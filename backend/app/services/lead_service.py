from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate


class InvalidLeadIdError(ValueError):
    pass


class LeadNotFoundError(LookupError):
    pass


class LeadService:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["leads"]

    async def list_leads(self) -> list[LeadResponse]:
        cursor = self.collection.find().sort("createdAt", -1)
        documents = await cursor.to_list(length=None)
        return [self._serialize_lead(document) for document in documents]

    async def create_lead(self, lead: LeadCreate) -> LeadResponse:
        now = datetime.now(UTC)
        document = lead.model_dump()
        document["createdAt"] = now
        document["updatedAt"] = now

        result = await self.collection.insert_one(document)
        created = await self.collection.find_one({"_id": result.inserted_id})
        if created is None:
            raise LeadNotFoundError("Lead was not found after creation.")

        return self._serialize_lead(created)

    async def update_lead(self, lead_id: str, lead: LeadUpdate) -> LeadResponse:
        object_id = self._validate_object_id(lead_id)
        updates = lead.model_dump(exclude_unset=True)
        updates["updatedAt"] = datetime.now(UTC)

        updated = await self.collection.find_one_and_update(
            {"_id": object_id},
            {"$set": updates},
            return_document=ReturnDocument.AFTER,
        )
        if updated is None:
            raise LeadNotFoundError("Lead not found.")

        return self._serialize_lead(updated)

    def _validate_object_id(self, lead_id: str) -> ObjectId:
        if not ObjectId.is_valid(lead_id):
            raise InvalidLeadIdError("Invalid lead id.")
        return ObjectId(lead_id)

    def _serialize_lead(self, document: dict[str, Any]) -> LeadResponse:
        document["id"] = str(document["_id"])
        document.pop("_id", None)
        return LeadResponse.model_validate(document)
