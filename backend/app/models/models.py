from pydantic import BaseModel
from datetime import date, datetime
from typing import Dict, Optional
from typing import Optional, List

class StockRequest(BaseModel):
    ticker: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    higher_interval: str = "1d"
    lower_interval: str = "1h"
    leginMinBodyPercent: int = 50
    ltf_leginMinBodyPercent: int = 50
    legoutMinBodyPercent: int = 50
    ltf_legoutMinBodyPercent: int = 50
    baseMaxBodyPercent: int = 50
    ltf_baseMaxBodyPercent: int = 50
    minLegoutMovement: int = 7
    ltf_minLegoutMovement: int = 3
    minLeginMovement: int = 7
    ltf_minLeginMovement: int = 3
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
    freshness: float
    parent_zone_id: Optional[str] = None
    coinciding_lower_zones: List[Dict] = []


class MultiStockRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    higher_interval: str = "1d"
    lower_interval: str = "1h"
    leginMinBodyPercent: int = 50
    ltf_leginMinBodyPercent: int = 50
    legoutMinBodyPercent: int = 50
    ltf_legoutMinBodyPercent: int = 50
    baseMaxBodyPercent: int = 50
    ltf_baseMaxBodyPercent: int = 50
    minLegoutMovement: int = 7
    ltf_minLegoutMovement: int = 3
    minBaseCandles: int = 1
    maxBaseCandles: int = 5
    detectLowerZones: Optional[bool] = True
