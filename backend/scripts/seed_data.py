import os
import sys
from datetime import datetime, timedelta

# Ensure python path finds backend package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.core.database import SessionLocal, Base, engine
from backend.app.core.security import get_password_hash
from backend.app.models.user import User, RoleEnum
from backend.app.models.airline import Airport, Route, Aircraft, Seat, CabinClassEnum
from backend.app.models.flight import Flight, FlightStatusEnum
from backend.app.models.booking import (
    Booking, BookingStatusEnum, Passenger, SeatAllocation,
    Payment, AncillaryBooking, AncillaryTypeEnum
)
from backend.app.models.checkin import CheckIn, BoardingPass
from backend.app.models.outbox import AuditLog, NotificationLog


def seed():
    print("[*] Creating database schema tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Users
        print("[*] Seeding demo users...")
        users_to_create = [
            ("admin@aerolux.com", "Admin@123456", "Lord Sterling (Chief Administrator)", RoleEnum.ADMIN, "+971 4 000 1111"),
            ("staff@aerolux.com", "Staff@123456", "Marcus Vance (Operations Controller)", RoleEnum.STAFF, "+971 4 000 2222"),
            ("customer@aerolux.com", "Customer@123456", "Lady Catherine Grey", RoleEnum.CUSTOMER, "+44 20 7946 0912"),
        ]

        user_map = {}
        for email, pwd, name, role, phone in users_to_create:
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                u = User(
                    email=email,
                    hashed_password=get_password_hash(pwd),
                    full_name=name,
                    role=role,
                    phone=phone,
                    is_active=True
                )
                db.add(u)
                db.flush()
                user_map[email] = u
            else:
                user_map[email] = existing

        # 2. Seed Airports
        print("[*] Seeding international airports...")
        airports_data = [
            ("DXB", "OMDB", "Dubai International Airport", "Dubai", "United Arab Emirates", "Asia/Dubai", 25.2532, 55.3657),
            ("LHR", "EGLL", "Heathrow Airport", "London", "United Kingdom", "Europe/London", 51.4700, -0.4543),
            ("JFK", "KJFK", "John F. Kennedy International Airport", "New York", "United States", "America/New_York", 40.6413, -73.7781),
            ("SIN", "WSSS", "Singapore Changi Airport", "Singapore", "Singapore", "Asia/Singapore", 1.3644, 103.9915),
            ("HND", "RJTT", "Tokyo Haneda Airport", "Tokyo", "Japan", "Asia/Tokyo", 35.5494, 139.7798),
            ("CDG", "LFPG", "Charles de Gaulle Airport", "Paris", "France", "Europe/Paris", 49.0097, 2.5479),
            ("FRA", "EDDF", "Frankfurt Airport", "Frankfurt", "Germany", "Europe/Berlin", 50.0379, 8.5622),
            ("SYD", "YSSY", "Sydney Kingsford Smith Airport", "Sydney", "Australia", "Australia/Sydney", -33.9399, 151.1753),
            ("BOM", "VABB", "Chhatrapati Shivaji Maharaj International", "Mumbai", "India", "Asia/Kolkata", 19.0896, 72.8656),
            ("LAX", "KLAX", "Los Angeles International Airport", "Los Angeles", "United States", "America/Los_Angeles", 33.9416, -118.4085),
            ("ZRH", "LSZH", "Zurich Airport", "Zurich", "Switzerland", "Europe/Zurich", 47.4582, 8.5555),
            ("DOH", "OTHH", "Hamad International Airport", "Doha", "Qatar", "Asia/Qatar", 25.2731, 51.6081),
        ]

        for iata, icao, name, city, country, tz, lat, lon in airports_data:
            existing = db.query(Airport).filter(Airport.iata_code == iata).first()
            if not existing:
                a = Airport(
                    iata_code=iata,
                    icao_code=icao,
                    name=name,
                    city=city,
                    country=country,
                    timezone=tz,
                    latitude=lat,
                    longitude=lon
                )
                db.add(a)

        db.flush()

        # 3. Seed Routes
        print("[*] Seeding global airline routes...")
        routes_data = [
            ("DXB", "LHR", 5500, 450),
            ("LHR", "DXB", 5500, 430),
            ("DXB", "JFK", 11000, 840),
            ("JFK", "DXB", 11000, 780),
            ("DXB", "SIN", 5850, 455),
            ("SIN", "DXB", 5850, 460),
            ("DXB", "HND", 7950, 580),
            ("HND", "DXB", 7950, 640),
            ("DXB", "CDG", 5250, 420),
            ("CDG", "DXB", 5250, 400),
            ("DXB", "SYD", 12050, 850),
            ("SYD", "DXB", 12050, 890),
            ("DXB", "BOM", 1930, 195),
            ("BOM", "DXB", 1930, 205),
            ("DXB", "LAX", 13400, 960),
            ("LAX", "DXB", 13400, 920),
            ("DXB", "ZRH", 4750, 380),
            ("ZRH", "DXB", 4750, 360),
            ("LHR", "JFK", 5550, 480),
            ("JFK", "LHR", 5550, 420),
        ]

        route_map = {}
        for orig, dest, dist, dur in routes_data:
            existing = (
                db.query(Route)
                .filter(Route.origin_iata == orig, Route.destination_iata == dest)
                .first()
            )
            if not existing:
                r = Route(
                    origin_iata=orig,
                    destination_iata=dest,
                    distance_km=dist,
                    estimated_duration_minutes=dur
                )
                db.add(r)
                db.flush()
                route_map[f"{orig}-{dest}"] = r
            else:
                route_map[f"{orig}-{dest}"] = existing

        # 4. Seed Luxury Aircraft Fleet & Cabin Seat Layouts
        print("[*] Seeding luxury fleet and seat layouts...")
        fleet_data = [
            ("ALX-771", "Boeing 777-300ER", "Boeing Commercial Airplanes", 120),
            ("ALX-380", "Airbus A380-800", "Airbus S.A.S.", 140),
            ("ALX-350", "Airbus A350-900", "Airbus S.A.S.", 110),
            ("ALX-772", "Boeing 777-300ER", "Boeing Commercial Airplanes", 120),
        ]

        aircraft_map = {}
        for reg, model, maker, capacity in fleet_data:
            existing = db.query(Aircraft).filter(Aircraft.registration_number == reg).first()
            if not existing:
                ac = Aircraft(
                    registration_number=reg,
                    model=model,
                    manufacturer=maker,
                    total_seats=capacity,
                    status="ACTIVE"
                )
                db.add(ac)
                db.flush()
                aircraft_map[reg] = ac

                # Generate Seat Map:
                # Rows 1-2: First Class (1-2-1 layout: A, E, F, K)
                for r in [1, 2]:
                    for col in ["A", "E", "F", "K"]:
                        db.add(Seat(
                            aircraft_id=ac.id,
                            seat_number=f"{r}{col}",
                            cabin_class=CabinClassEnum.FIRST,
                            row_num=r,
                            col_letter=col,
                            is_extra_legroom=True,
                            is_exit_row=False,
                            extra_charge=0.0
                        ))

                # Rows 3-6: Business Class (2-2-2 layout: A, B, E, F, J, K)
                for r in range(3, 7):
                    for col in ["A", "B", "E", "F", "J", "K"]:
                        db.add(Seat(
                            aircraft_id=ac.id,
                            seat_number=f"{r}{col}",
                            cabin_class=CabinClassEnum.BUSINESS,
                            row_num=r,
                            col_letter=col,
                            is_extra_legroom=True,
                            is_exit_row=False,
                            extra_charge=0.0
                        ))

                # Rows 7-9: Premium Economy (2-3-2 layout: A, C, D, E, F, H, K)
                for r in range(7, 10):
                    for col in ["A", "C", "D", "E", "F", "H", "K"]:
                        db.add(Seat(
                            aircraft_id=ac.id,
                            seat_number=f"{r}{col}",
                            cabin_class=CabinClassEnum.PREMIUM_ECONOMY,
                            row_num=r,
                            col_letter=col,
                            is_extra_legroom=False,
                            is_exit_row=False,
                            extra_charge=0.0
                        ))

                # Rows 10-20: Economy Class (3-3-3 layout: A, B, C, D, E, F, H, J, K)
                for r in range(10, 21):
                    for col in ["A", "B", "C", "D", "E", "F", "H", "J", "K"]:
                        is_exit = (r == 15)
                        is_legroom = (r == 10 or r == 15)
                        charge = 45.0 if is_exit else (30.0 if is_legroom else 0.0)
                        db.add(Seat(
                            aircraft_id=ac.id,
                            seat_number=f"{r}{col}",
                            cabin_class=CabinClassEnum.ECONOMY,
                            row_num=r,
                            col_letter=col,
                            is_extra_legroom=is_legroom,
                            is_exit_row=is_exit,
                            extra_charge=charge
                        ))
                db.flush()
            else:
                aircraft_map[reg] = existing

        # 5. Seed Scheduled Flights for Next 14 Days
        print("[*] Generating scheduled flights across flight routes...")
        now = datetime.utcnow()
        flight_schedules = [
            ("ALX-101", "DXB-LHR", "ALX-380", 8, 0, 750, 1350, 3400, 7200, "3", "A1"),
            ("ALX-102", "LHR-DXB", "ALX-380", 17, 30, 720, 1300, 3300, 7100, "2", "B4"),
            ("ALX-201", "DXB-JFK", "ALX-771", 9, 30, 950, 1650, 4200, 8900, "3", "A8"),
            ("ALX-202", "JFK-DXB", "ALX-771", 22, 0, 920, 1600, 4100, 8700, "4", "C12"),
            ("ALX-301", "DXB-SIN", "ALX-350", 3, 15, 620, 1150, 2800, 5900, "3", "B7"),
            ("ALX-302", "SIN-DXB", "ALX-350", 15, 0, 600, 1100, 2750, 5800, "1", "D3"),
            ("ALX-401", "DXB-HND", "ALX-772", 7, 45, 840, 1450, 3600, 7800, "3", "A14"),
            ("ALX-501", "DXB-CDG", "ALX-350", 14, 0, 680, 1250, 3100, 6600, "3", "B18"),
            ("ALX-601", "DXB-SYD", "ALX-380", 2, 0, 1100, 1950, 4800, 9900, "3", "A2"),
            ("ALX-701", "DXB-BOM", "ALX-771", 10, 0, 280, 520, 1400, 3200, "3", "C5"),
            ("ALX-801", "DXB-LAX", "ALX-771", 8, 30, 1150, 2100, 5100, 10500, "3", "A6"),
            ("ALX-901", "DXB-ZRH", "ALX-350", 8, 15, 620, 1180, 2950, 6200, "3", "B10"),
        ]

        created_flights = []
        # Create flights for: today, tomorrow, and subsequent 7 days
        for day_offset in range(0, 8):
            flight_date = (now + timedelta(days=day_offset)).date()
            for f_num, r_key, ac_reg, dep_h, dep_m, p_eco, p_peco, p_biz, p_fst, term, gate in flight_schedules:
                route = route_map.get(r_key)
                aircraft = aircraft_map.get(ac_reg)
                if not route or not aircraft:
                    continue

                dep_dt = datetime.combine(flight_date, datetime.min.time()) + timedelta(hours=dep_h, minutes=dep_m)
                arr_dt = dep_dt + timedelta(minutes=route.estimated_duration_minutes)

                # Check if flight already exists
                existing = (
                    db.query(Flight)
                    .filter(Flight.flight_number == f_num, Flight.departure_time == dep_dt)
                    .first()
                )
                if not existing:
                    status = FlightStatusEnum.SCHEDULED
                    if day_offset == 0 and dep_h <= now.hour:
                        status = FlightStatusEnum.DEPARTED

                    fl = Flight(
                        flight_number=f_num,
                        route_id=route.id,
                        aircraft_id=aircraft.id,
                        departure_time=dep_dt,
                        arrival_time=arr_dt,
                        status=status,
                        terminal=term,
                        gate=gate,
                        delay_minutes=0,
                        base_price_economy=float(p_eco),
                        base_price_premium_economy=float(p_peco),
                        base_price_business=float(p_biz),
                        base_price_first=float(p_fst),
                        created_at=datetime.utcnow()
                    )
                    db.add(fl)
                    created_flights.append(fl)

        db.flush()

        # 6. Seed Demo Bookings & Boarding Passes
        print("[*] Creating realistic demo bookings with PNRs and simulated Boarding Pass...")
        demo_flight = (
            db.query(Flight)
            .filter(Flight.flight_number == "ALX-101", Flight.status == FlightStatusEnum.SCHEDULED)
            .first()
        )

        if demo_flight:
            pnr1 = "ALX701"
            existing_b1 = db.query(Booking).filter(Booking.booking_reference == pnr1).first()
            if not existing_b1:
                b1 = Booking(
                    booking_reference=pnr1,
                    user_id=user_map["customer@aerolux.com"].id,
                    contact_name="Lord Sterling",
                    contact_email="customer@aerolux.com",
                    contact_phone="+44 20 7946 0912",
                    fare_tier="FLEX_PLUS",
                    status=BookingStatusEnum.CONFIRMED,
                    total_fare=3925.00,
                    tax_amount=471.00,
                    ancillaries_amount=110.00,
                    currency="USD",
                    created_at=datetime.utcnow() - timedelta(hours=4)
                )
                db.add(b1)
                db.flush()

                p1 = Passenger(
                    booking_id=b1.id,
                    first_name="Lord Sterling",
                    last_name="Sterling",
                    passport_number="GB99482104",
                    nationality="GB",
                    meal_preference="Gourmet Dining",
                    special_requests="Chauffeured transfer at LHR"
                )
                db.add(p1)
                db.flush()

                # Find First Class Seat 1A
                seat_1a = (
                    db.query(Seat)
                    .filter(Seat.aircraft_id == demo_flight.aircraft_id, Seat.seat_number == "1A")
                    .first()
                )
                if seat_1a:
                    alloc1 = SeatAllocation(
                        flight_id=demo_flight.id,
                        seat_id=seat_1a.id,
                        passenger_id=p1.id,
                        booking_id=b1.id,
                        status="CONFIRMED"
                    )
                    db.add(alloc1)

                pay1 = Payment(
                    booking_id=b1.id,
                    amount=3925.00,
                    currency="USD",
                    status="SUCCESS",
                    payment_method="SIMULATED_CREDIT_CARD",
                    transaction_reference="TXN-ALX-DEMO-991",
                    card_last_four="4242",
                    created_at=datetime.utcnow()
                )
                db.add(pay1)

                # Generate CheckIn and BoardingPass for ALX701
                ci1 = CheckIn(
                    booking_id=b1.id,
                    passenger_id=p1.id,
                    flight_id=demo_flight.id,
                    sequence_number=1,
                    status="COMPLETED",
                    check_in_time=datetime.utcnow()
                )
                db.add(ci1)
                db.flush()

                bp1 = BoardingPass(
                    check_in_id=ci1.id,
                    pass_token="BP-ALX101-DEMO-001",
                    barcode_data="M1STERLING/LORD       EALX101 DXBLHRALX00101A0001100",
                    passenger_name="Lord Sterling",
                    flight_number="ALX-101",
                    origin_iata="DXB",
                    destination_iata="LHR",
                    terminal="3",
                    gate="A1",
                    boarding_time=demo_flight.departure_time - timedelta(minutes=45),
                    seat_number="1A",
                    cabin_class="FIRST",
                    sequence_number=1,
                    is_demo_document=True,
                    issued_at=datetime.utcnow()
                )
                db.add(bp1)

                # Add NotificationLog
                db.add(NotificationLog(
                    recipient_email="customer@aerolux.com",
                    notification_type="BOOKING_CONFIRMED",
                    title="AeroLux Booking Confirmation: Ref #ALX701",
                    message="Your First Class booking on flight ALX-101 has been confirmed. PNR: ALX701.",
                    status="DELIVERED",
                    sent_at=datetime.utcnow()
                ))

                # Add AuditLog
                db.add(AuditLog(
                    entity_name="Booking",
                    entity_id=str(b1.id),
                    action="BOOKING_CONFIRMED",
                    actor_email="customer@aerolux.com",
                    details_json='{"flight": "ALX-101", "pnr": "ALX701", "tier": "FLEX_PLUS"}',
                    created_at=datetime.utcnow()
                ))

        # Commit all records
        db.commit()
        print("[+] Successfully seeded database with realistic AeroLux airline dataset!")

    except Exception as ex:
        db.rollback()
        print(f"[!] Error seeding database: {ex}")
        raise ex
    finally:
        db.close()


if __name__ == "__main__":
    seed()
