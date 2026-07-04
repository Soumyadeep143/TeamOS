import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.store import db

client = TestClient(app)

# Helper headers for authenticated requests
AUTH_USER_1 = {"Authorization": "Bearer user-1"}
AUTH_USER_2 = {"Authorization": "Bearer user-2"}

@pytest.fixture(autouse=True)
def reset_store():
    """
    Clears the in-memory database and restores initial mock seed data before
    each test to guarantee absolute test isolation.
    """
    db.workspaces.clear()
    db.members.clear()
    db.tasks.clear()
    db.contexts.clear()
    db.events = []
    db._init_demo_data()


# ==============================================================================
# 1. System Health Checks (Public / No Auth Required)
# ==============================================================================
def test_health_check_public():
    """
    Health check should remain accessible without authentication headers.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


# ==============================================================================
# 2. Authentication Policy Tests
# ==============================================================================
def test_authentication_missing_token():
    """
    Endpoint should deny access with HTTP 401 if Authorization header is missing.
    """
    response = client.get("/member/")
    assert response.status_code == 401
    assert "missing authorization header" in response.json()["detail"].lower()

def test_authentication_invalid_format():
    """
    Endpoint should deny access with HTTP 401 if Token format is incorrect.
    """
    response = client.get("/member/", headers={"Authorization": "InvalidTokenStyle"})
    assert response.status_code == 401
    assert "malformed authorization" in response.json()["detail"].lower()

def test_authentication_nonexistent_user():
    """
    Endpoint should deny access with HTTP 401 if user profile is missing.
    """
    response = client.get("/member/", headers={"Authorization": "Bearer user-nonexistent"})
    assert response.status_code == 401
    assert "user profile not found" in response.json()["detail"].lower()


# ==============================================================================
# 3. Workspace Scoping & Tenant Isolation Tests
# ==============================================================================
def test_workspace_isolation_read_access_denied():
    """
    User-1 (not a member of Workspace B) should be blocked with 403 Forbidden
    when attempting to fetch Workspace B details.
    """
    # 1. User-2 creates Workspace B
    payload = {"name": "Workspace B", "description": "Private space"}
    create_res = client.post("/workspace/create", json=payload, headers=AUTH_USER_2)
    ws_b_id = create_res.json()["workspace_id"]
    
    # 2. User-1 tries to read Workspace B details -> Should return 403 Forbidden
    read_res = client.get(f"/workspace/{ws_b_id}", headers=AUTH_USER_1)
    assert read_res.status_code == 403
    assert "not a member" in read_res.json()["detail"].lower()

def test_workspace_isolation_task_leakage_prevented():
    """
    Asserts that tasks created in Workspace A are invisible to members of Workspace B.
    """
    # 1. User-1 creates Workspace A
    ws_a = client.post("/workspace/create", json={"name": "Workspace A"}, headers=AUTH_USER_1).json()
    ws_a_id = ws_a["workspace_id"]
    
    # 2. User-2 creates Workspace B
    ws_b = client.post("/workspace/create", json={"name": "Workspace B"}, headers=AUTH_USER_2).json()
    ws_b_id = ws_b["workspace_id"]
    
    # 3. User-1 creates a task inside Workspace A
    task_payload = {"title": "Sensitive Task A", "assignee": "user-1", "checklist": []}
    client.post(f"/task/?workspace_id={ws_a_id}", json=task_payload, headers=AUTH_USER_1)
    
    # 4. User-2 lists tasks for Workspace B -> should NOT see user-1's task
    tasks_b = client.get(f"/task/?workspace_id={ws_b_id}", headers=AUTH_USER_2).json()
    task_titles = [t["title"] for t in tasks_b]
    assert "Sensitive Task A" not in task_titles

def test_workspace_isolation_cross_tenant_update_prevented():
    """
    Asserts that User-2 cannot modify tasks belonging to Workspace A.
    """
    # 1. User-1 creates Workspace A
    ws_a = client.post("/workspace/create", json={"name": "Workspace A"}, headers=AUTH_USER_1).json()
    ws_a_id = ws_a["workspace_id"]
    
    # 2. User-1 creates a task inside Workspace A
    task_payload = {"title": "Critical Task A", "assignee": "user-1", "checklist": []}
    task = client.post(f"/task/?workspace_id={ws_a_id}", json=task_payload, headers=AUTH_USER_1).json()
    task_id = task["task_id"]
    
    # 3. User-2 attempts to modify User-1's task -> should return 403 Forbidden
    patch_res = client.patch(f"/task/{task_id}", json={"title": "Hacked Title"}, headers=AUTH_USER_2)
    assert patch_res.status_code == 403
    assert "not a member" in patch_res.json()["detail"].lower()


# ==============================================================================
# 4. Stored XSS Input Sanitization Tests
# ==============================================================================
def test_stored_xss_sanitization_workspace_create():
    """
    Asserts that HTML characters are escaped on workspace creation.
    """
    payload = {
        "name": "<script>alert('XSS')</script>",
        "description": "<div>Test Description</div>"
    }
    response = client.post("/workspace/create", json=payload, headers=AUTH_USER_1)
    assert response.status_code == 201
    data = response.json()
    # Script tag characters must be escaped
    assert "&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;" in data["name"]
    assert "&lt;div&gt;Test Description&lt;/div&gt;" in data["description"]

def test_stored_xss_sanitization_task_create():
    """
    Asserts that HTML tags are escaped inside task and checklist titles.
    """
    payload = {
        "title": "<img> src=x onerror=alert(1)",
        "checklist": [{"title": "<a href='javascript:void(0)'>Link</a>", "completed": False}]
    }
    response = client.post("/task/", json=payload, headers=AUTH_USER_1)
    assert response.status_code == 201
    data = response.json()
    assert "&lt;img&gt; src=x onerror=alert(1)" in data["title"]
    assert "&lt;a href=&#x27;javascript:void(0)&#x27;&gt;Link&lt;/a&gt;" in data["checklist"][0]["title"]


# ==============================================================================
# 5. DoS Payload Size Validation Tests
# ==============================================================================
def test_oversized_payload_rejection():
    """
    Asserts that shared context text_content exceeding 1MB is rejected with HTTP 422.
    """
    # Create a payload of 1.1MB
    huge_text = "x" * (1024 * 1024 + 10)
    payload = {
        "type": "page",
        "title": "Large Payload Test",
        "text_content": huge_text
    }
    response = client.post("/context/share", json=payload, headers=AUTH_USER_1)
    assert response.status_code == 422
    assert "payload size exceeds" in response.text.lower()


# ==============================================================================
# 6. Preserved Core Business Workflows
# ==============================================================================
def test_task_progress_calculations():
    """
    Verifies that checklist progress math and task state transitions function correctly.
    """
    # Create task with 2 sub-items
    payload = {
        "title": "Subtask Progress Test",
        "checklist": [
            {"title": "Step 1", "completed": False},
            {"title": "Step 2", "completed": False}
        ]
    }
    task = client.post("/task/", json=payload, headers=AUTH_USER_1).json()
    task_id = task["task_id"]
    assert task["progress"] == 0
    assert task["status"] == "todo"
    
    # Complete 1 item -> status becomes in-progress
    patch_res = client.patch(f"/task/{task_id}", json={"checklist": [
        {"title": "Step 1", "completed": True},
        {"title": "Step 2", "completed": False}
    ]}, headers=AUTH_USER_1).json()
    assert patch_res["progress"] == 50
    assert patch_res["status"] == "in-progress"

def test_sprint_progress_aggregation():
    """
    Ensures that aggregate progress endpoints calculate values across workspace tasks.
    """
    # 1. User-1 creates Workspace A
    ws_a = client.post("/workspace/create", json={"name": "Workspace A"}, headers=AUTH_USER_1).json()
    ws_a_id = ws_a["workspace_id"]
    
    # 2. Add tasks in Workspace A
    client.post(f"/task/?workspace_id={ws_a_id}", json={
        "title": "Task 1",
        "checklist": [{"title": "Subtask", "completed": True}]
    }, headers=AUTH_USER_1)
    
    # 3. Retrieve workspace progress
    res = client.get(f"/progress/?workspace_id={ws_a_id}", headers=AUTH_USER_1).json()
    assert res["sprint_progress"] == 100
    assert res["total_tasks"] == 1
    assert res["completed_tasks"] == 1
