from datetime import datetime, date, time
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from backend.app.models.airline import Airport, Route, Aircraft, Seat, CabinClassEnum
from backend.app.models.flight import Flight, FlightStatusEnum
from backend.app.models.booking import SeatAllocation
from backend.app.schemas.flight import FlightResponse, RouteResponse, AircraftResponse
from backend.app.schemas.airline import AirportResponse, RouteResponse as RouteSchemaResponse
from backend.app.services.pricing_service import get_fare_tiers_for_flight, get_base_price_for_cabin


def list_airports(db: Session) -> List[AirportResponse]:
    airports = db.query(Airport).order_by(Airport.city.asc()).all()
    return [AirportResponse.model_validate(a) for a in airports]


def search_flights(
    db: Session,
    origin_iata: str,
    destination_iata: str,
    departure_date: date,
    cabin_class: CabinClassEnum = CabinClassEnum.ECONOMY,
    passengers: int = 1
) -> List[FlightResponse]:
    start_dt = datetime.combine(departure_date, time.min)
    end_dt = datetime.combine(departure_date, time.max)

    # Find matching routes
    route = (
        db.query(Route)
        .filter(
            func.upper(Route.origin_iata) == origin_iata.upper(),
            func.upper(Route.destination_iata) == destination_iata.upper()
        )
        .first()
    )

    if not route:
        return []

    # Query flights for this route on this date
    flights = (
        db.query(Flight)
        .filter(Flight.route_id == route.id)
        .filter(Flight.departure_time >= start_dt, Flight.departure_time <= end_dt)
        .filter(Flight.status.in_([FlightStatusEnum.SCHEDULED, FlightStatusEnum.DELAYED, FlightStatusEnum.BOARDING]))
        .order_by(Flight.departure_time.asc())
        .all()
    )

    results = []
    for f in flights:
        aircraft = db.query(Aircraft).filter(Aircraft.id == f.aircraft_id).first()
        duration_mins = int((f.arrival_time - f.departure_time).total_seconds() / 60)

        # Count available seats for the requested cabin
        total_cabin_seats = (
            db.query(func.count(Seat.id))
            .filter(Seat.aircraft_id == f.aircraft_id)
            .filter(Seat.cabin_class == cabin_class)
            .scalar() or 0
        )

        occupied_cabin_seats = (
            db.query(func.count(SeatAllocation.id))
            .join(Seat, SeatAllocation.seat_id == Seat.id)
            .filter(SeatAllocation.flight_id == f.id)
            .filter(SeatAllocation.status == "CONFIRMED")
            .filter(Seat.cabin_class == cabin_class)
            .scalar() or 0
        )

        avail_count = max(0, total_cabin_seats - occupied_cabin_seats)
        if avail_count < passengers:
            continue  # Not enough seats for the requested party

        fare_tiers = get_fare_tiers_for_flight(f, cabin_class)

        route_resp = RouteResponse(
            id=route.id,
            origin_iata=route.origin_iata,
            destination_iata=route.destination_iata,
            distance_km=route.distance_km,
            estimated_duration_minutes=route.estimated_duration_minutes,
            origin_airport=AirportResponse.model_validate(route.origin_airport) if route.origin_airport else None,
            destination_airport=AirportResponse.model_validate(route.destination_airport) if route.destination_airport else None
        )

        aircraft_resp = AircraftResponse.model_validate(aircraft) if aircraft else None

        results.append(
            FlightResponse(
                id=f.id,
                flight_number=f.flight_number,
                route_id=f.route_id,
                aircraft_id=f.aircraft_id,
                departure_time=f.departure_time,
                arrival_time=f.arrival_time,
                duration_minutes=duration_mins,
                status=f.status,
                terminal=f.terminal,
                gate=f.gate,
                delay_minutes=f.delay_minutes,
                route=route_resp,
                aircraft=aircraft_resp,
                price_economy=f.base_price_economy,
                price_premium_economy=f.base_price_premium_economy,
                price_business=f.base_price_business,
                price_first=f.base_price_first,
                fare_tiers=fare_tiers,
                available_seats_count=avail_count
            )
        )

    return results


def get_flight_by_id(
    db: Session,
    flight_id: int,
    cabin_class: CabinClassEnum = CabinClassEnum.ECONOMY
) -> FlightResponse:
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")

    route = db.query(Route).filter(Route.id == flight.route_id).first()
    aircraft = db.query(Aircraft).filter(Aircraft.id == flight.aircraft_id).first()
    duration_mins = int((flight.arrival_time - flight.departure_time).total_seconds() / 60)

    total_cabin_seats = (
        db.query(func.count(Seat.id))
        .filter(Seat.aircraft_id == flight.aircraft_id)
        .filter(Seat.cabin_class == cabin_class)
        .scalar() or 0
    )

    occupied_cabin_seats = (
        db.query(func.count(SeatAllocation.id))
        .join(Seat, SeatAllocation.seat_id == Seat.id)
        .filter(SeatAllocation.flight_id == flight.id)
        .filter(SeatAllocation.status == "CONFIRMED")
        .filter(Seat.cabin_class == cabin_class)
        .scalar() or 0
    )

    avail_count = max(0, total_cabin_seats - occupied_cabin_seats)
    fare_tiers = get_fare_tiers_for_flight(flight, cabin_class)

    route_resp = RouteResponse(
        id=route.id,
        origin_iata=route.origin_iata,
        destination_iata=route.destination_iata,
        distance_km=route.distance_km,
        estimated_duration_minutes=route.estimated_duration_minutes,
        origin_airport=AirportResponse.model_validate(route.origin_airport) if route.origin_airport else None,
        destination_airport=AirportResponse.model_validate(route.destination_airport) if route.destination_airport else None
    )

    return FlightResponse(
        id=flight.id,
        flight_number=flight.flight_number,
        route_id=flight.route_id,
        aircraft_id=flight.aircraft_id,
        departure_time=flight.departure_time,
        arrival_time=flight.arrival_time,
        duration_minutes=duration_mins,
        status=flight.status,
        terminal=flight.terminal,
        gate=flight.gate,
        delay_minutes=flight.delay_minutes,
        route=route_resp,
        aircraft=AircraftResponse.model_validate(aircraft) if aircraft else None,
        price_economy=flight.base_price_economy,
        price_premium_economy=flight.base_price_premium_economy,
        price_business=flight.base_price_business,
        price_first=flight.base_price_first,
        fare_tiers=fare_tiers,
        available_seats_count=avail_count
    )
