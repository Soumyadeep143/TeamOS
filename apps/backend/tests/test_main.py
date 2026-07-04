import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.store import db
from app.services.hydra_service import hydra_service

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_store():
    # Clear in-memory store before each test to ensure test isolation
    db.workspaces.clear()
    db.members.clear()
    db.tasks.clear()
    db.contexts.clear()
    db.notifications.clear()
    db._init_demo_data()
    hydra_service.reset()

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

def test_update_member_presence():
    payload = {
        "status": "busy",
        "current_activity": "Coding the sidebar UI",
        "progress": 85
    }
    response = client.patch("/member/user-1", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "user-1"
    assert data["status"] == "busy"
    assert data["current_activity"] == "Coding the sidebar UI"
    assert data["progress"] == 85


def test_websocket_broadcasts_member_presence_update():
    with client.websocket_connect("/ws/demo-workspace-123") as websocket:
        response = client.patch(
            "/member/user-1",
            json={"status": "busy", "current_activity": "Deep work", "progress": 60},
        )
        assert response.status_code == 200

        message = websocket.receive_json()
        assert message["event"] == "USER_BUSY"
        assert message["data"]["user_id"] == "user-1"
        assert message["data"]["status"] == "busy"


def test_websocket_broadcasts_task_created_and_progress():
    with client.websocket_connect("/ws/demo-workspace-123") as websocket:
        response = client.post(
            "/task/",
            json={"title": "Write docs", "assignee": "user-1", "checklist": []},
        )
        assert response.status_code == 201

        created = websocket.receive_json()
        assert created["event"] == "TASK_CREATED"
        assert created["data"]["title"] == "Write docs"

        progress = websocket.receive_json()
        assert progress["event"] == "PROGRESS_UPDATED"
        assert "sprint_progress" in progress["data"]


def test_duplicate_share_creates_and_reads_notification():
    # Text overlaps heavily with the demo ctx-1 seed data (title + summary) so the
    # local cosine-similarity fallback in hydra_service clears the 80% threshold.
    payload = {
        "type": "document",
        "title": "Browser Use Competitor Analysis",
        "text_content": "Browser Use Competitor Analysis: GitHub repository for Browser Use agent framework.",
    }
    response = client.post("/context/share", json=payload)
    assert response.status_code == 201

    notif_response = client.get("/notification/")
    assert notif_response.status_code == 200
    notifications = notif_response.json()["notifications"]
    duplicate_notifs = [n for n in notifications if n["type"] == "duplicate_found"]
    assert len(duplicate_notifs) == 1

    notif_id = duplicate_notifs[0]["notification_id"]
    read_response = client.post(f"/notification/{notif_id}/read")
    assert read_response.status_code == 200
    assert read_response.json()["read"] is True


def test_ai_run_generates_summary_and_broadcasts_completion():
    with client.websocket_connect("/ws/demo-workspace-123") as websocket:
        response = client.post(
            "/ai/run",
            json={"prompt": "Summarize the current sprint status for the team."},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert "summary" in data

        started = websocket.receive_json()
        assert started["event"] == "AI_STARTED"
        completed = websocket.receive_json()
        assert completed["event"] == "AI_COMPLETED"


def test_knowledge_graph_endpoint_returns_nodes_and_edges():
    response = client.post("/ai/knowledge-graph")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) > 0


def test_context_search_matches_title():
    response = client.get("/context/search", params={"q": "Browser Use"})
    assert response.status_code == 200
    results = response.json()
    assert any("Browser Use" in r["title"] for r in results)


def test_context_share_persists_metadata():
    payload = {
        "type": "page",
        "title": "Screenshot Test Page",
        "url": "https://example.com",
        "metadata": {"screenshot": "data:image/png;base64,abc123"},
    }
    response = client.post("/context/share", json=payload)
    assert response.status_code == 201
    assert response.json()["metadata"] == {"screenshot": "data:image/png;base64,abc123"}

