import { API_BASE_URL, WS_BASE_URL } from "@teamos/config";
import type {
  AIRunResult,
  ChecklistItem,
  KnowledgeGraph,
  Member,
  MemberUpdate,
  Notification,
  ProgressSummary,
  SharedContext,
  Task,
  TimelineEvent,
  Workspace,
  WorkspaceEvent,
} from "@teamos/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      // response had no JSON body
    }
    throw new Error(`${init?.method ?? "GET"} ${path} failed (${response.status}): ${detail}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// Workspace
export const createWorkspace = (name: string, description?: string) =>
  request<Workspace>("/workspace/create", { method: "POST", body: JSON.stringify({ name, description }) });

export const joinWorkspace = (inviteCode: string) =>
  request<Workspace>("/workspace/join", { method: "POST", body: JSON.stringify({ invite_code: inviteCode }) });

export const getWorkspace = (workspaceId: string) => request<Workspace>(`/workspace/${workspaceId}`);

export const getWorkspaceMembers = (workspaceId: string) =>
  request<Member[]>(`/workspace/${workspaceId}/members`);

// Members / presence
export const listMembers = () => request<Member[]>("/member/");

export const updateMemberPresence = (userId: string, update: MemberUpdate) =>
  request<Member>(`/member/${userId}`, { method: "PATCH", body: JSON.stringify(update) });

// Context feed
export const shareContext = (payload: {
  type: string;
  title: string;
  url?: string;
  text_content?: string;
  metadata?: Record<string, unknown>;
}) => request<SharedContext>("/context/share", { method: "POST", body: JSON.stringify(payload) });

export const getContextFeed = () => request<SharedContext[]>("/context/feed");

export const searchContext = (query: string) =>
  request<SharedContext[]>(`/context/search?q=${encodeURIComponent(query)}`);

// Tasks
export const listTasks = () => request<Task[]>("/task/");

export const createTask = (payload: { title: string; assignee?: string; checklist?: ChecklistItem[] }) =>
  request<Task>("/task/", { method: "POST", body: JSON.stringify(payload) });

export const updateTask = (
  taskId: string,
  payload: Partial<{ title: string; assignee: string; status: string; progress: number; checklist: ChecklistItem[] }>
) => request<Task>(`/task/${taskId}`, { method: "PATCH", body: JSON.stringify(payload) });

// Progress / timeline
export const getProgress = () => request<ProgressSummary>("/progress/");

export const getTimeline = (userId?: string) =>
  request<TimelineEvent[]>(`/timeline/${userId ? `?user_id=${encodeURIComponent(userId)}` : ""}`);

// Notifications
export const listNotifications = () =>
  request<{ notifications: Notification[] }>("/notification/").then((r) => r.notifications);

export const markNotificationRead = (notificationId: string) =>
  request<Notification>(`/notification/${notificationId}/read`, { method: "POST" });

// AI
export const runAI = (prompt: string) =>
  request<AIRunResult>("/ai/run", { method: "POST", body: JSON.stringify({ prompt }) });

export const getKnowledgeGraph = () => request<KnowledgeGraph>("/ai/knowledge-graph", { method: "POST" });

/**
 * Opens the live workspace WebSocket (presence/context/task/notification events).
 * Caller owns the returned socket's lifecycle (close it on unmount).
 */
export function connectWorkspaceSocket(
  workspaceId: string,
  onEvent: (message: WorkspaceEvent) => void,
  onStatusChange?: (status: "open" | "closed" | "error") => void
): WebSocket {
  const socket = new WebSocket(`${WS_BASE_URL}/ws/${workspaceId}`);
  socket.onopen = () => onStatusChange?.("open");
  socket.onclose = () => onStatusChange?.("closed");
  socket.onerror = () => onStatusChange?.("error");
  socket.onmessage = (event) => {
    try {
      onEvent(JSON.parse(event.data));
    } catch {
      // ignore malformed frames
    }
  };
  return socket;
}
