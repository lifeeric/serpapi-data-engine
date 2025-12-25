"""Contact management API routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.contact import Contact
from app.models.intent_score import IntentScore
from app.schemas.contact import (
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    ContactListResponse
)
from app.services.intent_scorer import IntentScoringService
from app.services.enrichment_service import EnrichmentService

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("/", response_model=ContactListResponse)
def list_contacts(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    search: Optional[str] = None,
    industry: Optional[str] = None,
    location: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    intent_level: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """
    List contacts with filtering and pagination.
    """
    query = db.query(Contact)
    
    # Apply filters
    if search:
        search_filter = or_(
            Contact.first_name.ilike(f"%{search}%"),
            Contact.last_name.ilike(f"%{search}%"),
            Contact.email.ilike(f"%{search}%"),
            Contact.company.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if industry:
        query = query.filter(Contact.industry.ilike(f"%{industry}%"))
    
    if location:
        query = query.filter(Contact.location.ilike(f"%{location}%"))
    
    if city:
        query = query.filter(Contact.city.ilike(f"%{city}%"))
    
    if state:
        query = query.filter(Contact.state.ilike(f"%{state}%"))
    
    if date_from:
        query = query.filter(Contact.created_at >= date_from)
    
    if date_to:
        query = query.filter(Contact.created_at <= date_to)
    
    # Filter by intent level
    if intent_level:
        query = query.join(IntentScore).filter(IntentScore.score == intent_level.upper())
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    contacts = query.offset(offset).limit(page_size).all()
    
    return ContactListResponse(
        total=total,
        page=page,
        page_size=page_size,
        contacts=contacts
    )


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    """Get a specific contact by ID."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.post("/", response_model=ContactResponse, status_code=201)
def create_contact(contact_data: ContactCreate, db: Session = Depends(get_db)):
    """Create a new contact."""
    # Check for duplicate email
    if contact_data.email:
        existing = db.query(Contact).filter(Contact.email == contact_data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Contact with this email already exists")
    
    # Create contact
    contact = Contact(**contact_data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    
    # Calculate intent score
    intent_scorer = IntentScoringService(db)
    intent_score = intent_scorer.calculate_intent(contact)
    db.add(intent_score)
    db.commit()
    db.refresh(contact)
    
    return contact


@router.put("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: int,
    contact_data: ContactUpdate,
    db: Session = Depends(get_db)
):
    """Update a contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Update fields
    update_data = contact_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)
    
    db.commit()
    db.refresh(contact)
    
    # Recalculate intent score
    intent_scorer = IntentScoringService(db)
    intent_scorer.recalculate_score(contact_id)
    db.refresh(contact)
    
    return contact


@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    """Delete a contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()


@router.post("/{contact_id}/enrich")
async def enrich_contact(contact_id: int, db: Session = Depends(get_db)):
    """Enrich a contact with skip-trace data."""
    enrichment_service = EnrichmentService(db)
    result = await enrichment_service.enrich_contact(contact_id)
    return result


@router.post("/{contact_id}/recalculate-intent")
def recalculate_intent(contact_id: int, db: Session = Depends(get_db)):
    """Recalculate intent score for a contact."""
    intent_scorer = IntentScoringService(db)
    try:
        intent_score = intent_scorer.recalculate_score(contact_id)
        return {
            "contact_id": contact_id,
            "score": intent_score.score,
            "score_value": intent_score.score_value,
            "message": "Intent score recalculated"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
