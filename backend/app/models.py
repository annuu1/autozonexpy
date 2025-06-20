from pydantic import BaseModel
from datetime import date
from typing import Optional

class StockRequest(BaseModel):
    ticker: str
    start_date: Optional[date] = None  # Default set in controller
    end_date: Optional[date] = None    # Default set in controller
    interval: str = "1d"  # Default: Daily
    leginMinBodyPercent: int = 50
    legoutMinBodyPercent: int = 50
    baseMaxBodyPercent: int = 50
    minBaseCandles: int = 1
    maxBaseCandles: int = 5

class DemandZone(BaseModel):
    zone_id: str
    proximal_line: float
    distal_line: float
    trade_score: float
    pattern: str
    timestamp: str
    base_candles: int
    freshness: str