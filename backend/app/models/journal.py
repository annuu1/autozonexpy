from datetime import datetime
from typing import Optional
from bson import ObjectId
from pydantic import GetCoreSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic import BaseModel, Field
from pydantic_core import core_schema

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler: GetCoreSchemaHandler) -> JsonSchemaValue:
        return {"type": "string"}
class JournalEntry(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    symbol: str
    exchange_segment: str
    transaction_type: str  # Buy / Sell
    quantity: int
    trade_date: datetime
    current_status: str  # Open / Closed
    notes: Optional[str] = None
    sector: Optional[str] = None
    instrument_name: Optional[str] = None
    avg_buy_price: Optional[float] = None
    sell_price: Optional[float] = None
    sell_date: Optional[datetime] = None
    holding_cost: Optional[float] = None
    market_value: Optional[float] = None
    journal_created_on: datetime = Field(default_factory=datetime.now)

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        allow_population_by_field_name = True
