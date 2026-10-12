from typing import List, Dict
from backend.app.models.airline import CabinClassEnum, Seat
from backend.app.models.flight import Flight
from backend.app.models.booking import AncillaryTypeEnum
from backend.app.schemas.flight import FareTierDetail
from backend.app.core.config import settings

FARE_TIER_CONFIG = {
    "SAVER": {
        "multiplier": 0.90,
        "baggage_allowance": "1x 23kg Checked Bag",
        "seat_selection_free": False,
        "refundable": False,
        "changes_allowed": True,
        "description": "Best value fare. Essential baggage included. Non-refundable."
    },
    "FLEX": {
        "multiplier": 1.00,
        "baggage_allowance": "2x 23kg Checked Bags",
        "seat_selection_free": True,
        "refundable": True,
        "changes_allowed": True,
        "description": "Maximum flexibility. Complimentary standard seat selection & free date change."
    },
    "FLEX_PLUS": {
        "multiplier": 1.25,
        "baggage_allowance": "2x 32kg Checked Bags",
        "seat_selection_free": True,
        "refundable": True,
        "changes_allowed": True,
        "description": "Ultimate luxury freedom. Free priority seats, SkyLounge pass & 100% refundable."
    }
}

ANCILLARY_PRICES = {
    AncillaryTypeEnum.EXTRA_BAGGAGE: 50.0,
    AncillaryTypeEnum.MEAL_UPGRADE: 25.0,
    AncillaryTypeEnum.LOUNGE_ACCESS: 60.0,
    AncillaryTypeEnum.PRIORITY_BOARDING: 20.0,
}


def get_base_price_for_cabin(flight: Flight, cabin: CabinClassEnum) -> float:
    if cabin == CabinClassEnum.ECONOMY:
        return flight.base_price_economy
    elif cabin == CabinClassEnum.PREMIUM_ECONOMY:
        return flight.base_price_premium_economy
    elif cabin == CabinClassEnum.BUSINESS:
        return flight.base_price_business
    elif cabin == CabinClassEnum.FIRST:
        return flight.base_price_first
    return flight.base_price_economy


def get_fare_tiers_for_flight(flight: Flight, cabin: CabinClassEnum) -> List[FareTierDetail]:
    base = get_base_price_for_cabin(flight, cabin)
    tiers = []
    for tier_key, cfg in FARE_TIER_CONFIG.items():
        price = round(base * cfg["multiplier"], 2)
        tiers.append(
            FareTierDetail(
                tier_name=tier_key,
                cabin_class=cabin,
                total_price=price,
                baggage_allowance=cfg["baggage_allowance"],
                seat_selection_free=cfg["seat_selection_free"],
                refundable=cfg["refundable"],
                changes_allowed=cfg["changes_allowed"],
                description=cfg["description"]
            )
        )
    return tiers


def calculate_booking_totals(
    flight: Flight,
    cabin_class: CabinClassEnum,
    fare_tier_name: str,
    passenger_count: int,
    selected_seats: List[Seat],
    ancillaries_count: Dict[AncillaryTypeEnum, int]
) -> dict:
    """
    Server-authoritative fare calculation. Recomputes all base fares, tier adjustments,
    seat charges, add-on services, taxes and fuel surcharges.
    """
    tier_name = fare_tier_name.upper()
    tier_cfg = FARE_TIER_CONFIG.get(tier_name, FARE_TIER_CONFIG["FLEX"])
    
    base_seat_price = get_base_price_for_cabin(flight, cabin_class)
    adjusted_fare_per_passenger = base_seat_price * tier_cfg["multiplier"]
    base_fare_total = round(adjusted_fare_per_passenger * passenger_count, 2)

    # Seat charges
    seat_charges_total = 0.0
    for seat in selected_seats:
        if tier_name == "SAVER":
            # Extra legroom has fee plus standard fee
            seat_charges_total += seat.extra_charge + (15.0 if not seat.is_extra_legroom else 0.0)
        else:
            # Free standard selection, extra legroom has extra_charge
            seat_charges_total += seat.extra_charge

    # Ancillaries charges
    ancillaries_total = 0.0
    for svc_type, count in ancillaries_count.items():
        price = ANCILLARY_PRICES.get(svc_type, 0.0)
        ancillaries_total += price * count

    # Taxes and fuel surcharge
    taxes_and_fees = round((base_fare_total * settings.TAX_RATE) + (settings.FUEL_SURCHARGE * passenger_count), 2)

    grand_total = round(base_fare_total + seat_charges_total + ancillaries_total + taxes_and_fees, 2)

    return {
        "base_fare_total": base_fare_total,
        "seat_charges_total": round(seat_charges_total, 2),
        "ancillaries_total": round(ancillaries_total, 2),
        "taxes_and_fees": taxes_and_fees,
        "grand_total": grand_total,
        "currency": settings.CURRENCY
    }
