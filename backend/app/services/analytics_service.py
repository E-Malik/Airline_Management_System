from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.booking import Booking, BookingStatusEnum, Passenger, SeatAllocation
from backend.app.models.flight import Flight, FlightStatusEnum
from backend.app.models.airline import Route, Aircraft, Seat, CabinClassEnum
from backend.app.schemas.analytics import (
    AnalyticsOverviewResponse, RoutePopularityItem,
    CabinRevenueItem, DailyRevenueItem
)


def get_analytics_overview(db: Session) -> AnalyticsOverviewResponse:
    # 1. Total revenue from confirmed bookings
    total_rev = (
        db.query(func.sum(Booking.total_fare))
        .filter(Booking.status == BookingStatusEnum.CONFIRMED)
        .scalar()
    ) or 0.0

    # 2. Total confirmed bookings
    total_bookings = (
        db.query(func.count(Booking.id))
        .filter(Booking.status == BookingStatusEnum.CONFIRMED)
        .scalar()
    ) or 0

    # 3. Total passengers
    total_passengers = (
        db.query(func.count(Passenger.id))
        .join(Booking, Passenger.booking_id == Booking.id)
        .filter(Booking.status == BookingStatusEnum.CONFIRMED)
        .scalar()
    ) or 0

    # 4. Fleet Load Factor
    total_aircraft_capacity = (
        db.query(func.sum(Aircraft.total_seats))
        .join(Flight, Flight.aircraft_id == Aircraft.id)
        .scalar()
    ) or 1

    total_seats_occupied = (
        db.query(func.count(SeatAllocation.id))
        .filter(SeatAllocation.status == "CONFIRMED")
        .scalar()
    ) or 0

    load_factor = round((total_seats_occupied / max(total_aircraft_capacity, 1)) * 100, 1)

    # 5. Active flights
    active_flights = (
        db.query(func.count(Flight.id))
        .filter(Flight.status.in_([FlightStatusEnum.SCHEDULED, FlightStatusEnum.BOARDING, FlightStatusEnum.DELAYED]))
        .scalar()
    ) or 0

    # 6. Top Routes
    top_routes_query = (
        db.query(
            Route.origin_iata,
            Route.destination_iata,
            func.count(SeatAllocation.id).label("passenger_count"),
            func.sum(Booking.total_fare).label("route_revenue")
        )
        .join(Flight, Flight.route_id == Route.id)
        .join(SeatAllocation, SeatAllocation.flight_id == Flight.id)
        .join(Booking, SeatAllocation.booking_id == Booking.id)
        .filter(Booking.status == BookingStatusEnum.CONFIRMED)
        .filter(SeatAllocation.status == "CONFIRMED")
        .group_by(Route.origin_iata, Route.destination_iata)
        .order_by(func.count(SeatAllocation.id).desc())
        .limit(5)
        .all()
    )

    top_routes: List[RoutePopularityItem] = []
    for r in top_routes_query:
        top_routes.append(
            RoutePopularityItem(
                route=f"{r.origin_iata} -> {r.destination_iata}",
                origin_iata=r.origin_iata,
                destination_iata=r.destination_iata,
                passengers_count=r.passenger_count,
                revenue=float(r.route_revenue or 0.0)
            )
        )

    # 7. Revenue by Cabin Class
    cabin_query = (
        db.query(
            Seat.cabin_class,
            func.count(SeatAllocation.id).label("seat_count")
        )
        .join(SeatAllocation, SeatAllocation.seat_id == Seat.id)
        .filter(SeatAllocation.status == "CONFIRMED")
        .group_by(Seat.cabin_class)
        .all()
    )

    cabin_items: List[CabinRevenueItem] = []
    total_cabin_passengers = sum(c.seat_count for c in cabin_query) or 1
    for c in cabin_query:
        c_name = c.cabin_class.value
        # Estimate weighted revenue share based on class multipliers
        mult = 1.0
        if c_name == "PREMIUM_ECONOMY":
            mult = 1.6
        elif c_name == "BUSINESS":
            mult = 3.2
        elif c_name == "FIRST":
            mult = 6.5
        approx_rev = round(total_rev * (c.seat_count * mult / (total_cabin_passengers * 1.5 or 1)), 2)
        cabin_items.append(
            CabinRevenueItem(
                cabin_class=c_name,
                passengers_count=c.seat_count,
                revenue=approx_rev,
                percentage=round((c.seat_count / total_cabin_passengers) * 100, 1)
            )
        )

    # 8. Daily trend for the past 7 days
    recent_trend: List[DailyRevenueItem] = []
    today = datetime.utcnow().date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        
        day_rev = (
            db.query(func.sum(Booking.total_fare))
            .filter(
                Booking.status == BookingStatusEnum.CONFIRMED,
                Booking.created_at >= day_start,
                Booking.created_at <= day_end
            )
            .scalar()
        ) or 0.0

        day_count = (
            db.query(func.count(Booking.id))
            .filter(
                Booking.status == BookingStatusEnum.CONFIRMED,
                Booking.created_at >= day_start,
                Booking.created_at <= day_end
            )
            .scalar()
        ) or 0

        recent_trend.append(
            DailyRevenueItem(
                date=day.strftime("%b %d"),
                revenue=float(day_rev),
                bookings_count=day_count
            )
        )

    return AnalyticsOverviewResponse(
        total_revenue=float(total_rev),
        total_bookings=total_bookings,
        total_passengers=total_passengers,
        fleet_load_factor=load_factor,
        active_flights_count=active_flights,
        top_routes=top_routes,
        revenue_by_cabin=cabin_items,
        recent_trend=recent_trend
    )
