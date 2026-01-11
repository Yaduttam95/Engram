from pydantic import BaseModel
from typing import Optional

class NoteInput(BaseModel):
    text: str
    context: Optional[str] = None

class RecallQuery(BaseModel):
    query: str

class UpdateContent(BaseModel):
    content: str

class ConfigUpdate(BaseModel):
    vault_path: Optional[str] = None
    chat_model: Optional[str] = None
