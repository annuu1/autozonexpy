from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SymbolBase(BaseModel):
    symbol: str
    ltp: Optional[float] = None
    sectors: Optional[List[str]] = []
    watchlists: Optional[List[str]] = []
    company_name: Optional[str] = None
    last_updated: Optional[datetime] = None

class SymbolCreate(SymbolBase):
    pass

class SymbolUpdate(BaseModel):
    ltp: Optional[float] = None
    sectors: Optional[List[str]] = []
    watchlists: Optional[List[str]] = []
    company_name: Optional[str] = None

class Symbol(SymbolBase):
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {datetime: lambda v: v.isoformat()}