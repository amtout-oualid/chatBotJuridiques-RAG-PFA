# ChatBot Juridique — ai Platform

## Project Overview
This project is a full-stack legal assistant platform utilizing LLMs. It provides AI-powered legal assistance, secure document management, a LaTeX generator/editor, and a directory of professional lawyers.

The application is structured into a Python backend (`/backend`) and a React frontend (`/frontend`).

### Main Technologies
*   **Backend:** Python 3.13+, FastAPI, PostgreSQL (via SQLAlchemy & `asyncpg`), Google GenAI, Pydantic, Uvicorn, python-jose.
*   **Frontend:** React 19, Vite, React Router, Clerk (`@clerk/clerk-react`) for Authentication, Axios, Lucide React.
*   **Package Management:** Node/npm (Frontend) and `uv` (Backend).

## Architecture & Directory Structure
*   `AI_CONTEXT/`: Contains documentation defining the project's rules, architecture, API routes, database schema, and security rules. **Consult these files for deep architectural context, and populate them as the project evolves.**
*   `backend/`: Contains the FastAPI application. The main application is at `backend/app/main.py`. The routing logic is modularized inside `backend/app/routers/` (`auth`, `chats`, `editor`, `files`, `lawyers`).
*   `frontend/`: The primary React application leveraging Clerk for Auth.
*   `newfront/`: just the ui that the ui desighner created but we would not use right now.
*   `UML_DB_Roots/`: Contains SQL scripts, transactions, and Drawio diagrams for the Database layout.
*   `uiUx/`: Design materials, HTML/CSS prototypes, and mockups.

## Building and Running

### Backend
The backend uses `uv` for fast dependency management.
1. Navigate to the `backend/` directory.
2. Install dependencies: `uv sync`
3. Run the development server: 
   * Windows: You can use the provided `run_backend.bat` script at the root.
   * Manual: `uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` (Make sure to run from within `/backend` or `/backend/app` depending on your path configuration).

### Frontend
The primary frontend is located in `/frontend/`.
1. Navigate to `/frontend/`.
2. Copy `.env` containe all the keys  and  `VITE_API_BASE_URL` points to your backend (default: `http://127.0.0.1:8000`).
3. Install dependencies: `npm install`
4. Start the Vite dev server: `npm run dev`

## Development Conventions
*   **Documentation First:** Keep architecture, decisions, and workflows well-documented in the `AI_CONTEXT/` directory. Update these files when making structural changes.
*   **Backend Modularity:** The FastAPI application uses `APIRouter`. New domains should be added as separate files in `backend/app/routers/` and `backend/app/services/` and included in `main.py`.
*   **Async Database:** The backend strictly uses asynchronous database sessions (`asyncpg` over SQLAlchemy). Ensure all database operations are `await`ed and utilize `asynccontextmanager` when appropriate.
*   **Authentication:** The frontend relies on Clerk. Backend authentication routes likely verify Clerk tokens or handle custom JWTs via `python-jose`. Ensure secure handling of sessions and tokens.


# ROLE AND SYSTEM ARCHITECTURE
You are a Principal Full-Stack Engineer working on a LegalTech platform.
Stack: React (react, Axios ... ) frontend + FastAPI (PostgreSQL, SQLAlchemy) ... backend.



## Page Components & User Experience Flow

To maintain architectural consistency, the frontend UI is strictly divided into distinct domains. Each page serves a specific role in the user journey and relies on dedicated backend endpoints.

### 1. Landing Page (`/`)
* **Role in UX Flow:** The public face of the application. It explains the value proposition (AI legal assistance, document generation, lawyer directory) and funnels users toward authentication or chat page.



### 2. AI Chat Interface * **Role in UX Flow:** The core AI  feature. Users ask complex legal questions and receive answers strictly grounded in their uploaded documents from the + button or general legal context.
* **Main Components:**
  * **Session Sidebar:** List of previous chat sessions (History) when you hoverd one it shows you tree dotes in the chat where you can click and shouse rename delite pin or unpin  .
  * **Chat Window:** Real-time message feed (User vs. AI).
  * **Input Area:** Text area for prompts.
  * **+ button:** button inside the chat input filde where you clicket and a popup appers leting you to navigate esistens files you alrady up load in the documents page.
  * **search in chates:** make you able to search for previeus chat useing just string was used in that chat.

### 3. Document Management System 
* **Role in UX Flow:** The data ingestion point. Users upload their contracts,  files, so the AI can read them when you import theme in chat page wth + button.
* **Main Components:**
  * **Dropzone:** Drag-and-drop area for uploading PDFs.
  * **Data Table:** A grid listing all uploaded files, showing `File Name`, `Upload Date`, and `Status` ( size name type date pinded if yes) where you can navigate inside folders and you chan change there names or delet theme if will be with the same loginc as file explorerthe order will be pinded ones after order by date of upload .
  * **Action Buttons:** Delete/View buttons for each rowor file  or folder there is search button also you can switch from grid to row mode also.

### 4. Legal Template Editor (`/editor`)
* **Role in UX Flow:** Automates the creation of standard legal documents (NDAs, contracts ...) using the backend LaTeX engine.
* **Main Components:**
  * **Split Screen Layout:** * *Left Panel:* Dynamic input forms (previeus project the user can chose from when he chose one it trns into  fills and docements arborisont containe in names order in similare and when you hove it the shows tree dotes when you clicke it you can delete rename the file or folder it the same logic of vscode or over life ).
    * *midle Panel:* PDF Viewer (Displays the generated `.pdf` document you can chose visual view mode that shows the pdf or code view that shows the latex code of the showsen file like vs code you can open one file at the time and you have option to save that turn in to export when you use visual view mode  ).
    * *right Panel:* ai chat (you have a chatai that can modifide all of your files exactly the latext ones when you send prompte to this ai the model send it to the ai with all of your files and the ai can thene change your lates code or creat new files ).

### 5. Lawyer Directory & Messaging (`/lawyers`)
* **Role in UX Flow:** Connects clients with human legal professionals when AI is not enough.
* **Main Components:**
  * **Search & Filter Bar:** Filter lawyers by specialty or location and you can search by the name .
  * **Lawyer Cards/Grid:** Displays profile info, picture, and specialty , number of wined coudes and losed one in for of percentage .
  * **Secure Message Modal:** A popup or dedicated view to initiate a secure 1-on-1 direct message with the selected lawyer.
* **API Domain:** `backend/app/routers/lawyers.py`
but notee 





## RULES
- Always read relevant files before making changes
- Make changes step by step, one task at a time
- Show diffs before applying
- Never break existing working features (Landing, DMS, Chat pages)
- When AI modifies LaTeX, send all project files in context
- i want you to keep the same ui 
- when you finished give me to test your resulte cz that needs autontofication 

