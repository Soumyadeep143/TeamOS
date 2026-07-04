from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.store import db

class WLAservice:
    def get_workload_analysis(self, workspace_id: str) -> Dict[str, Any]:
        """
        Performs Workload Analysis (WLA) on all members of the specified workspace.
        """
        ws = db.workspaces.get(workspace_id)
        if not ws:
            return {
                "workspace_id": workspace_id,
                "overloaded_members": [],
                "idle_members": [],
                "meeting_suggestions": [],
                "overlap_summary": "Workspace not found."
            }
            
        members_list = []
        for m_id in ws["members"]:
            if m_id in db.members:
                members_list.append(db.members[m_id])
                
        all_tasks = list(db.tasks.values())
        
        overloaded = []
        idle = []
        
        for member in members_list:
            m_id = member["user_id"]
            # Filter tasks assigned to this member
            m_tasks = [t for t in all_tasks if t.get("assignee") == m_id]
            active_tasks = [t for t in m_tasks if t.get("status") == "in-progress"]
            
            # Rule 1: Overloaded if >= 2 in-progress tasks or >= 3 total tasks assigned
            if len(active_tasks) >= 2 or len(m_tasks) >= 3:
                overloaded.append({
                    "user_id": m_id,
                    "display_name": member["display_name"],
                    "active_tasks_count": len(active_tasks),
                    "total_tasks_count": len(m_tasks),
                    "reason": "High concurrent task allocation." if len(active_tasks) >= 2 else "Large total backlog allocation."
                })
                
            # Rule 2: Idle if online/busy but has 0 total tasks assigned
            if member["status"] in ["online", "busy"] and len(m_tasks) == 0:
                idle.append({
                    "user_id": m_id,
                    "display_name": member["display_name"],
                    "status": member["status"],
                    "reason": "No tasks currently assigned."
                })
                
        # Compute availability overlap suggestions
        meeting_suggestions = self._calculate_meeting_suggestions(members_list)
        
        return {
            "workspace_id": workspace_id,
            "overloaded_members": overloaded,
            "idle_members": idle,
            "meeting_suggestions": meeting_suggestions,
            "overlap_summary": f"Analyzed {len(members_list)} members. Found {len(overloaded)} overloaded and {len(idle)} idle."
        }

    def get_availability_heatmap(self, workspace_id: str) -> Dict[str, Any]:
        """
        Builds a 7x24 occupancy matrix representing how many members are available
        at any given hour of the week (0-23 hours for Monday-Sunday).
        """
        ws = db.workspaces.get(workspace_id)
        if not ws:
            return {"heatmap": {}}
            
        members_list = []
        for m_id in ws["members"]:
            if m_id in db.members:
                members_list.append(db.members[m_id])
                
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        # Structure: {Day: [0, 0, ... 24 items]}
        heatmap_matrix = {day: [0] * 24 for day in days}
        
        for member in members_list:
            for window in member.get("availability", []):
                day = window.get("day")
                if day not in heatmap_matrix:
                    continue
                try:
                    start_h = int(window.get("start_time", "00:00").split(":")[0])
                    end_h = int(window.get("end_time", "00:00").split(":")[0])
                    
                    # Fill availability slots
                    for hour in range(start_h, min(end_h + 1, 24)):
                        heatmap_matrix[day][hour] += 1
                except (ValueError, IndexError):
                    continue
                    
        return {
            "workspace_id": workspace_id,
            "heatmap": heatmap_matrix,
            "total_members": len(members_list)
        }

    def _calculate_meeting_suggestions(self, members: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Finds overlapping time windows of available hours across members.
        """
        if len(members) < 2:
            return []
            
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        suggestions = []
        
        for day in days:
            # Collect start and end hours for each member available on this day
            member_intervals = []
            for m in members:
                for w in m.get("availability", []):
                    if w.get("day") == day:
                        try:
                            start_h = int(w.get("start_time", "00:00").split(":")[0])
                            end_h = int(w.get("end_time", "00:00").split(":")[0])
                            member_intervals.append((start_h, end_h))
                        except (ValueError, IndexError):
                            pass
                            
            # We want to find overlap. Since it's MVP, check if all members available on this day overlap
            if len(member_intervals) >= 2:
                # Simple intersection of intervals
                max_start = max(interval[0] for interval in member_intervals)
                min_end = min(interval[1] for interval in member_intervals)
                
                if max_start < min_end:
                    suggestions.append({
                        "day": day,
                        "start_time": f"{max_start:02d}:00",
                        "end_time": f"{min_end:02d}:00",
                        "available_count": len(member_intervals),
                        "recommendation": f"Optimal sync window on {day}s between {max_start:02d}:00 and {min_end:02d}:00."
                    })
                    
        return suggestions
