from fastapi import APIRouter
from typing import List

from models import DemandZone, StockRequest
from app.controllers import find_demand_zones_controller, health_check_controller

router = APIRouter()

@router.post("/demand-zones", response_model=List[DemandZone])
async def demand_zones(request: StockRequest):
    return await find_demand_zones_controller(request)

@router.get("/health")
async def health():
    return await health_check_controller()
