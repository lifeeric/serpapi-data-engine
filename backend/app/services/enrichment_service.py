"""Contact enrichment service (skip-trace API integration)."""
import httpx
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime
from app.models.contact import Contact
from app.config import get_settings

settings = get_settings()


class EnrichmentService:
    """Service for enriching contact data via skip-trace API."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def enrich_contact(self, contact_id: int) -> Dict[str, Any]:
        """
        Enrich a contact with additional data from skip-trace API.
        
        Args:
            contact_id: ID of contact to enrich
            
        Returns:
            Dictionary with enrichment results
        """
        contact = self.db.query(Contact).filter(Contact.id == contact_id).first()
        if not contact:
            raise ValueError(f"Contact {contact_id} not found")
        
        if not settings.skiptrace_api_key or not settings.skiptrace_api_url:
            return {
                "success": False,
                "message": "Skip-trace API not configured",
                "enriched_fields": []
            }
        
        try:
            # Call skip-trace API
            enriched_data = await self._call_skiptrace_api(contact)
            
            if enriched_data:
                # Update contact with enriched data
                contact.enriched_data = enriched_data
                contact.enriched_at = datetime.now()
                
                # Optionally update main fields if they're missing
                if not contact.phone and enriched_data.get("phone"):
                    contact.phone = enriched_data["phone"]
                if not contact.email and enriched_data.get("email"):
                    contact.email = enriched_data["email"]
                if not contact.city and enriched_data.get("city"):
                    contact.city = enriched_data["city"]
                if not contact.state and enriched_data.get("state"):
                    contact.state = enriched_data["state"]
                
                self.db.commit()
                
                return {
                    "success": True,
                    "message": "Contact enriched successfully",
                    "enriched_fields": list(enriched_data.keys())
                }
            else:
                return {
                    "success": False,
                    "message": "No enrichment data found",
                    "enriched_fields": []
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Enrichment failed: {str(e)}",
                "enriched_fields": []
            }
    
    async def _call_skiptrace_api(self, contact: Contact) -> Optional[Dict[str, Any]]:
        """
        Call skip-trace API to get enrichment data.
        
        This is a generic implementation that needs to be adapted
        to the specific skip-trace API being used.
        
        Args:
            contact: Contact to enrich
            
        Returns:
            Enriched data dictionary or None
        """
        # Prepare request data
        # (This will vary based on the specific API)
        request_data = {}
        
        if contact.email:
            request_data["email"] = contact.email
        if contact.phone:
            request_data["phone"] = contact.phone
        if contact.first_name:
            request_data["first_name"] = contact.first_name
        if contact.last_name:
            request_data["last_name"] = contact.last_name
        
        # Make API request
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.skiptrace_api_url,
                json=request_data,
                headers={
                    "Authorization": f"Bearer {settings.skiptrace_api_key}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
    
    async def bulk_enrich(self, contact_ids: list[int]) -> Dict[str, Any]:
        """
        Enrich multiple contacts.
        
        Args:
            contact_ids: List of contact IDs to enrich
            
        Returns:
            Dictionary with bulk enrichment results
        """
        results = {
            "total": len(contact_ids),
            "successful": 0,
            "failed": 0,
            "errors": []
        }
        
        for contact_id in contact_ids:
            try:
                result = await self.enrich_contact(contact_id)
                if result["success"]:
                    results["successful"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append({
                        "contact_id": contact_id,
                        "error": result["message"]
                    })
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "contact_id": contact_id,
                    "error": str(e)
                })
        
        return results
