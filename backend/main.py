from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from app.routes import router
import logging
from app.db.database import init_db
from app.db.database import collection
from app.routers.zones import router as zones_router
from fastapi.middleware.cors import CORSMiddleware

# Configure logging at the start of the module or main app
logging.basicConfig(
    level=logging.INFO,  # Capture INFO and above (INFO, WARNING, ERROR)
    # format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',  # Log format
    format='%(name)s - %(levelname)s - %(message)s',  # Log format
    handlers=[
        logging.StreamHandler()  # Output to console
    ]
)

logger = logging.getLogger(__name__)


app = FastAPI(title="GTF Demand Zone Finder API", version="1.0.0")

app.include_router(router)
app.include_router(zones_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve index.html at root
@app.get("/", include_in_schema=False)
async def root():
    index_path = Path("static/index.html")
    return FileResponse(index_path)

@app.on_event("startup")
async def startup_event():
    await init_db()
    print("MongoDB initialized with unique index on zone_id")