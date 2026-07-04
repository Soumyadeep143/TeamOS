import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:8000";

interface Availability {
  day: string;
  start_time: string;
  end_time: string;
}

interface Member {
  user_id: string;
  display_name: string;
  status: string; // online, busy, idle, offline
  current_activity?: string;
  availability: Availability[];
  progress: number;
}

export function Team() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/member/`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
        // Set focus mode local state based on user-1 status
        const currentUser = data.find((m: Member) => m.user_id === "user-1");
        if (currentUser) {
          setFocusMode(currentUser.status === "busy");
        }
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    const interval = setInterval(fetchMembers, 4000); // poll every 4 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleFocusMode = async () => {
    const newStatus = focusMode ? "online" : "busy";
    setFocusMode(!focusMode);
    try {
      await fetch(`${API_BASE_URL}/member/user-1`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: newStatus,
          current_activity: newStatus === "busy" ? "Focus Mode enabled" : "Working in browser"
        })
      });
      fetchMembers();
    } catch (error) {
      console.error("Error toggling focus mode:", error);
    }
  };

  // Helper to calculate team overlap free hours (Monday schedule is the demo slot)
  const calculateOverlap = () => {
    // Collect all monday schedules
    const schedules: { start: number; end: number }[] = [];
    members.forEach((m) => {
      const mon = m.availability.find((a) => a.day === "Monday");
      if (mon) {
        const [sHour, sMin] = mon.start_time.split(":").map(Number);
        const [eHour, eMin] = mon.end_time.split(":").map(Number);
        schedules.push({
          start: sHour + sMin / 60,
          end: eHour + eMin / 60
        });
      }
    });

    if (schedules.length === 0) return "No shared availability scheduled";

    // Find the intersection
    let maxStart = Math.max(...schedules.map((s) => s.start));
    let minEnd = Math.min(...schedules.map((s) => s.end));

    if (maxStart < minEnd) {
      const formatTime = (time: number) => {
        const hours = Math.floor(time);
        const mins = Math.round((time - hours) * 60);
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      };
      return `Monday Overlap: ${formatTime(maxStart)} - ${formatTime(minEnd)}`;
    }
    return "No overlapping schedule slots found";
  };

  if (loading && members.length === 0) {
    return <div style={{ color: "#94a3b8", textAlign: "center", padding: "16px" }}>Loading team presence...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Self presence / focus mode switch */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#1e293b",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #334155"
        }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "14px" }}>Focus Mode</div>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>DND - Suppress team alerts</div>
        </div>
        <button
          onClick={toggleFocusMode}
          style={{
            backgroundColor: focusMode ? "#ef4444" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "16px",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s"
          }}>
          {focusMode ? "ON" : "OFF"}
        </button>
      </div>

      {/* Member cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {members.map((member) => {
          const isUserSelf = member.user_id === "user-1";
          const statusColors: Record<string, string> = {
            online: "#10b981",
            busy: "#ef4444",
            idle: "#f59e0b",
            offline: "#64748b"
          };
          const currentDotColor = statusColors[member.status] || "#64748b";

          return (
            <div
              key={member.user_id}
              style={{
                backgroundColor: "#1e293b",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #334155",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Initials badge */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "white",
                    position: "relative"
                  }}>
                  {member.display_name.slice(0, 2).toUpperCase()}
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: currentDotColor,
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      border: "2px solid #1e293b"
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                    {member.display_name}
                    {isUserSelf && <span style={{ fontSize: "10px", color: "#3b82f6", backgroundColor: "#1e3a8a", padding: "1px 6px", borderRadius: "10px" }}>You</span>}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                    Status: <span style={{ color: currentDotColor }}>{member.status}</span>
                  </div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6" }}>{member.progress}%</div>
              </div>

              {/* Progress bar */}
              <div style={{ width: "100%", height: "6px", backgroundColor: "#334155", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${member.progress}%`, height: "100%", backgroundColor: "#3b82f6", borderRadius: "3px" }} />
              </div>

              {/* Activity / website details */}
              {member.current_activity && (
                <div style={{ fontSize: "12px", color: "#e2e8f0", backgroundColor: "#0f172a", padding: "6px 8px", borderRadius: "4px" }}>
                  🔍 {member.current_activity}
                </div>
              )}

              {/* Individual availability slots */}
              {member.availability.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                  {member.availability.map((av, idx) => (
                    <span key={idx} style={{ fontSize: "10px", backgroundColor: "#334155", color: "#cbd5e1", padding: "2px 6px", borderRadius: "4px" }}>
                      📅 {av.day}: {av.start_time}-{av.end_time}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Plan overlap indicator */}
      <div
        style={{
          marginTop: "8px",
          backgroundColor: "#1e3a8a",
          border: "1px solid #2563eb",
          padding: "12px",
          borderRadius: "8px",
          color: "#bfdbfe"
        }}>
        <div style={{ fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          🚀 Team Overlap Coordinate
        </div>
        <div style={{ fontSize: "12px", fontWeight: 500 }}>{calculateOverlap()}</div>
        <div style={{ fontSize: "11px", color: "#93c5fd", marginTop: "4px" }}>
          Shared schedule mapping helps plan synchronous action sprints.
        </div>
      </div>
    </div>
  );
}
