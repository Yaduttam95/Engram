from src.core.agent import BrainAgent
from src.core.db import VectorDB
from typing import Dict, Any

class AnalysisService:
    def __init__(self, agent: BrainAgent, db: VectorDB):
        self.agent = agent
        self.db = db

    async def analyze_input(self, text: str, context: str = None) -> Dict[str, Any]:
        """
        Analyzes text using the Cortex Agent.
        """
        full_text = text
        if context:
            full_text += f"\n(Context: {context})"
        
        analysis = await self.agent.process(full_text)
        
        if isinstance(analysis, dict):
             analysis["original_text"] = full_text
             
        return analysis

    async def ask(self, query: str) -> Dict[str, Any]:
        """
        Performs vector search and answers user query.
        """
        results = self.db.search(query, n_results=5)
        answer = await self.agent.answer(query, results)
        
        return {
            "answer": answer,
            "sources": [{
                "filename": r['metadata'].get('filename'),
                "title": r['metadata'].get('title'),
                "category": r['metadata'].get('category'),
                "snippet": r['content'][:200] + "..."
            } for r in results]
        }

    def get_graph_data(self) -> Dict[str, Any]:
        """
        Returns nodes and links for force-graph.
        """
        data = self.db.get_all_notes()
        nodes = []
        links = []
        
        # Build Nodes
        ids = data.get('ids', [])
        metadatas = data.get('metadatas', [])
        documents = data.get('documents', [])
        
        for i, doc_id in enumerate(ids):
            meta = metadatas[i] if metadatas else {}
            category = meta.get('category', 'Inbox')
            
            # Color coding for Work Sub-domains
            if "Tickets" in category: color = "#f43f5e" # Rose
            elif "Meetings" in category: color = "#10b981" # Emerald
            elif "Tech" in category: color = "#3b82f6" # Blue
            elif "Planning" in category: color = "#8b5cf6" # Violet
            else: color = "#64748b" # Slate (General/Misc)

            nodes.append({
                "id": doc_id,
                "name": meta.get('title', doc_id),
                "val": 1, 
                "group": category,
                "color": color,
                "summary": documents[i] if documents else "", 
                "tags": meta.get("tags", ""),
                "created": meta.get('created', 'Unknown')
            })
        
        # Build Links (Chain Strategy)
        category_map = {}
        for node in nodes:
            cat = node['group']
            if cat not in category_map: category_map[cat] = []
            category_map[cat].append(node['id'])
            
        for cat, node_ids in category_map.items():
            for j in range(len(node_ids) - 1):
                links.append({
                    "source": node_ids[j],
                    "target": node_ids[j+1]
                })

        return {"nodes": nodes, "links": links}
