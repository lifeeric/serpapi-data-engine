"""SerpAPI search tracking model."""
from sqlalchemy import Column, Integer, String, TIMESTAMP, JSON
from sqlalchemy.sql import func
from app.database import Base


class SerpAPISearch(Base):
    """Model for tracking SerpAPI searches."""
    
    __tablename__ = "serpapi_searches"
    
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String(500), nullable=False)
    results_count = Column(Integer, default=0)
    raw_response = Column(JSON, nullable=True)  # Full API response for debugging
    searched_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
