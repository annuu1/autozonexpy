from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict
from app.models.symbol_models import Symbol, SymbolCreate, SymbolUpdate
from datetime import datetime
import yfinance as yf
from app.db.database import symbol_collection
from app.controllers.controllers import load_tickers_from_json
from pymongo import UpdateOne
import asyncio

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
@router.post("/batch", response_model=Dict[str, List])
async def create_symbols(symbols_data: List[SymbolCreate]):
    collection = symbol_collection

    if not symbols_data:
        print("No symbols provided")
        #load ticker and make its  Symbol model
        tickers = load_tickers_from_json()
        symbols_data = [Symbol(symbol=ticker) for ticker in tickers]
    print(symbols_data)
    # Extract symbol names from the incoming data
    incoming_symbols = [symbol.symbol for symbol in symbols_data]

    # Fetch existing symbols from the database
    existing_symbols_cursor = await collection.find(
        {"symbol": {"$in": incoming_symbols}}
    ).to_list(length=None)
    existing_symbols = {symbol["symbol"] for symbol in existing_symbols_cursor}
    print("existing_symbols", existing_symbols)

    # Filter out symbols that already exist
    new_symbols_data = [symbol for symbol in symbols_data if symbol.symbol not in existing_symbols]
    print("new_symbols_data", new_symbols_data)

    if not new_symbols_data:
        raise HTTPException(status_code=400, detail="All provided symbols already exist")

    # Prepare documents for insertion
    symbols_dict = [symbol.model_dump() for symbol in new_symbols_data]
    for symbol_dict in symbols_dict:
        symbol_dict["last_updated"] = datetime.now()

    # Insert new symbols
    await collection.insert_many(symbols_dict)

    return {
        "inserted_symbols": [s["symbol"] for s in symbols_dict],
        "skipped_symbols": list(existing_symbols)
    }

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
@router.post("/update-ltp/")
async def update_all_ltp():
    try:
        collection = symbol_collection

        # Get all symbols
        cursor = collection.find()
        symbols = await cursor.to_list(length=None)
        if not symbols:
            return {"detail": "No symbols found"}

        # Prepare tickers for yfinance in chunks
        ticker_chunks = [symbols[i:i + 300] for i in range(0, len(symbols), 300)]

        total_updates = 0

        for chunk in ticker_chunks:
            tickers_str = " ".join([f"{symbol['symbol']}.NS" for symbol in chunk])
            yf_tickers = yf.Tickers(tickers_str)

            async def update_symbol(symbol):
                try:
                    ticker = yf_tickers.tickers.get(f"{symbol['symbol']}.NS")
                    if ticker:
                        ltp = ticker.info.get("regularMarketPrice")
                        if ltp:
                            await collection.update_one(
                                {"symbol": symbol["symbol"]},
                                {"$set": {"ltp": ltp, "last_updated": datetime.now()}}
                            )
                            return 1  # Successful update
                except Exception as e:
                    print(f"Failed to update {symbol['symbol']}: {e}")
                return 0  # Failed or skipped

            # Run updates concurrently for this chunk with asyncio.gather
            updates = await asyncio.gather(*(update_symbol(symbol) for symbol in chunk))
            total_updates += sum(updates)

        return {"detail": f"Updated LTP for {total_updates} symbols"}

    except Exception as e:
        print(f"Error in update_all_ltp: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update LTP: {str(e)}")