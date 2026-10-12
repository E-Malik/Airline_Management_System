import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.models.outbox import OutboxEvent
from backend.app.core.events import DomainEvent
from backend.app.events.handlers.notification_handler import (
    handle_booking_confirmed_notification,
    handle_flight_status_changed_notification,
    handle_check_in_completed_notification,
    handle_booking_cancelled_notification,
)
from backend.app.events.handlers.audit_handler import record_audit_entry

logger = logging.getLogger(__name__)


def record_outbox_event(db: Session, event: DomainEvent) -> OutboxEvent:
    """
    Transactional Outbox: Persists domain event within the caller's active database transaction.
    This guarantees that the business mutation and event record commit or rollback together atomically.
    """
    outbox_entry = OutboxEvent(
        event_type=event.event_type,
        aggregate_type=event.aggregate_type,
        aggregate_id=str(event.aggregate_id),
        payload_json=event.to_json(),
        status="PENDING",
        created_at=datetime.utcnow()
    )
    db.add(outbox_entry)
    db.flush()
    return outbox_entry


def execute_event_handler(db: Session, event_type: str, aggregate_type: str, aggregate_id: str, payload: dict):
    """
    Routes an event to registered idempotent subscribers.
    """
    if event_type == "BookingConfirmed":
        handle_booking_confirmed_notification(db, payload)
        record_audit_entry(
            db,
            entity_name=aggregate_type,
            entity_id=aggregate_id,
            action="BOOKING_CONFIRMED",
            actor_email=payload.get("contact_email"),
            details={"flight": payload.get("flight_number"), "total": payload.get("total_fare")}
        )
    elif event_type == "FlightStatusChanged":
        handle_flight_status_changed_notification(db, payload)
        record_audit_entry(
            db,
            entity_name=aggregate_type,
            entity_id=aggregate_id,
            action=f"FLIGHT_STATUS_{payload.get('status')}",
            actor_email=payload.get("updated_by_email", "Operations Staff"),
            details=payload
        )
    elif event_type == "CheckInCompleted":
        handle_check_in_completed_notification(db, payload)
        record_audit_entry(
            db,
            entity_name=aggregate_type,
            entity_id=aggregate_id,
            action="CHECK_IN_COMPLETED",
            actor_email=payload.get("contact_email"),
            details={"seat": payload.get("seat_number"), "passenger": payload.get("passenger_name")}
        )
    elif event_type == "BookingCancelled":
        handle_booking_cancelled_notification(db, payload)
        record_audit_entry(
            db,
            entity_name=aggregate_type,
            entity_id=aggregate_id,
            action="BOOKING_CANCELLED",
            actor_email=payload.get("contact_email"),
            details={"refund": payload.get("refund_amount")}
        )
    elif event_type == "AdministrativeChangeRecorded":
        record_audit_entry(
            db,
            entity_name=aggregate_type,
            entity_id=aggregate_id,
            action=payload.get("action", "ADMIN_UPDATE"),
            actor_email=payload.get("actor_email"),
            details=payload
        )
    else:
        logger.warning(f"No handler registered for event type: {event_type}")


def process_pending_outbox_events(db: Session, limit: int = 50) -> int:
    """
    Pulls PENDING events from the outbox, processes them idempotently, and marks them PROCESSED or FAILED.
    """
    events = (
        db.query(OutboxEvent)
        .filter(OutboxEvent.status == "PENDING")
        .order_by(OutboxEvent.id.asc())
        .limit(limit)
        .all()
    )

    processed_count = 0
    for evt in events:
        try:
            payload = json.loads(evt.payload_json)
            execute_event_handler(
                db=db,
                event_type=evt.event_type,
                aggregate_type=evt.aggregate_type,
                aggregate_id=evt.aggregate_id,
                payload=payload
            )
            evt.status = "PROCESSED"
            evt.processed_at = datetime.utcnow()
            processed_count += 1
        except Exception as ex:
            logger.error(f"Error processing outbox event #{evt.id}: {ex}")
            evt.status = "FAILED"
            evt.retry_count += 1
            evt.error_message = str(ex)
        db.commit()

    return processed_count
