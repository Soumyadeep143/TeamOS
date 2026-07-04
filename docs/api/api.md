# TeamOS API

## Endpoints

### Workspace
- `POST /workspace/create`
- `POST /workspace/join`
- `GET /workspace/{workspace_id}`
- `GET /workspace/{workspace_id}/members`

### Members / Presence
- `GET /member/`
- `PATCH /member/{user_id}`

### Context Feed
- `POST /context/share`
- `GET /context/feed`
- `GET /context/search?q=`

### Tasks
- `GET /task/`
- `POST /task/`
- `PATCH /task/{task_id}`

### Progress
- `GET /progress/`

### Timeline
- `GET /timeline/?user_id=`

### Notifications
- `GET /notification/`
- `POST /notification/{notification_id}/read`

### AI
- `POST /ai/run` — body `{ "prompt": string }`
- `POST /ai/knowledge-graph`

### Real-time
- `WS /ws/{workspace_id}` — presence/context/task/notification broadcasts (see WebSocket Events below)
- `GET /browser/status` — connection diagnostics (active rooms + counts)

## WebSocket Events

Broadcast over `/ws/{workspace_id}` as `{"event": "<NAME>", "data": {...}}`:

| Category | Events |
| --- | --- |
| Presence | `USER_ACTIVE` · `USER_IDLE` · `USER_BUSY` · `USER_LEFT` |
| Context | `PAGE_SHARED` · `DOCUMENT_SHARED` · `HIGHLIGHT_SHARED` · `NEW_CONTEXT` |
| AI | `AI_STARTED` · `AI_COMPLETED` · `AI_FAILED` |
| Tasks | `TASK_CREATED` · `TASK_UPDATED` · `TASK_COMPLETED` · `PROGRESS_UPDATED` |
| Notifications | `DUPLICATE_FOUND` · `SUMMARY_READY` |

Entities aren't yet tagged with a `workspace_id` in `MemoryStore`, so the backend currently fans broadcasts out to every connected room regardless of the path's `workspace_id` — see the note in `apps/backend/app/websocket/__init__.py`.
