import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

MONGODB_URL = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = "autozonex"
COLLECTION_NAME = "tradejournals"

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

#collections
collection = db[COLLECTION_NAME]

async def init_db():
    """Initialize MongoDB with a unique index on symbol"""
    index = IndexModel([("symbol", ASCENDING)], unique=True)
    await collection.create_indexes([index])