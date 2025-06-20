from pydantic import BaseModel

class StockRequest(BaseModel):
    ticker: str
    period: str = "1mo"  # Default: 1 month
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
