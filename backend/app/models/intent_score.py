"""Intent score data model."""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, TIMESTAMP, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class IntentScore(Base):
    """Intent scoring model."""
    
    __tablename__ = "intent_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(String(20), nullable=False, index=True)  # 'LOW', 'MEDIUM', 'HIGH'
    score_value = Column(Float, nullable=False)  # Numerical score (0.0-1.0) for sorting
    signals = Column(JSON, nullable=True)  # Matched keywords, activity data, reasoning
    calculated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    contact = relationship("Contact", back_populates="intent_scores")
