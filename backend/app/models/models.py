from pydantic import BaseModel
from datetime import date, datetime
from typing import Dict, Optional
from typing import Optional, List



class GetZonesRequest(BaseModel):
    tickers: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class StockRequest(BaseModel):
    ticker: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    higher_interval: str = "1d"
    lower_interval: str = "1h"
    leginMinBodyPercent: float = 50
    ltf_leginMinBodyPercent: float = 50
    legoutMinBodyPercent: float = 50
    ltf_legoutMinBodyPercent: float = 50
    baseMaxBodyPercent: float = 50
    ltf_baseMaxBodyPercent: float = 50
    minLegoutMovement: float = 7
    ltf_minLegoutMovement: float = 3
    minLeginMovement: float = 7
    ltf_minLeginMovement: float = 3
    minBaseCandles: float = 1
    maxBaseCandles: float = 5
    detectLowerZones: Optional[bool] = True

class DemandZone(BaseModel):
    zone_id: str
    proximal_line: float
    distal_line: float
    trade_score: float
    pattern: str
    timestamp: str
    end_timestamp: str
    base_candles: float
    freshness: float
    parent_zone_id: Optional[str] = None
    coinciding_lower_zones: List[Dict] = []


class MultiStockRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    higher_interval: str = "1d"
    lower_interval: str = "1h"
    leginMinBodyPercent: float = 50
    ltf_leginMinBodyPercent: float = 50
    legoutMinBodyPercent: float = 50
    ltf_legoutMinBodyPercent: float = 50
    baseMaxBodyPercent: float = 50
    ltf_baseMaxBodyPercent: float = 50
    minLegoutMovement: float = 7
    ltf_minLegoutMovement: float = 3
    minLeginMovement: float = 7
    ltf_minLeginMovement: float = 3
    minBaseCandles: float = 1
    maxBaseCandles: float = 5
    detectLowerZones: Optional[bool] = True
