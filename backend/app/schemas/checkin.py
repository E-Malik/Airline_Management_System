from datetime import datetime
from pydantic import BaseModel, Field


class CheckInRequest(BaseModel):
    booking_reference: str = Field(..., min_length=6, max_length=8)
    passenger_id: int
    dangerous_goods_declaration_accepted: bool = Field(..., description="Passenger confirms no dangerous goods")


class BoardingPassResponse(BaseModel):
    id: int
    pass_token: str
    passenger_name: str
    flight_number: str
    origin_iata: str
    origin_city: str
    destination_iata: str
    destination_city: str
    terminal: str
    gate: str
    boarding_time: datetime
    departure_time: datetime
    seat_number: str
    cabin_class: str
    sequence_number: int
    barcode_data: str
    is_demo_document: bool = True
    issued_at: datetime

    class Config:
        from_attributes = True
