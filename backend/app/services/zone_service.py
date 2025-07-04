import logging
from typing import Dict, List, Optional
from dateutil import parser
from motor.motor_asyncio import AsyncIOMotorCollection
from app.models.zone_models import DemandZone, LowerZone
from app.db.database import collection

logger = logging.getLogger(__name__)

async def save_unique_zones(zones_by_ticker: Dict[str, List[DemandZone]], db_collection: AsyncIOMotorCollection = collection) -> None:
    """
    Save unique zones to MongoDB, ensuring no duplicates based on zone_id.
    
    Args:
        zones_by_ticker: Dictionary mapping ticker symbols to lists of DemandZone objects.
        db_collection: MongoDB collection to save zones to (defaults to app.db.database.collection).
    """
    try:
        global_unique_zones = set()  # Track unique zone_ids across all tickers
        for ticker, zones in zones_by_ticker.items():
            for zone in zones:
                if zone.zone_id not in global_unique_zones:
                    global_unique_zones.add(zone.zone_id)
                    lower_zones = [
                        lower_zone if isinstance(lower_zone, LowerZone) else LowerZone(**lower_zone)
                        for lower_zone in getattr(zone, "coinciding_lower_zones", [])
                    ]
                    zone_ticker = zone.zone_id.split("-")[0]
                    if zone_ticker != ticker:
                        logger.warning(f"Mismatch in ticker: {ticker} vs {zone_ticker} in zone_id {zone.zone_id}")
                    demand_zone = DemandZone(
                        zone_id=zone.zone_id,
                        ticker=zone_ticker, 
                        timeframes=zone.timeframes,
                        proximal_line=zone.proximal_line,
                        distal_line=zone.distal_line,
                        trade_score=zone.trade_score,
                        pattern=zone.pattern,
                        timestamp=zone.timestamp,
                        end_timestamp=zone.end_timestamp,
                        base_candles=zone.base_candles,
                        freshness=zone.freshness,
                        coinciding_lower_zones=lower_zones
                    )
                    try:
                        await db_collection.update_one(
                            {"zone_id": demand_zone.zone_id},
                            {"$set": demand_zone.model_dump()},
                            upsert=True
                        )
                        logger.info(f"Saved/Updated zone {demand_zone.zone_id} for ticker {ticker}")
                    except Exception as e:
                        logger.error(f"Error saving zone {demand_zone.zone_id} for ticker {ticker}: {str(e)}")
        logger.info(f"Saved {len(global_unique_zones)} unique zones to database")
    except Exception as e:
        logger.error(f"Error in save_unique_zones: {str(e)}")
        raise

async def get_zones_by_ticker(tickers: Optional[List[str]] = None, start_date: Optional[str] = None, end_date: Optional[str] = None, db_collection: AsyncIOMotorCollection = collection) -> Dict[str, List[Dict]]:
    """
    Retrieve demand zones from MongoDB, grouped by ticker.
    
    Args:
        tickers: Optional list of ticker symbols to filter by.
        start_date: Optional start date for zone timestamps (ISO format).
        end_date: Optional end date for zone timestamps (ISO format).
        db_collection: MongoDB collection to query (defaults to app.db.database.collection).
    
    Returns:
        Dictionary mapping ticker symbols to lists of DemandZone dictionaries.
    """
    try:
        query = {}
        if tickers:
            query["zone_id"] = {"$in": [f"{ticker}-" for ticker in tickers]}  # Partial match for zone_id
        if start_date and end_date:
            try:
                start_dt = parser.parse(start_date)
                end_dt = parser.parse(end_date)
                query["timestamp"] = {"$gte": start_dt.isoformat(), "$lte": end_dt.isoformat()}
            except ValueError as e:
                logger.error(f"Invalid date format: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")

        zones = await db_collection.find(query).to_list(length=None)
        logger.info(f"Retrieved {len(zones)} zones from database")

        # Group zones by ticker
        zones_by_ticker: Dict[str, List[Dict]] = {}
        for zone in zones:
            ticker = zone["zone_id"].split("-")[0]  # Extract ticker from zone_id (e.g., ZEEL from ZEEL-1d-...)
            if ticker not in zones_by_ticker:
                zones_by_ticker[ticker] = []
            # Convert to DemandZone and then to dict for consistent output
            demand_zone = DemandZone(**zone)
            zones_by_ticker[ticker].append(demand_zone.model_dump(by_alias=False))

        # Ensure empty lists for requested tickers with no zones
        if tickers:
            for ticker in tickers:
                if ticker not in zones_by_ticker:
                    zones_by_ticker[ticker] = []

        logger.info(f"Grouped zones for {len(zones_by_ticker)} tickers")
        return zones_by_ticker

    except Exception as e:
        logger.error(f"Error in get_zones_by_ticker: {str(e)}")
        raise

#get all the zones list
from app.models.zone_models import DemandZone

async def get_all_zones(
    db_collection: AsyncIOMotorCollection = collection,
    page: int = 1,
    limit: int = 10,
    sort_by: str = "timestamp",
    sort_order: int = -1,
    ticker: Optional[str] = None,
    pattern: Optional[str] = None,
    timeframe: Optional[str] = None
) -> Dict:
    try:
        # Build query filters
        query = {}
        if ticker:
            query["ticker"] = {"$regex": ticker, "$options": "i"}
        if pattern:
            query["pattern"] = pattern.upper()
        if timeframe:
            # Match if the timeframe is in the timeframes array
            query["timeframes"] = timeframe.lower()
            
        # Get total count
        total = await db_collection.count_documents(query)
        
        # Calculate skip and limit
        skip = (page - 1) * limit
        
        # Execute query with pagination and sorting
        cursor = db_collection.find(query)\
            .sort(sort_by, sort_order)\
            .skip(skip)\
            .limit(limit)
            
        zones = await cursor.to_list(length=limit)
        
        logger.info(f"Retrieved {len(zones)} zones from database (page {page}, limit {limit})")
        
        # Calculate total pages
        total_pages = (total + limit - 1) // limit
        
        zones_data = [DemandZone(**zone).model_dump(by_alias=True) for zone in zones]
        total_count = total
        
        return {
            "data": zones_data,
            "total": total_count,
            "page": page,
            "total_pages": total_pages
        }
    except Exception as e:
        logger.error(f"Error in get_all_zones: {str(e)}")
        raise

async def delete_zone(zone_id: str, db_collection: AsyncIOMotorCollection = collection):
    """
    Delete a zone by its ID.
    
    Args:
        zone_id: The ID of the zone to delete
        db_collection: MongoDB collection (defaults to app.db.database.collection)
        
    Returns:
        DeleteResult from MongoDB
    """
    try:
        logger.info(f"Deleting zone with ID: {zone_id}")
        result = await db_collection.delete_one({"zone_id": zone_id})
        logger.info(f"Delete result for zone {zone_id}: {result.raw_result}")
        return result
    except Exception as e:
        logger.error(f"Error deleting zone {zone_id}: {str(e)}")
        raise