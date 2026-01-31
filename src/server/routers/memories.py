from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict
from src.core.services.memory_service import MemoryService
# from src.server.schemas import UpdateContent
from src.server.dependencies import get_memory_service
from src.core.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter(prefix="", tags=["Memories"])

@router.post("/save", status_code=status.HTTP_201_CREATED)
async def save_note(data: Dict, service: MemoryService = Depends(get_memory_service)):
    """
    Save the analyzed note to the File System and Vector Database.
    """
    try:
        filepath = service.save_memory(data)
        logger.info(f"Memory saved: {filepath}")
        return {"status": "success", "filepath": filepath}
    except Exception as e:
        logger.error(f"Failed to save memory: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/delete/{doc_id}")
async def delete_memory(doc_id: str, service: MemoryService = Depends(get_memory_service)):
    """
    Manually delete a memory from the DB and FileSystem.
    """
    try:
        service.delete_memory(doc_id)
        logger.info(f"Memory deleted: {doc_id}")
        return {"status": "success", "id": doc_id}
    except Exception as e:
        logger.error(f"Failed to delete memory {doc_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/reindex")
async def reindex_memories(service: MemoryService = Depends(get_memory_service)):
    """
    Scans the Vault Directory and repopulates the Vector Database.
    This is a blocking CPU-bound operation, so we run it in a threadpool (synchronous def).
    """
    try:
        result = await service.reindex_vault()
        logger.info(f"Reindex complete: {result}")
        return {"status": "success", **result}
    except Exception as e:
        logger.error(f"Reindex failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
