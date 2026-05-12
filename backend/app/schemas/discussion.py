from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DiscussionCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    createdBy: str | None = Field(default=None, max_length=120)
    followUpAt: datetime | None = None


class DiscussionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    leadId: str
    content: str
    createdBy: str | None = None
    followUpAt: datetime | None = None
    createdAt: datetime
    updatedAt: datetime
