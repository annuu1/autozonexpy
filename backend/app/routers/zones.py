from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.controllers.controllers import get_demand_zones_controller
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