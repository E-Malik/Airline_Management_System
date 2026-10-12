import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class FlightStatusEnum(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    BOARDING = "BOARDING"
    DEPARTED = "DEPARTED"
    DELAYED = "DELAYED"
    ARRIVED = "ARRIVED"
    CANCELLED = "CANCELLED"


class Flight(Base):
    __tablename__ = "flights"

    id = Column(Integer, primary_key=True, index=True)
    flight_number = Column(String(20), nullable=False, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False, index=True)
    aircraft_id = Column(Integer, ForeignKey("aircraft.id"), nullable=False, index=True)
    departure_time = Column(DateTime, nullable=False, index=True)
    arrival_time = Column(DateTime, nullable=False)
    status = Column(Enum(FlightStatusEnum), default=FlightStatusEnum.SCHEDULED, nullable=False, index=True)
    terminal = Column(String(20), default="3", nullable=False)
    gate = Column(String(20), default="B12", nullable=False)
    delay_minutes = Column(Integer, default=0, nullable=False)
    
    # Base prices for each cabin class
    base_price_economy = Column(Float, nullable=False)
    base_price_premium_economy = Column(Float, nullable=False)
    base_price_business = Column(Float, nullable=False)
    base_price_first = Column(Float, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    route = relationship("Route", back_populates="flights")
    aircraft = relationship("Aircraft", back_populates="flights")
    seat_allocations = relationship("SeatAllocation", back_populates="flight")
    check_ins = relationship("CheckIn", back_populates="flight")
