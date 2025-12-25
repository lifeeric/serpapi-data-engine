"""Export API routes."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.database import get_db
from app.schemas.data_sources import ExportRequest, ExportResponse
from app.services.export_service import ExportService

router = APIRouter(prefix="/exports", tags=["exports"])


@router.post("/", response_model=ExportResponse)
async def export_contacts(
    request: ExportRequest,
    db: Session = Depends(get_db)
):
    """
    Export contacts in specified format.
    """
    export_service = ExportService(db)
    
    try:
        if request.format == "webhook":
            result = await export_service._export_webhook(
                export_service._get_contacts_for_export(
                    request.contact_ids,
                    request.audience_id
                ),
                request.webhook_url,
                request.fields or []
            )
        else:
            result = export_service.export_contacts(
                format=request.format,
                contact_ids=request.contact_ids,
                audience_id=request.audience_id,
                fields=request.fields,
                webhook_url=request.webhook_url
            )
        
        return ExportResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.post("/download")
def download_export(
    request: ExportRequest,
    db: Session = Depends(get_db)
):
    """
    Download exported contacts as CSV file.
    """
    if request.format == "webhook":
        raise HTTPException(status_code=400, detail="Use POST /exports/ for webhook export")
    
    export_service = ExportService(db)
    
    try:
        result = export_service.export_contacts(
            format=request.format,
            contact_ids=request.contact_ids,
            audience_id=request.audience_id,
            fields=request.fields
        )
        
        # Return file for download
        csv_content = result.get("content", "")
        
        filename = f"export_{request.format}.csv"
        if request.audience_id:
            filename = f"audience_{request.audience_id}_{request.format}.csv"
        
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export download failed: {str(e)}")
