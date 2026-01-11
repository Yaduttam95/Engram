from src.core.logger import setup_logger
import chromadb
import ollama
from .config import DB_PATH, MODELS

logger = setup_logger(__name__)

class VectorDB:
    def __init__(self):
        # Initialize persistent client
        self.client = chromadb.PersistentClient(path=str(DB_PATH))
        self.collection = self.client.get_or_create_collection(name="engram_memory")

    def add(self, content: str, metadata: dict, doc_id: str = None) -> None:
        """
        Embeds content and saves it.
        If doc_id is provided, it uses it (allowing overwrites).
        Otherwise generates one (not recommended for sync).
        """
        # Generate embedding
        response = ollama.embeddings(model=MODELS["embed"], prompt=content)
        embedding = response["embedding"]

        # Ensure we have an ID
        if not doc_id:
            import time
            doc_id = f"{metadata.get('category')}_{int(time.time())}"

        # Sanitize metadata (ChromaDB flat structure mostly supports strings/ints/floats)
        sanitized_metadata = {
            k: (",".join(str(i) for i in v) if isinstance(v, list) else v)
            for k, v in metadata.items()
        }

        self.collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[content],
            metadatas=[sanitized_metadata]
        )
        logger.info(f"Memory stored: {doc_id}")

    def search(self, query: str, n_results=3):
        """
        Semantic search for the 'Ask' feature
        Returns list of dicts: {'content': str, 'metadata': dict}
        """
        response = ollama.embeddings(model=MODELS["embed"], prompt=query)
        embedding = response["embedding"]

        results = self.collection.query(
            query_embeddings=[embedding],
            n_results=n_results
        )
        
        # Zip documents and metadatas
        output = []
        if results['documents']:
            for i in range(len(results['documents'][0])):
                output.append({
                    "id": results['ids'][0][i],
                    "content": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i]
                })

        return output

    def get_all_notes(self):
        """
        Retrieves all notes for the Graph View.
        """
        results = self.collection.get()
        return results

    def delete_note(self, doc_id: str):
        """
        Deletes a note by ID.
        """
        self.collection.delete(ids=[doc_id])

    def reset(self):
        """
        Nukes the entire database for a fresh start.
        """
        try:
            self.client.delete_collection("engram_memory")
        except Exception:
            pass # It might not exist
            
        self.collection = self.client.get_or_create_collection(name="engram_memory")
        logger.info("Database reset complete.")