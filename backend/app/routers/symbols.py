from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models.symbol_models import Symbol, SymbolCreate, SymbolUpdate
from datetime import datetime
import yfinance as yf
from app.db.database import symbol_collection

router = APIRouter(prefix="/symbols", tags=["symbols"])

# Create a symbol
@router.post("/", response_model=Symbol)
async def create_symbol(symbol_data: SymbolCreate):
    collection = symbol_collection
    
    # Check if symbol exists
    existing_symbol = await collection.find_one({"symbol": symbol_data.symbol})
    if existing_symbol:
        raise HTTPException(status_code=400, detail="Symbol already exists")
    
    # Create new symbol
    symbol_dict = symbol_data.model_dump()
    symbol_dict["last_updated"] = datetime.now()
    await collection.insert_one(symbol_dict)
    return symbol_dict

#create multiple symbols
@router.post("/batch", response_model=List[Symbol])
async def create_symbols(symbols_data: List[SymbolCreate]):
    collection = symbol_collection
    
    # Check if any symbol exists
    existing_symbols = await collection.find({"symbol": {"$in": [symbol.symbol for symbol in symbols_data]}}).to_list(length=None)
    if existing_symbols:
        raise HTTPException(status_code=400, detail="Some symbols already exist")
    
    # Create new symbols
    symbols_dict = [symbol.model_dump() for symbol in symbols_data]
    for symbol_dict in symbols_dict:
        symbol_dict["last_updated"] = datetime.now()
    await collection.insert_many(symbols_dict)
    return symbols_dict

# Get all symbols with pagination and filtering
@router.get("/", response_model=List[Symbol])
async def get_symbols(
    skip: int = 0,
    limit: int = 100,
    sector: Optional[str] = None,
    watchlist: Optional[str] = None
):
    collection = symbol_collection
    query = {}
    if sector:
        query["sectors"] = {"$in": [sector]}
    if watchlist:
        query["watchlists"] = {"$in": [watchlist]}
    
    cursor = collection.find(query).skip(skip).limit(limit)
    symbols = await cursor.to_list(length=limit)
    return symbols

# Get a specific symbol
@router.get("/{symbol}", response_model=Symbol)
async def get_symbol(symbol: str):
    collection = symbol_collection
    symbol_data = await collection.find_one({"symbol": symbol})
    if not symbol_data:
        raise HTTPException(status_code=404, detail="Symbol not found")
    return symbol_data

# Update a symbol
@router.put("/{symbol}", response_model=Symbol)
async def update_symbol(symbol: str, symbol_data: SymbolUpdate):
    collection = symbol_collection
    existing_symbol = await collection.find_one({"symbol": symbol})
    if not existing_symbol:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    update_data = symbol_data.model_dump(exclude_unset=True)
    await collection.update_one(
        {"symbol": symbol},
        {"$set": update_data}
    )
    updated_symbol = await collection.find_one({"symbol": symbol})
    return updated_symbol

# Delete a symbol
@router.delete("/{symbol}")
async def delete_symbol(symbol: str):
    collection = symbol_collection
    result = await collection.delete_one({"symbol": symbol})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Symbol not found")
    return {"detail": "Symbol deleted"}

# Update LTP for all symbols
@router.post("/update-ltp/")
async def update_all_ltp():
    try:
        collection = symbol_collection
        
        # Get all symbols
        cursor = collection.find()
        symbols = await cursor.to_list(length=None)
        if not symbols:
            return {"detail": "No symbols found"}
        
        # Prepare tickers for yfinance
        tickers = [f"{symbol['symbol']}.NS" for symbol in symbols]
        yf_tickers = yf.Tickers(" ".join(tickers))
        
        # Update LTP and last_updated
        for symbol in symbols:
            ticker = yf_tickers.tickers.get(f"{symbol['symbol']}.NS")
            if ticker:
                ltp = ticker.info.get("regularMarketPrice")
                if ltp:
                    await collection.update_one(
                        {"symbol": symbol["symbol"]},
                        {"$set": {"ltp": ltp, "last_updated": datetime.now()}}
                    )
        
        return {"detail": f"Updated LTP for {len(symbols)} symbols"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update LTP: {str(e)}")