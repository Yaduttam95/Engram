import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # App Config
    app_name: str = "Engram"
    version: str = "0.2.0"
    
    # Paths
    base_dir: Path = Field(default_factory=lambda: Path(os.getcwd()))
    vault_path: Path = Field(default_factory=lambda: Path(os.getcwd()) / "engram_vault")
    config_file: Path = Field(default_factory=lambda: Path(os.getcwd()) / "config.json")
    
    # Models
    chat_model: str = "llama3.1:8b"
    embed_model: str = "nomic-embed-text"

    class Config:
        env_file = ".env"
        
    def load_from_json(self):
        """Override with JSON config if exists"""
        if self.config_file.exists():
            import json
            try:
                with open(self.config_file, "r") as f:
                    data = json.load(f)
                    if "vault_path" in data:
                        self.vault_path = Path(data["vault_path"])
                    if "chat_model" in data:
                        self.chat_model = data["chat_model"]
                    if "embed_model" in data:
                        self.embed_model = data["embed_model"]
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to load config.json: {e}")

# Create Singleton
settings = Settings()
settings.load_from_json()

# Backward Compatibility Exports (for now, to reduce refactor noise, but eventually replace)
VAULT_ROOT = settings.vault_path
MODELS = {
    "chat": settings.chat_model,
    "embed": settings.embed_model
}
CONFIG_FILE = settings.config_file
DB_PATH = settings.vault_path / ".engram" / "db"

def init_folders():
    """Ensure essential folders exist"""
    settings.vault_path.mkdir(parents=True, exist_ok=True)
    (settings.vault_path / ".engram").mkdir(exist_ok=True)