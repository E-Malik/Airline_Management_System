from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.seat import SeatMapResponse
from backend.app.services.seat_service import get_seat_map_for_flight

router = APIRouter(prefix="/seats", tags=["Seat Management"])


@router.get("/{flight_id}", response_model=SeatMapResponse)
def get_flight_seat_map(flight_id: int, db: Session = Depends(get_db)):
    return get_seat_map_for_flight(db, flight_id=flight_id)
