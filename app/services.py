import yfinance as yf
import pandas as pd
import logging
from fastapi import HTTPException
from typing import List, Dict
import uuid

logger = logging.getLogger(__name__)

def fetch_stock_data(ticker: str, period: str, interval: str) -> pd.DataFrame:
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period=period, interval=interval)
        if data.empty:
            logger.error(f"No data found for ticker {ticker}")
            raise HTTPException(status_code=404, detail="No data found for the given ticker")
        return data
    except Exception as e:
        logger.error(f"Error fetching data for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

def identify_demand_zones(data: pd.DataFrame) -> List[Dict]:
    demand_zones = []
    min_base_candles = 1
    max_base_candles = 5
    i = 0

    while i < len(data) - max_base_candles - 1:
        # Check for leg-in candle (green or red)
        leg_in = data.iloc[i]
        is_leg_in_red = leg_in['Close'] < leg_in['Open']
        is_leg_in_green = leg_in['Close'] > leg_in['Open']
        if not (is_leg_in_red or is_leg_in_green):
            i += 1
            continue

        # Check for base candles (1-5 candles with body < 50% of range)
        base_candles = []
        j = i + 1
        while j < len(data) and len(base_candles) < max_base_candles:
            candle = data.iloc[j]
            candle_range = candle['High'] - candle['Low']
            body = abs(candle['Close'] - candle['Open'])
            if candle_range > 0 and body / candle_range < 0.5:
                base_candles.append(candle)
            else:
                break
            j += 1

        if len(base_candles) < min_base_candles:
            i = j
            continue

        # Check for leg-out candle (green rally candle)
        if j < len(data):
            leg_out = data.iloc[j]
            is_leg_out_green = leg_out['Close'] > leg_out['Open'] and leg_out['Close'] > leg_in['High']
            if not is_leg_out_green:
                i = j
                continue

            # Mark demand zone (body-to-wick method)
            base_highs = [candle['High'] for candle in base_candles]
            base_lows = [candle['Low'] for candle in base_candles]
            base_bodies = [max(candle['Open'], candle['Close']) for candle in base_candles]
            proximal_line = max(base_bodies)
            distal_line = min(base_lows)

            # Calculate trade score
            freshness_score = 3.0  # Assume fresh zone
            strength_score = 1.0 if abs(leg_out['Close'] - leg_out['Open']) / (leg_out['High'] - leg_out['Low']) > 0.5 else 0.5
            time_at_base_score = 2.0 if len(base_candles) <= 3 else 1.0 if len(base_candles) <= 5 else 0.0
            trade_score = freshness_score + strength_score + time_at_base_score

            # Determine pattern (DBR or RBR)
            pattern = "DBR" if is_leg_in_red else "RBR"

            # Create zone
            zone = {
                "zone_id": str(uuid.uuid4()),
                "proximal_line": proximal_line,
                "distal_line": distal_line,
                "trade_score": trade_score,
                "pattern": pattern,
                "timestamp": leg_out.name.isoformat(),
                "base_candles": len(base_candles),
                "freshness": "Fresh"
            }
            demand_zones.append(zone)
            i = j + 1
        else:
            break

    return demand_zones
