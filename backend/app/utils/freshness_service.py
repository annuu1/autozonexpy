import logging
from datetime import datetime, timedelta
import pandas as pd
from fastapi import HTTPException
from datetime import date
from typing import List, Dict
import yfinance as yf

logger = logging.getLogger(__name__)

def fetch_stock_data(ticker: str, start_date: date, end_date: date, interval: str) -> pd.DataFrame:
    try:
        # Normalize ticker: uppercase and append .NS if not present
        ticker = ticker.upper()
        if not ticker.endswith(".NS"):
            ticker = f"{ticker}.NS"
        
        stock = yf.Ticker(ticker)
        data = stock.history(
                start=start_date, 
                end=end_date, 
                interval=interval, 
                auto_adjust=False, 
                actions=False
                )
        if data.empty:
            logger.error(f"No data found for ticker {ticker}")
            raise HTTPException(status_code=404, detail="No data found for the given ticker")
        return data
    except Exception as e:
        logger.error(f"Error fetching data for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")


async def get_freshness(ticker: str, time_frame: str, proximal_line: float, distal_line: float, leg_out_date: str) -> float:
    try:
        # Fetch candles from leg_out_date to present
        start_date = datetime.fromisoformat(leg_out_date).date()
        end_date = datetime.now().date() + timedelta(days=1)
        candles = fetch_stock_data(ticker, start_date, end_date, time_frame)
        
        if candles.empty:
            logger.warning(f"No candles found for freshness check: {ticker} ({time_frame})")
            return 3.0  # No data, assume fresh

        approach_count = 0
        is_breached = False

        # Check each candle for approach or breach
        for index, candle in candles.iterrows():
            # Skip the leg-out candle
            if index.isoformat() == leg_out_date:
                continue

            # Approach: Price enters zone
            if candle['Low'] <= proximal_line and candle['High'] >= distal_line:
                approach_count += 1
                logger.info(f"Price approached zone: {ticker} ({time_frame}), Date: {index}, Low={candle['Low']}, High={candle['High']}")

            # Breach: Price closes below distal_line
            if candle['Close'] < distal_line:
                is_breached = True
                logger.info(f"Zone breached: {ticker} ({time_frame}), Date: {index}, Close={candle['Close']}, Distal={distal_line}")
                break

        # Assign freshness score
        if is_breached:
            return 0.0
        if approach_count == 0:
            return 3.0
        if approach_count <= 2:
            return 1.5
        return 0.0
    except Exception as e:
        logger.error(f"Error checking freshness for {ticker} ({time_frame}): {str(e)}")
        return 3.0