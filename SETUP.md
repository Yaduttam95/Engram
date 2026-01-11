# Engram Setup Guide

So you want to run Engram? Awesome. It's actually pretty simple, but there are a few moving parts because, well, it's a "brain" running on your local machine.

Here is everything you need to get up and running.

## 1. Prerequisites

First things first, make sure you have these installed. If you're a developer, you probably already do.

- **Python 3.12+**: The backbone of our backend.
- **Node.js (v18+)**: For building the frontend interface.
- **Ollama**: This is the engine that powers the AI.

### Setting up Ollama
Engram relies on local LLMs to keep your data private and fast.
1. Download [Ollama](https://ollama.com).
2. Run these commands in your terminal to pull the necessary models:

```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

*Note: You can switch models in `src/core/config.py` if you're feeling adventurous, but these are the defaults we've tuned for.*

## 2. Installation

Clone the repo (if you haven't already), and let's set up the environment.

### Backend Setup
We recommend using a virtual environment so things don't get messy.

```bash
# Create a virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install the dependencies
pip install -r requirements.txt
```

### Frontend Setup
Engram UI is built with React + Vite.

```bash
cd engram-ui
npm install
cd ..
```

## 3. Running Engram

We've made this part super easy. You don't need multiple terminal windows or complex commands.

From the root of the project, just run:

```bash
./engram run
```

This script will:
1.  Wake up the **Cortex** (Backend API).
2.  Spin up the **Interface** (React Dev Server).
3.  Launch your browser straight to the app.

When you're done, just hit `Ctrl+C` in the terminal to shut everything down gracefully.

## Troubleshooting

- **"Port already in use"**: Make sure you don't have another instance running on port `8000` or `5173`.
- **"Ollama connection failed"**: Ensure the Ollama app is actually running in the background.
