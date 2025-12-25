"""Data source API routes (SerpAPI and CSV upload)."""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.data_sources import (
    SerpAPISearchRequest,
    SerpAPISearchResponse,
    CSVUploadResponse
)
from app.services.serpapi_service import SerpAPIService
from app.services.csv_service import CSVService
from app.services.intent_scorer import IntentScoringService

router = APIRouter(prefix="/data-sources", tags=["data-sources"])


@router.post("/serpapi/search", response_model=SerpAPISearchResponse)
def search_serpapi(
    request: SerpAPISearchRequest,
    db: Session = Depends(get_db)
):
    """
    Search Google via SerpAPI and import results as contacts.
    """
    import logging
    import traceback
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"[SerpAPI] Starting search with query: {request.query}")
        
        serpapi_service = SerpAPIService(db)
        logger.info("[SerpAPI] Service initialized")
        
        result = serpapi_service.search_and_import(
            query=request.query,
            location=request.location,
            num_results=request.num_results
        )
        logger.info(f"[SerpAPI] Search completed: {result}")
        
        # Calculate intent scores for new contacts
        logger.info("[SerpAPI] Initializing intent scorer")
        intent_scorer = IntentScoringService(db)
        
        logger.info("[SerpAPI] Starting to score unscored contacts")
        try:
            scored_count = intent_scorer.score_all_unscored_contacts()
            logger.info(f"[SerpAPI] Successfully scored {scored_count} contacts")
        except Exception as scoring_error:
            logger.error(f"[SerpAPI] Error scoring contacts: {type(scoring_error).__name__}: {str(scoring_error)}")
            logger.error(f"[SerpAPI] Traceback: {traceback.format_exc()}")
            raise
        
        logger.info("[SerpAPI] Returning response")
        return SerpAPISearchResponse(**result)
    except ValueError as e:
        logger.error(f"[SerpAPI] ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[SerpAPI] Unexpected error: {type(e).__name__}: {str(e)}")
        logger.error(f"[SerpAPI] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"SerpAPI search failed: {str(e)}")


@router.post("/csv/upload", response_model=CSVUploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and import contacts from CSV file.
    """
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read file content
        content = await file.read()
        
        # Process CSV
        csv_service = CSVService(db)
        result = csv_service.upload_and_import(content, file.filename)
        
        # Calculate intent scores for imported contacts
        intent_scorer = IntentScoringService(db)
        intent_scorer.score_all_unscored_contacts()
        
        return CSVUploadResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV upload failed: {str(e)}")


@router.post("/csv/preview")
async def preview_csv(file: UploadFile = File(...)):
    """
    Preview CSV file before import.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        content = await file.read()
        csv_service = CSVService(None)  # No DB needed for preview
        result = csv_service.get_csv_preview(content)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
