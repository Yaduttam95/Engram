import ollama
import json
import re
from .config import MODELS
from src.core.logger import setup_logger

logger = setup_logger(__name__)

class BrainAgent:
    def __init__(self):
        self.model = MODELS["chat"]
        self.client = ollama.AsyncClient()

    async def process(self, text: str) -> dict:
        """
        Analyzes the text to determine category, tags, and clarity.
        """
        prompt = f"""
        You are the 'Cortex' of a PROFESSIONAL Second Brain system. Your goal is to organize thoughts into a pristine, unparalleled WORK knowledge base.
        
        INPUT TEXT: "{text}"
        
        ### 1. CATEGORIZATION ARCHITECTURE (WORK ONLY)
        You MUST classify all input into one of these strict Work Domains:
        
        - **`Work/Tickets`**: For tasks with EXPLICIT ticket IDs (e.g., JIRA-123) or clear bug fixes/feature requests.
        - **`Work/Meetings`**: Syncs, standups, huddles, interviews, calendar events.
        - **`Work/Tech`**: Engineering, deployment, infrastructure, code reviews, documentation.
        - **`Work/Planning`**: Goals, OKRs, roadmaps, strategy, career growth.
        - **`Work/General`**: Ideas, notes, or thoughts that don't fit the above but are work-related.
        
        ### 2. STRICT PROCESSING RULES
        - **PROFESSIONAL ONLY**: Do NOT create any 'Personal' categories. If the input seems personal (e.g. 'buy milk'), try to reframe it as a work task (e.g. 'Work/General' -> 'Buy milk for office') or ignore the personal aspect and focus on any work context.
        - **Ambiguity Filter**: If the input is too generic (e.g., "fix the bug", "meeting tomorrow") and lacks context on WHICH project or topic:
          - You MUST return `is_clear: false`
          - Ask a clarifying question like: "Which project or ticket is this related to?" or "What is the topic of the meeting?".
        - **Identity Constraint**: Do NOT invent project names or ticket IDs.
        - **Input Structure**: The input text may start with "Title:" and "Content:". If a "Title:" is provided, use it as the primary basis for the note's Title, but you may refine it for professionalism.

        ### 3. OUTPUT SPECIFICATIONS
        - **Title**: Create a concise, professional title. Use the user provided title if one exists with refinement if needed.
        - **Summary**: Write a high-quality Markdown summary.
          - Tasks: Use checkboxes `[ ]`.
          - Code: MUST wrap all code in markdown code blocks (e.g., ```python ... ```).
        - **Tags**: Generate 3-5 relevant, lowercase tags.
        
        ### OUTPUT JSON FORMAT
        Return ONLY valid JSON.
        CRITICAL FORMATTING RULES:
        1. You MUST escape all newlines in strings as "\\n". ({ "summary": "Line1\\nLine2" })
        2. You MUST escape all double quotes in strings as "\\\"". ({ "code": "printf(\\\"hello\\\")" })
        3. Do not print raw newlines or raw tabs inside the JSON values.
        
        {{
          "is_clear": boolean,
          "clarifying_question": "string (only if false)",
          "category": "Work/SubCategory",
          "tags": ["tag1", "tag2"],
          "title": "Title",
          "summary": "# Header\\nContent..."
        }}
        """

        try:
            response = await self.client.chat(model=self.model, messages=[
                {'role': 'user', 'content': prompt}
            ])
            
            content = response['message']['content']
            
            # Extract JSON using regex
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0)
            
            return json.loads(content, strict=False)
            
        except Exception as e:
            logger.error(f"Agent processing failed: {e}")
            # Fallback
            return {
                "is_clear": True,
                "category": "Inbox", 
                "tags": ["error"], 
                "title": "Unprocessed Note",
                "summary": text
            }

    async def answer(self, query: str, context: list) -> str:
        """
        Answers a user query based on the provided context (retrieved notes).
        """
        # Extract content
        context_strs = []
        for item in context:
            if isinstance(item, dict):
                context_strs.append(item.get('content', ''))
            else:
                context_strs.append(str(item))

        context_str = "\n\n---\n\n".join(context_strs)
        
        prompt = f"""
        You are a Second Brain assistant. Answer the user's question based STRICTLY on the context provided below.
        
        USER QUESTION: "{query}"
        
        RELEVANT NOTES (CONTEXT):
        {context_str}
        
        INSTRUCTIONS:
        1. Answer ONLY using facts from the RELEVANT NOTES above.
        2. Do NOT use outside knowledge or hallucinate details not found in the notes.
        3. If the answer is not in the notes, state: "I don't have that information in my memory."
        4. Be concise.
        
        Answer:
        """

        response = await self.client.chat(model=self.model, messages=[
            {'role': 'user', 'content': prompt}
        ])
        
        return response['message']['content']

    async def detect_updates(self, new_input: str, context_docs: list) -> list:
        """
        Checks if the new_input implies an update to existing context documents.
        """
        context_str = "\n\n---\n\n".join([f"NOTE {i}:\n{doc}" for i, doc in enumerate(context_docs)])
        
        prompt = f"""
        You are the 'Cortex' maintaining a persistent memory.
        
        NEW INPUT: "{new_input}"
        
        EXISTING MEMORIES:
        {context_str}
        
        ### GOAL
        Determine if the NEW INPUT explicitly updates the status of any EXISTING MEMORY.
        
        ### CRITERIA
        - **Solved/Completed**: If New Input explicitly says a task is done/fixed, mark the corresponding note as COMPLETED.
        - **Obsolete**: If New Input says to ignore or cancel a task, mark as CANCELLED.
        - **Match Required**: The New Input must be semantically related to the Existing Memory to trigger an update.
        
        ### OUTPUT JSON
        Return a list of updates. If no updates, return empty list [].
        Format:
        [
          {{
            "note_index": 0,  # Index of the note in the list above
            "action": "complete", # "complete", "archive", "append"
            "reason": "Input indicates this task is finished."
          }}
        ]
        
        Return ONLY raw JSON.
        """
        
        try:
            response = await self.client.chat(model=self.model, messages=[{'role': 'user', 'content': prompt}])
            content = response['message']['content']
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0), strict=False)
            return []
        except Exception as e:
            logger.error(f"Update detection failed: {e}")
            return []