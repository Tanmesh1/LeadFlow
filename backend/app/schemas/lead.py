from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator


class LeadStatus(StrEnum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    proposal_sent = "proposal_sent"
    won = "won"
    lost = "lost"


ACTIVE_LEAD_STATUSES = (
    LeadStatus.new,
    LeadStatus.contacted,
    LeadStatus.qualified,
    LeadStatus.proposal_sent,
)
CLOSED_LEAD_STATUSES = (LeadStatus.won, LeadStatus.lost)


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

    @computed_field
    @property
    def isOverdue(self) -> bool:
        if self.nextFollowUp is None or self.status not in ACTIVE_LEAD_STATUSES:
            return False

        follow_up = self.nextFollowUp
        if follow_up.tzinfo is None:
            follow_up = follow_up.replace(tzinfo=UTC)

        return follow_up < datetime.now(UTC)
