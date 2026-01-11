from fastapi import APIRouter, Depends, HTTPException, status
from src.server.schemas import ConfigUpdate
from src.core.services.system_service import SystemService
from src.server.dependencies import get_system_service
from src.core.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter(prefix="", tags=["System"])

@router.get("/tree")
async def get_vault_structure(service: SystemService = Depends(get_system_service)):
    try:
        return service.get_vault_structure()
    except Exception as e:
        logger.error(f"Failed to get vault structure: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/config")
async def get_config(service: SystemService = Depends(get_system_service)):
    try:
        return service.get_config()
    except Exception as e:
        logger.error(f"Failed to get config: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/config")
async def update_config(data: ConfigUpdate, service: SystemService = Depends(get_system_service)):
    try:
        return service.update_config(data.vault_path, data.chat_model)
    except Exception as e:
        logger.error(f"Failed to update config: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/reset")
async def reset_brain(service: SystemService = Depends(get_system_service)):
    try:
        return service.reset_brain()
    except Exception as e:
        logger.error(f"Failed to reset brain: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
