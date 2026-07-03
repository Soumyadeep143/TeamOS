# TeamOS

> The AI-powered browser where teams execute, collaborate, and never lose context.

TeamOS transforms web browsing into a shared execution workspace where humans and AI agents collaborate, research, monitor progress, and build persistent organizational knowledge.

## The Problem it Solves
Knowledge workers spend a significant portion of their day reconstructing context instead of creating value. Research is scattered across browser tabs, documents, chat applications, and meetings, resulting in duplicated research and poor team visibility. TeamOS reimagines the browser as a collaborative operating system where every discovery becomes organizational memory and AI agents collaborate as teammates.

---

## 🚀 Demo
*Interactive Chrome Extension panel side-by-side with your browsing canvas.*
![Workspace Mockup](https://raw.githubusercontent.com/google/material-design-icons/master/png/action/visibility/black_24dp.png) *(UI Screenshot Placeholder)*

---

## Key Features
- **Collaborative Workspaces**: Spin up shared team nodes, invite collaborators, and aggregate team presence.
- **Browser Presence & Timeline**: Broadcast active tab, activity descriptions, and view live status heatmaps.
- **Shared Context Feed**: Publish shared webpages, highlighted snippets, and uploaded files in real-time.
- **AI Research Agents**: Outsource competitive analyses and pricing monitoring workflows to autonomous browser agents.
- **Smart Document Intelligence**: Vector similarity comparison flags duplicate uploads and suggests merge operations.
- **Sprint Checklists**: Track development checklists and automatically recalculate member and sprint progress.

---

## Tech Stack
- **Extension**: Plasmo (Manifest V3), React, TypeScript, Zustand, Socket.io-client
- **Dashboard**: Vite, React, TypeScript
- **Backend API**: FastAPI (Python 3.12+), Pydantic v2, Uvicorn
- **Databases**: PostgreSQL (Relational Memory), Redis (WebSocket Pub/Sub & Presence Cache), HydraDB (Vector + Entity Graph Store)
- **AI Engine**: Browser Use automation framework, Google Gemini & OpenAI LLMs

---

## Architecture
See [ARCHITECTURE.md](file:///c:/Users/dell/TeamOs/ARCHITECTURE.md) for a detailed component breakdown, data flow details, and system entity ER diagrams.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)
- [Python](https://www.python.org/) (v3.12 or higher)

### Setup & Installation

#### 1. Clone & Configure Environments
Copy the template variables file to configure local credentials:
```bash
cp .env.example .env
```
*(Configure DB credentials and your GEMINI_API_KEY/OPENAI_API_KEY in the `.env` file)*

#### 2. Install & Start Extension & Dashboard (Frontend)
Run the following commands from the workspace root:
```bash
# Install NPM dependencies
pnpm install

# Start Chrome Extension in watch mode (Plasmo dev)
pnpm dev:extension

# Start Dashboard Web App locally
pnpm dev:dashboard
```

To load the extension on your Google Chrome browser:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Choose the build directory output: `apps/extension/build/chrome-mv3-dev`

#### 3. Install & Start FastAPI Server (Backend)
Open a new terminal session and run:
```bash
# Navigate to backend package
cd apps/backend

# Create virtual environment and activate it
python -m venv .venv
.venv\Scripts\activate

# Install dependencies in editable mode
pip install -e .

# Run the local server using the entrypoint script
start
```

---

## Project Structure

```text
TeamOS/
├── apps/
│   ├── backend/           # FastAPI web backend with REST routers & services
│   ├── extension/         # Plasmo Chrome extension popup, sidepanel, & content scripts
│   ├── dashboard/         # React SPA workspace dashboard application
│   ├── ai-engine/         # Python AI agent handlers & Browser Use actions
│   └── worker/            # Asynchronous background tasks worker (Celery/Redis)
├── packages/
│   ├── config/            # Base endpoint URLs and environment configurations
│   ├── types/             # Shared TypeScript models and interface declarations
│   ├── sdk/               # Shared API fetch helper functions
│   ├── ui/                # Shared layout & button UI components
│   └── utils/             # Common utility helper functions
├── services/
│   ├── browser-use/       # AI agent browser automation integration layer
│   ├── embeddings/        # Document vector generation utilities
│   ├── graph/             # Entity Graph traversal helper scripts
│   └── websocket/         # WebSocket messaging pub/sub hub
└── infra/
    ├── docker/            # Multi-container Compose setups (Postgres, Redis)
    └── nginx/             # Reverse proxy deployment configurations
```

---

## API Reference

### Workspace Service
- `POST /workspace/create`: Create a new workspace.
  - **Request Body**: `{"name": "string", "description": "string"}`
  - **Response (201)**: `{"workspace_id": "ws-123", "name": "...", "description": "...", "created_at": "...", "members": [...], "projects": [...]}`
- `POST /workspace/join`: Join a workspace via invite code.
  - **Request Body**: `{"invite_code": "ws-123"}`
  - **Response (200)**: `{"workspace_id": "ws-123", ...}`
- `GET /workspace/{workspace_id}`: Fetch workspace details.
  - **Response (200)**: `{"workspace_id": "...", ...}`
- `GET /workspace/{workspace_id}/members`: Fetch workspace members and presence.
  - **Response (200)**: `[{"user_id": "...", "display_name": "...", "status": "online", "current_activity": "...", "progress": 78}]`

### Task Service
- `GET /task/`: Get all tasks.
  - **Response (200)**: `[{"task_id": "...", "title": "...", "assignee": "...", "status": "...", "progress": 50, "checklist": [...]}]`
- `POST /task/`: Create a task.
  - **Request Body**: `{"title": "...", "assignee": "...", "checklist": [{"title": "...", "completed": false}]}`
- `PATCH /task/{task_id}`: Update task completion or progress.

### Context Service
- `POST /context/share`: Share active page or text selection.
  - **Request Body**: `{"type": "page", "title": "...", "url": "...", "text_content": "..."}`
- `GET /context/feed`: Fetch context chronological feed.

---

## Running Tests
Run the pytest test suite inside the backend virtual environment:
```bash
cd apps/backend
pytest
```

---

## Team / Credits
Built with 💙 for the TeamOS Hackathon MVP.

---

## License
Licensed under the [MIT License](LICENSE).
