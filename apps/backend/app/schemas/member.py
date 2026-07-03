from pydantic import BaseModel, Field
from typing import List, Optional

class MemberAvailability(BaseModel):
    day: str = Field(..., description="Day of the week, e.g., Monday")
    start_time: str = Field(..., description="Start hour, e.g., 18:00")
    end_time: str = Field(..., description="End hour, e.g., 23:00")

class MemberUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=50)
    status: Optional[str] = Field(None, pattern="^(online|offline|idle|busy)$")
    current_activity: Optional[str] = Field(None, max_length=100)
    availability: Optional[List[MemberAvailability]] = None
    progress: Optional[int] = Field(None, ge=0, le=100)

class MemberResponse(BaseModel):
    user_id: str
    display_name: str
    status: str
    current_activity: Optional[str] = None
    availability: List[MemberAvailability] = []
    progress: int

    class Config:
        from_attributes = True
