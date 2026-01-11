from fastapi import APIRouter, HTTPException, Depends, status
from src.core.services.analysis_service import AnalysisService
from src.server.schemas import NoteInput, RecallQuery
from src.server.dependencies import get_analysis_service
from src.core.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter(prefix="", tags=["Search & Cortex"])

@router.post("/analyze")
async def analyze_input(input_data: NoteInput, service: AnalysisService = Depends(get_analysis_service)):
    """
    Analyze text with LLM to extract meaning and context.
    """
    try:
        return await service.analyze_input(input_data.text, input_data.context)
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/ask")
async def ask_brain(query: RecallQuery, service: AnalysisService = Depends(get_analysis_service)):
    """
    Recall memories and chat with the system.
    """
    try:
        return await service.ask(query.query)
    except Exception as e:
        logger.error(f"Ask/Recall failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/graph")
async def get_knowledge_graph(service: AnalysisService = Depends(get_analysis_service)):
    """
    Returns nodes and links for knowledge graph visualization.
    """
    try:
        return service.get_graph_data()
    except Exception as e:
        logger.error(f"Failed to fetch knowledge graph: {e}")
        # Return empty structure to avoid breaking UI, but log the error.
        return {"nodes": [], "links": []}
