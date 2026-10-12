from typing import List, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.flight import Flight
from backend.app.models.airline import Aircraft, Seat, CabinClassEnum
from backend.app.models.booking import SeatAllocation
from backend.app.schemas.seat import SeatMapResponse, CabinSection, SeatRow, SeatItem


def get_seat_map_for_flight(db: Session, flight_id: int) -> SeatMapResponse:
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight with ID {flight_id} not found."
        )

    aircraft = db.query(Aircraft).filter(Aircraft.id == flight.aircraft_id).first()
    if not aircraft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aircraft configuration for flight {flight_id} not found."
        )

    # Fetch all seats configured for this aircraft
    all_seats = (
        db.query(Seat)
        .filter(Seat.aircraft_id == aircraft.id)
        .order_by(Seat.row_num.asc(), Seat.col_letter.asc())
        .all()
    )

    # Fetch currently confirmed seat allocations for this flight
    occupied_allocations = (
        db.query(SeatAllocation.seat_id)
        .filter(SeatAllocation.flight_id == flight_id)
        .filter(SeatAllocation.status == "CONFIRMED")
        .all()
    )
    occupied_seat_ids = {alloc[0] for alloc in occupied_allocations}

    # Group seats by cabin class and rows
    cabins_dict: Dict[str, CabinSection] = {}
    
    # Pre-categorize seats by cabin
    seats_by_cabin: Dict[CabinClassEnum, List[Seat]] = {
        CabinClassEnum.FIRST: [],
        CabinClassEnum.BUSINESS: [],
        CabinClassEnum.PREMIUM_ECONOMY: [],
        CabinClassEnum.ECONOMY: []
    }
    
    for s in all_seats:
        if s.cabin_class in seats_by_cabin:
            seats_by_cabin[s.cabin_class].append(s)

    for cabin_enum, cabin_seats in seats_by_cabin.items():
        if not cabin_seats:
            continue

        # Determine column layout (e.g. ['A', 'B', 'C', '', 'D', 'E', ...])
        distinct_cols = sorted(list({s.col_letter for s in cabin_seats}))
        
        # Build rows
        rows_map: Dict[int, List[SeatItem]] = {}
        for s in cabin_seats:
            if s.row_num not in rows_map:
                rows_map[s.row_num] = []
            
            is_avail = s.id not in occupied_seat_ids
            rows_map[s.row_num].append(
                SeatItem(
                    id=s.id,
                    seat_number=s.seat_number,
                    cabin_class=s.cabin_class,
                    row_num=s.row_num,
                    col_letter=s.col_letter,
                    is_extra_legroom=s.is_extra_legroom,
                    is_exit_row=s.is_exit_row,
                    extra_charge=s.extra_charge,
                    is_available=is_avail
                )
            )

        seat_rows = [
            SeatRow(
                row_num=r_num,
                cabin_class=cabin_enum,
                seats=sorted(r_seats, key=lambda x: x.col_letter)
            )
            for r_num, r_seats in sorted(rows_map.items())
        ]

        cabins_dict[cabin_enum.value] = CabinSection(
            cabin_class=cabin_enum,
            columns=distinct_cols,
            rows=seat_rows
        )

    total_seats = len(all_seats)
    occupied_count = len(occupied_seat_ids)
    available_count = max(0, total_seats - occupied_count)

    return SeatMapResponse(
        flight_id=flight.id,
        flight_number=flight.flight_number,
        aircraft_model=aircraft.model,
        total_seats=total_seats,
        available_seats=available_count,
        occupied_seats=occupied_count,
        cabins=cabins_dict
    )
