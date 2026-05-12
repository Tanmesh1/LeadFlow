from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.discussion import DiscussionCreate, DiscussionResponse
from app.services.lead_service import InvalidLeadIdError, LeadNotFoundError


class DiscussionService:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.leads_collection = database["leads"]
        self.discussions_collection = database["discussions"]

    async def list_discussions(self, lead_id: str) -> list[DiscussionResponse]:
        lead_object_id = await self._get_existing_lead_id(lead_id)
        cursor = self.discussions_collection.find({"leadId": lead_object_id}).sort("createdAt", -1)
        documents = await cursor.to_list(length=None)
        return [self._serialize_discussion(document) for document in documents]

    async def create_discussion(
        self,
        lead_id: str,
        discussion: DiscussionCreate,
    ) -> DiscussionResponse:
        lead_object_id = await self._get_existing_lead_id(lead_id)
        now = datetime.now(UTC)
        document = discussion.model_dump()
        document["leadId"] = lead_object_id
        document["createdAt"] = now
        document["updatedAt"] = now

        result = await self.discussions_collection.insert_one(document)

        lead_updates: dict[str, Any] = {
            "lastDiscussion": discussion.content,
            "lastDiscussionAt": now,
            "updatedAt": now,
        }
        if discussion.followUpAt is not None:
            lead_updates["nextFollowUp"] = discussion.followUpAt

        update_result = await self.leads_collection.update_one(
            {"_id": lead_object_id},
            {"$set": lead_updates},
        )
        if update_result.matched_count == 0:
            raise LeadNotFoundError("Lead not found.")

        document["_id"] = result.inserted_id
        return self._serialize_discussion(document)

    async def _get_existing_lead_id(self, lead_id: str) -> ObjectId:
        if not ObjectId.is_valid(lead_id):
            raise InvalidLeadIdError("Invalid lead id.")

        lead_object_id = ObjectId(lead_id)
        lead = await self.leads_collection.find_one({"_id": lead_object_id}, {"_id": 1})
        if lead is None:
            raise LeadNotFoundError("Lead not found.")

        return lead_object_id

    def _serialize_discussion(self, document: dict[str, Any]) -> DiscussionResponse:
        document["id"] = str(document["_id"])
        document["leadId"] = str(document["leadId"])
        document.pop("_id", None)
        return DiscussionResponse.model_validate(document)
