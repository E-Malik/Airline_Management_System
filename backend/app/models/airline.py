import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class CabinClassEnum(str, enum.Enum):
    ECONOMY = "ECONOMY"
    PREMIUM_ECONOMY = "PREMIUM_ECONOMY"
    BUSINESS = "BUSINESS"
    FIRST = "FIRST"


class Airport(Base):
    __tablename__ = "airports"

    iata_code = Column(String(3), primary_key=True, index=True)
    icao_code = Column(String(4), nullable=True)
    name = Column(String(150), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    country = Column(String(100), nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    origin_routes = relationship("Route", foreign_keys="Route.origin_iata", back_populates="origin_airport")
    destination_routes = relationship("Route", foreign_keys="Route.destination_iata", back_populates="destination_airport")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    origin_iata = Column(String(3), ForeignKey("airports.iata_code"), nullable=False, index=True)
    destination_iata = Column(String(3), ForeignKey("airports.iata_code"), nullable=False, index=True)
    distance_km = Column(Integer, nullable=False)
    estimated_duration_minutes = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("origin_iata", "destination_iata", name="uq_route_origin_destination"),
    )

    origin_airport = relationship("Airport", foreign_keys=[origin_iata], back_populates="origin_routes")
    destination_airport = relationship("Airport", foreign_keys=[destination_iata], back_populates="destination_routes")
    flights = relationship("Flight", back_populates="route")


class Aircraft(Base):
    __tablename__ = "aircraft"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(20), unique=True, nullable=False, index=True)
    model = Column(String(100), nullable=False)
    manufacturer = Column(String(100), nullable=False)
    total_seats = Column(Integer, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)

    seats = relationship("Seat", back_populates="aircraft", cascade="all, delete-orphan")
    flights = relationship("Flight", back_populates="aircraft")


class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    aircraft_id = Column(Integer, ForeignKey("aircraft.id"), nullable=False, index=True)
    seat_number = Column(String(10), nullable=False)
    cabin_class = Column(Enum(CabinClassEnum), nullable=False, index=True)
    row_num = Column(Integer, nullable=False)
    col_letter = Column(String(2), nullable=False)
    is_extra_legroom = Column(Boolean, default=False, nullable=False)
    is_exit_row = Column(Boolean, default=False, nullable=False)
    extra_charge = Column(Float, default=0.0, nullable=False)

    __table_args__ = (
        UniqueConstraint("aircraft_id", "seat_number", name="uq_aircraft_seat_number"),
    )

    aircraft = relationship("Aircraft", back_populates="seats")
    allocations = relationship("SeatAllocation", back_populates="seat")
