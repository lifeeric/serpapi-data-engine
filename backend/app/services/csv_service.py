"""CSV upload and processing service."""
import pandas as pd
import io
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.contact import Contact
from app.services.intent_scorer import IntentScoringService


class CSVService:
    """Service for handling CSV uploads and data import."""
    
    def __init__(self, db: Session):
        self.db = db
        self.intent_scorer = IntentScoringService(db)
    
    # Field mapping: CSV column -> Contact model field
    FIELD_MAPPING = {
        "first_name": "first_name",
        "firstname": "first_name",
        "fname": "first_name",
        "last_name": "last_name",
        "lastname": "last_name",
        "lname": "last_name",
        "email": "email",
        "email_address": "email",
        "phone": "phone",
        "phone_number": "phone",
        "mobile": "phone",
        "company": "company",
        "company_name": "company",
        "business": "company",
        "industry": "industry",
        "sector": "industry",
        "location": "location",
        "address": "location",
        "city": "city",
        "state": "state",
        "province": "state",
        "country": "country",
    }
    
    def upload_and_import(
        self,
        file_content: bytes,
        filename: str
    ) -> Dict[str, Any]:
        """
        Upload and import contacts from CSV file.
        
        Args:
            file_content: CSV file content as bytes
            filename: Name of uploaded file
            
        Returns:
            Dictionary with import statistics
        """
        errors = []
        imported_count = 0
        skipped_count = 0
        
        try:
            # Read CSV
            df = pd.read_csv(io.BytesIO(file_content))
            total_rows = len(df)
            
            # Normalize column names (lowercase, strip whitespace)
            df.columns = df.columns.str.lower().str.strip()
            
            # Process each row
            for index, row in df.iterrows():
                try:
                    contact_data = self._parse_row(row)
                    
                    # Skip if no meaningful data
                    if not any([
                        contact_data.get("email"),
                        contact_data.get("phone"),
                        contact_data.get("company")
                    ]):
                        skipped_count += 1
                        continue
                    
                    # Check for duplicate email
                    if contact_data.get("email"):
                        existing = self.db.query(Contact).filter(
                            Contact.email == contact_data["email"]
                        ).first()
                        if existing:
                            skipped_count += 1
                            continue
                    
                    # Create contact
                    contact = Contact(
                        **contact_data,
                        source="csv",
                        raw_data={"filename": filename, "row_index": index}
                    )
                    self.db.add(contact)
                    imported_count += 1
                    
                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")
                    skipped_count += 1
            
            # Commit all contacts
            self.db.commit()
            
            # Calculate intent scores for imported contacts
            # (will be done in bulk later)
            
            return {
                "filename": filename,
                "total_rows": total_rows,
                "imported_contacts": imported_count,
                "skipped_rows": skipped_count,
                "errors": errors[:10]  # Limit to first 10 errors
            }
            
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Failed to process CSV: {str(e)}")
    
    def _parse_row(self, row: pd.Series) -> Dict[str, Any]:
        """Parse a CSV row into contact data."""
        contact_data = {}
        
        for csv_column, value in row.items():
            # Skip NaN values
            if pd.isna(value):
                continue
            
            # Map CSV column to model field
            csv_column_clean = csv_column.lower().strip()
            if csv_column_clean in self.FIELD_MAPPING:
                model_field = self.FIELD_MAPPING[csv_column_clean]
                contact_data[model_field] = str(value).strip()
        
        return contact_data
    
    def get_csv_preview(
        self,
        file_content: bytes,
        rows: int = 5
    ) -> Dict[str, Any]:
        """
        Get preview of CSV file.
        
        Args:
            file_content: CSV file content
            rows: Number of rows to preview
            
        Returns:
            Dictionary with preview data
        """
        try:
            df = pd.read_csv(io.BytesIO(file_content), nrows=rows)
            
            return {
                "columns": df.columns.tolist(),
                "rows": df.to_dict(orient="records"),
                "total_columns": len(df.columns)
            }
        except Exception as e:
            raise ValueError(f"Failed to preview CSV: {str(e)}")
