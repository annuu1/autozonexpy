from pydantic import BaseModel
from typing import Optional

# --- Request Model for Place Order ---
class PlaceOrderRequest(BaseModel):
    exchange_segment: str
    product: str
    price: str
    order_type: str
    quantity: str
    validity: str
    trading_symbol: str
    transaction_type: str
    amo: Optional[str] = "NO"
    disclosed_quantity: Optional[str] = "0"
    market_protection: Optional[str] = "0"
    pf: Optional[str] = "N"
    trigger_price: Optional[str] = "0"
    tag: Optional[str] = None