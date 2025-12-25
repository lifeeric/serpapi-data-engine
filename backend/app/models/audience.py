"""Audience and audience membership models."""
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Audience(Base):
    """Saved audience segment model."""
    
    __tablename__ = "audiences"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    filters = Column(JSON, nullable=True)  # Stored filter criteria
    contact_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    contact_memberships = relationship("AudienceContact", back_populates="audience", cascade="all, delete-orphan")


class AudienceContact(Base):
    """Junction table for audience-contact many-to-many relationship."""
    
    __tablename__ = "audience_contacts"
    
    audience_id = Column(Integer, ForeignKey("audiences.id", ondelete="CASCADE"), primary_key=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True)
    added_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    audience = relationship("Audience", back_populates="contact_memberships")
    contact = relationship("Contact", back_populates="audience_memberships")
