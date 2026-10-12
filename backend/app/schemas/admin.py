from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from backend.app.models.flight import FlightStatusEnum


class PassengerManifestItem(BaseModel):
    passenger_id: int
    passenger_name: str
    passport_number: str
    nationality: str
    seat_number: Optional[str] = "Unassigned"
    cabin_class: str
    booking_reference: str
    has_checked_in: bool
    meal_preference: str
    special_requests: Optional[str] = None


class FlightManifestResponse(BaseModel):
    flight_id: int
    flight_number: str
    origin_iata: str
    destination_iata: str
    departure_time: datetime
    status: FlightStatusEnum
    total_passengers: int
    checked_in_count: int
    passengers: List[PassengerManifestItem]


class AuditLogResponse(BaseModel):
    id: int
    entity_name: str
    entity_id: str
    action: str
    actor_email: Optional[str] = "System"
    details_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationLogResponse(BaseModel):
    id: int
    recipient_email: str
    notification_type: str
    title: str
    message: str
    status: str
    sent_at: datetime

    class Config:
        from_attributes = True
