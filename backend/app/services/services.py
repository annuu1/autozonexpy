import yfinance as yf
import pandas as pd
import logging
from fastapi import HTTPException
from typing import List, Dict
from datetime import date
import uuid

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

def identify_demand_zones(
    data: pd.DataFrame,
    legin_min_body_percent: int = 50,
    legout_min_body_percent: int = 50,
    base_max_body_percent: int = 50,
    min_base_candles: int = 1,
    max_base_candles: int = 5,
) -> List[Dict]:
    DEBUG = True  # ⬅️ Turn to False in production
    demand_zones = []
    i = 0
    print(data)
    while i < len(data) - 2:
        leg_in = data.iloc[i]
        candle_range = leg_in['High'] - leg_in['Low']
        body = abs(leg_in['Close'] - leg_in['Open'])
        body_percent = (body / candle_range * 100) if candle_range > 0 else 0

        if DEBUG:
            print(f"\n🟠 Checking candle at {leg_in.name}")
            print(f"High: {leg_in['High']}, Low: {leg_in['Low']}, Open: {leg_in['Open']}, Close: {leg_in['Close']}")
            print(f"Body: {body}, Range: {candle_range}, Body%: {body_percent:.2f}%")

        is_leg_in_red = leg_in['Close'] < leg_in['Open'] and body_percent >= legin_min_body_percent
        is_leg_in_green = leg_in['Close'] > leg_in['Open'] and body_percent >= legin_min_body_percent
        if not (is_leg_in_red or is_leg_in_green):
            if DEBUG:
                print("❌ Not a valid leg-in candle.\n")
            i += 1
            continue

        if DEBUG:
            print("✅ Leg-in candle detected. Checking base candles...\n")

        base_candles = []
        j = i + 1
        while j < len(data) and len(base_candles) < max_base_candles:
            candle = data.iloc[j]
            candle_range = candle['High'] - candle['Low']
            body = abs(candle['Close'] - candle['Open'])
            body_percent = (body / candle_range * 100) if candle_range > 0 else 0

            if DEBUG:
                print(f"  📌 Base check — Candle {j}: Body% = {body_percent:.2f}%")

            if candle_range > 0 and body_percent <= base_max_body_percent:
                base_candles.append(candle)
                if DEBUG:
                    print("  ✅ Base candle accepted.")
            else:
                if DEBUG:
                    print("  ❌ Base candle rejected.")
                break
            j += 1

        if len(base_candles) < min_base_candles:
            if DEBUG:
                print(f"❌ Not enough base candles ({len(base_candles)} found). Moving to next leg-in.\n")
            i = j
            continue

        if j >= len(data):
            break

        if DEBUG:
            print(f"✅ {len(base_candles)} base candles found. Now checking for leg-out candle...\n")

        leg_out = data.iloc[j]
        leg_out_range = leg_out['High'] - leg_out['Low']
        leg_out_body = abs(leg_out['Close'] - leg_out['Open'])
        leg_out_body_percent = (leg_out_body / leg_out_range * 100) if leg_out_range > 0 else 0
        is_leg_out_green = (
            leg_out['Close'] > leg_out['Open']
            and leg_out['Close'] > leg_in['High']
            and leg_out_body_percent >= legout_min_body_percent
        )

        if DEBUG:
            print(f"Leg-out check at {leg_out.name}:")
            print(f"Close: {leg_out['Close']}, Open: {leg_out['Open']}, Body%: {leg_out_body_percent:.2f}%")
            print(f"Above Leg-in High: {leg_out['Close'] > leg_in['High']}")

        if not is_leg_out_green:
            if DEBUG:
                print("❌ Not a valid leg-out candle. Moving to next leg-in.\n")
            i = j
            continue

        base_highs = [c['High'] for c in base_candles]
        base_lows = [c['Low'] for c in base_candles]
        base_bodies = [max(c['Open'], c['Close']) for c in base_candles]
        proximal_line = max(base_bodies)
        distal_line = min(base_lows)

        freshness_score = 3.0
        strength_score = 1.0 if leg_out_body_percent > 50 else 0.5
        time_at_base_score = 2.0 if len(base_candles) <= 3 else 1.0
        trade_score = freshness_score + strength_score + time_at_base_score

        pattern = "DBR" if is_leg_in_red else "RBR"

        zone = {
            "zone_id": str(uuid.uuid4()),
            "proximal_line": proximal_line,
            "distal_line": distal_line,
            "trade_score": trade_score,
            "pattern": pattern,
            "start_timestamp": leg_in.name.isoformat(),
            "end_timestamp": leg_out.name.isoformat(),
            "base_candles": len(base_candles),
            "freshness": "Fresh",
            "timestamp": leg_in.name.isoformat()
        }

        if DEBUG:
            print("🎯 Demand Zone identified:")
            print(zone)

        demand_zones.append(zone)
        i = j + 1

    return demand_zones
