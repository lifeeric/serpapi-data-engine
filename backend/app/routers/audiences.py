"""Audience builder API routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.contact import Contact
from app.models.audience import Audience, AudienceContact
from app.models.intent_score import IntentScore
from app.schemas.audience import (
    AudienceCreate,
    AudienceUpdate,
    AudienceResponse,
    AudienceListResponse,
    AudienceFilters
)
from app.schemas.contact import ContactListResponse

router = APIRouter(prefix="/audiences", tags=["audiences"])


@router.get("/", response_model=AudienceListResponse)
def list_audiences(db: Session = Depends(get_db)):
    """List all saved audiences."""
    audiences = db.query(Audience).all()
    return AudienceListResponse(
        total=len(audiences),
        audiences=audiences
    )


@router.get("/{audience_id}", response_model=AudienceResponse)
def get_audience(audience_id: int, db: Session = Depends(get_db)):
    """Get a specific audience."""
    audience = db.query(Audience).filter(Audience.id == audience_id).first()
    if not audience:
        raise HTTPException(status_code=404, detail="Audience not found")
    return audience


@router.post("/", response_model=AudienceResponse, status_code=201)
def create_audience(
    audience_data: AudienceCreate,
    db: Session = Depends(get_db)
):
    """Create a new audience segment."""
    # Create audience
    audience = Audience(**audience_data.model_dump())
    db.add(audience)
    db.flush()  # Get ID without committing
    
    # Apply filters and add contacts
    if audience_data.filters:
        contacts = _apply_filters(db, audience_data.filters)
        for contact in contacts:
            membership = AudienceContact(
                audience_id=audience.id,
                contact_id=contact.id
            )
            db.add(membership)
        
        audience.contact_count = len(contacts)
    
    db.commit()
    db.refresh(audience)
    return audience


@router.put("/{audience_id}", response_model=AudienceResponse)
def update_audience(
    audience_id: int,
    audience_data: AudienceUpdate,
    db: Session = Depends(get_db)
):
    """Update an audience."""
    audience = db.query(Audience).filter(Audience.id == audience_id).first()
    if not audience:
        raise HTTPException(status_code=404, detail="Audience not found")
    
    # Update fields
    update_data = audience_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(audience, field, value)
    
    # If filters changed, rebuild audience
    if "filters" in update_data:
        # Remove old memberships
        db.query(AudienceContact).filter(
            AudienceContact.audience_id == audience_id
        ).delete()
        
        # Add new contacts
        contacts = _apply_filters(db, audience.filters)
        for contact in contacts:
            membership = AudienceContact(
                audience_id=audience.id,
                contact_id=contact.id
            )
            db.add(membership)
        
        audience.contact_count = len(contacts)
    
    db.commit()
    db.refresh(audience)
    return audience


@router.delete("/{audience_id}", status_code=204)
def delete_audience(audience_id: int, db: Session = Depends(get_db)):
    """Delete an audience."""
    audience = db.query(Audience).filter(Audience.id == audience_id).first()
    if not audience:
        raise HTTPException(status_code=404, detail="Audience not found")
    
    db.delete(audience)
    db.commit()


@router.get("/{audience_id}/contacts", response_model=ContactListResponse)
def get_audience_contacts(
    audience_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get contacts in an audience with pagination."""
    audience = db.query(Audience).filter(Audience.id == audience_id).first()
    if not audience:
        raise HTTPException(status_code=404, detail="Audience not found")
    
    # Get contact IDs from memberships
    contact_ids = [ac.contact_id for ac in audience.contact_memberships]
    
    # Query contacts
    query = db.query(Contact).filter(Contact.id.in_(contact_ids))
    total = query.count()
    
    # Paginate
    offset = (page - 1) * page_size
    contacts = query.offset(offset).limit(page_size).all()
    
    return ContactListResponse(
        total=total,
        page=page,
        page_size=page_size,
        contacts=contacts
    )


@router.post("/preview")
def preview_audience(
    filters: AudienceFilters,
    db: Session = Depends(get_db)
):
    """Preview contacts that match given filters."""
    contacts = _apply_filters(db, filters.model_dump())
    return {
        "matching_contacts": len(contacts),
        "preview": contacts[:5]  # Show first 5 contacts
    }


def _apply_filters(db: Session, filters: dict) -> List[Contact]:
    """Apply filters to get matching contacts."""
    query = db.query(Contact)
    
    if filters.get("industry"):
        query = query.filter(Contact.industry.ilike(f"%{filters['industry']}%"))
    
    if filters.get("location"):
        query = query.filter(Contact.location.ilike(f"%{filters['location']}%"))
    
    if filters.get("city"):
        query = query.filter(Contact.city.ilike(f"%{filters['city']}%"))
    
    if filters.get("state"):
        query = query.filter(Contact.state.ilike(f"%{filters['state']}%"))
    
    if filters.get("country"):
        query = query.filter(Contact.country.ilike(f"%{filters['country']}%"))
    
    if filters.get("intent_level"):
        query = query.join(IntentScore).filter(
            IntentScore.score == filters["intent_level"].upper()
        )
    
    if filters.get("date_from"):
        query = query.filter(Contact.created_at >= filters["date_from"])
    
    if filters.get("date_to"):
        query = query.filter(Contact.created_at <= filters["date_to"])
    
    if filters.get("search_query"):
        search = filters["search_query"]
        search_filter = or_(
            Contact.first_name.ilike(f"%{search}%"),
            Contact.last_name.ilike(f"%{search}%"),
            Contact.email.ilike(f"%{search}%"),
            Contact.company.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    return query.all()
