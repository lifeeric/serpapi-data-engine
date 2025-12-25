"""SerpAPI integration service."""
from serpapi import GoogleSearch
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.config import get_settings
from app.models.contact import Contact
from app.models.serpapi_search import SerpAPISearch
from app.services.intent_scorer import IntentScoringService

settings = get_settings()


class SerpAPIService:
    """Service for integrating with SerpAPI."""
    
    def __init__(self, db: Session):
        self.db = db
        self.intent_scorer = IntentScoringService(db)
    
    def search_and_import(
        self,
        query: str,
        location: str = None,
        num_results: int = 10
    ) -> Dict[str, Any]:
        """
        Execute SerpAPI search and import results as contacts.
        
        Args:
            query: Search query
            location: Optional location filter
            num_results: Number of results to fetch
            
        Returns:
            Dictionary with search results and import stats
        """
        if not settings.serpapi_api_key:
            raise ValueError("SERPAPI_API_KEY not configured")
        
        # Execute search
        params = {
            "q": query,
            "api_key": settings.serpapi_api_key,
            "num": num_results,
            "engine": "google"
        }
        
        if location:
            params["location"] = location
        
        import logging
        import json
        logger = logging.getLogger(__name__)
        
        try:
            search = GoogleSearch(params)
            results = search.get_dict()
            
            # Log the raw SerpAPI response
            logger.info("="*80)
            logger.info("[SerpAPI] RAW RESPONSE:")
            logger.info(json.dumps(results, indent=2, default=str))
            logger.info("="*80)
            
            # Check if results is actually a dictionary (API can return error strings)
            if not isinstance(results, dict):
                raise ValueError(f"SerpAPI returned error: {results}")
            
            # Check for error in results
            if "error" in results:
                raise ValueError(f"SerpAPI error: {results['error']}")
        
        except Exception as e:
            raise ValueError(f"SerpAPI search failed: {str(e)}")
        
        # Save search record
        search_record = SerpAPISearch(
            query=query,
            results_count=len(results.get("organic_results", [])),
            raw_response=results
        )
        self.db.add(search_record)
        self.db.commit()
        
        # Parse and import contacts
        contacts_created = 0
        organic_results = results.get("organic_results", [])
        local_results = results.get("local_results", [])
        
        # Process organic results
        for result in organic_results:
            # Skip if result is not a dictionary
            if not isinstance(result, dict):
                continue
                
            contact = self._parse_organic_result(result, query)
            if contact:
                self.db.add(contact)
                contacts_created += 1
        
        # Process local results (if available)
        for result in local_results:
            # Skip if result is not a dictionary
            if not isinstance(result, dict):
                continue
                
            contact = self._parse_local_result(result, query, location)
            if contact:
                self.db.add(contact)
                contacts_created += 1
        
        self.db.commit()
        
        # Calculate intent scores for new contacts
        # (will be done automatically via IntentScoringService)
        
        return {
            "search_id": search_record.id,
            "query": query,
            "results_count": len(organic_results) + len(local_results),
            "contacts_created": contacts_created
        }
    
    def _parse_organic_result(self, result: Dict, query: str) -> Contact:
        """Parse organic search result into Contact."""
        title = result.get("title", "")
        snippet = result.get("snippet", "")
        link = result.get("link", "")
        
        # Try to extract company name from title
        company = title.split("-")[0].strip() if "-" in title else title.split("|")[0].strip()
        
        # Infer industry from the search query
        # Common patterns: "plumbers in Austin", "lawyers near me", "roofing companies"
        industry = None
        query_lower = query.lower()
        
        # Extract potential industry keywords
        industry_keywords = [
            "plumber", "plumbing", "lawyer", "attorney", "roofer", "roofing",
            "contractor", "electrician", "hvac", "dentist", "doctor", "restaurant",
            "mechanic", "auto repair", "real estate", "agent", "broker", "insurance",
            "accountant", "marketing", "cleaning", "landscaping", "painter", "painting"
        ]
        
        for keyword in industry_keywords:
            if keyword in query_lower:
                industry = keyword.capitalize()
                if industry.endswith("er"):
                    industry = industry[:-2] + "ing"  # plumber -> plumbing
                break
        
        # Try to extract location from snippet or title
        location = None
        city = None
        state = None
        
        # Look for location patterns in snippet
        import re
        location_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b'
        location_match = re.search(location_pattern, snippet + " " + title)
        if location_match:
            city = location_match.group(1)
            state = location_match.group(2)
            location = f"{city}, {state}"
        
        # Create contact
        contact = Contact(
            company=company,
            industry=industry,
            location=location,
            city=city,
            state=state,
            source="serpapi",
            raw_data={
                "title": title,
                "snippet": snippet,
                "link": link,
                "search_query": query
            }
        )
        
        return contact
    
    def _parse_local_result(self, result: Dict, query: str, location: str = None) -> Contact:
        """Parse local search result into Contact."""
        title = result.get("title", "")
        address = result.get("address", "")
        phone = result.get("phone", "")
        rating = result.get("rating")
        reviews = result.get("reviews")
        type_info = result.get("type", "")
        website = result.get("website", "")
        
        # Infer industry from query or type field
        industry = None
        query_lower = query.lower()
        
        # First try to get from the type field
        if type_info:
            industry = type_info.split(",")[0].strip() if "," in type_info else type_info
        else:
            # Extract from query
            industry_keywords = {
                "plumber": "Plumbing", "plumbing": "Plumbing",
                "lawyer": "Legal Services", "attorney": "Legal Services",
                "roofer": "Roofing", "roofing": "Roofing",
                "contractor": "Construction",
                "electrician": "Electrical Services",
                "hvac": "HVAC Services",
                "dentist": "Dental", "doctor": "Medical",
                "restaurant": "Restaurant",
                "mechanic": "Auto Repair", "auto repair": "Auto Repair",
                "real estate": "Real Estate",
                "insurance": "Insurance",
                "accountant": "Accounting",
                "marketing": "Marketing",
                "cleaning": "Cleaning Services",
                "landscaping": "Landscaping",
                "painter": "Painting", "painting": "Painting"
            }
            
            for keyword, industry_name in industry_keywords.items():
                if keyword in query_lower:
                    industry = industry_name
                    break
        
        # Parse address components
        city = None
        state = None
        if address:
            parts = address.split(",")
            if len(parts) >= 2:
                city = parts[-2].strip()
                state_zip = parts[-1].strip().split()
                state = state_zip[0] if state_zip else None
        
        # Try to extract email from website or other fields
        email = result.get("email")
        
        contact = Contact(
            company=title,
            phone=phone,
            email=email,
            industry=industry,
            location=address,
            city=city,
            state=state,
            source="serpapi",
            raw_data={
                "title": title,
                "address": address,
                "phone": phone,
                "email": email,
                "website": website,
                "type": type_info,
                "rating": rating,
                "reviews": reviews,
                "search_query": query,
                "search_location": location
            }
        )
        
        return contact
        
        return contact
