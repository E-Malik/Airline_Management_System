from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.checkin import CheckInRequest, BoardingPassResponse
from backend.app.services.checkin_service import perform_check_in, get_boarding_pass_by_token

router = APIRouter(prefix="/checkin", tags=["Online Check-In"])


@router.post("/", response_model=BoardingPassResponse, status_code=status.HTTP_201_CREATED)
def check_in_passenger(req: CheckInRequest, db: Session = Depends(get_db)):
    return perform_check_in(
        db=db,
        booking_reference=req.booking_reference,
        passenger_id=req.passenger_id,
        dangerous_goods_declaration_accepted=req.dangerous_goods_declaration_accepted
    )


@router.get("/boarding-pass/{pass_token}", response_model=BoardingPassResponse)
def get_boarding_pass(pass_token: str, db: Session = Depends(get_db)):
    return get_boarding_pass_by_token(db=db, pass_token=pass_token)
