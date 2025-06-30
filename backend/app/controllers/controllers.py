import logging
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.models.models import StockRequest, DemandZone, MultiStockRequest
from app.services.services import fetch_stock_data, identify_demand_zones, identify_ltf_zones
from app.services.zone_service import save_unique_zones
from typing import List, Dict
from dateutil import parser
import json
from app.utils.ticker_loader import load_tickers_from_json
import pandas as pd
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

async def find_demand_zones_controller(request: StockRequest) -> List[Dict]:
    try:
        if not request.start_date:
            request.start_date = (datetime.now().date() - timedelta(days=365))
        if not request.end_date:
            request.end_date = datetime.now().date()

        logger.info(f"Processing {request.ticker} from {request.start_date} to {request.end_date}, "
                   f"higher interval: {request.higher_interval}, lower interval: {request.lower_interval}")

        higher_data = fetch_stock_data(
            request.ticker,
            request.start_date,
            request.end_date,
            request.higher_interval
        )
        if higher_data is None:
            logger.warning(f"No data found for {request.ticker}, skipping.")
            return []

        higher_zones = await identify_demand_zones(
            data=higher_data,
            ticker=request.ticker,
            time_frame=request.higher_interval,
            legin_min_body_percent=request.leginMinBodyPercent,
            legout_min_body_percent=request.legoutMinBodyPercent,
            base_max_body_percent=request.baseMaxBodyPercent,
            min_base_candles=request.minBaseCandles,
            max_base_candles=request.maxBaseCandles,
            min_legout_movement=request.minLegoutMovement,
            min_legin_movement=request.minLeginMovement
        )
        logger.info(f"Found {len(higher_zones)} higher timeframe zones.")

        # Map lower timeframe zones under corresponding higher timeframe zones
        if request.detectLowerZones:
            for h_zone in higher_zones:
                h_zone["timestamp"] = h_zone["start_timestamp"]
                h_zone["coinciding_lower_zones"] = []

                try:
                    start_date = parser.parse(h_zone["start_timestamp"]).date()
                    h_end_timestamp = parser.parse(h_zone["end_timestamp"])
                    next_candle_ts = higher_data.index[higher_data.index > h_end_timestamp]
                    if not next_candle_ts.empty:
                        end_date = next_candle_ts[0].date()
                    else:
                        end_date = request.end_date

                    logger.info(f"Fetching lower timeframe data from {start_date} to {end_date} "
                               f"for higher zone {h_zone['start_timestamp']}")

                    lt_data = fetch_stock_data(
                        request.ticker,
                        start_date,
                        end_date,
                        request.lower_interval
                    )

                    lt_zones = await identify_ltf_zones(
                        data=lt_data,
                        ticker=request.ticker,
                        time_frame=request.lower_interval,
                        legin_min_body_percent=request.ltf_leginMinBodyPercent,
                        legout_min_body_percent=request.ltf_legoutMinBodyPercent,
                        base_max_body_percent=request.ltf_baseMaxBodyPercent,
                        min_base_candles=request.minBaseCandles,
                        max_base_candles=request.maxBaseCandles,
                        min_legout_movement=request.ltf_minLegoutMovement,
                        min_legin_movement=request.ltf_minLeginMovement
                    )
                    h_zone["coinciding_lower_zones"] = lt_zones
                    logger.info(f"Found {len(lt_zones)} lower timeframe zones for higher zone "
                               f"starting at {h_zone['start_timestamp']}.")

                except Exception as e:
                    logger.error(f"Error processing lower timeframe zones for higher zone "
                                f"{h_zone['start_timestamp']}: {str(e)}")
                    continue
        else:
            logger.info("Skipped lower timeframe demand zone detection as per request.")

        logger.info("Mapped lower timeframe zones under higher timeframe zones.")
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
    df = pd.read_csv("data/data.csv")
    tickers = df['Symbol'].to_list()
    return data.get("tickers", tickers)

async def find_multi_demand_zones_controller(request: MultiStockRequest) -> Dict[str, List[Dict]]:
    try:
        tickers = load_tickers_from_json("data/tickers.json")
        logger.info(f"Loaded {len(tickers)} tickers")

        all_results = {}
        max_concurrent_tasks = 50  # Adjust based on system resources and API rate limits

        async def process_ticker(ticker: str) -> tuple:
            logger.info(f"Processing ticker: {ticker}")
            try:
                stock_request = StockRequest(
                    ticker=ticker,
                    start_date=request.start_date,
                    end_date=request.end_date,
                    higher_interval=request.higher_interval,
                    lower_interval=request.lower_interval,
                    leginMinBodyPercent=request.leginMinBodyPercent,
                    ltf_leginMinBodyPercent=request.ltf_leginMinBodyPercent,
                    legoutMinBodyPercent=request.legoutMinBodyPercent,
                    ltf_legoutMinBodyPercent=request.ltf_legoutMinBodyPercent,
                    baseMaxBodyPercent=request.baseMaxBodyPercent,
                    ltf_baseMaxBodyPercent=request.ltf_baseMaxBodyPercent,
                    minLegoutMovement=request.minLegoutMovement,
                    ltf_minLegoutMovement=request.ltf_minLegoutMovement,
                    minLeginMovement=request.minLeginMovement,
                    ltf_minLeginMovement=request.ltf_minLeginMovement,
                    minBaseCandles=request.minBaseCandles,
                    maxBaseCandles=request.maxBaseCandles,
                    detectLowerZones=request.detectLowerZones,
                )
                result = await find_demand_zones_controller(stock_request)
                return ticker, result
            except Exception as e:
                logger.error(f"Error processing ticker {ticker}: {str(e)}")
                return ticker, []

        # Use ThreadPoolExecutor for parallel processing
        with ThreadPoolExecutor(max_workers=max_concurrent_tasks) as executor:
            loop = asyncio.get_event_loop()
            tasks = [
                loop.run_in_executor(executor, lambda t=ticker: asyncio.run(process_ticker(t)))
                for ticker in tickers
            ]
            # Process tasks in chunks to avoid overwhelming the event loop
            for i in range(0, len(tasks), max_concurrent_tasks):
                chunk = tasks[i:i + max_concurrent_tasks]
                results = await asyncio.gather(*chunk, return_exceptions=True)
                for ticker, result in results:
                    if not isinstance(result, Exception):
                        all_results[ticker] = result

        # Save unique zones to MongoDB using the service
        await save_unique_zones(all_results)
        logger.info(f"Completed processing for {len(all_results)} tickers")
        return all_results

    except Exception as e:
        logger.error(f"Error processing multi ticker demand zones: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")