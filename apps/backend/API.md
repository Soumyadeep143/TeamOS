# TeamOS Backend API Specification

This document provides a comprehensive technical reference for integration specialists connecting client interfaces (such as the Web Dashboard and Chrome Extension) to the FastAPI backend.

---

## 🌐 1. Server Configuration & CORS

* **Base URL**: `http://127.0.0.1:8000`
* **Default Headers**:
  - `Content-Type: application/json`
  - `Accept: application/json`
* **CORS Settings**: The backend allows requests from all origins (`*`) with credentials. Standard methods (`GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`) and headers are allowed.

---

## 📋 2. Comprehensive Endpoint Index

| Category | Method | Path | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/` | Health status and version check | `200` |
| **Workspace** | `POST` | `/workspace/create` | Spawns a new workspace | `210 Created`, `422`, `500` |
| | `POST` | `/workspace/join` | Adds active user to a workspace | `200`, `404`, `422`, `500` |
| | `GET` | `/workspace/{workspace_id}` | Retrieves workspace details | `200`, `404`, `500` |
| | `GET` | `/workspace/{workspace_id}/members` | Lists member presence profiles | `200`, `404`, `500` |
| **Teammate** | `GET` | `/member/` | Lists global teammate presence states | `200`, `500` |
| **Context** | `POST` | `/context/share` | Shares web content or documents | `201 Created`, `422`, `500` |
| | `GET` | `/context/feed` | Gets chronological shared context | `200`, `500` |
| **Tasks** | `GET` | `/task/` | Lists tasks and checklist details | `200`, `500` |
| | `POST` | `/task/` | Spawns a task and checklist | `201 Created`, `422`, `500` |
| | `PATCH` | `/task/{task_id}` | Updates task or checklist status | `200`, `404`, `422`, `500` |
| | `GET` | `/progress/` | Computes aggregate sprint progress | `200`, `500` |
| **Timeline** | `GET` | `/timeline/` | Chronological log of workspace events | `200`, `500` |
| **Analytics** | `GET` | `/analytics/wla` | Overload detection & meeting syncs | `200`, `500` |
| | `GET` | `/analytics/heatmap` | 7x24 weekly availability heatmap grid | `200`, `500` |
| **AI Workflows**| `POST` | `/ai/run` | Triggers research browser-use agent | `200`, `422`, `500` |

---

## 🛠️ 3. Detailed Endpoint Specification

### 3.1 System Services

#### **GET** `/`
Checks server availability and active versioning.

* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "status": "online",
    "version": "0.1.0"
  }
  ```

---

### 3.2 Workspace Services

#### **POST** `/workspace/create`
Initializes a new collaborative workspace. The creating user ID is automatically assigned as `"user-1"` (Owner).

* **Request Body Validation Constraints**:
  - `name`: String. Minimum length: `1`. Maximum length: `100`.
  - `description`: String (Optional). Maximum length: `255`.
* **Request Payload**:
  ```json
  {
    "name": "TeamOS Core Developers",
    "description": "Collaboration room for building the TeamOS browser extension"
  }
  ```
* **Response Status**: `201 Created`
* **Response Body**:
  ```json
  {
    "workspace_id": "ws-c5d6e7f8",
    "name": "TeamOS Core Developers",
    "description": "Collaboration room for building the TeamOS browser extension",
    "created_at": "2026-07-03T20:31:00.123456",
    "members": ["user-1"],
    "projects": []
  }
  ```

#### **POST** `/workspace/join`
Adds the current user to a workspace. The user ID defaults to `"user-1"` (for mock purposes).

* **Request Body Validation Constraints**:
  - `invite_code`: String (Required). Min length: `1`. Maps directly to the workspace ID.
* **Request Payload**:
  ```json
  {
    "invite_code": "ws-c5d6e7f8"
  }
  ```
* **Response Status**: `200 OK` (or `404 Not Found` if the workspace ID is invalid)
* **Response Body**:
  ```json
  {
    "workspace_id": "ws-c5d6e7f8",
    "name": "TeamOS Core Developers",
    "description": "Collaboration room for building the TeamOS browser extension",
    "created_at": "2026-07-03T20:31:00.123456",
    "members": ["user-1", "user-2"],
    "projects": []
  }
  ```

#### **GET** `/workspace/{workspace_id}`
Returns details for a specific workspace.

