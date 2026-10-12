from typing import List, Dict, Optional
from pydantic import BaseModel
from backend.app.models.airline import CabinClassEnum


class SeatItem(BaseModel):
    id: int
    seat_number: str
    cabin_class: CabinClassEnum
    row_num: int
    col_letter: str
    is_extra_legroom: bool
    is_exit_row: bool
    extra_charge: float
    is_available: bool

    class Config:
        from_attributes = True


class SeatRow(BaseModel):
    row_num: int
    cabin_class: CabinClassEnum
    seats: List[Optional[SeatItem]]  # None can represent aisle gap


class CabinSection(BaseModel):
    cabin_class: CabinClassEnum
    columns: List[str]  # e.g. ["A", "B", "C", "", "D", "E", "F", "G", "", "H", "J", "K"]
    rows: List[SeatRow]


class SeatMapResponse(BaseModel):
    flight_id: int
    flight_number: str
    aircraft_model: str
    total_seats: int
    available_seats: int
    occupied_seats: int
    cabins: Dict[str, CabinSection]
