from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, get_current_user_optional
from backend.app.models.user import User
from backend.app.schemas.booking import (
    CreateBookingRequest, BookingResponse,
    BookingLookupRequest, CancelBookingResponse
)
from backend.app.services.booking_service import (
    create_booking, lookup_booking, cancel_booking, get_user_bookings
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def book_flight(
    req: CreateBookingRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    return create_booking(db=db, req=req, current_user=current_user)


@router.post("/lookup", response_model=BookingResponse)
def lookup(req: BookingLookupRequest, db: Session = Depends(get_db)):
    return lookup_booking(db=db, booking_reference=req.booking_reference, last_name=req.last_name)


@router.get("/my-trips", response_model=List[BookingResponse])
def get_my_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_user_bookings(db=db, user_id=current_user.id)


@router.post("/{booking_reference}/cancel", response_model=CancelBookingResponse)
def cancel(
    booking_reference: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    return cancel_booking(db=db, booking_reference=booking_reference, current_user=current_user)
