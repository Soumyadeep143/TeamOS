import logging
from fastapi import APIRouter, HTTPException, status
from app.services.notification_service import NotificationService

logger = logging.getLogger("teamos.api.notifications")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/notification", tags=["notification"])
notification_service = NotificationService()


@router.get("/")
def list_notifications():
    """
    Returns all workspace notifications, newest first.
    """
    logger.info("Listing notifications")
    try:
        return {"notifications": notification_service.list_notifications()}
    except Exception as e:
        logger.exception("Failed to list notifications")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while listing notifications: {str(e)}"
        )


@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: str):
    """
    Marks a notification as read.
    """
    logger.info("Marking notification as read: id=%s", notification_id)
    try:
        notification = notification_service.mark_read(notification_id)
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Notification with ID '{notification_id}' not found."
            )
        return notification
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to mark notification as read: id=%s", notification_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating the notification: {str(e)}"
        )
