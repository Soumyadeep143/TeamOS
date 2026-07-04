from pydantic import BaseModel, Field


class AIRunRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Natural language prompt for the AI research/monitoring agent")
