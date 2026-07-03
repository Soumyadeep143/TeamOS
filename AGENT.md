# AGENT.md

## 1. Project Overview
- **What this project is**: TeamOS is an AI-powered collaborative browser extension that transforms web browsing into a shared execution workspace where humans and AI agents collaborate, research, monitor progress, and build persistent organizational knowledge.
- **Who it's for**: Startup teams (2–10 members) and hackathon teams executing rapidly under tight timelines.
- **Current stage**: Hackathon MVP.

## 2. Tech Stack (Authoritative)
- **Extension**: Plasmo (Manifest V3), React 19, TypeScript, Zustand, React Query, Socket.io-client.
- **Dashboard Frontend**: Vite, React 19, TypeScript.
- **Backend API**: FastAPI (Python 3.12+), Pydantic v2, Uvicorn.
- **Databases**: PostgreSQL (Relational persistence), Redis 7 (WebSocket Pub/Sub, Presence cache), HydraDB (Vector similarity + Entity relationship graph).
- **Orchestration / AI**: Browser Use (AI browser agent), Google Gemini / OpenAI.
- **Locked Dependencies**:
  - `fastapi` and `pydantic` in `apps/backend/pyproject.toml`
  - `plasmo` and `react` in `apps/extension/package.json`
- **Constraint**: *Do not introduce new frameworks/libraries without flagging it first.*

## 3. Project Structure
```text
TeamOS/
├── apps/
│   ├── backend/           # FastAPI web backend (REST routes, Pydantic schemas, store)
│   ├── extension/         # Plasmo Chrome extension (background, content, sidepanel, popup)
│   ├── dashboard/         # React SPA workspace dashboard application
│   ├── ai-engine/         # Python AI agent handlers & Browser Use actions
│   └── worker/            # Empty placeholder directory for background workers
├── packages/
│   ├── config/            # Base endpoint configurations
│   ├── types/             # Shared TypeScript interfaces
│   ├── sdk/               # API fetch helper functions
│   ├── ui/                # Shared layout & UI components
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
- **File Placement Conventions**:
  - Backend endpoints go into `apps/backend/app/api/` matching Pydantic schemas in `apps/backend/app/schemas/` and domain logic in `apps/backend/app/services/`.
  - Frontend components go into `apps/extension/src/sidepanel/` or `apps/dashboard/src/components/`.
- **What NOT to touch**:
  - Do not overwrite the global `db` store configuration in [core/store.py](file:///c:/Users/dell/TeamOs/apps/backend/app/core/store.py) unless implementing a true DB migration.
  - Do not modify `infra/docker/docker-compose.yml` service configurations without explicit approval.

## 4. Core Features & Requirements
1. **Workspace Management (FR-1 to FR-4)**: Users can create/join workspaces via invite code; workspace displays live status cards of connected members.
2. **Browser Presence (FR-5 to FR-8)**: Broadcast active tab, activity, availability timelines, and focus mode status.
3. **Shared Context Feed (FR-9 to FR-14)**: Capture URL, screenshots, highlighted selections, shared documents, auto-generated page summaries, and feed timeline.
4. **Browser Use AI Agents (FR-15 to FR-19)**: Execute competitor analysis matrices, price page monitoring, form filling, and knowledge extraction.
5. **Smart Document Intelligence (FR-20 to FR-24)**: Embed uploaded files, compare similarity against HydraDB (80% threshold), notify users, and offer merge choices.
6. **Knowledge Graph (FR-25 to FR-28)**: Extract Person, Company, Product, Technology, and mapping relations to search context graphs.
7. **AI Search (FR-29 to FR-31)**: Answer natural language queries, attributes sources, and matches keywords.
8. **Team Progress (FR-32 to FR-36)**: Checklist items, dynamic task progress percentages, sprint status progress, and history logs.
9. **Timeline (FR-37 to FR-39)**: Chronological event recorder with filtering and sprint playback.
10. **Notifications (FR-40 to FR-42)**: Live socket triggers for duplicates, completed tasks, summaries, and mentions.
11. **AI Sprint Manager (FR-43 to FR-47)**: Monitor deadlines, resource availability overlap, workload overloads, and idle member states.
12. **Browser Synchronization (FR-48 to FR-50)**: Open shared tabs, sessions, and collections.
13. **HydraDB Memory (FR-51 to FR-54)**: Hybrid vector + graph search and context retrieval.
- **Non-Goals / Out of Scope**:
  - No Enterprise Authentication (SSO, RBAC, SCIM). Access is link/code based.
  - No Billing, payments, or license management.
  - No custom browser engines; runs strictly as a Chromium Chrome Extension.
  - No mobile layouts. Desktop only.
  - No replacement for full Jira/Linear ticket trackers.
  - Large file binary storage (files are indexed via vectors, not hosted locally).

## 5. Coding Standards
- **Formatting/Linting**:
  - TypeScript: ESLint + Prettier. Format check command: `pnpm lint`.
  - Python: Flake8/Black.
- **Naming Conventions**:
  - React Components: PascalCase (e.g., `Dashboard.tsx`).
  - TypeScript Files: camelCase (e.g., `index.ts`).
  - Python Files/Functions: snake_case (e.g., `workspace_service.py`).
  - Python Classes: PascalCase (e.g., `WorkspaceService`).
- **Error Handling Pattern**:
  - Backend must catch exceptions inside router endpoints, log tracebacks, and raise typed `HTTPException` payloads with explicit details.
  - Frontend must catch network errors using React Query error boundaries or try/catch hooks, showing a user-friendly modal (FR-8.10 stubs).
- **Comments/Docstrings**:
  - Backend functions require docstrings outlining parameters and returns.
  - Extension code requires descriptions of side-effects.
- **State Management**:
  - Frontend uses `Zustand` store definitions.
  - Backend uses service layer architecture (API -> Services -> DB Store).

## 6. Environment & Setup
- **Dependencies installation**:
  - JS: `pnpm install`
  - Python: `cd apps/backend && python -m venv .venv && .venv\Scripts\activate && pip install -e .`
- **Execution Commands**:
  - Extension Dev: `pnpm dev:extension`
  - Dashboard Dev: `pnpm dev:dashboard`
  - FastAPI server: `cd apps/backend && .venv\Scripts\activate && start` (calls uvicorn startup script)
- **Environment Variables**:
  - Copy `.env.example` to `.env` at root:
    - `DATABASE_URL` (PostgreSQL connection string)
    - `REDIS_URL` (Redis connection string)
    - `GEMINI_API_KEY` (Gemini API token)
    - `OPENAI_API_KEY` (OpenAI API token)
- **Verification**:
  - Check health response: `GET http://localhost:8000/` returns `{"status": "online"}`.
  - Extension build outputs `apps/extension/build/chrome-mv3-dev/` directories.

