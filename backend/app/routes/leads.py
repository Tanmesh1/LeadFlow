from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import PyMongoError

from app.database import get_database
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate
from app.services.lead_service import InvalidLeadIdError, LeadNotFoundError, LeadService


router = APIRouter(prefix="/api/leads", tags=["Leads"])


def get_lead_service(database: AsyncIOMotorDatabase = Depends(get_database)) -> LeadService:
    return LeadService(database)


@router.get("", response_model=list[LeadResponse])
async def get_leads(service: LeadService = Depends(get_lead_service)) -> list[LeadResponse]:
    try:
        return await service.list_leads()
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch leads.",
        ) from exc


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    lead: LeadCreate,
    service: LeadService = Depends(get_lead_service),
) -> LeadResponse:
    try:
        return await service.create_lead(lead)
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to create lead.",
        ) from exc


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    lead: LeadUpdate,
    service: LeadService = Depends(get_lead_service),
) -> LeadResponse:
    try:
        return await service.update_lead(lead_id, lead)
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
            detail="Unable to update lead.",
        ) from exc
