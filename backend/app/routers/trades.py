from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.db.database import trade_collection
from bson import ObjectId
from app.models.trade_models import TradeCreate, VerifyTrade

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

# Update a trade
@router.put("/{trade_id}")
async def update_trade(trade_id: str, trade: TradeCreate):
    try:
        if not ObjectId.is_valid(trade_id):
            raise HTTPException(status_code=400, detail="Invalid trade ID")

        trade_dict = trade.dict(exclude_unset=True)
        result = await trade_collection.update_one(
            {"_id": ObjectId(trade_id)},
            {"$set": trade_dict}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Trade not found")

        updated_trade = await trade_collection.find_one({"_id": ObjectId(trade_id)})
        updated_trade["_id"] = str(updated_trade["_id"])
        return {"message": "Trade updated successfully", "trade": updated_trade}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# Delete a trade
@router.delete("/{trade_id}")
async def delete_trade(trade_id: str):
    try:
        if not ObjectId.is_valid(trade_id):
            raise HTTPException(status_code=400, detail="Invalid trade ID")

        result = await trade_collection.delete_one({"_id": ObjectId(trade_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Trade not found")

        return {"message": "Trade deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# Toggle verified status
@router.patch("/{trade_id}/verify")
async def toggle_trade_verified(trade_id: str, verify_data: VerifyTrade):
    try:
        if not ObjectId.is_valid(trade_id):
            raise HTTPException(status_code=400, detail="Invalid trade ID")

        result = await trade_collection.update_one(
            {"_id": ObjectId(trade_id)},
            {"$set": {"verified": verify_data.verified}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Trade not found")

        updated_trade = await trade_collection.find_one({"_id": ObjectId(trade_id)})
        updated_trade["_id"] = str(updated_trade["_id"])
        return {"message": "Verified status updated successfully", "trade": updated_trade}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")