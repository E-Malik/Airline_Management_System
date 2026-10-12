from backend.app.models.outbox import OutboxEvent, NotificationLog, AuditLog
from backend.app.events.dispatcher import process_pending_outbox_events


def test_transactional_outbox_and_event_dispatch(client, db_session, seed_test_data):
    flight = seed_test_data["flight"]

    booking_payload = {
        "flight_id": flight.id,
        "cabin_class": "ECONOMY",
        "fare_tier": "FLEX",
        "contact_name": "EDA Test Guest",
        "contact_email": "edatest@example.com",
        "contact_phone": "+1 555 1234",
        "passengers": [
            {
                "first_name": "EDA",
                "last_name": "Guest",
                "passport_number": "EDA8899",
                "nationality": "AE"
            }
        ],
        "ancillaries": [],
        "payment": {
            "card_number": "4242424242424242",
            "card_holder": "EDA Test Guest",
            "expiry": "12/28",
            "cvv": "123"
        }
    }

    resp = client.post("/api/v1/bookings/", json=booking_payload)
    assert resp.status_code == 201

    # Verify OutboxEvent exists in the database
    outbox_events = (
        db_session.query(OutboxEvent)
        .filter(OutboxEvent.event_type == "BookingConfirmed")
        .all()
    )
    assert len(outbox_events) >= 1

    # Dispatch pending outbox events
    processed = process_pending_outbox_events(db_session)
    assert processed >= 0

    # Verify notification log was generated
    notif = (
        db_session.query(NotificationLog)
        .filter(NotificationLog.recipient_email == "edatest@example.com")
        .first()
    )
    assert notif is not None
    assert "Booking Confirmation" in notif.title

    # Verify audit log was recorded
    audit = (
        db_session.query(AuditLog)
        .filter(AuditLog.actor_email == "edatest@example.com")
        .first()
    )
    assert audit is not None
    assert audit.action == "BOOKING_CONFIRMED"
