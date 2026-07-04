import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.store import db


class NotificationService:
    def list_notifications(self) -> List[Dict[str, Any]]:
        return sorted(db.notifications.values(), key=lambda n: n["created_at"], reverse=True)

    def create_notification(self, type_: str, message: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        notification_id = f"notif-{uuid.uuid4().hex[:8]}"
        notification = {
            "notification_id": notification_id,
            "type": type_,
            "message": message,
            "data": data or {},
            "read": False,
            "created_at": datetime.now(),
        }
        db.notifications[notification_id] = notification
        return notification

    def mark_read(self, notification_id: str) -> Optional[Dict[str, Any]]:
        notification = db.notifications.get(notification_id)
        if not notification:
            return None
        notification["read"] = True
        return notification
