import random
import string
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from backend.app.models.user import User
from backend.app.models.flight import Flight, FlightStatusEnum
from backend.app.models.airline import Aircraft, Seat, CabinClassEnum
from backend.app.models.booking import (
    Booking, BookingStatusEnum, Passenger, SeatAllocation,
    AncillaryBooking, Payment, AncillaryTypeEnum
)
from backend.app.models.checkin import CheckIn
from backend.app.schemas.booking import (
    CreateBookingRequest, BookingResponse, BookingFlightSummary,
    PassengerResponse, CancelBookingResponse
)
from backend.app.services.pricing_service import calculate_booking_totals
from backend.app.core.events import BookingConfirmedEvent, BookingCancelledEvent
from backend.app.events.dispatcher import record_outbox_event, process_pending_outbox_events


def generate_pnr(db: Session) -> str:
    """Generates a unique 6-character alphanumeric Booking Reference (e.g. ALX7K2)"""
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    for _ in range(20):
        code = "AL" + "".join(random.choices(chars, k=4))
        existing = db.query(Booking).filter(Booking.booking_reference == code).first()
        if not existing:
            return code
    return "AL" + uuid.uuid4().hex[:4].upper()


def create_booking(
    db: Session,
    req: CreateBookingRequest,
    current_user: Optional[User] = None
) -> BookingResponse:
    # 1. Fetch and validate flight
    flight = db.query(Flight).filter(Flight.id == req.flight_id).first()
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested flight does not exist."
        )
    if flight.status in [FlightStatusEnum.CANCELLED, FlightStatusEnum.DEPARTED, FlightStatusEnum.ARRIVED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Flight is {flight.status}. Bookings are closed."
        )

    # 2. Concurrency-Safe Seat Resolution & Lock
    # Collect requested seat IDs
    requested_seat_ids = [p.seat_id for p in req.passengers if p.seat_id is not None]
    
    # Check for duplicate seat selections in the same request
    if len(requested_seat_ids) != len(set(requested_seat_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate seat selections found within the passenger list."
        )

    selected_seats: List[Seat] = []
    
    # If seats were explicitly selected, verify and lock them
    if requested_seat_ids:
        # Check if engine is postgresql to apply row-level locking
        query = (
            db.query(SeatAllocation)
            .filter(
                SeatAllocation.flight_id == flight.id,
                SeatAllocation.seat_id.in_(requested_seat_ids),
                SeatAllocation.status == "CONFIRMED"
            )
        )
        if db.bind.dialect.name == "postgresql":
            query = query.with_for_update()

        already_taken = query.all()
        if already_taken:
            taken_seat = db.query(Seat).filter(Seat.id == already_taken[0].seat_id).first()
            seat_label = taken_seat.seat_number if taken_seat else "selected seat"
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Seat {seat_label} is already reserved by another passenger. Please select another seat."
            )

        # Retrieve Seat entities
        for s_id in requested_seat_ids:
            seat = db.query(Seat).filter(Seat.id == s_id).first()
            if not seat or seat.aircraft_id != flight.aircraft_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Seat ID {s_id} is invalid for this aircraft."
                )
            selected_seats.append(seat)

    # If some passengers did not specify a seat, auto-assign available unallocated seats in requested cabin
    allocated_seat_ids_set = set(requested_seat_ids)
    for p in req.passengers:
        if p.seat_id is None:
            # Query all confirmed allocations for flight
            confirmed_seat_ids = {
                alloc[0] for alloc in
                db.query(SeatAllocation.seat_id)
                .filter(SeatAllocation.flight_id == flight.id, SeatAllocation.status == "CONFIRMED")
                .all()
            }
            # Find first available seat in requested cabin
            candidate = (
                db.query(Seat)
                .filter(
                    Seat.aircraft_id == flight.aircraft_id,
                    Seat.cabin_class == req.cabin_class,
                    ~Seat.id.in_(confirmed_seat_ids.union(allocated_seat_ids_set))
                )
                .order_by(Seat.row_num.asc(), Seat.col_letter.asc())
                .first()
            )
            if not candidate:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"No available seats remaining in {req.cabin_class.value} cabin."
                )
            p.seat_id = candidate.id
            allocated_seat_ids_set.add(candidate.id)
            selected_seats.append(candidate)

    # 3. Server-Authoritative Price Calculation
    ancillaries_count = {}
    for a in req.ancillaries:
        ancillaries_count[a.service_type] = ancillaries_count.get(a.service_type, 0) + 1

    pricing = calculate_booking_totals(
        flight=flight,
        cabin_class=req.cabin_class,
        fare_tier_name=req.fare_tier,
        passenger_count=len(req.passengers),
        selected_seats=selected_seats,
        ancillaries_count=ancillaries_count
    )

    # 4. Generate PNR Reference
    pnr = generate_pnr(db)

    # 5. Persist Booking entity
    user_id = current_user.id if current_user else None
    booking = Booking(
        booking_reference=pnr,
        user_id=user_id,
        contact_name=req.contact_name,
        contact_email=req.contact_email.lower(),
        contact_phone=req.contact_phone,
        fare_tier=req.fare_tier.upper(),
        status=BookingStatusEnum.CONFIRMED,
        total_fare=pricing["grand_total"],
        tax_amount=pricing["taxes_and_fees"],
        ancillaries_amount=pricing["ancillaries_total"],
        currency=pricing["currency"],
        created_at=datetime.utcnow()
    )
    db.add(booking)
    db.flush()

    # 6. Persist Passengers and Seat Allocations
    passenger_responses = []
    passengers_event_payload = []
    
    seat_lookup = {s.id: s for s in selected_seats}

    for p_input in req.passengers:
        p_entity = Passenger(
            booking_id=booking.id,
            first_name=p_input.first_name.strip(),
            last_name=p_input.last_name.strip(),
            date_of_birth=p_input.date_of_birth,
            gender=p_input.gender,
            passport_number=p_input.passport_number.strip().upper(),
            nationality=p_input.nationality.strip().upper(),
            meal_preference=p_input.meal_preference or "Standard",
            special_requests=p_input.special_requests
        )
        db.add(p_entity)
        db.flush()

        # Seat allocation
        seat_obj = seat_lookup.get(p_input.seat_id)
        allocation = SeatAllocation(
            flight_id=flight.id,
            seat_id=p_input.seat_id,
            passenger_id=p_entity.id,
            booking_id=booking.id,
            allocated_at=datetime.utcnow(),
            status="CONFIRMED"
        )
        db.add(allocation)

        passenger_responses.append(
            PassengerResponse(
                id=p_entity.id,
                first_name=p_entity.first_name,
                last_name=p_entity.last_name,
                passport_number=p_entity.passport_number,
                nationality=p_entity.nationality,
                meal_preference=p_entity.meal_preference,
                seat_number=seat_obj.seat_number if seat_obj else "TBD",
                seat_id=p_input.seat_id,
                has_checked_in=False
            )
        )
        passengers_event_payload.append({
            "first_name": p_entity.first_name,
            "last_name": p_entity.last_name,
            "seat_number": seat_obj.seat_number if seat_obj else "TBD"
        })

    # 7. Persist Ancillaries
    for a_input in req.ancillaries:
        ancillary_entity = AncillaryBooking(
            booking_id=booking.id,
            service_type=a_input.service_type,
            price=50.0,  # Authoritative lookup
            description=a_input.description
        )
        db.add(ancillary_entity)

    # 8. Simulated Payment Processing
    payment = Payment(
        booking_id=booking.id,
        amount=pricing["grand_total"],
        currency=pricing["currency"],
        status="SUCCESS",
        payment_method="SIMULATED_CREDIT_CARD",
        transaction_reference=f"TXN-ALX-{uuid.uuid4().hex[:10].upper()}",
        card_last_four=req.payment.card_number[-4:],
        created_at=datetime.utcnow()
    )
    db.add(payment)

    # 9. EDA: Emits BookingConfirmed Domain Event into Outbox within the SAME transaction
    event = BookingConfirmedEvent(
        event_id=str(uuid.uuid4()),
        aggregate_id=str(booking.id),
        payload={
            "booking_id": booking.id,
            "booking_reference": booking.booking_reference,
            "contact_email": booking.contact_email,
            "contact_name": booking.contact_name,
            "flight_id": flight.id,
            "flight_number": flight.flight_number,
            "total_fare": booking.total_fare,
            "passengers": passengers_event_payload,
            "created_at": booking.created_at.isoformat()
        }
    )
    record_outbox_event(db, event)

    # Commit entire atomic transaction
    db.commit()
    db.refresh(booking)

    # 10. Process Outbox asynchronously / immediately
    try:
        process_pending_outbox_events(db, limit=10)
    except Exception:
        pass  # In production, handled by durable worker

    # 11. Build full response
    route = flight.route
    aircraft = flight.aircraft

    flight_summary = BookingFlightSummary(
        id=flight.id,
        flight_number=flight.flight_number,
        departure_time=flight.departure_time,
        arrival_time=flight.arrival_time,
        origin_iata=route.origin_iata,
        origin_city=route.origin_airport.city if route.origin_airport else "",
        origin_airport=route.origin_airport.name if route.origin_airport else "",
        destination_iata=route.destination_iata,
        destination_city=route.destination_airport.city if route.destination_airport else "",
        destination_airport=route.destination_airport.name if route.destination_airport else "",
        status=flight.status,
        terminal=flight.terminal,
        gate=flight.gate,
        delay_minutes=flight.delay_minutes,
        aircraft_model=aircraft.model if aircraft else "Boeing 777"
    )

    return BookingResponse(
        id=booking.id,
        booking_reference=booking.booking_reference,
        contact_name=booking.contact_name,
        contact_email=booking.contact_email,
        contact_phone=booking.contact_phone,
        fare_tier=booking.fare_tier,
        status=booking.status,
        total_fare=booking.total_fare,
        tax_amount=booking.tax_amount,
        ancillaries_amount=booking.ancillaries_amount,
        currency=booking.currency,
        created_at=booking.created_at,
        flight=flight_summary,
        passengers=passenger_responses
    )


