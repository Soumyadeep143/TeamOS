# TeamOS Task Checklist

## 1. Project Setup & Foundational Infrastructure
- [x] Resolve frontend monorepo JS package dependency errors (`plasmo` version and `react-query` renaming to `@tanstack/react-query`)
- [x] Configure standard `index.html` entrypoint for `@teamos/dashboard` Vite application
- [x] Generate premium vector logo and configure assets/icon in `@teamos/extension`
- [x] Clean up backend `pyproject.toml` dependency specifiers (convert caret `^` to PEP 621 `>=` formats)
- [x] Fix psycopg dependency and define start entrypoint script
- [x] Initialize backend virtual environment and install dependencies (`pytest`, `httpx`, `httpx2`)
- [x] Fix task service status/progress alignment issue to make backend test suites pass
- [x] Run and verify `pytest` suite (all tests pass)
- [x] Start FastAPI backend local server and verify health endpoint returns online status

## 2. Backend Services & Core Relational APIs
- [x] Implement thread-safe in-memory `MemoryStore` data layer
- [x] Workspace Management API (FR-1 to FR-4)
  - [x] Create workspace endpoint
  - [x] Join workspace endpoint (linking user-1 to workspace)
  - [x] Fetch workspace metadata
  - [x] List workspace members and status cards
- [x] Tasks & Sprint Tracking APIs (FR-32 to FR-36)
  - [x] Create task with checklist items
  - [x] Update task progress and automatically adjust task status (`todo`, `in-progress`, `completed`)
  - [x] Aggregated sprint-level progress percentage calculations
  - [x] Individual member progress contributions
- [x] Context Feed Sharing APIs (FR-9 to FR-14)
  - [x] Share webpage context payload validation and creation
  - [x] Chronological activity feed query
- [x] Timeline Event Logging (FR-37 to FR-39)
  - [x] Log events chronologically
  - [x] Query and filter timeline events by user ID
- [x] Duplicate Detection Service Scaffold (FR-20 to FR-24)
  - [x] Basic text semantic similarity mock comparator

## 3. Chrome Extension Development (`apps/extension`)
- [ ] Implement browser interaction listeners in background service worker
  - [ ] Broadcaster for active tab, activity, and focus state (FR-5 to FR-6)
- [ ] Build Right-Click context menu listener (FR-10 to FR-11)
  - [ ] Text selection capture and sharing
  - [ ] Image capture and metadata sharing
- [ ] Build Sidebar Panel User Interface (Zustand + React)
  - [ ] Workspace switcher and joining view
  - [ ] Real-time chronological Context Feed display
  - [ ] Workspace member presence cards
  - [ ] Live Task Checklist management widget
  - [ ] Natural Language AI Search chat panel
  - [ ] Notifications overlay

## 4. Dashboard Web Application (`apps/dashboard`)
- [ ] Develop Dashboard Core Layout (React + Vite)
- [ ] Workspace Command Center
  - [ ] Aggregated sprint progress trackers and metrics cards (FR-33 to FR-34)
  - [ ] Team Activity Heatmap (presence status tracker) (FR-8)
  - [ ] Timeline event playback controller (FR-38)
- [ ] AI Research Panel
  - [ ] Trigger Browser Use AI agents and view progress logs
  - [ ] Competitor analysis matrices and price monitoring updates
- [ ] Knowledge Graph Visual Explorer (FR-25 to FR-28)
  - [ ] Interactive graph rendering (users, docs, entities, companies)

## 5. Persistence & Event Streaming (Relational & Cache Migration)
- [ ] PostgreSQL Database Schema Setup (SQLAlchemy + Alembic)
  - [ ] Map Workspace, Member, Context, Task, Checklist schemas
  - [ ] Database migrations initialization
- [ ] Redis Integration (redis-py)
  - [ ] Broadcast WebSockets via Redis Pub/Sub room routing
  - [ ] Cache user availability timelines and active status markers
- [ ] WebSocket Broadcast Server
  - [ ] Real-time pub/sub broadcaster for user events (joins, active tab, shares)

## 6. AI Agent Engine & Browser Use Automation (`apps/ai-engine`)
- [ ] Set up Browser Use Agent runner
  - [ ] Competitor research agent handler (FR-15, FR-18)
  - [ ] Site price monitoring agent worker (FR-16)
  - [ ] Automated form fill execution (FR-17)
- [ ] LLM Integration (Google Gemini / OpenAI APIs)
  - [ ] Automatic page text summarization worker (FR-13)
  - [ ] Entity relationship extraction worker (FR-19, FR-25)

## 7. Document Intelligence & Vector Graph Memory (HydraDB)
- [ ] Set up HydraDB Data Client
- [ ] Document Vector Embeddings Pipeline
  - [ ] Generate sentence embeddings for text/highlights
  - [ ] Vector similarity comparison at 80% threshold (FR-20)
  - [ ] Duplicate warning triggers and merge recommendations (FR-21 to FR-22)
- [ ] Knowledge Graph Database
  - [ ] Entity node mapping (Person, Company, Product, Technology, Website)
  - [ ] Relationship edge insertions

## 8. AI Sprint Manager (FR-43 to FR-47)
- [ ] Implement AI reasoning heuristics inside backend
  - [ ] Team availability overlap coordinator
  - [ ] Sprint deadline risk calculations
  - [ ] Idle and overloaded team member detection
  - [ ] Resourcing change recommendations

## 9. Verification & Testing
- [ ] Expand pytest integration tests for database models
- [ ] Run typescript compiler and eslint checks (`pnpm lint`)
