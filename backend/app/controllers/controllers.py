import logging
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.models.models import StockRequest, DemandZone
from app.services.services import fetch_stock_data, identify_demand_zones
from typing import List, Dict


logger = logging.getLogger(__name__)

async def find_demand_zones_controller(request: StockRequest) -> List[Dict]:
    try:
        if not request.start_date:
            request.start_date = (datetime.now().date() - timedelta(days=365))
        if not request.end_date:
            request.end_date = datetime.now().date()

        logger.info(f"Processing {request.ticker} from {request.start_date} to {request.end_date}, higher interval: {request.higher_interval}, lower interval: {request.lower_interval}")

        higher_data = fetch_stock_data(request.ticker, request.start_date, request.end_date, request.higher_interval)
        higher_zones = identify_demand_zones(
            higher_data,
            legin_min_body_percent=request.leginMinBodyPercent,
            legout_min_body_percent=request.legoutMinBodyPercent,
            base_max_body_percent=request.baseMaxBodyPercent,
            min_base_candles=request.minBaseCandles,
            max_base_candles=request.maxBaseCandles,
        )
        logger.info(f"Found {len(higher_zones)} higher timeframe zones.")

        lower_data = fetch_stock_data(request.ticker, request.start_date, request.end_date, request.lower_interval)
        lower_zones = identify_demand_zones(
            lower_data,
            legin_min_body_percent=request.leginMinBodyPercent,
            legout_min_body_percent=request.legoutMinBodyPercent,
            base_max_body_percent=request.baseMaxBodyPercent,
            min_base_candles=request.minBaseCandles,
            max_base_candles=request.maxBaseCandles,
        )
        logger.info(f"Found {len(lower_zones)} lower timeframe zones.")

        # Map lower timeframe zones under corresponding higher timeframe zones
        for h_zone in higher_zones:
            h_zone["timestamp"] = h_zone["start_timestamp"]  # Ensure 'timestamp' exists
            h_zone["coinciding_lower_zones"] = []

            for l_zone in lower_zones:
                if (
                    l_zone["proximal_line"] <= h_zone["proximal_line"]
                    and l_zone["distal_line"] >= h_zone["distal_line"]
                ):
                    l_zone["timestamp"] = l_zone["start_timestamp"]
                    h_zone["coinciding_lower_zones"].append(l_zone)

        logger.info(f"Mapped lower timeframe zones under higher timeframe zones.")

        return higher_zones

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")



async def health_check_controller():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}