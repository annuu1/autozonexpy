import logging
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.models.models import StockRequest, DemandZone
from app.services.services import fetch_stock_data, identify_demand_zones
from typing import List, Dict
from dateutil import parser


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

        # Map lower timeframe zones under corresponding higher timeframe zones
        if request.detectLowerZones:
            for h_zone in higher_zones:
                h_zone["timestamp"] = h_zone["start_timestamp"]
                h_zone["coinciding_lower_zones"] = []

                try:
                    start_date = parser.parse(h_zone["start_timestamp"]).date()

                    # Find next higher timeframe candle timestamp
                    h_end_timestamp = parser.parse(h_zone["end_timestamp"])
                    next_candle_ts = higher_data.index[higher_data.index > h_end_timestamp]
                    if not next_candle_ts.empty:
                        end_date = next_candle_ts[0].date()
                    else:
                        end_date = request.end_date

                    logger.info(f"Fetching lower timeframe data from {start_date} to {end_date} for higher zone {h_zone['start_timestamp']}")

                    lt_data = fetch_stock_data(request.ticker, start_date, end_date, request.lower_interval)

                    lt_zones = identify_demand_zones(
                        lt_data,
                        legin_min_body_percent=request.leginMinBodyPercent,
                        legout_min_body_percent=request.legoutMinBodyPercent,
                        base_max_body_percent=request.baseMaxBodyPercent,
                        min_base_candles=request.minBaseCandles,
                        max_base_candles=request.maxBaseCandles,
                    )
                    h_zone["coinciding_lower_zones"] = lt_zones
                    logger.info(f"Found {len(lt_zones)} lower timeframe zones for higher zone starting at {h_zone['start_timestamp']}.")

                except Exception as e:
                    logger.error(f"Error processing lower timeframe zones for higher zone {h_zone['start_timestamp']}: {str(e)}")
                    continue
        else:
            logger.info("Skipped lower timeframe demand zone detection as per request.")


        logger.info(f"Mapped lower timeframe zones under higher timeframe zones.")

        return higher_zones

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")



async def health_check_controller():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}