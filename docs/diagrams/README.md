# TeamOS Diagrams

This document holds the core visual maps for the working TeamOS product. The diagrams below show the end-to-end flow from browser context capture to workspace intelligence.

## System Overview

```mermaid
flowchart LR
  A[Chrome Extension] --> B[FastAPI Gateway]
  B --> C[Workspace Service]
  B --> D[Context Service]
  B --> E[AI Agent Service]
  C --> F[Workspace Dashboard]
  D --> G[Shared Context Feed]
  E --> H[Knowledge Graph and Search]
```

## End-to-End Collaboration Flow

```mermaid
sequenceDiagram
  participant User
  participant Extension
  participant Backend
  participant AI
  participant Dashboard

  User->>Extension: Share page or selection
  Extension->>Backend: POST /context/share
  Backend->>Backend: Validate and enrich context
  Backend->>AI: Queue summarization and analysis
  AI-->>Backend: Return summary and entities
  Backend-->>Dashboard: Broadcast updated workspace state
  Dashboard-->>User: Render feed, tasks, and insights
```

## Product Surface Map

- Browser extension: capture context and launch actions
- Dashboard: review workspace state, tasks, presence, and AI outputs
- Backend: route requests, validate payloads, and coordinate services
- AI layer: summarize, analyze, and extract structured knowledge

