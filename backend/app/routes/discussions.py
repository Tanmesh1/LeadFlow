from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import PyMongoError

from app.database import get_database
from app.schemas.discussion import DiscussionCreate, DiscussionResponse
from app.services.discussion_service import DiscussionService
from app.services.lead_service import InvalidLeadIdError, LeadNotFoundError


router = APIRouter(prefix="/api/leads/{id}/discussions", tags=["Discussions"])


def get_discussion_service(
    database: AsyncIOMotorDatabase = Depends(get_database),
) -> DiscussionService:
    return DiscussionService(database)


@router.get("", response_model=list[DiscussionResponse])
async def get_discussions(
    id: str,
    service: DiscussionService = Depends(get_discussion_service),
) -> list[DiscussionResponse]:
    try:
        return await service.list_discussions(id)
    except InvalidLeadIdError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid lead id.",
        ) from exc
    except LeadNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found.",
        ) from exc
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch discussions.",
        ) from exc


@router.post("", response_model=DiscussionResponse, status_code=status.HTTP_201_CREATED)
async def create_discussion(
    id: str,
    discussion: DiscussionCreate,
    service: DiscussionService = Depends(get_discussion_service),
) -> DiscussionResponse:
    try:
        return await service.create_discussion(id, discussion)
    except InvalidLeadIdError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid lead id.",
        ) from exc
    except LeadNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found.",
        ) from exc
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to create discussion.",
        ) from exc
