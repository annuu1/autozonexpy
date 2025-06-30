from fastapi import APIRouter, HTTPException
from app.db.database import trade_collection
from app.models.trade_models import TradeCreate

router = APIRouter(prefix = '/trades', tags=["trades"])

#create
@router.post("/")
async def create_trade(trade: TradeCreate):
    try:
        trade_dict = trade.dict()
        trade_collection.insert_one(trade_dict)
        return {"message": "Trade added successfully!"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
