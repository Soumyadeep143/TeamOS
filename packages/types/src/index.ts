// Mirrors apps/backend/app/schemas/*.py and the service-layer response shapes.
// Keep these in sync with the Pydantic models — they are the source of truth.

export interface MemberAvailability {
  day: string;
  start_time: string;
  end_time: string;
}

export type MemberStatus = "online" | "offline" | "idle" | "busy";

export interface Member {
  user_id: string;
  display_name: string;
  status: MemberStatus;
  current_activity?: string | null;
  availability: MemberAvailability[];
  progress: number;
}

export interface MemberUpdate {
  display_name?: string;
  status?: MemberStatus;
  current_activity?: string;
  availability?: MemberAvailability[];
  progress?: number;
}

export interface Workspace {
  workspace_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  members: string[];
  projects: string[];
}

export interface WorkspaceCreate {
  name: string;
  description?: string;
}

export type ContextType = "page" | "document" | "highlight";

export interface ContextShare {
  type: ContextType;
  title: string;
  url?: string;
  text_content?: string;
  metadata?: Record<string, unknown>;
}

export interface SharedContext {
  context_id: string;
  type: ContextType;
  title: string;
  url?: string | null;
  summary?: string | null;
  created_by: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface ChecklistItem {
  title: string;
  completed: boolean;
}

export type TaskStatus = "todo" | "in-progress" | "completed";

export interface Task {
  task_id: string;
  title: string;
  assignee?: string | null;
  status: TaskStatus;
  progress: number;
  checklist: ChecklistItem[];
}

export interface TaskCreate {
  title: string;
  assignee?: string;
  checklist?: ChecklistItem[];
}

export interface TaskUpdate {
  title?: string;
  assignee?: string;
  status?: TaskStatus;
  progress?: number;
  checklist?: ChecklistItem[];
}

export interface ProgressSummary {
  sprint_progress: number;
  total_tasks: number;
  completed_tasks: number;
  individual_progress?: Record<string, number>;
}

export interface TimelineEvent {
  event_id: string;
  timestamp: string;
  user: string;
  user_id: string;
  type: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Notification {
  notification_id: string;
  type: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AIRunResult {
  status: "completed" | "unavailable" | string;
  prompt?: string;
  plan?: Record<string, unknown>;
  visits?: Array<Record<string, unknown>>;
  summary?: string;
  summary_source?: string;
  message?: string;
}

// WebSocket event names emitted over /ws/{workspace_id} — see apps/backend/app/websocket.
export type WorkspaceEventName =
  | "USER_ACTIVE" | "USER_IDLE" | "USER_BUSY" | "USER_LEFT"
  | "PAGE_SHARED" | "DOCUMENT_SHARED" | "HIGHLIGHT_SHARED" | "NEW_CONTEXT"
  | "AI_STARTED" | "AI_PROGRESS" | "AI_COMPLETED" | "AI_FAILED"
  | "TASK_CREATED" | "TASK_UPDATED" | "TASK_COMPLETED" | "PROGRESS_UPDATED"
  | "DUPLICATE_FOUND" | "SUMMARY_READY" | "MENTION";

export interface WorkspaceEvent<T = unknown> {
  event: WorkspaceEventName | string;
  data: T;
}
