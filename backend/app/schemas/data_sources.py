"""Pydantic schemas for data source operations."""
from pydantic import BaseModel
from typing import Optional, List


class SerpAPISearchRequest(BaseModel):
    """Schema for SerpAPI search request."""
    query: str
    location: Optional[str] = None
    num_results: int = 10


class SerpAPISearchResponse(BaseModel):
    """Schema for SerpAPI search response."""
    search_id: int
    query: str
    results_count: int
    contacts_created: int


class CSVUploadResponse(BaseModel):
    """Schema for CSV upload response."""
    filename: str
    total_rows: int
    imported_contacts: int
    skipped_rows: int
    errors: List[str] = []


class ExportRequest(BaseModel):
    """Schema for export request."""
    format: str = "csv"  # csv, webhook, hashed
    audience_id: Optional[int] = None
    contact_ids: Optional[List[int]] = None
    fields: Optional[List[str]] = None
    webhook_url: Optional[str] = None


class ExportResponse(BaseModel):
    """Schema for export response."""
    format: str
    record_count: int
    file_url: Optional[str] = None
    webhook_sent: bool = False
    message: str
