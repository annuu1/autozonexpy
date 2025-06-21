from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from app.routes import router
import logging


# Configure logging at the start of the module or main app
logging.basicConfig(
    level=logging.INFO,  # Capture INFO and above (INFO, WARNING, ERROR)
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',  # Log format
    handlers=[
        logging.StreamHandler()  # Output to console
    ]
)

logger = logging.getLogger(__name__)


app = FastAPI(title="GTF Demand Zone Finder API", version="1.0.0")

app.include_router(router)



# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve index.html at root
@app.get("/", include_in_schema=False)
async def root():
    index_path = Path("static/index.html")
    return FileResponse(index_path)