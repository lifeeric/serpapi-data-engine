"""Pydantic schemas for Contact API."""
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class ContactBase(BaseModel):
    """Base contact schema."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


class ContactCreate(ContactBase):
    """Schema for creating a contact."""
    source: str = "manual"
    raw_data: Optional[dict] = None


class ContactUpdate(BaseModel):
    """Schema for updating a contact."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


class IntentScoreSchema(BaseModel):
    """Schema for intent score."""
    id: int
    contact_id: int
    score: str
    score_value: float
    signals: Optional[dict] = None
    calculated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ContactResponse(ContactBase):
    """Schema for contact response."""
    id: int
    source: Optional[str] = None
    enriched_data: Optional[dict] = None
    enriched_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    intent_scores: list[IntentScoreSchema] = []
    
    model_config = ConfigDict(from_attributes=True)


class ContactListResponse(BaseModel):
    """Schema for paginated contact list."""
    total: int
    page: int
    page_size: int
    contacts: list[ContactResponse]
