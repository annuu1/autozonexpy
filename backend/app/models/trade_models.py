from pydantic import BaseModel, Field, validator
from typing import Optional
from enum import Enum
from datetime import datetime

class TradeType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class TradeStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"

class TradeCreate(BaseModel):
    symbol: str = Field(..., min_length=3)
    entry_price: float = Field(gt=0)
    stop_loss: Optional[float] = None
    target_price: Optional[float] = None
    trade_type: TradeType
    status: TradeStatus = TradeStatus.OPEN
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    alert_sent: Optional[bool] = False
    entry_alert_sent: Optional[bool] = False
    note: Optional[str] = None

    @validator("stop_loss")
    def stop_loss_validation(cls, v, values):
        if v and "entry_price" in values and v >= values["entry_price"]:
            raise ValueError("Stop Loss must be less than Entry Price")
        return v

    @validator("target_price")
    def target_price_validation(cls, v, values):
        if v and "entry_price" in values and v <= values["entry_price"]:
            raise ValueError("Target Price must be greater than Entry Price")
        return v
