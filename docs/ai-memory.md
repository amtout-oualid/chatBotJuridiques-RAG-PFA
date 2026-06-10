# AI Project Memory

## Projects in Workspace
1. **chatBotJuridiques-RAG-PFA**: A full-stack legal assistant platform with AI chat, document management, and LaTeX editor.
2. **rag-legal-arabic**: Another RAG project, likely focused on Arabic legal documents.

## Current State - chatBotJuridiques-RAG-PFA
- **Backend**: FastAPI (Python 3.13), PostgreSQL, Google GenAI. Uses `uv` for management.
- **Frontend**: React 19, Vite, Clerk for Auth.
- **Key Features**: 
    - Landing Page
    - AI Chat (grounded in uploaded documents)
    - Document Management (PDF uploads, folder organization)
    - Legal Template Editor (LaTeX based, split screen)
    - Lawyer Directory
- **Documentation**: `GEMINI.md` provides detailed UX flows and rules. `AI_CONTEXT/` is initialized but currently contains minimal content.

## Strategy & Decisions
- **Documentation First**: Following the rule to keep architecture and decisions documented.
- **Surgical Edits**: Prioritizing targeted changes as per system instructions.

## Ongoing Tasks
- [ ] Initialize/Populate `AI_CONTEXT/` files with current findings.
- [ ] Explore `backend` and `frontend` codebases to confirm implementation details.
