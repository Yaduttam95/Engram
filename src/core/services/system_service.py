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
        """
        Wipes the database and deletes all memory files from the Vault.
        """
        # 1. Reset DB
        if self.db:
            self.db.reset()
        
        # 2. Delete Files from Vault (Safe Delete)
        deleted_count = 0
        try:
            # We want to delete all visible files/folders in VAULT_ROOT
            # But preserve .engram or other hidden system folders if essential? 
            # Actually, "Wipe Everything" simplifies logic: Delete all MD files and empty folders.
            
            # Walk top-down to find files
            for root, dirs, files in os.walk(VAULT_ROOT, topdown=False):
                # Skip hidden directories like .engram inside the walk
                if ".engram" in root: continue
                
                # Delete Files
                for name in files:
                    if name.startswith("."): continue # Skip hidden files? Or maybe delete them too? Let's stick to visible/md for safety.
                    file_path = Path(root) / name
                    if file_path.suffix == ".md":
                        try:
                            os.remove(file_path)
                            deleted_count += 1
                        except Exception as e:
                            logger.error(f"Failed to delete {file_path}: {e}")

                # Delete Empty Directories (after files are gone)
                # Note: os.walk with topdown=False visits children before parents
                # so we can try removing directories if they are empty.
                if root == str(VAULT_ROOT): continue # Don't delete root
                
                try:
                    # check if dir is empty (ignoring hidden files potentially?)
                    # If we only deleted .md files, other files might remain.
                    # If the user wants a TOTAL wipe, we should delete everything except .engram.
                    
                    # More aggressive wipe:
                    dir_path = Path(root)
                    if dir_path.exists() and not any(dir_path.iterdir()):
                        dir_path.rmdir()
                except Exception as e:
                     pass # Directory might not be empty

        except Exception as e:
            logger.error(f"Failed to wipe vault files: {e}")

        logger.info(f"Brain wipe complete. Deleted {deleted_count} files.")
        return {"status": "reset_complete", "deleted_files": deleted_count}

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
