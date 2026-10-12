from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import require_role
from backend.app.models.user import User
from backend.app.models.flight import Flight, FlightStatusEnum
from backend.app.schemas.flight import (
    FlightResponse, FlightStatusUpdateRequest, CreateFlightRequest
)
from backend.app.schemas.admin import (
    FlightManifestResponse, AuditLogResponse, NotificationLogResponse
)
from backend.app.services.admin_service import (
    update_flight_status, create_flight, get_flight_manifest,
    get_audit_logs, get_notification_logs
)
from backend.app.services.flight_service import get_flight_by_id

router = APIRouter(prefix="/admin", tags=["Administrator & Operations"])


@router.get("/flights", response_model=List[FlightResponse])
def get_all_flights_admin(
    status_filter: Optional[FlightStatusEnum] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_role(["STAFF", "ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(Flight).order_by(Flight.departure_time.asc())
    if status_filter:
        query = query.filter(Flight.status == status_filter)
    flights = query.offset(offset).limit(limit).all()
    return [get_flight_by_id(db, f.id) for f in flights]


@router.post("/flights", response_model=FlightResponse, status_code=status.HTTP_201_CREATED)
def admin_create_flight(
    req: CreateFlightRequest,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    flight = create_flight(db, req, current_user)
    return get_flight_by_id(db, flight.id)


@router.patch("/flights/{flight_id}/status", response_model=FlightResponse)
def admin_update_flight_status(
    flight_id: int,
    req: FlightStatusUpdateRequest,
    current_user: User = Depends(require_role(["STAFF", "ADMIN"])),
    db: Session = Depends(get_db)
):
    flight = update_flight_status(db, flight_id, req, current_user)
    return get_flight_by_id(db, flight.id)


@router.get("/flights/{flight_id}/manifest", response_model=FlightManifestResponse)
def get_manifest(
    flight_id: int,
    current_user: User = Depends(require_role(["STAFF", "ADMIN"])),
    db: Session = Depends(get_db)
):
    return get_flight_manifest(db, flight_id)


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_system_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    return get_audit_logs(db, limit, offset)


@router.get("/notifications", response_model=List[NotificationLogResponse])
def get_system_notifications(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_role(["STAFF", "ADMIN"])),
    db: Session = Depends(get_db)
):
    return get_notification_logs(db, limit, offset)
