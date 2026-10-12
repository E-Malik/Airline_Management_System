import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class BookingStatusEnum(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class AncillaryTypeEnum(str, enum.Enum):
    EXTRA_BAGGAGE = "EXTRA_BAGGAGE"
    MEAL_UPGRADE = "MEAL_UPGRADE"
    LOUNGE_ACCESS = "LOUNGE_ACCESS"
    PRIORITY_BOARDING = "PRIORITY_BOARDING"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(8), unique=True, index=True, nullable=False)  # e.g. ALX7K2
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    contact_email = Column(String(255), nullable=False, index=True)
    contact_phone = Column(String(50), nullable=False)
    contact_name = Column(String(150), nullable=False)
    fare_tier = Column(String(20), default="FLEX", nullable=False)  # SAVER, FLEX, FLEX_PLUS
    status = Column(Enum(BookingStatusEnum), default=BookingStatusEnum.CONFIRMED, nullable=False, index=True)
    
    total_fare = Column(Float, nullable=False)
    tax_amount = Column(Float, nullable=False)
    ancillaries_amount = Column(Float, default=0.0, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    cancelled_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="bookings")
    passengers = relationship("Passenger", back_populates="booking", cascade="all, delete-orphan")
    seat_allocations = relationship("SeatAllocation", back_populates="booking", cascade="all, delete-orphan")
    ancillaries = relationship("AncillaryBooking", back_populates="booking", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
    check_ins = relationship("CheckIn", back_populates="booking")


class Passenger(Base):
    __tablename__ = "passengers"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False, index=True)
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    passport_number = Column(String(50), nullable=False)
    nationality = Column(String(50), nullable=False)
    meal_preference = Column(String(50), default="Standard", nullable=False)
    special_requests = Column(String(255), nullable=True)

    booking = relationship("Booking", back_populates="passengers")
    seat_allocation = relationship("SeatAllocation", back_populates="passenger", uselist=False)
    check_in = relationship("CheckIn", back_populates="passenger", uselist=False)


class SeatAllocation(Base):
    __tablename__ = "seat_allocations"

    id = Column(Integer, primary_key=True, index=True)
    flight_id = Column(Integer, ForeignKey("flights.id"), nullable=False, index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False, index=True)
    passenger_id = Column(Integer, ForeignKey("passengers.id"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    allocated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(20), default="CONFIRMED", nullable=False)  # CONFIRMED, RELEASED

    flight = relationship("Flight", back_populates="seat_allocations")
    seat = relationship("Seat", back_populates="allocations")
    passenger = relationship("Passenger", back_populates="seat_allocation")
    booking = relationship("Booking", back_populates="seat_allocations")


class AncillaryBooking(Base):
    __tablename__ = "ancillary_bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    passenger_id = Column(Integer, ForeignKey("passengers.id"), nullable=True)
    service_type = Column(Enum(AncillaryTypeEnum), nullable=False)
    price = Column(Float, nullable=False)
    description = Column(String(255), nullable=False)

    booking = relationship("Booking", back_populates="ancillaries")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    status = Column(String(20), default="SUCCESS", nullable=False)  # SUCCESS, REFUNDED
    payment_method = Column(String(50), default="SIMULATED_CREDIT_CARD", nullable=False)
    transaction_reference = Column(String(100), unique=True, nullable=False)
    card_last_four = Column(String(4), default="4242", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="payments")
