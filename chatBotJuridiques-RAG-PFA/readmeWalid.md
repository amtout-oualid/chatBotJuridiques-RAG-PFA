# ChatBot Juridique - RAG Platform

## Overview
This project is an AI-powered Full-Stack Legal Assistant designed specifically for the structural and linguistic complexities of Moroccan and Arabic law. It provides an intelligent legal interface where users can interact with an AI to analyze documents, extract insights, and generate customized legal templates via a built-in LaTeX engine.

## Architecture & Tech Stack
The platform is separated into a robust backend and a dynamic frontend:

### Backend
- **Framework:** Python 3.13+ with FastAPI.
- **Database:** PostgreSQL (via SQLAlchemy & `asyncpg` for async transactions).
- **AI Integration:** Google Generative AI (Gemini Flash models) for chat intelligence.
- **RAG Pipeline:** Utilizes ChromaDB for vector storage and semantic retrieval, alongside the `BGE-M3` model for cross-lingual document reranking.
- **Package Manager:** Managed using `uv`.

### Frontend
- **Framework:** React 19 bootstrapped with Vite.
- **Authentication:** Clerk (`@clerk/clerk-react`) for secure, seamless user management.
- **UI Components:** Styled with CSS and uses Lucide React for iconography.
- **Routing:** React Router DOM.

## Core Features & Workflows

### 1. Document Management System (DMS)
Users can upload legal PDFs and documents through the frontend interface. The backend automatically processes these files:
- **Extraction:** A dedicated OCR pipeline powered by GPT-4o analyzes the documents.
- **Chunking:** The system intelligently splits text into precise, manageable chunks (maximum 512 characters) using regex and custom splitters, ensuring tables remain intact.
- **Vectorization:** Text is embedded and stored securely for fast retrieval during chats.

### 2. AI Chat Interface (RAG Engine)
When a user asks a legal question:
- The backend searches the vector database for relevant legal text chunks (Retrieval-Augmented Generation).
- It reranks the chunks for maximum relevance using BGE-M3.
- The compiled context is sent to the Gemini AI to generate an accurate, grounded legal response in Arabic.
- Users can also bypass global search by explicitly attaching an uploaded PDF (via the `+` button), prompting the AI to perform text-extraction on-the-fly and respond exclusively based on that file.

### 3. LaTeX Legal Template Editor
A complete built-in split-screen environment for drafting official legal documents:
- **Left Panel:** Input forms to inject dynamic data.
- **Middle Panel:** Live PDF viewer rendering the compiled LaTeX code.
- **Right Panel:** A dedicated AI sidebar that can parse, modify, and format your LaTeX files automatically via chat commands.

## How to Run the Application

### Running the Backend
1. Open a terminal and navigate to the `/backend` directory.
2. Sync dependencies: `uv sync`
3. Start the FastAPI server: `.\.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`

### Running the Frontend
1. Open a new terminal and navigate to the `/frontend` directory.
2. Install Node dependencies: `npm install`
3. Launch the Vite dev server: `npm run dev`
4. Access the application in your browser at `http://localhost:5173`.
