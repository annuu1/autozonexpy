from app.services.services import fetch_stock_data
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.models.models import StockRequest, DemandZone, MultiStockRequest
from app.services.services import fetch_stock_data, identify_demand_zones, identify_ltf_zones
from typing import List, Dict
from dateutil import parser
import json
from app.utils.ticker_loader import load_tickers_from_json
import pandas as pd
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from datetime import date

logger = logging.getLogger(__name__)

#api to get the ohlc data
async def ohlc_data_controller(ticker: str, start_date: date, end_date: date, interval: str):
    try:
        if not start_date:
            start_date = (datetime.now().date() - timedelta(days=365))
        if not end_date:
            end_date = datetime.now().date()
        
        logger.info(f"Processing {ticker} from {start_date} to {end_date}, "
                   f"interval: {interval}")
        
        ohlc_data = fetch_stock_data(
            ticker,
            start_date,
            end_date,
            interval
        )
        if ohlc_data is None:
            raise HTTPException(status_code=404, detail="No data found for the given ticker")
        # Convert DataFrame to records and ensure native types
        data = ohlc_data.reset_index()
        result = json.loads(data.to_json(orient="records", date_format="iso"))
        return result
    except Exception as e:
        logger.error(f"Error fetching data for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")