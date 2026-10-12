from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from backend.app.models.flight import FlightStatusEnum
from backend.app.models.airline import CabinClassEnum
from backend.app.schemas.airline import RouteResponse, AircraftResponse


class FlightSearchQuery(BaseModel):
    origin: str = Field(..., min_length=3, max_length=3)
    destination: str = Field(..., min_length=3, max_length=3)
    departure_date: date
    cabin_class: CabinClassEnum = CabinClassEnum.ECONOMY
    passengers: int = Field(default=1, ge=1, le=9)


class FareTierDetail(BaseModel):
    tier_name: str  # SAVER, FLEX, FLEX_PLUS
    cabin_class: CabinClassEnum
    total_price: float
    baggage_allowance: str
    seat_selection_free: bool
    refundable: bool
    changes_allowed: bool
    description: str


class FlightResponse(BaseModel):
    id: int
    flight_number: str
    route_id: int
    aircraft_id: int
    departure_time: datetime
    arrival_time: datetime
    duration_minutes: int
    status: FlightStatusEnum
    terminal: str
    gate: str
    delay_minutes: int
    route: RouteResponse
    aircraft: AircraftResponse
    
    # Prices for the requested/available cabin classes
    price_economy: float
    price_premium_economy: float
    price_business: float
    price_first: float
    
    # Detailed fare tiers for the requested cabin class
    fare_tiers: List[FareTierDetail] = []
    
    available_seats_count: int = 0

    class Config:
        from_attributes = True


class FlightStatusUpdateRequest(BaseModel):
    status: FlightStatusEnum
    delay_minutes: Optional[int] = 0
    terminal: Optional[str] = None
    gate: Optional[str] = None


class CreateFlightRequest(BaseModel):
    flight_number: str
    route_id: int
    aircraft_id: int
    departure_time: datetime
    arrival_time: datetime
    terminal: str = "3"
    gate: str = "B12"
    base_price_economy: float = Field(..., gt=0)
    base_price_premium_economy: float = Field(..., gt=0)
    base_price_business: float = Field(..., gt=0)
    base_price_first: float = Field(..., gt=0)
