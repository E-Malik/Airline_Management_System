from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from backend.app.models.airline import CabinClassEnum
from backend.app.models.booking import BookingStatusEnum, AncillaryTypeEnum
from backend.app.models.flight import FlightStatusEnum


class PassengerInput(BaseModel):
    first_name: str = Field(..., min_length=2)
    last_name: str = Field(..., min_length=2)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = "Unspecified"
    passport_number: str = Field(..., min_length=5)
    nationality: str = Field(..., min_length=2)
    meal_preference: Optional[str] = "Standard"
    special_requests: Optional[str] = None
    seat_id: Optional[int] = None  # Chosen seat for this passenger


class AncillaryInput(BaseModel):
    passenger_index: Optional[int] = 0
    service_type: AncillaryTypeEnum
    description: str


class PaymentInput(BaseModel):
    card_number: str = Field(..., min_length=13, max_length=19)  # Simulated only
    card_holder: str = Field(..., min_length=2)
    expiry: str = Field(..., pattern=r"^(0[1-9]|1[0-2])\/?([0-9]{2})$")
    cvv: str = Field(..., min_length=3, max_length=4)


class CreateBookingRequest(BaseModel):
    flight_id: int
    cabin_class: CabinClassEnum = CabinClassEnum.ECONOMY
    fare_tier: str = "FLEX"  # SAVER, FLEX, FLEX_PLUS
    contact_name: str = Field(..., min_length=2)
    contact_email: EmailStr
    contact_phone: str = Field(..., min_length=6)
    passengers: List[PassengerInput] = Field(..., min_length=1)
    ancillaries: List[AncillaryInput] = []
    payment: PaymentInput


class PassengerResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    passport_number: str
    nationality: str
    meal_preference: str
    seat_number: Optional[str] = None
    seat_id: Optional[int] = None
    has_checked_in: bool = False

    class Config:
        from_attributes = True


class BookingFlightSummary(BaseModel):
    id: int
    flight_number: str
    departure_time: datetime
    arrival_time: datetime
    origin_iata: str
    origin_city: str
    origin_airport: str
    destination_iata: str
    destination_city: str
    destination_airport: str
    status: FlightStatusEnum
    terminal: str
    gate: str
    delay_minutes: int
    aircraft_model: str


class BookingResponse(BaseModel):
    id: int
    booking_reference: str
    contact_name: str
    contact_email: str
    contact_phone: str
    fare_tier: str
    status: BookingStatusEnum
    total_fare: float
    tax_amount: float
    ancillaries_amount: float
    currency: str
    created_at: datetime
    flight: BookingFlightSummary
    passengers: List[PassengerResponse]


class BookingLookupRequest(BaseModel):
    booking_reference: str = Field(..., min_length=6, max_length=8)
    last_name: str = Field(..., min_length=2)


class CancelBookingResponse(BaseModel):
    booking_reference: str
    status: BookingStatusEnum
    refund_amount: float
    message: str
