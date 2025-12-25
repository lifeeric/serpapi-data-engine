"""Pydantic schemas for Audience API."""
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class AudienceBase(BaseModel):
    """Base audience schema."""
    name: str
    description: Optional[str] = None
    filters: Optional[dict] = None


class AudienceCreate(AudienceBase):
    """Schema for creating an audience."""
    pass


class AudienceUpdate(BaseModel):
    """Schema for updating an audience."""
    name: Optional[str] = None
    description: Optional[str] = None
    filters: Optional[dict] = None


class AudienceResponse(AudienceBase):
    """Schema for audience response."""
    id: int
    contact_count: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AudienceListResponse(BaseModel):
    """Schema for audience list."""
    total: int
    audiences: list[AudienceResponse]


class AudienceFilters(BaseModel):
    """Schema for audience filter criteria."""
    industry: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    intent_level: Optional[str] = None  # LOW, MEDIUM, HIGH
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    search_query: Optional[str] = None
