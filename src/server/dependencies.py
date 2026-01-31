from functools import lru_cache
from src.core.db import VectorDB
from src.core.agent import BrainAgent
from src.core.fs import ObsidianWriter
from src.core.services.memory_service import MemoryService
from src.core.services.analysis_service import AnalysisService
from src.core.services.system_service import SystemService

@lru_cache()
def get_vector_db():
    """Singleton VectorDB instance"""
    return VectorDB()

@lru_cache()
def get_brain_agent():
    """Singleton BrainAgent instance"""
    return BrainAgent()

@lru_cache()
def get_obsidian_writer():
    """Singleton ObsidianWriter instance"""
    return ObsidianWriter()

def get_memory_service():
    """Dependency Provider for MemoryService"""
    return MemoryService(
        db=get_vector_db(), 
        writer=get_obsidian_writer(),
        agent=get_brain_agent()
    )

def get_analysis_service():
    """Dependency Provider for AnalysisService"""
    return AnalysisService(
        agent=get_brain_agent(),
        db=get_vector_db()
    )

def get_system_service():
    """Dependency Provider for SystemService"""
    return SystemService(db=get_vector_db())
