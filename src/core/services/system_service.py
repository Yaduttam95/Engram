from pathlib import Path
import json
import os
from src.core.config import VAULT_ROOT, CONFIG_FILE, MODELS
from src.core.logger import setup_logger

logger = setup_logger(__name__)

class SystemService:
    def __init__(self, db=None):
        self.db = db

    def reset_brain(self):
        if self.db:
            self.db.reset()
        return {"status": "reset_complete"}

    def get_vault_structure(self):
        def build_tree(path: Path):
            tree = []
            try:
                # Sort: Directories first, then files
                items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name))
                
                for item in items:
                    if item.name.startswith("."): continue # Skip hidden
                    
                    node = {
                        "name": item.name,
                        "path": str(item.relative_to(VAULT_ROOT)),
                        "type": "folder" if item.is_dir() else "file"
                    }
                    
                    if item.is_dir():
                        node["children"] = build_tree(item)
                        
                    tree.append(node)
            except Exception as e:
                logger.error(f"Error accessing path {path}: {e}")
                # Don't crash the whole tree build, return empty for this node
            return tree

        return {
            "root": str(VAULT_ROOT),
            "structure": build_tree(VAULT_ROOT)
        }

    def get_config(self):
        return {
            "vault_path": str(VAULT_ROOT),
            "chat_model": MODELS["chat"],
            "available_models": ["llama3.1:8b", "mistral", "gemma2", "deepseek-coder", "llama3.2"] 
        }

    def update_config(self, vault_path: str = None, chat_model: str = None):
        current = {}
        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE, "r") as f:
                    current = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to read existing config (overwriting): {e}")
        
        if vault_path:
            current["vault_path"] = vault_path
        if chat_model:
            current["chat_model"] = chat_model
        
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump(current, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
            raise e
            
        return {"status": "updated", "requires_restart": True}
