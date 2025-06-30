import logging
from typing import Dict, List
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
                    demand_zone = DemandZone(
                        zone_id=zone.zone_id,
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