import os
from datetime import datetime
from pathlib import Path
from .config import VAULT_ROOT

class ObsidianWriter:
    def save_note(self, content: str, metadata: dict):
        """
        Writes the markdown file to the Vault Root.
        """
        # 1. Target is always Root
        target_folder = VAULT_ROOT
        
        # 2. Create Filename (Sanitized Title + Date)
        safe_title = "".join(c for c in metadata['title'] if c.isalnum() or c in (' ', '_', '-')).rstrip()
        safe_title = safe_title.replace(" ", "_")
        if not safe_title:
             safe_title = "Untitled"
        
        filename = f"{datetime.now().strftime('%Y%m%d')}_{safe_title}.md"
        filepath = target_folder / filename

        # 3. Construct File Content with YAML Frontmatter
        file_content = f"""---
title: "{metadata['title']}"
category: "{category}"
tags: {metadata['tags']}
created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
status: active
---

{content}

## Original Content
```text
{metadata.get('original_text', '')}
```
"""

        # 4. Write to Disk
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(file_content)
            
        return filepath

    def update_note(self, filename: str, action: str, reason: str):
        """
        Updates an existing note based on action.
        filename: Can be just the name (e.g. '20250101_Bug.md') to search, or full path.
        """
        found_path = None
        for path in VAULT_ROOT.rglob(filename):
            found_path = path
            break
        
        if not found_path:
            return None

        with open(found_path, "r", encoding="utf-8") as f:
            content = f.read()

        if action == "complete":
            # 1. Update YAML status
            content = content.replace("status: active", "status: completed")
            
            # 2. Append update log
            update_log = f"\n\n## Update: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n**Status changed to Completed**\n*Reason: {reason}*\n"
            content += update_log

        elif action == "archive":
            content = content.replace("status: active", "status: archived")
            update_log = f"\n\n## Update: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n**Archived**\n*Reason: {reason}*\n"
            content += update_log

        elif action == "append":
             update_log = f"\n\n## Update: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n*Note: {reason}*\n"
             content += update_log

        with open(found_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        return found_path


