import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from backend.app.models.booking import Booking, BookingStatusEnum, Passenger, SeatAllocation
from backend.app.models.flight import Flight, FlightStatusEnum
from backend.app.models.checkin import CheckIn, BoardingPass
from backend.app.schemas.checkin import BoardingPassResponse
from backend.app.core.events import CheckInCompletedEvent
from backend.app.events.dispatcher import record_outbox_event, process_pending_outbox_events


def perform_check_in(
    db: Session,
    booking_reference: str,
    passenger_id: int,
    dangerous_goods_declaration_accepted: bool
) -> BoardingPassResponse:
    if not dangerous_goods_declaration_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Safety declaration regarding hazardous materials must be acknowledged."
        )

    # 1. Fetch booking
    booking = (
        db.query(Booking)
        .filter(Booking.booking_reference == booking_reference.upper())
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking reference not found.")

    if booking.status != BookingStatusEnum.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Check-in unavailable. Booking status is {booking.status}."
        )

    # 2. Fetch passenger
    passenger = (
        db.query(Passenger)
        .filter(Passenger.id == passenger_id, Passenger.booking_id == booking.id)
        .first()
    )
    if not passenger:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Passenger record does not match this booking."
        )

    # Check if passenger has already checked in
    existing_checkin = db.query(CheckIn).filter(CheckIn.passenger_id == passenger.id).first()
    if existing_checkin and existing_checkin.boarding_pass:
        bp = existing_checkin.boarding_pass
        return _format_boarding_pass_response(bp, existing_checkin.flight)

    # 3. Retrieve flight & seat
    alloc = (
        db.query(SeatAllocation)
        .filter(
            SeatAllocation.passenger_id == passenger.id,
            SeatAllocation.booking_id == booking.id,
            SeatAllocation.status == "CONFIRMED"
        )
        .first()
    )
    if not alloc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No confirmed seat assignment found for this passenger."
        )

    flight = db.query(Flight).filter(Flight.id == alloc.flight_id).first()
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found.")

    if flight.status in [FlightStatusEnum.CANCELLED, FlightStatusEnum.DEPARTED, FlightStatusEnum.ARRIVED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Flight is {flight.status}. Online check-in is closed."
        )

    # 4. Generate next sequence number for this flight
    max_seq = (
        db.query(func.max(CheckIn.sequence_number))
        .filter(CheckIn.flight_id == flight.id)
        .scalar()
    ) or 0
    next_seq = max_seq + 1

    # 5. Persist CheckIn
    checkin = CheckIn(
        booking_id=booking.id,
        passenger_id=passenger.id,
        flight_id=flight.id,
        sequence_number=next_seq,
        status="COMPLETED",
        check_in_time=datetime.utcnow()
    )
    db.add(checkin)
    db.flush()

    # 6. Generate simulated boarding pass token and barcode string
    pass_token = f"BP-{flight.flight_number}-{uuid.uuid4().hex[:8].upper()}"
    p_name_formatted = f"{passenger.last_name.upper()}/{passenger.first_name.upper()}"
    barcode_payload = (
        f"M1{p_name_formatted:<20}E{flight.flight_number:<8}{flight.route.origin_iata}"
        f"{flight.route.destination_iata}ALX{flight.departure_time.strftime('%j')}"
        f"{alloc.seat.seat_number:<4}{next_seq:04d}100"
    )

    boarding_time = flight.departure_time - timedelta(minutes=45)

    boarding_pass = BoardingPass(
        check_in_id=checkin.id,
        pass_token=pass_token,
        barcode_data=barcode_payload,
        passenger_name=f"{passenger.first_name} {passenger.last_name}",
        flight_number=flight.flight_number,
        origin_iata=flight.route.origin_iata,
        destination_iata=flight.route.destination_iata,
        terminal=flight.terminal,
        gate=flight.gate,
        boarding_time=boarding_time,
        seat_number=alloc.seat.seat_number,
        cabin_class=alloc.seat.cabin_class.value,
        sequence_number=next_seq,
        is_demo_document=True,
        issued_at=datetime.utcnow()
    )
    db.add(boarding_pass)

    # 7. EDA: Emit CheckInCompletedEvent
    event = CheckInCompletedEvent(
        event_id=str(uuid.uuid4()),
        aggregate_id=str(checkin.id),
        payload={
            "check_in_id": checkin.id,
            "pass_token": pass_token,
            "passenger_id": passenger.id,
            "passenger_name": boarding_pass.passenger_name,
            "flight_number": flight.flight_number,
            "seat_number": alloc.seat.seat_number,
            "booking_reference": booking.booking_reference,
            "contact_email": booking.contact_email,
            "issued_at": boarding_pass.issued_at.isoformat()
        }
    )
    record_outbox_event(db, event)

    db.commit()

    try:
        process_pending_outbox_events(db, limit=10)
    except Exception:
        pass

    return _format_boarding_pass_response(boarding_pass, flight)


def get_boarding_pass_by_token(db: Session, pass_token: str) -> BoardingPassResponse:
    bp = db.query(BoardingPass).filter(BoardingPass.pass_token == pass_token).first()
    if not bp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Boarding pass not found.")
    flight = bp.check_in.flight
    return _format_boarding_pass_response(bp, flight)


def _format_boarding_pass_response(bp: BoardingPass, flight: Flight) -> BoardingPassResponse:
    route = flight.route
    return BoardingPassResponse(
        id=bp.id,
        pass_token=bp.pass_token,
        passenger_name=bp.passenger_name,
        flight_number=bp.flight_number,
        origin_iata=bp.origin_iata,
        origin_city=route.origin_airport.city if route and route.origin_airport else "",
        destination_iata=bp.destination_iata,
        destination_city=route.destination_airport.city if route and route.destination_airport else "",
        terminal=bp.terminal,
        gate=bp.gate,
        boarding_time=bp.boarding_time,
        departure_time=flight.departure_time,
        seat_number=bp.seat_number,
        cabin_class=bp.cabin_class,
        sequence_number=bp.sequence_number,
        barcode_data=bp.barcode_data,
        is_demo_document=bp.is_demo_document,
        issued_at=bp.issued_at
    )
