from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.airline import CabinClassEnum
from backend.app.schemas.flight import FlightResponse
from backend.app.schemas.airline import AirportResponse
from backend.app.services.flight_service import (
    list_airports, search_flights, get_flight_by_id
)

router = APIRouter(prefix="/flights", tags=["Flights"])


@router.get("/airports", response_model=List[AirportResponse])
def get_airports(db: Session = Depends(get_db)):
    return list_airports(db)


@router.get("/search", response_model=List[FlightResponse])
def search(
    origin: str = Query(..., min_length=3, max_length=3, description="Origin IATA Code, e.g. DXB"),
    destination: str = Query(..., min_length=3, max_length=3, description="Destination IATA Code, e.g. LHR"),
    departure_date: date = Query(..., description="Flight departure date (YYYY-MM-DD)"),
    cabin_class: CabinClassEnum = Query(CabinClassEnum.ECONOMY, description="Cabin class"),
    passengers: int = Query(1, ge=1, le=9, description="Passenger count"),
    db: Session = Depends(get_db)
):
    return search_flights(
        db=db,
        origin_iata=origin,
        destination_iata=destination,
        departure_date=departure_date,
        cabin_class=cabin_class,
        passengers=passengers
    )


@router.get("/{flight_id}", response_model=FlightResponse)
def get_flight(
    flight_id: int,
    cabin_class: CabinClassEnum = Query(CabinClassEnum.ECONOMY),
    db: Session = Depends(get_db)
):
    return get_flight_by_id(db, flight_id=flight_id, cabin_class=cabin_class)
