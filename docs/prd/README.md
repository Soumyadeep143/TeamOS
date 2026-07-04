# TeamOS Product Specification

This document defines the working, end-to-end TeamOS product experience for the current MVP release. It is intended to be implementation-ready and should be treated as the source of truth for product behavior, API contracts, and delivery scope.

## 1. Product Vision

TeamOS is a browser-native work operating system for collaborative execution. It helps teams move from browsing to action by turning every page, selection, and task into a shared workspace artifact that can be reviewed, searched, and acted upon by both humans and AI agents.

The product must work as a real operating layer for collaborative research and delivery, not as a static demo. The experience must support onboarding, shared context capture, agent-driven assistance, sprint tracking, and team visibility in one continuous flow.

## 2. Problem Statement

Modern teams lose time because context lives in fragmented surfaces: tabs, chat threads, documents, meeting notes, and spreadsheets. TeamOS consolidates that context into a shared workspace where people can collaborate and where AI agents can act as teammates.

## 3. Goals and Non-Goals

### Goals
- Let a user create or join a workspace in a single flow.
- Capture shared web context from the browser and make it visible to the team.
- Run AI research and automation tasks against the current workspace context.
- Surface duplicate or overlapping context automatically.
- Maintain a clear task and sprint view for delivery progress.
- Keep the experience fast, desktop-first, and reliable for team collaboration.

### Non-Goals
- SSO, enterprise identity management, or RBAC.
- Billing or subscription management.
- Mobile-first or cross-browser support in this release.
- Replacing full issue trackers such as Jira or Linear.

## 4. Target Users

- Startup teams of 2 to 10 members working on fast-moving research or product delivery.
- Hackathon and launch teams coordinating browser-based exploration and execution.
- Operators who need shared context and AI assistance while working inside a browser.

## 5. Core User Journeys

### Journey A: Create a team workspace
1. A user opens TeamOS and creates a workspace.
2. The workspace is assigned a shareable invite code.
3. The user invites teammates and sees their presence in the workspace.
4. The workspace becomes the operational home for shared research and tasks.

### Journey B: Share browser context
1. A user opens a page, highlights text, or captures a page snapshot.
2. The extension sends the item to TeamOS.
3. The item is validated, stored, summarized, and shared with the team.
4. The feed shows the shared context with a visible summary and metadata.

### Journey C: Run AI research
1. A user enters a task goal for an AI agent.
2. The agent executes the research step in the browser or workspace context.
3. The workspace receives structured findings, task updates, and notifications.
4. The user reviews the result in the dashboard and acts on it.

### Journey D: Track delivery progress
1. A user creates or updates tasks and checklist items.
2. Progress is recalculated and shown in real time.
3. The team sees blocker states, completion rates, and sprint posture.

## 6. Functional Requirements

### FR-1 Workspace Orchestration
- The system must let users create a workspace with a name and description.
- The system must let users join a workspace with an invite code.
- The system must expose workspace membership and active status to the team.

### FR-2 Presence and Activity Sync
- The system must show teammate presence, current browser context, and available activity state.
- The system must distinguish active, focus, and idle states.

### FR-3 Shared Context Feed
- The system must capture page URLs, titles, page summaries, and user-highlighted text.
- The system must publish shared context to a chronological feed.
- The system must support duplicate detection for overlapping context.

### FR-4 AI Agent Execution
- The system must support launching an AI agent with a task goal and model selection.
- The system must stream agent progress and surface terminal-style logs.
- The system must return structured findings into the workspace.

### FR-5 Document Intelligence
- The system must compare uploaded or shared documents against existing workspace context.
- The system must trigger a similarity warning when overlap is high.
- The system must allow a user to review and resolve duplicates.

### FR-6 Knowledge Graph and Search
- The system must extract entities such as people, companies, products, and technologies from shared context.
- The system must expose a knowledge graph view and a search experience over workspace memory.

### FR-7 Task and Sprint Management
- The system must create and update tasks with checklist progress.
- The system must surface sprint progress and blocker states.
- The system must recalculate overall progress as checklist items change.

### FR-8 Notifications and Timeline
- The system must publish workspace events for tasks, summaries, duplicates, mentions, and agent completions.
- The system must provide a timeline view of important events.

## 7. End-to-End Functional Flow

1. Workspace is created.
2. Teammates join through invite code.
3. The browser extension captures an active page or selection.
4. The backend validates input and stores it in the workspace context feed.
5. A duplicate analysis step checks for overlap.
6. The AI engine can summarize and enrich the content.
7. The dashboard renders the updated feed, presence, tasks, and knowledge graph.
8. Notifications and timeline events keep the workspace synchronized.

## 8. API and Interface Contract

### Workspace APIs
- POST /workspace/create
- POST /workspace/join
- GET /workspace/{workspace_id}
- GET /workspace/{workspace_id}/members

### Context APIs
- POST /context/share
- GET /context/feed

### Task APIs
- GET /task/
- POST /task/
- PATCH /task/{task_id}

### AI APIs
- POST /ai/run
- GET /ai/status/{job_id}

### Notification APIs
- GET /notification/
- GET /timeline/

## 9. Non-Functional Requirements

- The experience must run on desktop Chrome with a local extension and dashboard.
- Core read operations should respond within 500 ms in typical local development conditions.
- WebSocket updates should appear in under 2 seconds after event publication.
- The system must never expose secrets or tokens in logs or UI payloads.
- The system must be observable through structured logs and error states.

## 10. Acceptance Criteria

- A user can create a workspace and share it with a teammate via invite code.
- A page or selection shared from the browser appears in the shared feed with a summary and timestamp.
- The AI agent can be launched from the dashboard and returns an execution log plus structured findings.
- Duplicate context is flagged with a visible warning and can be reviewed.
- Task progress is recalculated and reflected in the sprint view.
- Search returns relevant workspace entities and context items.

## 11. Definition of Done

- The workflow is implemented end to end across extension, API, and dashboard.
- The experience is functional without relying on placeholder data for core journeys.
- Core APIs are covered by backend tests and smoke validation.
- The UI reflects live workspace state rather than a static demo mock.

## 12. Delivery Plan

- Phase 1: workspace onboarding, presence, and context feed
- Phase 2: AI agent execution and notifications
- Phase 3: document intelligence, knowledge graph, and search
- Phase 4: reliability improvements, observability, and persistence hardening
