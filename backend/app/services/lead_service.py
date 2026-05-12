import re
from datetime import UTC, datetime, timedelta
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.schemas.lead import (
    ACTIVE_LEAD_STATUSES,
    CLOSED_LEAD_STATUSES,
    LeadCreate,
    LeadResponse,
    LeadStatus,
    LeadUpdate,
)


class InvalidLeadIdError(ValueError):
    pass


class LeadNotFoundError(LookupError):
    pass


class LeadService:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["leads"]

    async def list_leads(
        self,
        status: LeadStatus | None = None,
        search: str | None = None,
        overdue: bool | None = None,
        today: bool | None = None,
    ) -> list[LeadResponse]:
        now = datetime.now(UTC)
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_of_tomorrow = start_of_today + timedelta(days=1)
        active_statuses = [lead_status.value for lead_status in ACTIVE_LEAD_STATUSES]
        closed_statuses = [lead_status.value for lead_status in CLOSED_LEAD_STATUSES]
        filters: dict[str, Any] = {}
        follow_up_filter: dict[str, datetime] = {}

        if status is not None:
            filters["status"] = status.value
        if search:
            filters["name"] = {"$regex": re.escape(search), "$options": "i"}
        if overdue is True or today is True:
            filters["status"] = filters.get("status", {"$in": active_statuses})
        if overdue is True:
            follow_up_filter["$lt"] = now
        if today is True:
            follow_up_filter["$gte"] = start_of_today
            follow_up_filter["$lt"] = min(follow_up_filter.get("$lt", start_of_tomorrow), start_of_tomorrow)
        if follow_up_filter:
            filters["nextFollowUp"] = follow_up_filter

        pipeline: list[dict[str, Any]] = [
            {"$match": filters},
            {
                "$addFields": {
                    "_sortRank": {
                        "$switch": {
                            "branches": [
                                {
                                    "case": {
                                        "$and": [
                                            {"$in": ["$status", active_statuses]},
                                            {"$ne": ["$nextFollowUp", None]},
                                            {"$lt": ["$nextFollowUp", now]},
                                        ]
                                    },
                                    "then": 0,
                                },
                                {
                                    "case": {
                                        "$and": [
                                            {"$in": ["$status", active_statuses]},
                                            {"$ne": ["$nextFollowUp", None]},
                                            {"$gte": ["$nextFollowUp", start_of_today]},
                                            {"$lt": ["$nextFollowUp", start_of_tomorrow]},
                                        ]
                                    },
                                    "then": 1,
                                },
                                {
                                    "case": {"$in": ["$status", active_statuses]},
                                    "then": 2,
                                },
                                {
                                    "case": {"$in": ["$status", closed_statuses]},
                                    "then": 3,
                                },
                            ],
                            "default": 4,
                        }
                    },
                }
            },
            {
                "$addFields": {
                    "_followUpSortAt": {
                        "$cond": [
                            {"$in": ["$_sortRank", [0, 1]]},
                            "$nextFollowUp",
                            None,
                        ]
                    },
                }
            },
            {"$sort": {"_sortRank": 1, "_followUpSortAt": 1, "updatedAt": -1}},
            {"$project": {"_sortRank": 0, "_followUpSortAt": 0}},
        ]

        cursor = self.collection.aggregate(pipeline)
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
