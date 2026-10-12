import json
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel


class DomainEvent(BaseModel):
    event_id: Optional[str] = None
    event_type: str
    aggregate_type: str
    aggregate_id: str
    timestamp: datetime = datetime.utcnow()
    payload: Dict[str, Any]

    def to_json(self) -> str:
        # Serializer supporting datetime
        return json.dumps(self.payload, default=str)


class BookingConfirmedEvent(DomainEvent):
    event_type: str = "BookingConfirmed"
    aggregate_type: str = "Booking"


class FlightStatusChangedEvent(DomainEvent):
    event_type: str = "FlightStatusChanged"
    aggregate_type: str = "Flight"


class CheckInCompletedEvent(DomainEvent):
    event_type: str = "CheckInCompleted"
    aggregate_type: str = "CheckIn"


class BookingCancelledEvent(DomainEvent):
    event_type: str = "BookingCancelled"
    aggregate_type: str = "Booking"


class AdministrativeChangeRecordedEvent(DomainEvent):
    event_type: str = "AdministrativeChangeRecorded"
    aggregate_type: str = "Administrative"
