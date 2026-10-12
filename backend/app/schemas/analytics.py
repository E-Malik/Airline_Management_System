from typing import List, Dict
from pydantic import BaseModel


class RoutePopularityItem(BaseModel):
    route: str  # e.g. "DXB -> LHR"
    origin_iata: str
    destination_iata: str
    passengers_count: int
    revenue: float


class CabinRevenueItem(BaseModel):
    cabin_class: str
    passengers_count: int
    revenue: float
    percentage: float


class DailyRevenueItem(BaseModel):
    date: str
    revenue: float
    bookings_count: int


class AnalyticsOverviewResponse(BaseModel):
    total_revenue: float
    total_bookings: int
    total_passengers: int
    fleet_load_factor: float  # Percentage, e.g. 82.5
    active_flights_count: int
    top_routes: List[RoutePopularityItem]
    revenue_by_cabin: List[CabinRevenueItem]
    recent_trend: List[DailyRevenueItem]
