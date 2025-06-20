from fastapi import FastAPI, HTTPException
from datetime import datetime
import logging
from typing import List

from models import StockRequest, DemandZone
from services import fetch_stock_data, identify_demand_zones

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="GTF Demand Zone Finder API", version="1.0.0")

@app.post("/demand-zones", response_model=List[DemandZone])
async def find_demand_zones(request: StockRequest):
    try:
        logger.info(f"Processing request for ticker {request.ticker}, period: {request.period}, interval: {request.interval}")
        data = fetch_stock_data(request.ticker, request.period, request.interval)
        zones = identify_demand_zones(data)
        if not zones:
            logger.warning(f"No demand zones found for {request.ticker}")
        return zones
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
