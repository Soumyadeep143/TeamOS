import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:8000";

interface ChecklistItem {
  title: string;
  completed: boolean;
}

interface Task {
  task_id: string;
  title: string;
  assignee?: string;
  status: string; // todo, in-progress, completed
  progress: number;
  checklist: ChecklistItem[];
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/task/`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 4000); // poll tasks every 4 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/task/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: newTaskTitle,
          assignee: "user-1",
          checklist: []
        })
      });

      if (response.ok) {
        setNewTaskTitle("");
        fetchTasks();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleToggleChecklist = async (taskId: string, itemIdx: number) => {
    // Find task in local state
    const task = tasks.find((t) => t.task_id === taskId);
    if (!task) return;

    // Deep copy checklist
    const updatedChecklist = task.checklist.map((item, idx) => {
      if (idx === itemIdx) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });

    try {
      // Optimistically update local state
      setTasks((prev) =>
        prev.map((t) => {
          if (t.task_id === taskId) {
            // Recalculate progress for local display
            const total = updatedChecklist.length;
            const completed = updatedChecklist.filter((c) => c.completed).length;
            const localProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
            return {
              ...t,
              checklist: updatedChecklist,
              progress: localProgress,
              status: localProgress === 100 ? "completed" : localProgress > 0 ? "in-progress" : "todo"
            };
          }
          return t;
        })
      );

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/task/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          checklist: updatedChecklist
        })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        // Sync with actual backend values
        setTasks((prev) => prev.map((t) => (t.task_id === taskId ? updatedTask : t)));
      }
    } catch (error) {
      console.error("Error updating task:", error);
      fetchTasks(); // rollback on error
    }
  };

  const addChecklistItem = async (taskId: string, itemTitle: string) => {
    if (!itemTitle.trim()) return;
    const task = tasks.find((t) => t.task_id === taskId);
    if (!task) return;

    const updatedChecklist = [...task.checklist, { title: itemTitle, completed: false }];

    try {
      const response = await fetch(`${API_BASE_URL}/task/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          checklist: updatedChecklist
        })
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error adding checklist item:", error);
    }
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  if (loading && tasks.length === 0) {
    return <div style={{ color: "#94a3b8", textAlign: "center", padding: "16px" }}>Loading tasks...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Create Task Form */}
      <form onSubmit={handleCreateTask} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add new task title..."
          style={{
            flex: 1,
            backgroundColor: "#1e293b",
            color: "white",
            border: "1px solid #334155",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "13px"
          }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer"
          }}>
          Create
        </button>
      </form>

      {/* Task List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {tasks.map((task) => {
          const isExpanded = expandedTaskId === task.task_id;
          const statusColors: Record<string, string> = {
            todo: "#cbd5e1",
            "in-progress": "#f59e0b",
            completed: "#10b981"
          };
          const currentStatusColor = statusColors[task.status] || "#cbd5e1";

          return (
            <div
              key={task.task_id}
              style={{
                backgroundColor: "#1e293b",
                borderRadius: "8px",
                border: "1px solid #334155",
                overflow: "hidden"
              }}>
              {/* Task Header */}
              <div
                onClick={() => toggleExpand(task.task_id)}
                style={{
                  padding: "12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  userSelect: "none"
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc" }}>{task.title}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#3b82f6" }}>{task.progress}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: currentStatusColor }}>
                    ● {task.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {task.checklist.length} items
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ width: "100%", height: "4px", backgroundColor: "#334155", borderRadius: "2px", overflow: "hidden", marginTop: "4px" }}>
                  <div style={{ width: `${task.progress}%`, height: "100%", backgroundColor: currentStatusColor, borderRadius: "2px" }} />
                </div>
              </div>

              {/* Task Expanded Checklist */}
              {isExpanded && (
                <div style={{ padding: "12px", backgroundColor: "#0f172a", borderTop: "1px solid #334155" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {task.checklist.map((item, idx) => (
                      <label
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          color: item.completed ? "#64748b" : "#f1f5f9",
                          textDecoration: item.completed ? "line-through" : "none",
                          cursor: "pointer"
                        }}>
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklist(task.task_id, idx)}
                          style={{ cursor: "pointer" }}
                        />
                        {item.title}
                      </label>
                    ))}

                    {/* Add Checklist Item Box */}
                    <input
                      type="text"
                      placeholder="Add sub-task & press enter..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addChecklistItem(task.task_id, e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                      style={{
                        backgroundColor: "#1e293b",
                        color: "white",
                        border: "1px solid #334155",
                        borderRadius: "4px",
                        padding: "6px 8px",
                        fontSize: "12px",
                        marginTop: "4px"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
