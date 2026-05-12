from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class LeadStatus(StrEnum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    proposal_sent = "proposal_sent"
    won = "won"
    lost = "lost"


class LeadBase(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=40)
    company: str | None = Field(default=None, max_length=120)
    source: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=2000)
    status: LeadStatus | None = None


class LeadCreate(LeadBase):
    name: str = Field(min_length=1, max_length=120)
    status: LeadStatus = LeadStatus.new


class LeadUpdate(LeadBase):
    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "LeadUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")
        if "name" in self.model_fields_set and self.name is None:
            raise ValueError("Name cannot be null.")
        if "status" in self.model_fields_set and self.status is None:
            raise ValueError("Status cannot be null.")
        return self


class LeadResponse(LeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    status: LeadStatus
    lastDiscussion: str | None = None
    lastDiscussionAt: datetime | None = None
    nextFollowUp: datetime | None = None
    createdAt: datetime
    updatedAt: datetime
