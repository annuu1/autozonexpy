from pydantic import BaseModel
from datetime import date
from typing import Optional

class StockRequest(BaseModel):
    ticker: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    higher_interval: str = "1d"
    lower_interval: str = "1h"
    leginMinBodyPercent: int = 50
    legoutMinBodyPercent: int = 50
    baseMaxBodyPercent: int = 50
    minBaseCandles: int = 1
    maxBaseCandles: int = 5
    detectLowerZones: Optional[bool] = True

class DemandZone(BaseModel):
    zone_id: str
    proximal_line: float
    distal_line: float
    trade_score: float
    pattern: str
    timestamp: str
    base_candles: int
    freshness: str
    parent_zone_id: Optional[str] = None  # New field
    timestamp: Optional[str] = None
