"""Export service for CSV, webhook, and hashed exports."""
import csv
import io
import httpx
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.models.contact import Contact
from app.models.audience import Audience
from app.utils.hashing import hash_email


class ExportService:
    """Service for exporting contact data."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def export_contacts(
        self,
        format: str,
        contact_ids: Optional[List[int]] = None,
        audience_id: Optional[int] = None,
        fields: Optional[List[str]] = None,
        webhook_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Export contacts in specified format.
        
        Args:
            format: Export format ('csv', 'webhook', 'hashed')
            contact_ids: Optional list of specific contact IDs
            audience_id: Optional audience ID to export
            fields: Optional list of fields to include
            webhook_url: Required for webhook format
            
        Returns:
            Export result dictionary
        """
        # Get contacts to export
        contacts = self._get_contacts_for_export(contact_ids, audience_id)
        
        if not contacts:
            return {
                "format": format,
                "record_count": 0,
                "message": "No contacts to export"
            }
        
        # Default fields if none specified
        if not fields:
            fields = [
                "id", "first_name", "last_name", "email", "phone",
                "company", "industry", "location", "city", "state", "country"
            ]
        
        # Execute export based on format
        if format == "csv":
            return self._export_csv(contacts, fields)
        elif format == "hashed":
            return self._export_hashed(contacts)
        elif format == "webhook":
            if not webhook_url:
                raise ValueError("webhook_url required for webhook export")
            return self._export_webhook(contacts, webhook_url, fields)
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    def _get_contacts_for_export(
        self,
        contact_ids: Optional[List[int]],
        audience_id: Optional[int]
    ) -> List[Contact]:
        """Get contacts for export."""
        query = self.db.query(Contact)
        
        if contact_ids:
            query = query.filter(Contact.id.in_(contact_ids))
        elif audience_id:
            # Get contacts from audience
            audience = self.db.query(Audience).filter(Audience.id == audience_id).first()
            if not audience:
                raise ValueError(f"Audience {audience_id} not found")
            
            contact_ids = [ac.contact_id for ac in audience.contact_memberships]
            query = query.filter(Contact.id.in_(contact_ids))
        
        return query.all()
    
    def _export_csv(self, contacts: List[Contact], fields: List[str]) -> Dict[str, Any]:
        """Export contacts as CSV."""
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fields)
        writer.writeheader()
        
        for contact in contacts:
            row = {}
            for field in fields:
                # Get field value
                value = getattr(contact, field, None)
                
                # Handle intent score (latest)
                if field == "intent_score" and contact.intent_scores:
                    value = contact.intent_scores[0].score if contact.intent_scores else None
                
                row[field] = value if value is not None else ""
            
            writer.writerow(row)
        
        csv_content = output.getvalue()
        output.close()
        
        # In a real app, you'd save this to a file or S3 and return a download URL
        # For MVP, we'll return the content directly
        return {
            "format": "csv",
            "record_count": len(contacts),
            "file_url": None,  # Would be a download URL in production
            "content": csv_content,
            "message": f"Exported {len(contacts)} contacts as CSV"
        }
    
    def _export_hashed(self, contacts: List[Contact]) -> Dict[str, Any]:
        """Export contacts with SHA-256 hashed emails for ad platforms."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["hashed_email"])
        
        hashed_count = 0
        for contact in contacts:
            if contact.email:
                hashed = hash_email(contact.email)
                writer.writerow([hashed])
                hashed_count += 1
        
        csv_content = output.getvalue()
        output.close()
        
        return {
            "format": "hashed",
            "record_count": hashed_count,
            "file_url": None,
            "content": csv_content,
            "message": f"Exported {hashed_count} hashed emails"
        }
    
    async def _export_webhook(
        self,
        contacts: List[Contact],
        webhook_url: str,
        fields: List[str]
    ) -> Dict[str, Any]:
        """Export contacts via webhook POST."""
        # Prepare data
        contact_data = []
        for contact in contacts:
            row = {}
            for field in fields:
                value = getattr(contact, field, None)
                if field == "intent_score" and contact.intent_scores:
                    value = contact.intent_scores[0].score if contact.intent_scores else None
                row[field] = value
            contact_data.append(row)
        
        # Send webhook
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook_url,
                    json={"contacts": contact_data},
                    timeout=30.0
                )
                
                if response.status_code in [200, 201, 202]:
                    return {
                        "format": "webhook",
                        "record_count": len(contacts),
                        "webhook_sent": True,
                        "message": f"Sent {len(contacts)} contacts to webhook"
                    }
                else:
                    return {
                        "format": "webhook",
                        "record_count": len(contacts),
                        "webhook_sent": False,
                        "message": f"Webhook failed with status {response.status_code}"
                    }
        except Exception as e:
            return {
                "format": "webhook",
                "record_count": len(contacts),
                "webhook_sent": False,
                "message": f"Webhook failed: {str(e)}"
            }