def lookup_booking(db: Session, booking_reference: str, last_name: str) -> BookingResponse:
    booking = (
        db.query(Booking)
        .filter(Booking.booking_reference == booking_reference.upper())
        .first()
    )
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No booking found with this reference."
        )

    # Verify surname matches at least one passenger or contact name
    matching_passenger = any(
        p.last_name.lower() == last_name.lower()
        for p in booking.passengers
    )
    contact_match = last_name.lower() in booking.contact_name.lower()

    if not (matching_passenger or contact_match):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Passenger surname does not match this booking reference."
        )

    # Get flight
    first_alloc = db.query(SeatAllocation).filter(SeatAllocation.booking_id == booking.id).first()
    flight = db.query(Flight).filter(Flight.id == first_alloc.flight_id).first() if first_alloc else None
    
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated flight not found")

    passenger_responses = []
    for p in booking.passengers:
        alloc = db.query(SeatAllocation).filter(SeatAllocation.passenger_id == p.id, SeatAllocation.status == "CONFIRMED").first()
        seat_num = alloc.seat.seat_number if alloc and alloc.seat else "Unassigned"
        seat_id = alloc.seat_id if alloc else None
        
        has_checked_in = db.query(CheckIn).filter(CheckIn.passenger_id == p.id).first() is not None

        passenger_responses.append(
            PassengerResponse(
                id=p.id,
                first_name=p.first_name,
                last_name=p.last_name,
                passport_number=p.passport_number,
                nationality=p.nationality,
                meal_preference=p.meal_preference,
                seat_number=seat_num,
                seat_id=seat_id,
                has_checked_in=has_checked_in
            )
        )

    route = flight.route
    aircraft = flight.aircraft

    flight_summary = BookingFlightSummary(
        id=flight.id,
        flight_number=flight.flight_number,
        departure_time=flight.departure_time,
        arrival_time=flight.arrival_time,
        origin_iata=route.origin_iata,
        origin_city=route.origin_airport.city if route.origin_airport else "",
        origin_airport=route.origin_airport.name if route.origin_airport else "",
        destination_iata=route.destination_iata,
        destination_city=route.destination_airport.city if route.destination_airport else "",
        destination_airport=route.destination_airport.name if route.destination_airport else "",
        status=flight.status,
        terminal=flight.terminal,
        gate=flight.gate,
        delay_minutes=flight.delay_minutes,
        aircraft_model=aircraft.model if aircraft else "Boeing 777"
    )

    return BookingResponse(
        id=booking.id,
        booking_reference=booking.booking_reference,
        contact_name=booking.contact_name,
        contact_email=booking.contact_email,
        contact_phone=booking.contact_phone,
        fare_tier=booking.fare_tier,
        status=booking.status,
        total_fare=booking.total_fare,
        tax_amount=booking.tax_amount,
        ancillaries_amount=booking.ancillaries_amount,
        currency=booking.currency,
        created_at=booking.created_at,
        flight=flight_summary,
        passengers=passenger_responses
    )


