from typing import Optional
from pydantic import BaseModel
from backend.app.models.airline import CabinClassEnum


class AirportResponse(BaseModel):
    iata_code: str
    icao_code: Optional[str] = None
    name: str
    city: str
    country: str
    timezone: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


class RouteResponse(BaseModel):
    id: int
    origin_iata: str
    destination_iata: str
    distance_km: int
    estimated_duration_minutes: int
    origin_airport: Optional[AirportResponse] = None
    destination_airport: Optional[AirportResponse] = None

    class Config:
        from_attributes = True


class SeatResponse(BaseModel):
    id: int
    seat_number: str
    cabin_class: CabinClassEnum
    row_num: int
    col_letter: str
    is_extra_legroom: bool
    is_exit_row: bool
    extra_charge: float
    is_available: bool = True

    class Config:
        from_attributes = True


class AircraftResponse(BaseModel):
    id: int
    registration_number: str
    model: str
    manufacturer: str
    total_seats: int
    status: str

    class Config:
        from_attributes = True
