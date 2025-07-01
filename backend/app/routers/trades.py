from typing import Optional
from fastapi import APIRouter, HTTPException, Query
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

# Get all trades with pagination and sorting
@router.get("/")
async def get_trades(
    page: int = Query(1, ge=1, description="Page number, starting from 1"),
    limit: int = Query(10, ge=1, le=100, description="Number of trades per page"),
    sort_by: Optional[str] = Query("created_at", description="Field to sort by"),
    sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$", description="Sort order (asc or desc)")
):
    try:
        # Validate sort_by field
        valid_sort_fields = [
            "symbol", "entry_price", "stop_loss", "target_price",
            "trade_type", "status", "created_at", "alert_sent",
            "entry_alert_sent", "note", "verified"
        ]
        if sort_by not in valid_sort_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid sort field. Must be one of: {', '.join(valid_sort_fields)}"
            )

        # Prepare MongoDB query
        skip = (page - 1) * limit
        sort_direction = 1 if sort_order == "asc" else -1

        # Fetch trades with pagination and sorting
        trades_cursor = trade_collection.find().sort(sort_by, sort_direction).skip(skip).limit(limit)
        trades = []
        async for trade in trades_cursor:
            trade["_id"] = str(trade["_id"])  # Convert ObjectId to string
            trades.append(trade)

        # Get total count for pagination
        total_count = await trade_collection.count_documents({})

        # Calculate total pages
        total_pages = (total_count + limit - 1) // limit  # Ceiling division

        return {
            "trades": trades,
            "total_pages": total_pages,
            "total_count": total_count
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")