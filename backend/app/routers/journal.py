from typing import List
from fastapi import APIRouter, HTTPException
from app.models.journal import JournalEntry
from app.db.database import journal_collection
from bson import ObjectId

# Create a router for the journal
router = APIRouter(prefix="/journal", tags=["journal"])

#route to create the journal
@router.post("/", response_model=JournalEntry)
async def create_journal(journal_data: JournalEntry):
    collection = journal_collection
    try:
        result = await collection.insert_one(journal_data.model_dump(by_alias=True, exclude={"id"}))
        created_journal = await collection.find_one({"_id": result.inserted_id})
        return JournalEntry(**created_journal)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#route to get the journal
@router.get("/", response_model=List[JournalEntry])
async def get_journal():
    collection = journal_collection
    
    try:
        cursor = collection.find()
        return [JournalEntry(**doc) for doc in await cursor.to_list(length=None)]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
#router to update the journal
@router.put("/{journal_id}", response_model=JournalEntry)
async def update_journal(journal_id: str, journal_data: JournalEntry):
    collection = journal_collection
    try:
        result = await collection.update_one({"_id": ObjectId(journal_id)}, {"$set": journal_data.model_dump(by_alias=True, exclude={"id"})})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Journal not found")
        updated_doc = await collection.find_one({"_id": ObjectId(journal_id)})
        return JournalEntry(**updated_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#router to delete the journal
@router.delete("/{journal_id}", response_model=JournalEntry)
async def delete_journal(journal_id: str):
    collection = journal_collection
    
    try:
        result = await collection.delete_one({"_id": ObjectId(journal_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Journal not found")
        return {"detail": f"Journal {journal_id} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
