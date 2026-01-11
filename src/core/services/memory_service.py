from datetime import datetime
from typing import Dict
from src.core.db import VectorDB
from src.core.fs import ObsidianWriter
from src.core.config import VAULT_ROOT
from src.core.logger import setup_logger
import os

logger = setup_logger(__name__)

class MemoryService:
    def __init__(self, db: VectorDB, writer: ObsidianWriter):
        self.db = db
        self.writer = writer

    def save_memory(self, data: Dict) -> str:
        """
        Saves a filtered/analyzed memory to both FileSystem and VectorDB.
        """
        # Write to File System
        filepath = self.writer.save_note(data.get("summary"), data)
        
        # Prepare content for DB (Summary + Original to match file body)
        full_db_content = f"{data.get('summary')}\n\n## Original Content\n{data.get('original_text', '')}"

        # Write to DB
        self.db.add(
            content=full_db_content,
            metadata={
                "filename": filepath.name,
                "category": data.get("category"),
                "title": data.get("title"),
                "tags": str(data.get("tags", [])),
                "created": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            },
            doc_id=filepath.name
        )
        return str(filepath)

    def delete_memory(self, doc_id: str) -> str:
        """
        Deletes a memory from DB and FS.
        """
        # Delete from DB
        self.db.delete_note(doc_id)
        
        # Delete from FS
        found_path = None
        for path in VAULT_ROOT.rglob(doc_id):
            found_path = path
            break
            
        if found_path and found_path.exists():
            os.remove(found_path)
            
        return doc_id

    def update_memory_content(self, doc_id: str, new_content: str) -> str:
        """
        Updates the content of a memory in FS and re-indexes in DB.
        """
        # Update File System
        self.writer.edit_content(doc_id, new_content)
        
        # Update DB (Re-embed)
        existing = self.db.collection.get(ids=[doc_id])
        if not existing['ids']:
             raise ValueError("Memory not found in DB")
             
        meta = existing['metadatas'][0]
        
        self.db.add(
            content=new_content,
            metadata=meta,
            doc_id=doc_id
        )
        return doc_id

    def reindex_vault(self):
        """
        Smart Index: Scans Vault and checks for modified files.
        Only re-embeds changed or new files.
        """
        import json
        import re
        import yaml
        
        # Load Index State
        index_state_path = VAULT_ROOT / ".engram" / "index_state.json"
        index_state = {}
        if index_state_path.exists():
            try:
                with open(index_state_path, "r") as f:
                    index_state = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load index state, rebuilding: {e}")
                pass 

        nodes_updated = 0
        pruned_count = 0
        current_files = set()
        
        # Add/Update from Disk
        for path in VAULT_ROOT.rglob("*.md"):
            if ".engram" in str(path): continue
            
            filename = path.name
            current_files.add(filename)
            mtime = path.stat().st_mtime
            
            # Smart Check: Skip if unchanged
            if filename in index_state and index_state[filename] == mtime:
                continue
                
            # --- PROCESS FILE ---
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Parse Frontmatter
                frontmatter_match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
                metadata = {}
                if frontmatter_match:
                    try:
                        metadata = yaml.safe_load(frontmatter_match.group(1))
                    except Exception as e:
                        logger.warning(f"Failed to parse frontmatter for {filename}: {e}")
                
                body = re.sub(r'^---\n(.*?)\n---', '', content, flags=re.DOTALL).strip()
                
                self.db.add(
                    content=body,
                    metadata={
                        "filename": filename,
                        "category": metadata.get("category", "Unknown"),
                        "title": metadata.get("title", path.stem),
                        "tags": str(metadata.get("tags", [])),
                        "created": str(metadata.get("created", datetime.fromtimestamp(path.stat().st_ctime).strftime('%Y-%m-%d %H:%M:%S')))
                    },
                    doc_id=filename
                )
                
                # Update State
                index_state[filename] = mtime
                nodes_updated += 1
                logger.info(f"Index Updated: {filename}")
                
            except Exception as e:
                logger.error(f"Failed to index {filename}: {e}")
            
        existing_notes = self.db.get_all_notes()
        existing_ids = existing_notes.get('ids', [])
        
        for doc_id in existing_ids:
            if doc_id not in current_files:
                 self.db.delete_note(doc_id)
                 if doc_id in index_state:
                     del index_state[doc_id]
                 pruned_count += 1
                 logger.info(f"Pruned: {doc_id}")
                 
        with open(index_state_path, "w") as f:
            json.dump(index_state, f, indent=2)

        return {"updated": nodes_updated, "pruned": pruned_count}
