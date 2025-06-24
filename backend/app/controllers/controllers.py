import logging
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.models.models import StockRequest, DemandZone
from app.services.services import fetch_stock_data, identify_demand_zones, identify_ltf_zones
from typing import List, Dict
from dateutil import parser
from app.models.models import DemandZone, MultiStockRequest
import json
from app.utils.ticker_loader import load_tickers_from_json

logger = logging.getLogger(__name__)

async def find_demand_zones_controller(request: StockRequest) -> List[Dict]:
    try:
        if not request.start_date:
            request.start_date = (datetime.now().date() - timedelta(days=365))
        if not request.end_date:
            request.end_date = datetime.now().date()

        logger.info(f"Processing {request.ticker} from {request.start_date} to {request.end_date}, higher interval: {request.higher_interval}, lower interval: {request.lower_interval}")

        higher_data = fetch_stock_data(request.ticker, request.start_date, request.end_date, request.higher_interval)
        if higher_data is None:
            logger.warning(f"No data found for {request.ticker}, skipping.")
            return [] 
        higher_zones = await identify_demand_zones(
            higher_data,
            request.ticker,
            request.higher_interval,  # Pass the higher time_frame
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

                    lt_zones = await identify_ltf_zones(
                        lt_data,
                        request.ticker,
                        request.lower_interval,  # Pass the lower time_frame
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
        higher_zone_models = [DemandZone(**zone) for zone in higher_zones]

        return higher_zone_models

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")



async def health_check_controller():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

def load_tickers_from_json(file_path="data/tickers.json") -> List[str]:
    with open(file_path, "r") as f:
        data = json.load(f)
    return data.get("tickers", [])
async def find_multi_demand_zones_controller(request: MultiStockRequest) -> Dict[str, List[Dict]]:
    try:
        tickers = load_tickers_from_json("data/tickers.json")
        logger.info(f"Loaded tickers: {tickers}")

        all_results = {}

        for ticker in tickers:
            logger.info(f"Processing ticker: {ticker}")

            stock_request = StockRequest(
                ticker=ticker,
                start_date=request.start_date,
                end_date=request.end_date,
                higher_interval=request.higher_interval,
                lower_interval=request.lower_interval,
                leginMinBodyPercent=request.leginMinBodyPercent,
                legoutMinBodyPercent=request.legoutMinBodyPercent,
                baseMaxBodyPercent=request.baseMaxBodyPercent,
                minBaseCandles=request.minBaseCandles,
                maxBaseCandles=request.maxBaseCandles,
                detectLowerZones=request.detectLowerZones,
            )

            result = await find_demand_zones_controller(stock_request)
            all_results[ticker] = result

        return all_results

    except Exception as e:
        logger.error(f"Error processing multi ticker demand zones: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

