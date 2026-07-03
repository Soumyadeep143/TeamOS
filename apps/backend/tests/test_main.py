import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.store import db

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_store():
    # Clear in-memory store before each test to ensure test isolation
    db.workspaces.clear()
    db.members.clear()
    db.tasks.clear()
    db.contexts.clear()
    db._init_demo_data()

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"
    assert "version" in response.json()

def test_create_workspace_success():
    payload = {
        "name": "New Test Workspace",
        "description": "A workspace for testing"
    }
    response = client.post("/workspace/create", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "workspace_id" in data
    assert data["name"] == "New Test Workspace"
    assert "user-1" in data["members"]

def test_get_workspace_not_found():
    response = client.get("/workspace/ws-nonexistent")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_create_task_and_progress_recalculation():
    # Create task with 2 completed and 2 uncompleted checklist items
    task_payload = {
        "title": "Implement test suite",
        "assignee": "user-1",
        "checklist": [
            {"title": "Write unit tests", "completed": True},
            {"title": "Mock database connections", "completed": True},
            {"title": "Run tests in CI", "completed": False},
            {"title": "Verify coverage", "completed": False}
        ]
    }
    response = client.post("/task/", json=task_payload)
    assert response.status_code == 201
    task_data = response.json()
    assert task_data["task_id"] is not None
    assert task_data["progress"] == 50
    assert task_data["status"] == "in-progress"

    # Now verify progress endpoint calculates overall sprint progress correctly
    progress_response = client.get("/progress/")
    assert progress_response.status_code == 200
    progress_data = progress_response.json()
    # The progress should be calculated across all tasks in db
    assert "sprint_progress" in progress_data
    assert "individual_progress" in progress_data
