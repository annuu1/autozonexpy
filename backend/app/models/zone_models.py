from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    """Custom type for MongoDB ObjectId"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, *args, **kwargs):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)  # Ensure output is always a string

class LowerZone(BaseModel):
    zone_id: str
    proximal_line: float
    distal_line: float
    trade_score: float
    pattern: str
    start_timestamp: str
    end_timestamp: str
    base_candles: float
    freshness: float
    timestamp: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DemandZone(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=ObjectId, alias="_id")
    zone_id: str
    ticker: str
    timeframes: Optional[List[str]] = None
    proximal_line: float
    distal_line: float
    trade_score: float
    pattern: str
    timestamp: str
    end_timestamp: str
    base_candles: float
    freshness: float
    parent_zone_id: Optional[str]=None
    coinciding_lower_zones: List[LowerZone] = []

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}