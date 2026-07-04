from fastapi import Header, HTTPException, status
from typing import Optional
from app.core.store import db

def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    FastAPI dependency to extract and validate the authenticated user from the Authorization header.
    Expects header format: Bearer <user_id> (e.g., Bearer user-1)
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header."
        )
        
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header must follow format: Bearer <user_id>"
            )
        user_id = parts[1]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed Authorization header."
        )
        
    # Validate user exists in local store database
    if user_id not in db.members:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: User profile not found."
        )
        
    return user_id

def verify_workspace_access(workspace_id: str, user_id: str) -> None:
    """
    Checks if the specified user is registered as a member in the workspace.
    Raises 403 Forbidden if the user is not authorized.
    Raises 404 Not Found if the workspace does not exist.
    """
    if workspace_id not in db.workspaces:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workspace with ID '{workspace_id}' not found."
        )
        
    ws = db.workspaces[workspace_id]
    if user_id not in ws.get("members", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not a member of this workspace."
        )
