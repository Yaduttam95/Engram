from datetime import datetime
from typing import Dict
from src.core.db import VectorDB
from src.core.fs import ObsidianWriter
from src.core.config import VAULT_ROOT
from src.core.logger import setup_logger
import os

logger = setup_logger(__name__)

from src.core.agent import BrainAgent

class MemoryService:
    def __init__(self, db: VectorDB, writer: ObsidianWriter, agent: BrainAgent = None):
        self.db = db
        self.writer = writer
        self.agent = agent

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



    async def reindex_vault(self):
        """
        Smart Index: Scans Vault and checks for modified files.
        Only re-embeds changed or new files.
        Auto-categorizes raw files if Agent is available.
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
                # logger.info(f"Processing modified file: {path}") # Optional verbose log
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Parse Frontmatter (Tolerant of missing frontmatter)
                frontmatter_match = re.search(r'^\s*---\s*\n(.*?)\n---\s*\n', content, re.DOTALL | re.MULTILINE)
                
                metadata = {}
                body = content
                
                if frontmatter_match:
                    try:
                        metadata = yaml.safe_load(frontmatter_match.group(1)) or {}
                        # Remove frontmatter from body for indexing
                        body = re.sub(r'^\s*---\s*\n(.*?)\n---\s*\n', '', content, flags=re.DOTALL | re.MULTILINE).strip()
                    except Exception as e:
                        logger.warning(f"Failed to parse frontmatter for {filename}: {e}")
                else:
                    # --- AUTO-TAGGING FOR RAW FILES ---
                    if self.agent:
                         logger.info(f"Auto-tagging raw file: {filename}")
                         try:
                             # Use Agent to analyze content
                             analysis = await self.agent.process(content)
                             if analysis:
                                 metadata = {
                                     "title": analysis.get("title", path.stem),
                                     "category": analysis.get("category", "Inbox"),
                                     "tags": analysis.get("tags", []),
                                     "created": datetime.fromtimestamp(path.stat().st_ctime).strftime('%Y-%m-%d %H:%M:%S'),
                                     "status": "active"
                                 }
                                 
                                 # Rewrite File with Frontmatter
                                 # We keep the file in its current location, just prepend frontmatter
                                 new_file_content = f"---\n"
                                 for k, v in metadata.items():
                                     new_file_content += f"{k}: {json.dumps(v) if isinstance(v, list) else v}\n"
                                 new_file_content += "---\n\n" + content
                                 
                                 with open(path, "w", encoding="utf-8") as f:
                                     f.write(new_file_content)
                                     
                                 logger.info(f"Rewrite complete for {filename}")
                                 # Update body/content for indexing
                                 body = content 
                             else:
                                 logger.warning(f"Agent failed to tag {filename}")
                         except Exception as agent_err:
                             logger.error(f"Auto-tagging error for {filename}: {agent_err}")
                             
                    else:
                        logger.debug(f"{filename} has no frontmatter and no agent available.")

                # --- INFER METADATA IF STILL MISSING (Fallback) ---
                title = metadata.get("title")
                if not title:
                     h1_match = re.search(r'^#\s+(.*)', body, re.MULTILINE)
                     title = h1_match.group(1).strip() if h1_match else path.stem.replace("_", " ").title()

                category = metadata.get("category")
                if not category:
                    try:
                        rel_path = path.relative_to(VAULT_ROOT)
                        category = str(rel_path.parent) if str(rel_path.parent) != "." else "Inbox"
                    except: category = "External"
                    
                tags = metadata.get("tags", [])
                created = metadata.get("created", datetime.fromtimestamp(path.stat().st_ctime).strftime('%Y-%m-%d %H:%M:%S'))

                logger.debug(f"Indexing {filename}: Title='{title}', Cat='{category}'")

                self.db.add(
                    content=body,
                    metadata={
                        "filename": filename,
                        "category": category,
                        "title": title,
                        "tags": str(tags),
                        "created": str(created)
                    },
                    doc_id=filename
                )
                
                # Update State
                index_state[filename] = path.stat().st_mtime # Update with fresh mtime after rewrite
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
