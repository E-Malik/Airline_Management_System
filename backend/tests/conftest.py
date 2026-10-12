import os
import sys
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.core.database import Base, get_db
from backend.app.core.security import get_password_hash, create_access_token
from backend.app.main import app
from backend.app.models.user import User, RoleEnum
from backend.app.models.airline import Airport, Route, Aircraft, Seat, CabinClassEnum
from backend.app.models.flight import Flight, FlightStatusEnum
from backend.app.models.booking import Booking, BookingStatusEnum, Passenger, SeatAllocation, Payment

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def seed_test_data(db_session):
    # 1. Users
    admin = User(
        email="test_admin@aerolux.com",
        hashed_password=get_password_hash("AdminPass123"),
        full_name="Admin User",
        role=RoleEnum.ADMIN
    )
    staff = User(
        email="test_staff@aerolux.com",
        hashed_password=get_password_hash("StaffPass123"),
        full_name="Staff User",
        role=RoleEnum.STAFF
    )
    customer = User(
        email="test_customer@aerolux.com",
        hashed_password=get_password_hash("CustomerPass123"),
        full_name="Customer User",
        role=RoleEnum.CUSTOMER
    )
    db_session.add_all([admin, staff, customer])

    # 2. Airports & Route
    dxb = Airport(iata_code="DXB", name="Dubai International", city="Dubai", country="UAE")
    lhr = Airport(iata_code="LHR", name="Heathrow", city="London", country="UK")
    db_session.add_all([dxb, lhr])
    db_session.flush()

    route = Route(origin_iata="DXB", destination_iata="LHR", distance_km=5500, estimated_duration_minutes=450)
    db_session.add(route)
    db_session.flush()

    # 3. Aircraft & Seats
    ac = Aircraft(
        registration_number="TEST-777",
        model="Boeing 777-300ER",
        manufacturer="Boeing",
        total_seats=10
    )
    db_session.add(ac)
    db_session.flush()

    seat_1a = Seat(
        aircraft_id=ac.id,
        seat_number="1A",
        cabin_class=CabinClassEnum.FIRST,
        row_num=1,
        col_letter="A",
        extra_charge=0.0
    )
    seat_2a = Seat(
        aircraft_id=ac.id,
        seat_number="2A",
        cabin_class=CabinClassEnum.BUSINESS,
        row_num=2,
        col_letter="A",
        extra_charge=0.0
    )
    seat_10a = Seat(
        aircraft_id=ac.id,
        seat_number="10A",
        cabin_class=CabinClassEnum.ECONOMY,
        row_num=10,
        col_letter="A",
        extra_charge=0.0
    )
    seat_10b = Seat(
        aircraft_id=ac.id,
        seat_number="10B",
        cabin_class=CabinClassEnum.ECONOMY,
        row_num=10,
        col_letter="B",
        extra_charge=0.0
    )
    db_session.add_all([seat_1a, seat_2a, seat_10a, seat_10b])
    db_session.flush()

    # 4. Flight
    flight_dep = datetime.utcnow() + timedelta(days=2)
    flight = Flight(
        flight_number="TEST-101",
        route_id=route.id,
        aircraft_id=ac.id,
        departure_time=flight_dep,
        arrival_time=flight_dep + timedelta(minutes=450),
        status=FlightStatusEnum.SCHEDULED,
        terminal="3",
        gate="A1",
        base_price_economy=500.0,
        base_price_premium_economy=900.0,
        base_price_business=2000.0,
        base_price_first=5000.0
    )
    db_session.add(flight)
    db_session.commit()

    return {
        "admin": admin,
        "staff": staff,
        "customer": customer,
        "flight": flight,
        "seat_10a": seat_10a,
        "seat_10b": seat_10b,
        "seat_1a": seat_1a,
        "seat_2a": seat_2a
    }


@pytest.fixture
def admin_headers(seed_test_data):
    user = seed_test_data["admin"]
    token = create_access_token({"sub": str(user.id), "role": user.role.value, "email": user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def staff_headers(seed_test_data):
    user = seed_test_data["staff"]
    token = create_access_token({"sub": str(user.id), "role": user.role.value, "email": user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def customer_headers(seed_test_data):
    user = seed_test_data["customer"]
    token = create_access_token({"sub": str(user.id), "role": user.role.value, "email": user.email})
    return {"Authorization": f"Bearer {token}"}