def cancel_booking(db: Session, booking_reference: str, current_user: Optional[User] = None) -> CancelBookingResponse:
    booking = db.query(Booking).filter(Booking.booking_reference == booking_reference.upper()).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if booking.status == BookingStatusEnum.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking is already cancelled.")

    # Calculate demo refund based on fare tier rules
    refund_percentage = 0.0
    if booking.fare_tier == "FLEX_PLUS":
        refund_percentage = 1.0  # 100% refund
    elif booking.fare_tier == "FLEX":
        refund_percentage = 0.85  # 85% refund (15% administration fee)
    else:  # SAVER
        refund_percentage = 0.0  # Non-refundable

    refund_amount = round(booking.total_fare * refund_percentage, 2)

    # 1. Update booking status
    booking.status = BookingStatusEnum.CANCELLED
    booking.cancelled_at = datetime.utcnow()

    # 2. Release allocated seats
    db.query(SeatAllocation).filter(SeatAllocation.booking_id == booking.id).update(
        {"status": "RELEASED"}, synchronize_session=False
    )

    # 3. Update payment status if exists
    for p in booking.payments:
        p.status = "REFUNDED"

    # 4. EDA: Record BookingCancelledEvent
    event = BookingCancelledEvent(
        event_id=str(uuid.uuid4()),
        aggregate_id=str(booking.id),
        payload={
            "booking_id": booking.id,
            "booking_reference": booking.booking_reference,
            "contact_email": booking.contact_email,
            "refund_amount": refund_amount,
            "cancelled_at": booking.cancelled_at.isoformat()
        }
    )
    record_outbox_event(db, event)

    db.commit()

    try:
        process_pending_outbox_events(db, limit=10)
    except Exception:
        pass

    return CancelBookingResponse(
        booking_reference=booking.booking_reference,
        status=BookingStatusEnum.CANCELLED,
        refund_amount=refund_amount,
        message=f"Booking {booking.booking_reference} successfully cancelled. Demo refund of ${refund_amount:.2f} processed."
    )


def get_user_bookings(db: Session, user_id: int) -> List[BookingResponse]:
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    results = []
    for b in bookings:
        try:
            resp = lookup_booking(db, b.booking_reference, b.contact_name)
            results.append(resp)
        except Exception:
            continue
    return results
