import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.workspace import router as workspace_router
from app.api.members import router as members_router
from app.api.context import router as context_router
from app.api.ai import router as ai_router
from app.api.tasks import router as tasks_router
from app.api.progress import router as progress_router
from app.api.notifications import router as notifications_router
from app.api.timeline import router as timeline_router
from app.api.websocket import router as websocket_router, ws_router

# Configure structured logging for the application
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("teamos.main")

app = FastAPI(
    title="TeamOS Backend",
    description="Production-hardened FastAPI backend scaffold for collaborative browser execution.",
    version="0.1.0"
)

# Standard security headers / CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_routers = [
    workspace_router,
    members_router,
    context_router,
    ai_router,
    tasks_router,
    progress_router,
    notifications_router,
    timeline_router,
    websocket_router,
    ws_router,
]

for router in api_routers:
    app.include_router(router)

@app.on_event("startup")
def on_startup():
    logger.info("TeamOS Backend is starting up. In-memory datastore initialized.")

@app.on_event("shutdown")
def on_shutdown():
    logger.info("TeamOS Backend is shutting down.")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "TeamOS Backend",
        "version": "0.1.0"
    }

def start():
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