## 7. Testing Requirements
- **Core Requirements**: All endpoints must have associated tests matching happy path and failure scenarios before a feature is marked done.
- **Test Command**: `cd apps/backend && pytest` (inside virtual environment).
- **Test Coverage**: Minimum 80% coverage on new backend business logic modules.
- **Agent Rule**: *Do not mark a task complete without running tests.*

## 8. Agent Behavior Rules
- **Do's**:
  - Always read existing files in a module before modifying them to maintain structure.
  - Add explicit types to JavaScript parameters to prevent implicit-any compilation issues.
  - Run lint checks (`pnpm lint` or equivalent) after updating TypeScript files.
  - Reference files via absolute schema markdown links (e.g. `[filename](file:///path/to/file)`).
- **Don'ts**:
  - Never commit raw credentials, secrets, or `.env` files. Ensure they are listed in `.gitignore`.
  - Never delete existing files or directories without confirmation.
  - Never silently guess ambiguous specifications; write down the assumption in planning.
  - Never push incomplete stubs. Ensure code compiles and does not break surrounding components.

## 9. Definition of Done
- [ ] Feature matches functional specifications and acceptance criteria in Section 4.
- [ ] New and modified backend routes are validated with `pytest` unit tests.
- [ ] TypeScript/TSX code compiles cleanly with no compiler warnings or `noImplicitAny` errors.
- [ ] All sensitive parameters are referenced via environment variables.
- [ ] Root `README.md` and `ARCHITECTURE.md` are updated if file locations or APIs changed.

## 10. Known Constraints / Risks
- **Extension Sandbox Limitations**: Chrome Extensions have strict MV3 security bounds (no external scripts execution, local permissions for screenshots).
- **Browser Use Execution Latency**: Real-time browser automation jobs might take 30+ seconds to run. Handlers must run asynchronously inside workers, not blocking the main FastAPI thread.
- **Duplicate Threshold Tuning**: Similarity threshold is locked at 80% per PRD (FR-20) to prevent excessive false duplicate warnings.
- **Hackathon Time Constraints**: Speed to working demo is prioritized. Use mock in-memory stores first if persistent DB structures block feature visibility.

## 11. Escalation Rules
Stop execution and prompt the developer when:
1. Encountering a requirement not covered in the PRD.
2. Needing to add a new external dependency/service package not defined in the Tech Stack.
3. Needing to execute destructive actions (e.g., dropping database tables, deleting codebase files, force pushing Git branches).
4. Facing architectural conflicts between old stubs and newly implemented features.
