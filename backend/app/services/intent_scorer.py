"""Rule-based intent scoring engine."""
from sqlalchemy.orm import Session
from typing import Dict, List
from datetime import datetime, timedelta, timezone
from app.models.contact import Contact
from app.models.intent_score import IntentScore
from app.config import get_settings

settings = get_settings()


class IntentScoringService:
    """Service for calculating rule-based intent scores."""
    
    # Intent keywords - higher value = stronger intent signal
    INTENT_KEYWORDS = {
        "high": [
            "looking for",
            "need",
            "urgent",
            "quote",
            "estimate",
            "pricing",
            "buy",
            "purchase",
            "hire",
            "service",
            "help",
            "repair",
            "install",
            "replace"
        ],
        "medium": [
            "compare",
            "review",
            "best",
            "top",
            "near me",
            "local",
            "contact",
            "call",
            "schedule"
        ],
        "low": [
            "what is",
            "how to",
            "diy",
            "tutorial",
            "free",
            "information"
        ]
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_intent(self, contact: Contact) -> IntentScore:
        """
        Calculate intent score for a contact based on rules.
        
        Args:
            contact: Contact to score
            
        Returns:
            IntentScore object
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[IntentScorer] Calculating intent for contact {contact.id}")
        
        score_value = 0.0
        signals = {
            "matched_keywords": [],
            "recency_boost": False,
            "source_boost": False,
            "reasoning": []
        }
        
        # Extract text data for analysis
        searchable_text = self._get_searchable_text(contact)
        searchable_text_lower = searchable_text.lower()
        
        # Keyword matching
        high_matches = []
        medium_matches = []
        low_matches = []
        
        for keyword in self.INTENT_KEYWORDS["high"]:
            if keyword in searchable_text_lower:
                high_matches.append(keyword)
                score_value += 0.3
        
        for keyword in self.INTENT_KEYWORDS["medium"]:
            if keyword in searchable_text_lower:
                medium_matches.append(keyword)
                score_value += 0.15
        
        for keyword in self.INTENT_KEYWORDS["low"]:
            if keyword in searchable_text_lower:
                low_matches.append(keyword)
                score_value += 0.05
        
        signals["matched_keywords"] = {
            "high": high_matches,
            "medium": medium_matches,
            "low": low_matches
        }
        
        if high_matches:
            signals["reasoning"].append(f"Matched {len(high_matches)} high-intent keywords")
        if medium_matches:
            signals["reasoning"].append(f"Matched {len(medium_matches)} medium-intent keywords")
        
        # Recency boost
        logger.info(f"[IntentScorer] Contact created_at: {contact.created_at}, type: {type(contact.created_at)}")
        recency_threshold = datetime.now(timezone.utc) - timedelta(days=settings.intent_recency_days)
        logger.info(f"[IntentScorer] Recency threshold: {recency_threshold}, type: {type(recency_threshold)}")
        
        try:
            if contact.created_at >= recency_threshold:
                score_value += 0.2
                signals["recency_boost"] = True
                signals["reasoning"].append(f"Recent activity (within {settings.intent_recency_days} days)")
            logger.info(f"[IntentScorer] Recency check passed")
        except Exception as e:
            logger.error(f"[IntentScorer] Error in recency check: {type(e).__name__}: {str(e)}")
            raise
        
        # Source-based boost (SerpAPI = actively searching)
        if contact.source == "serpapi":
            score_value += 0.1
            signals["source_boost"] = True
            signals["reasoning"].append("Contact from active search (SerpAPI)")
        
        # Normalize score to 0-1 range
        score_value = min(score_value, 1.0)
        
        # Determine categorical score
        if score_value >= settings.intent_high_threshold:
            score_label = "HIGH"
        elif score_value >= settings.intent_medium_threshold:
            score_label = "MEDIUM"
        else:
            score_label = "LOW"
        
        # Create intent score record
        intent_score = IntentScore(
            contact_id=contact.id,
            score=score_label,
            score_value=score_value,
            signals=signals
        )
        
        logger.info(f"[IntentScorer] Intent calculated: {score_label} ({score_value})")
        
        return intent_score
    
    def _get_searchable_text(self, contact: Contact) -> str:
        """Extract all searchable text from contact."""
        text_parts = []
        
        if contact.company:
            text_parts.append(contact.company)
        if contact.industry:
            text_parts.append(contact.industry)
        if contact.raw_data:
            # Extract relevant fields from raw_data
            for key in ["title", "snippet", "description", "search_query"]:
                if key in contact.raw_data and contact.raw_data[key]:
                    text_parts.append(str(contact.raw_data[key]))
        
        return " ".join(text_parts)
    
    def score_all_unscored_contacts(self) -> int:
        """
        Calculate intent scores for all contacts without scores.
        
        Returns:
            Number of contacts scored
        """
        # Find contacts without intent scores
        contacts = self.db.query(Contact).filter(
            ~Contact.intent_scores.any()
        ).all()
        
        scored_count = 0
        for contact in contacts:
            intent_score = self.calculate_intent(contact)
            self.db.add(intent_score)
            scored_count += 1
        
        if scored_count > 0:
            self.db.commit()
        
        return scored_count
    
    def recalculate_score(self, contact_id: int) -> IntentScore:
        """
        Recalculate intent score for a specific contact.
        
        Args:
            contact_id: ID of contact to rescore
            
        Returns:
            New IntentScore
        """
        contact = self.db.query(Contact).filter(Contact.id == contact_id).first()
        if not contact:
            raise ValueError(f"Contact {contact_id} not found")
        
        # Delete existing scores
        self.db.query(IntentScore).filter(
            IntentScore.contact_id == contact_id
        ).delete()
        
        # Calculate new score
        new_score = self.calculate_intent(contact)
        self.db.add(new_score)
        self.db.commit()
        
        return new_score
