import logging
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from app.schemas.workspace import WorkspaceCreate, WorkspaceJoin, WorkspaceResponse
from app.schemas.member import MemberResponse
from app.services.workspace_service import WorkspaceService
from app.core.auth import get_current_user, verify_workspace_access

# Configure logging
logger = logging.getLogger("teamos.api.workspace")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/workspace", tags=["workspace"])
workspace_service = WorkspaceService()

@router.post("/create", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    workspace_in: WorkspaceCreate,
    current_user: str = Depends(get_current_user)
):
    """
    Creates a new collaborative workspace.
    """
    logger.info("Creating a new workspace: name=%s, owner=%s", workspace_in.name, current_user)
    try:
        ws = workspace_service.create_workspace(workspace_in, owner_id=current_user)
        logger.info("Workspace created successfully: id=%s", ws["workspace_id"])
        return ws
    except Exception as e:
        logger.exception("Failed to create workspace")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the workspace: {str(e)}"
        )

@router.post("/join", response_model=WorkspaceResponse)
def join_workspace(
    workspace_join: WorkspaceJoin,
    current_user: str = Depends(get_current_user)
):
    """
    Adds the active user to an existing workspace using the invite code.
    """
    # For MVP, invite_code maps directly to workspace_id
    ws_id = workspace_join.invite_code
    logger.info("User %s requesting to join workspace: id=%s", current_user, ws_id)
    try:
        ws = workspace_service.join_workspace(ws_id, user_id=current_user)
        if not ws:
            logger.warning("Workspace not found for code: %s", ws_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Workspace with code '{ws_id}' not found."
            )
        logger.info("User %s joined workspace successfully: id=%s", current_user, ws_id)
        return ws
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to join workspace: id=%s", ws_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while joining the workspace: {str(e)}"
        )

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Returns workspace metadata.
    """
    logger.info("Fetching workspace details: id=%s, user=%s", workspace_id, current_user)
    verify_workspace_access(workspace_id, current_user)
    try:
        ws = workspace_service.get_workspace(workspace_id)
        if not ws:
            logger.warning("Workspace not found: id=%s", workspace_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Workspace with ID '{workspace_id}' not found."
            )
        return ws
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to fetch workspace: id=%s", workspace_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while retrieving workspace details: {str(e)}"
        )

@router.get("/{workspace_id}/members", response_model=List[MemberResponse])
def get_workspace_members(
    workspace_id: str,
    current_user: str = Depends(get_current_user)
):
    """
    Returns all connected members of a workspace.
    """
    logger.info("Fetching workspace members: id=%s, user=%s", workspace_id, current_user)
    verify_workspace_access(workspace_id, current_user)
    try:
        members = workspace_service.get_workspace_members(workspace_id)
        if members is None:
            logger.warning("Workspace not found for member fetch: id=%s", workspace_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Workspace with ID '{workspace_id}' not found."
            )
        return members
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to fetch workspace members: id=%s", workspace_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while retrieving workspace members: {str(e)}"
        )