* **Response Status**: `200 OK` (or `404 Not Found` if ID does not exist)
* **Response Body**:
  ```json
  {
    "workspace_id": "ws-c5d6e7f8",
    "name": "TeamOS Core Developers",
    "description": "Collaboration room for building the TeamOS browser extension",
    "created_at": "2026-07-03T20:31:00.123456",
    "members": ["user-1"],
    "projects": []
  }
  ```

#### **GET** `/workspace/{workspace_id}/members`
Retrieves the presence and status details of all members registered in this workspace.

* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  [
    {
      "user_id": "user-1",
      "display_name": "Soumyadeep",
      "status": "online",
      "current_activity": "Researching Browser Use",
      "availability": [
        {
          "day": "Monday",
          "start_time": "18:00",
          "end_time": "23:00"
        }
      ],
      "progress": 75
    }
  ]
  ```

---

### 3.3 Context & Activity Feed

#### **POST** `/context/share`
Publishes a webpage, text snippet highlight, or document to the shared feed. 
*Note: If the content is type `document` or `page` and similar content already exists, the backend evaluates similarity. A similarity score exceeding `80%` logs a semantic duplicate warning in the system feed.*

* **Request Body Validation Constraints**:
  - `type`: String. Must be one of: `"page"`, `"highlight"`, `"document"`.
  - `title`: String. Minimum length: `1`.
  - `url`: String (Optional). Must be a valid HTTP/HTTPS URL pattern if supplied.
  - `text_content`: String (Optional). Used for duplicate detection checking.
  - `metadata`: Key-value object (Optional).
* **Request Payload**:
  ```json
  {
    "type": "page",
    "title": "Browser Use Documentation",
    "url": "https://github.com/browser-use/browser-use",
    "text_content": "Detailed overview of using playwright with browser agents.",
    "metadata": {
      "category": "developer-docs"
    }
  }
  ```
* **Response Status**: `201 Created`
* **Response Body**:
  ```json
  {
    "context_id": "ctx-e5f6g7h8",
    "type": "page",
    "title": "Browser Use Documentation",
    "url": "https://github.com/browser-use/browser-use",
    "text_content": "Detailed overview of using playwright with browser agents.",
    "summary": "GitHub repository for Browser Use agent framework.",
    "created_by": "user-1",
    "created_at": "2026-07-03T20:55:00.123456",
    "metadata": {
      "category": "developer-docs"
    }
  }
  ```

---

### 3.4 Task Management

#### **POST** `/task/`
Spawns a new task.

* **Request Body Validation Constraints**:
  - `title`: String. Minimum length: `1`. Maximum length: `100`.
  - `assignee`: String (Optional). Must correspond to a registered member ID.
  - `checklist`: Array of ChecklistItems (Optional). Each item requires a `title` (string) and `completed` (boolean).
* **Request Payload**:
  ```json
  {
    "title": "Connect WebSocket Listener",
    "assignee": "user-1",
    "checklist": [
      {
        "title": "Initialize client connection",
        "completed": true
      },
      {
        "title": "Setup error fallback handlers",
        "completed": false
      }
    ]
  }
  ```
* **Response Status**: `201 Created`
* **Response Body**:
  ```json
  {
    "task_id": "task-b7c8d9e0",
    "title": "Connect WebSocket Listener",
    "assignee": "user-1",
    "status": "in-progress",
    "progress": 50,
    "checklist": [
      {
        "title": "Initialize client connection",
        "completed": true
      },
      {
        "title": "Setup error fallback handlers",
        "completed": false
      }
    ]
  }
  ```

#### **PATCH** `/task/{task_id}`
Updates details, assignee, status, or checklists on a task.
*If `checklist` is provided, the backend automatically recalculates the task's completion `progress` percentage and maps `status` (0% = `todo`, 1-99% = `in-progress`, 100% = `completed`).*

* **Request Payload**:
  ```json
  {
    "checklist": [
      {
        "title": "Initialize client connection",
        "completed": true
      },
      {
        "title": "Setup error fallback handlers",
        "completed": true
      }
    ]
  }
  ```
* **Response Status**: `200 OK` (or `404 Not Found` if ID does not exist)
* **Response Body**:
  ```json
  {
    "task_id": "task-b7c8d9e0",
    "title": "Connect WebSocket Listener",
    "assignee": "user-1",
    "status": "completed",
    "progress": 100,
    "checklist": [
      {
        "title": "Initialize client connection",
        "completed": true
      },
      {
        "title": "Setup error fallback handlers",
        "completed": true
      }
    ]
  }
  ```

---

### 3.5 Timeline Events

#### **GET** `/timeline/`
Retrieves chronological logs representing workspace activities. Supports query-level filtering.

* **Query Parameters**:
  - `user_id` (Optional): Filters events by user ID (e.g. `?user_id=user-1`)
  - `event_type` (Optional): Filters events by event type (e.g. `?event_type=workspace_create`)
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  [
    {
      "event_id": "event-98ab76cd",
      "timestamp": "2026-07-03T20:31:00.123456",
      "user": "Soumyadeep",
      "user_id": "user-1",
      "type": "workspace_create",
      "message": "created workspace: 'TeamOS Demo Workspace'",
      "details": {
        "workspace_id": "demo-workspace-123"
      }
    }
  ]
  ```

