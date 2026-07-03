import logging
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.task_service import TaskService

logger = logging.getLogger("teamos.api.tasks")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/task", tags=["tasks"])
task_service = TaskService()

@router.get("/", response_model=List[TaskResponse])
def list_tasks():
    """
    Returns all tasks in the workspace.
    """
    logger.info("Listing all tasks")
    try:
        return task_service.list_tasks()
    except Exception as e:
        logger.exception("Failed to retrieve tasks")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while listing tasks: {str(e)}"
        )

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate):
    """
    Creates a new task.
    """
    logger.info("Creating task: title=%s", task_in.title)
    try:
        task = task_service.create_task(task_in)
        logger.info("Task created successfully: id=%s", task["task_id"])
        return task
    except Exception as e:
        logger.exception("Failed to create task")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the task: {str(e)}"
        )

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task_in: TaskUpdate):
    """
    Updates progress or details of an existing task.
    """
    logger.info("Updating task: id=%s", task_id)
    try:
        updated_task = task_service.update_task(task_id, task_in)
        if not updated_task:
            logger.warning("Task not found for update: id=%s", task_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID '{task_id}' not found."
            )
        logger.info("Task updated successfully: id=%s", task_id)
        return updated_task
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update task: id=%s", task_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating the task: {str(e)}"
        )
