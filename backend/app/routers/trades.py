from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.db.database import trade_collection
from bson import ObjectId
from app.models.trade_models import TradeCreate, VerifyTrade
from app.models.models import RealtimeData
import yfinance as yf
import logging
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import math

router = APIRouter(prefix="/trades", tags=["trades"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Custom JSON encoder that handles NaN and infinity
def json_serial(obj):
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, (list, tuple)):
        return [json_serial(item) for item in obj]
    if isinstance(obj, dict):
        return {k: json_serial(v) for k, v in obj.items()}
    if isinstance(obj, (np.floating, float)) and (math.isnan(obj) or not math.isfinite(obj)):
        return None
    return str(obj)

# Create a trade
@router.post("/")
async def create_trade(trade: TradeCreate):
    try:
        trade_dict = trade.dict()
        result = await trade_collection.insert_one(trade_dict)
        created_trade = await trade_collection.find_one({"_id": ObjectId(result.inserted_id)})
        created_trade["_id"] = str(created_trade["_id"])
        return {"message": "Trade added successfully!", "trade_id": str(result.inserted_id), "trade": created_trade}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error creating trade: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# Get a trade by symbol
@router.get("/symbol/{symbol}")
async def get_trade_by_symbol(symbol: str):
    try:
        # Get the trades by symbol case insensitive
        trades = []
        async for trade in trade_collection.find({"symbol": {"$regex": symbol, "$options": "i"}}).limit(100):
            trade["_id"] = str(trade["_id"])  # Convert ObjectId to string
            trades.append(trade)
        return trades
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching trades by symbol {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# Get a single trade
@router.get("/{trade_id}")
async def get_trade(trade_id: str):
    try:
        if not ObjectId.is_valid(trade_id):
            raise HTTPException(status_code=400, detail="Invalid trade ID")
        trade = await trade_collection.find_one({"_id": ObjectId(trade_id)})
        if not trade:
            raise HTTPException(status_code=404, detail="Trade not found")
        trade["_id"] = str(trade["_id"])
        return {"trade": trade}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# Get all trades with pagination, sorting, and search
@router.get("/")
async def get_trades(
    page: int = Query(1, ge=1, description="Page number, starting from 1"),
    limit: int = Query(10, ge=1, le=100, description="Number of trades per page"),
    sort_by: Optional[str] = Query("created_at", description="Field to sort by"),
    sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$", description="Sort order (asc or desc)"),
    symbol: Optional[str] = Query("", description="Search by symbol (partial match)"),
    status: Optional[str] = Query("", regex="^(OPEN|CLOSED|)$", description="Filter by status (OPEN or CLOSED)")
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

        # Build MongoDB query
        query = {}
        if symbol:
            query["symbol"] = {"$regex": symbol, "$options": "i"}  # Case-insensitive partial match
        if status:
            query["status"] = status  # Exact match

        # Prepare MongoDB query
        skip = (page - 1) * limit
        sort_direction = 1 if sort_order == "asc" else -1

        # Fetch trades with pagination, sorting, and filtering
        trades_cursor = trade_collection.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
        trades = []
        async for trade in trades_cursor:
            trade["_id"] = str(trade["_id"])  # Convert ObjectId to string
            trades.append(trade)

        # Get total count for pagination
        total_count = await trade_collection.count_documents(query)

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


# Get real-time data for multiple tickers
@router.post("/realtime-data")
async def get_realtime_data(tickers: List[str]):
    try:
        # Remove duplicates and empty strings, append .NS for Indian stocks
        tickers = list(set([t + ".NS" for t in tickers if t.strip()]))
        if not tickers:
            return {"realtime_data": []}

        logger.info(f"Fetching real-time data for tickers: {tickers}")

        # Fetch data using yfinance
        data = yf.download(
            tickers=tickers,
            period="1d",
            interval="1d",
            group_by="ticker",
            threads=True,
            ignore_tz=True
        )

        realtime_data = []
        for ticker in tickers:
            try:
                # Remove .NS for response to match original symbol
                original_ticker = ticker.replace(".NS", "")
                ticker_data = data[ticker] if len(tickers) > 1 else data
                if not ticker_data.empty:
                    ltp = ticker_data['Close'].iloc[-1]
                    day_low = ticker_data['Low'].iloc[-1]
                    # Convert NaN to None and handle non-finite values
                    ltp_val = None if pd.isna(ltp) or not np.isfinite(ltp) else round(float(ltp), 2)
                    day_low_val = None if pd.isna(day_low) or not np.isfinite(day_low) else round(float(day_low), 2)
                    realtime_data.append({
                        "symbol": original_ticker,
                        "ltp": ltp_val,
                        "day_low": day_low_val
                    })
                else:
                    logger.warning(f"No data found for ticker {ticker}")
                    realtime_data.append({
                        "symbol": original_ticker,
                        "ltp": None,
                        "day_low": None
                    })
            except (KeyError, IndexError, ValueError) as e:
                logger.error(f"Error processing ticker {ticker}: {str(e)}")
                realtime_data.append({
                    "symbol": original_ticker,
                    "ltp": None,
                    "day_low": None
                })

        return {"realtime_data": realtime_data}
    except Exception as e:
        logger.error(f"Failed to fetch real-time data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch real-time data: {str(e)}")