"""Contact/Lead data model."""
from sqlalchemy import Column, Integer, String, TIMESTAMP, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Contact(Base):
    """Contact/Lead database model."""
    
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True, index=True)
    industry = Column(String(255), nullable=True, index=True)
    location = Column(String(255), nullable=True)
    city = Column(String(255), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    source = Column(String(50), nullable=True)  # 'serpapi' or 'csv'
    raw_data = Column(JSON, nullable=True)  # Original data from source
    enriched_data = Column(JSON, nullable=True)  # Data from skip-trace API
    enriched_at = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    intent_scores = relationship("IntentScore", back_populates="contact", cascade="all, delete-orphan")
    audience_memberships = relationship("AudienceContact", back_populates="contact", cascade="all, delete-orphan")
