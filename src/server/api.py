from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback
import time

from src.server.routers import memories, search, system
from src.core.logger import setup_logger

logger = setup_logger("server")

from contextlib import asynccontextmanager
from src.core.config import init_folders

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure folders exist on startup
    init_folders()
    logger.info("System initialized.")
    yield

app = FastAPI(title="Engram Server", version="1.0.0", lifespan=lifespan)

# Global Error Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc)
    stack_trace = traceback.format_exc()
    logger.error(f"Global Exception: {error_msg}\n{stack_trace}")
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal Server Error", "detail": error_msg}
    )

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(search.router)
app.include_router(memories.router)
app.include_router(system.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Engram Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
