import logging
from fastapi import HTTPException
from typing import List
from datetime import datetime, timedelta
from app.models import StockRequest, DemandZone
from app.services import fetch_stock_data, identify_demand_zones

logger = logging.getLogger(__name__)

async def find_demand_zones_controller(request: StockRequest) -> List[DemandZone]:
    try:
        # Set default date range: 1 year from current date
        if not request.start_date:
            request.start_date = (datetime.now().date() - timedelta(days=365))
        if not request.end_date:
            request.end_date = datetime.now().date()

        logger.info(f"Processing request for ticker {request.ticker}, start_date: {request.start_date}, end_date: {request.end_date}, interval: {request.interval}")
        data = fetch_stock_data(request.ticker, request.start_date, request.end_date, request.interval)
        zones = identify_demand_zones(
            data,
            legin_min_body_percent=request.leginMinBodyPercent,
            legout_min_body_percent=request.legoutMinBodyPercent,
            base_max_body_percent=request.baseMaxBodyPercent,
            min_base_candles=request.minBaseCandles,
            max_base_candles=request.maxBaseCandles,
        )
        if not zones:
            logger.warning(f"No demand zones found for {request.ticker}")
        return zones
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

async def health_check_controller():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}