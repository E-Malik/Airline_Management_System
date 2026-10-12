from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class CheckIn(Base):
    __tablename__ = "check_ins"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    passenger_id = Column(Integer, ForeignKey("passengers.id"), nullable=False, unique=True, index=True)
    flight_id = Column(Integer, ForeignKey("flights.id"), nullable=False, index=True)
    check_in_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    sequence_number = Column(Integer, nullable=False)
    status = Column(String(20), default="COMPLETED", nullable=False)

    booking = relationship("Booking", back_populates="check_ins")
    passenger = relationship("Passenger", back_populates="check_in")
    flight = relationship("Flight", back_populates="check_ins")
    boarding_pass = relationship("BoardingPass", back_populates="check_in", uselist=False, cascade="all, delete-orphan")


class BoardingPass(Base):
    __tablename__ = "boarding_passes"

    id = Column(Integer, primary_key=True, index=True)
    check_in_id = Column(Integer, ForeignKey("check_ins.id"), nullable=False, unique=True, index=True)
    pass_token = Column(String(100), unique=True, nullable=False, index=True)
    barcode_data = Column(String(255), nullable=False)
    passenger_name = Column(String(150), nullable=False)
    flight_number = Column(String(20), nullable=False)
    origin_iata = Column(String(3), nullable=False)
    destination_iata = Column(String(3), nullable=False)
    terminal = Column(String(20), nullable=False)
    gate = Column(String(20), nullable=False)
    boarding_time = Column(DateTime, nullable=False)
    seat_number = Column(String(10), nullable=False)
    cabin_class = Column(String(30), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    is_demo_document = Column(Boolean, default=True, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    check_in = relationship("CheckIn", back_populates="boarding_pass")
