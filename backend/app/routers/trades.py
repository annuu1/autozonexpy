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

#get all trades
@router.get("/")
async def get_trades():
    try:
        trades = []
        async for trade in trade_collection.find():
            trade["_id"] = str(trade["_id"])
            trades.append(trade)
        return trades
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
