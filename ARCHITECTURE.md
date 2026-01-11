# Architecture & Tech Stack

Engram isn't just a CRUD app; it's a local-first system designed for high-performance memory retrieval and synthesis. Here's a look under the hood.

## 🛠 The Tech Stack

We chose these technologies for a specific reason: **Speed, Privacy, and Control.**

### **Frontend ( The Interface )**
- **React 19**: The latest and greatest for building dynamic UIs.
- **Vite**: For lightning-fast builds and hot reloading.
- **TailwindCSS**: Utility-first styling that lets us move fast.
- **Framer Motion**: For those buttery smooth layout transitions.
- **React Force Graph**: To visualize the neural connections of your notes.
- **Lucide React**: Clean, consistent iconography.

### **Backend ( The Cortex )**
- **FastAPI**: Modern Python web framework. It’s typed, async, and incredibly fast.
- **uvicorn**: The lightning-fast ASGI server.
- **Pydantic**: For rock-solid data validation.

### **The Brain ( AI & Data )**
- **Ollama**: Runs the LLMs locally. No API keys, no monthly bills, total privacy.
- **Llama 3.1**: The reasoning engine. It categorizes, summarizes, and chats with you.
- **Nomic Embed Text**: Converts your notes into vectors (numbers) so the AI can "understand" semantic meaning.
- **ChromaDB**: The vector database where your memories live. It allows us to perform "semantic search" (finding concepts, not just keywords).

---

## 🔄 Data How It Flows

Here is how a thought travels from your brain into Engram's brain.

```mermaid
graph TD
    %% Styling
    classDef user fill:#f9f,stroke:#333,stroke-width:2px;
    classDef ui fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;
    classDef api fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef ai fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    classDef db fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    User((User)):::user
    
    subgraph Frontend [Engram UI]
        WebInput[Input Bar]:::ui
        Dashboard[Graph View]:::ui
    end

    subgraph Backend [FastAPI Server]
        Router[API Router]:::api
        Service[Analysis Service]:::api
    end

    subgraph Cortex [Local Intelligence]
        Agent[Brain Agent]:::ai
        Ollama[Ollama LLM]:::ai
    end

    subgraph Storage [Memory Vault]
        VectorDB[(ChromaDB)]:::db
    end

    %% Flow: Adding a Note
    User -->|Types note| WebInput
    WebInput -->|POST /analyze| Router
    Router -->|Process| Service
    Service -->|Prompt| Agent
    Agent -->|Inference Request| Ollama
    Ollama -->|Classification & Tags| Agent
    Agent -->|Structured Memory| Service
    Service -->|Store Embeddings| VectorDB

    %% Flow: Recall
    User -->|Ask Question| Dashboard
    Dashboard -->|GET /ask| Router
    Router -->|Query| Service
    Service -->|Semantic Search| VectorDB
    VectorDB -->|Relevant Context| Service
    Service -->|Context + Query| Agent
    Agent -->|Synthesize Answer| Ollama
    Ollama -->|Final Answer| Agent
    Agent -->|Response| Router
    Router -->|Display| Dashboard
```

### Key Concepts

1.  **The "Analyze" Loop**: When you type something, we don't just save text. We send it to Llama 3.1 to ask: *"What is this? Is it a task? A thought? A code snippet?"* It automatically tags and categorizes it for you.
2.  **Semantic Search**: When you search, we don't look for matching words. We compare the *meaning* of your query to the *meaning* of your notes using vector embeddings.
3.  **Local First**: All of this happens on your machine. Your thoughts never leave your laptop.
