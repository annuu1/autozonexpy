from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.controllers.controllers import get_all_zones_controller, get_demand_zones_controller, delete_zone_controller
from app.models.models import GetZonesRequest

router = APIRouter(prefix="/zones", tags=["zones"])

@router.post("/demand-zones")
async def get_demand_zones(request: GetZonesRequest):
    """
    Retrieve demand zones from MongoDB, grouped by ticker.
    
    Args:
        request: GetZonesRequest with optional tickers, start_date, and end_date filters.
    
    Returns:
        Dict mapping ticker symbols to lists of DemandZone dictionaries.
    """
    try:
        return await get_demand_zones_controller(request)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.get("/all-zones")
async def get_all_zones(
    page: int = 1,
    limit: int = 10,
    sort_by: str = "timestamp",
    sort_order: int = -1,
    ticker: Optional[str] = None,
    pattern: Optional[str] = None
):
    """
    Retrieve all trading zones with pagination and filtering.
    
    Args:
        page: Page number (1-based)
        limit: Number of items per page
        sort_by: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)
        ticker: Filter by ticker symbol
        pattern: Filter by pattern (DBR/RBR)
        
    Returns:
        Dictionary containing paginated zones and metadata
    """
    try:
        return await get_all_zones_controller(
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
            ticker=ticker,
            pattern=pattern
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.delete("/{zone_id}")
async def delete_zone(zone_id: str):
    """
    Delete a zone by its ID.
    
    Args:
        zone_id: The ID of the zone to delete
        
    Returns:
        Success message if deleted, 404 if not found
    """
    try:
        return await delete_zone_controller(zone_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
