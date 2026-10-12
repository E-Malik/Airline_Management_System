import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from backend.app.models.user import User
from backend.app.models.flight import Flight, FlightStatusEnum
from backend.app.models.airline import Route, Aircraft, Seat
from backend.app.models.booking import Booking, BookingStatusEnum, Passenger, SeatAllocation
from backend.app.models.checkin import CheckIn
from backend.app.models.outbox import AuditLog, NotificationLog
from backend.app.schemas.flight import FlightStatusUpdateRequest, CreateFlightRequest
from backend.app.schemas.admin import (
    FlightManifestResponse, PassengerManifestItem,
    AuditLogResponse, NotificationLogResponse
)
from backend.app.core.events import FlightStatusChangedEvent, AdministrativeChangeRecordedEvent
from backend.app.events.dispatcher import record_outbox_event, process_pending_outbox_events


def update_flight_status(
    db: Session,
    flight_id: int,
    req: FlightStatusUpdateRequest,
    actor_user: User
) -> Flight:
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found.")

    old_status = flight.status
    flight.status = req.status
    if req.delay_minutes is not None:
        flight.delay_minutes = req.delay_minutes
    if req.terminal:
        flight.terminal = req.terminal
    if req.gate:
        flight.gate = req.gate
    flight.updated_at = datetime.utcnow()

    # EDA: Emit FlightStatusChangedEvent
    event = FlightStatusChangedEvent(
        event_id=str(uuid.uuid4()),
        aggregate_id=str(flight.id),
        payload={
            "flight_id": flight.id,
            "flight_number": flight.flight_number,
            "old_status": old_status.value,
            "status": req.status.value,
            "delay_minutes": flight.delay_minutes,
            "gate": flight.gate,
            "terminal": flight.terminal,
            "updated_by_email": actor_user.email,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    record_outbox_event(db, event)

    db.commit()
    db.refresh(flight)

    try:
        process_pending_outbox_events(db, limit=20)
    except Exception:
        pass

    return flight


def create_flight(db: Session, req: CreateFlightRequest, actor_user: User) -> Flight:
    # Verify route and aircraft exist
    route = db.query(Route).filter(Route.id == req.route_id).first()
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found.")

    aircraft = db.query(Aircraft).filter(Aircraft.id == req.aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft not found.")

    flight = Flight(
        flight_number=req.flight_number.upper(),
        route_id=req.route_id,
        aircraft_id=req.aircraft_id,
        departure_time=req.departure_time,
        arrival_time=req.arrival_time,
        status=FlightStatusEnum.SCHEDULED,
        terminal=req.terminal,
        gate=req.gate,
        delay_minutes=0,
        base_price_economy=req.base_price_economy,
        base_price_premium_economy=req.base_price_premium_economy,
        base_price_business=req.base_price_business,
        base_price_first=req.base_price_first,
        created_at=datetime.utcnow()
    )
    db.add(flight)
    db.flush()

    # Record administrative change
    event = AdministrativeChangeRecordedEvent(
        event_id=str(uuid.uuid4()),
        aggregate_id=str(flight.id),
        payload={
            "action": "FLIGHT_CREATED",
            "flight_number": flight.flight_number,
            "actor_email": actor_user.email,
            "departure": flight.departure_time.isoformat()
        }
    )
    record_outbox_event(db, event)

    db.commit()
    db.refresh(flight)
    return flight


def get_flight_manifest(db: Session, flight_id: int) -> FlightManifestResponse:
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found.")

    # Find all confirmed seat allocations for this flight
    allocations = (
        db.query(SeatAllocation)
        .filter(SeatAllocation.flight_id == flight_id, SeatAllocation.status == "CONFIRMED")
        .all()
    )

    manifest_items = []
    checked_in_count = 0

    for alloc in allocations:
        p = alloc.passenger
        b = alloc.booking
        seat = alloc.seat

        checkin = db.query(CheckIn).filter(CheckIn.passenger_id == p.id, CheckIn.flight_id == flight.id).first()
        is_checked_in = checkin is not None
        if is_checked_in:
            checked_in_count += 1

        manifest_items.append(
            PassengerManifestItem(
                passenger_id=p.id,
                passenger_name=f"{p.last_name}, {p.first_name}",
                passport_number=p.passport_number,
                nationality=p.nationality,
                seat_number=seat.seat_number if seat else "Unassigned",
                cabin_class=seat.cabin_class.value if seat else "ECONOMY",
                booking_reference=b.booking_reference,
                has_checked_in=is_checked_in,
                meal_preference=p.meal_preference,
                special_requests=p.special_requests
            )
        )

    # Sort manifest by seat number
    manifest_items.sort(key=lambda x: x.seat_number)

    return FlightManifestResponse(
        flight_id=flight.id,
        flight_number=flight.flight_number,
        origin_iata=flight.route.origin_iata,
        destination_iata=flight.route.destination_iata,
        departure_time=flight.departure_time,
        status=flight.status,
        total_passengers=len(manifest_items),
        checked_in_count=checked_in_count,
        passengers=manifest_items
    )


def get_audit_logs(db: Session, limit: int = 50, offset: int = 0) -> List[AuditLogResponse]:
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [AuditLogResponse.model_validate(l) for l in logs]


def get_notification_logs(db: Session, limit: int = 50, offset: int = 0) -> List[NotificationLogResponse]:
    logs = (
        db.query(NotificationLog)
        .order_by(NotificationLog.sent_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [NotificationLogResponse.model_validate(l) for l in logs]