---

### 3.6 Workload & Availability Analytics

#### **GET** `/analytics/wla`
Retrieves calendar overlaps and triggers overload warnings.
* **Overload Rules**: Flagged if `in-progress` tasks count $\ge 2$, or total assigned tasks count $\ge 3$.
* **Idle Rules**: Flagged if presence status is `online` or `busy` but total assigned tasks count $= 0$.

* **Query Parameters**:
  - `workspace_id` (Optional): Defaults to `demo-workspace-123`
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "workspace_id": "demo-workspace-123",
    "overloaded_members": [
      {
        "user_id": "user-1",
        "display_name": "Soumyadeep",
        "active_tasks_count": 2,
        "total_tasks_count": 3,
        "reason": "High concurrent task allocation."
      }
    ],
    "idle_members": [],
    "meeting_suggestions": [
      {
        "day": "Monday",
        "start_time": "18:00",
        "end_time": "22:00",
        "available_count": 2,
        "recommendation": "Optimal sync window on Mondays between 18:00 and 22:00."
      }
    ],
    "overlap_summary": "Analyzed 2 members. Found 1 overloaded and 0 idle."
  }
  ```

#### **GET** `/analytics/heatmap`
Returns weekly hour-by-hour availability matrix for generating density heatmaps.

* **Query Parameters**:
  - `workspace_id` (Optional): Defaults to `demo-workspace-123`
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "workspace_id": "demo-workspace-123",
    "heatmap": {
      "Monday": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0], // Density values per hour slot (0-23)
      "Tuesday": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ...
    },
    "total_members": 2
  }
  ```

---

## ⚡ 4. Real-time WebSocket Protocol

A WebSocket endpoint is available at:
`ws://127.0.0.1:8000/browser/ws` (Placeholder endpoint config is available on client side via `ws/`).

### Event Payload Formats

#### 4.1 Client Broadcast: Status Update
Clients broadcast active page focus changes to update presence.
```json
{
  "event": "USER_ACTIVE",
  "payload": {
    "user_id": "user-1",
    "current_activity": "Researching Browser Use",
    "active_url": "https://github.com/browser-use/browser-use"
  }
}
```

#### 4.2 Server Broadcast: Task Progress Changed
Server broadcasts to all connected clients when sprint progress updates.
```json
{
  "event": "PROGRESS_UPDATED",
  "payload": {
    "sprint_progress": 72,
    "total_tasks": 5,
    "completed_tasks": 3
  }
}
```

---

## 💻 5. Front-End Integration Examples

### 5.1 React / TypeScript: Toggle Checklist Item
```typescript
interface ChecklistItem {
  title: string;
  completed: boolean;
}

export const toggleChecklistItem = async (taskId: string, updatedChecklist: ChecklistItem[]) => {
  const response = await fetch(`http://127.0.0.1:8000/task/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      checklist: updatedChecklist
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to update task checklist: ${response.statusText}`);
  }

  return await response.json();
};
```

### 5.2 Chrome Extension Background Worker: Broadcast Activity
```javascript
// background.js
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (!tab.url || tab.url.startsWith("chrome://")) return;

  const payload = {
    type: "page",
    title: tab.title,
    url: tab.url,
    text_content: ""
  };

  // Log active browsing metadata back to workspace
  fetch("http://127.0.0.1:8000/context/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(err => console.error("Auto-sync tab failed:", err));
});
```

---

## 🚫 6. Error Response Schema

FastAPI defaults to standard JSON validation error outputs.

### 422 Unprocessable Entity (Schema Validation Error)
```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "name"],
      "msg": "String should have at least 1 character",
      "input": "",
      "ctx": {"min_length": 1}
    }
  ]
}
```

### 404 Not Found (Entity Missing)
```json
{
  "detail": "Workspace with ID 'ws-nonexistent' not found."
}
```
