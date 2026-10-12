import json
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.models.outbox import NotificationLog
from backend.app.models.booking import Booking, BookingStatusEnum
from backend.app.models.flight import Flight


def handle_booking_confirmed_notification(db: Session, payload: dict):
    contact_email = payload.get("contact_email")
    booking_ref = payload.get("booking_reference")
    flight_number = payload.get("flight_number")
    total_fare = payload.get("total_fare")
    passengers = payload.get("passengers", [])

    names = ", ".join([f"{p.get('first_name')} {p.get('last_name')}" for p in passengers])
    title = f"AeroLux Booking Confirmation: Ref #{booking_ref}"
    message = (
        f"Dear AeroLux Valued Guest,\n\n"
        f"Your booking on flight {flight_number} has been confirmed.\n"
        f"Booking Reference (PNR): {booking_ref}\n"
        f"Passengers: {names}\n"
        f"Total Paid: ${total_fare:.2f} USD\n\n"
        f"Check-in opens 48 hours prior to departure. We look forward to welcoming you aboard.\n"
        f"— AeroLux Airlines Guest Services"
    )

    notif = NotificationLog(
        recipient_email=contact_email,
        notification_type="BOOKING_CONFIRMED",
        title=title,
        message=message,
        status="DELIVERED",
        sent_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()


def handle_flight_status_changed_notification(db: Session, payload: dict):
    flight_id = payload.get("flight_id")
    flight_number = payload.get("flight_number")
    new_status = payload.get("status")
    delay_minutes = payload.get("delay_minutes", 0)

    # Find all passengers with confirmed bookings on this flight
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        return

    # Find distinct emails of bookings for this flight
    bookings = (
        db.query(Booking)
        .join(Booking.seat_allocations)
        .filter(Booking.status == BookingStatusEnum.CONFIRMED)
        .filter(Booking.seat_allocations.any(flight_id=flight_id))
        .all()
    )

    emails_notified = set()
    for b in bookings:
        if b.contact_email not in emails_notified:
            emails_notified.add(b.contact_email)
            delay_text = f" (Delayed by {delay_minutes} minutes)" if delay_minutes > 0 else ""
            title = f"Flight Status Update: {flight_number} is now {new_status}"
            message = (
                f"Dear Passenger,\n\n"
                f"Please be advised that your flight {flight_number} operational status has changed to: {new_status}{delay_text}.\n"
                f"Gate: {flight.gate} | Terminal: {flight.terminal}\n\n"
                f"Please verify your schedule on the AeroLux Flight Status portal.\n"
                f"— AeroLux Flight Operations"
            )
            notif = NotificationLog(
                recipient_email=b.contact_email,
                notification_type="FLIGHT_STATUS_CHANGED",
                title=title,
                message=message,
                status="DELIVERED",
                sent_at=datetime.utcnow()
            )
            db.add(notif)
    db.commit()


def handle_check_in_completed_notification(db: Session, payload: dict):
    passenger_name = payload.get("passenger_name")
    flight_number = payload.get("flight_number")
    seat_number = payload.get("seat_number")
    booking_ref = payload.get("booking_reference")
    contact_email = payload.get("contact_email")

    title = f"Boarding Pass Ready: {flight_number} - Seat {seat_number}"
    message = (
        f"Dear {passenger_name},\n\n"
        f"Your online check-in for flight {flight_number} (PNR {booking_ref}) is complete.\n"
        f"Assigned Seat: {seat_number}\n\n"
        f"Your simulated boarding pass document has been generated and is ready to view or print in your Customer Portal.\n"
        f"— AeroLux Airport Concierge"
    )

    notif = NotificationLog(
        recipient_email=contact_email,
        notification_type="CHECK_IN_COMPLETED",
        title=title,
        message=message,
        status="DELIVERED",
        sent_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()


def handle_booking_cancelled_notification(db: Session, payload: dict):
    contact_email = payload.get("contact_email")
    booking_ref = payload.get("booking_reference")
    refund_amount = payload.get("refund_amount", 0.0)

    title = f"Booking Cancelled: Ref #{booking_ref}"
    message = (
        f"Dear Guest,\n\n"
        f"Your booking with reference #{booking_ref} has been cancelled.\n"
        f"Eligible demo refund amount: ${refund_amount:.2f} USD.\n"
        f"Any allocated seats have been released back to general availability.\n\n"
        f"— AeroLux Guest Services"
    )

    notif = NotificationLog(
        recipient_email=contact_email,
        notification_type="BOOKING_CANCELLED",
        title=title,
        message=message,
        status="DELIVERED",
        sent_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()
