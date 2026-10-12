export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

export type FlightStatus = 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'DELAYED' | 'ARRIVED' | 'CANCELLED';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type AncillaryType = 'EXTRA_BAGGAGE' | 'MEAL_UPGRADE' | 'LOUNGE_ACCESS' | 'PRIORITY_BOARDING';

export interface Airport {
  iata_code: string;
  icao_code?: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
}

export interface Route {
  id: number;
  origin_iata: string;
  destination_iata: string;
  distance_km: number;
  estimated_duration_minutes: number;
  origin_airport?: Airport;
  destination_airport?: Airport;
}

export interface Aircraft {
  id: number;
  registration_number: string;
  model: string;
  manufacturer: string;
  total_seats: number;
  status: string;
}

export interface FareTierDetail {
  tier_name: 'SAVER' | 'FLEX' | 'FLEX_PLUS';
  cabin_class: CabinClass;
  total_price: number;
  baggage_allowance: string;
  seat_selection_free: boolean;
  refundable: boolean;
  changes_allowed: boolean;
  description: string;
}

export interface Flight {
  id: number;
  flight_number: string;
  route_id: number;
  aircraft_id: number;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  status: FlightStatus;
  terminal: string;
  gate: string;
  delay_minutes: number;
  route: Route;
  aircraft: Aircraft;
  price_economy: number;
  price_premium_economy: number;
  price_business: number;
  price_first: number;
  fare_tiers: FareTierDetail[];
  available_seats_count: number;
}

export interface SeatItem {
  id: number;
  seat_number: string;
  cabin_class: CabinClass;
  row_num: number;
  col_letter: string;
  is_extra_legroom: boolean;
  is_exit_row: boolean;
  extra_charge: number;
  is_available: boolean;
}

export interface SeatRow {
  row_num: number;
  cabin_class: CabinClass;
  seats: (SeatItem | null)[];
}

export interface CabinSection {
  cabin_class: CabinClass;
  columns: string[];
  rows: SeatRow[];
}

export interface SeatMapResponse {
  flight_id: number;
  flight_number: string;
  aircraft_model: string;
  total_seats: number;
  available_seats: number;
  occupied_seats: number;
  cabins: Record<string, CabinSection>;
}

export interface PassengerInput {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  passport_number: string;
  nationality: string;
  meal_preference?: string;
  special_requests?: string;
  seat_id?: number;
}

export interface AncillaryInput {
  passenger_index?: number;
  service_type: AncillaryType;
  description: string;
}

export interface PaymentInput {
  card_number: string;
  card_holder: string;
  expiry: string;
  cvv: string;
}

export interface CreateBookingRequest {
  flight_id: number;
  cabin_class: CabinClass;
  fare_tier: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  passengers: PassengerInput[];
  ancillaries: AncillaryInput[];
  payment: PaymentInput;
}

export interface PassengerResponse {
  id: number;
  first_name: string;
  last_name: string;
  passport_number: string;
  nationality: string;
  meal_preference: string;
  seat_number?: string;
  seat_id?: number;
  has_checked_in: boolean;
}

export interface BookingFlightSummary {
  id: number;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  origin_iata: string;
  origin_city: string;
  origin_airport: string;
  destination_iata: string;
  destination_city: string;
  destination_airport: string;
  status: FlightStatus;
  terminal: string;
  gate: string;
  delay_minutes: number;
  aircraft_model: string;
}

export interface Booking {
  id: number;
  booking_reference: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  fare_tier: string;
  status: BookingStatus;
  total_fare: number;
  tax_amount: number;
  ancillaries_amount: number;
  currency: string;
  created_at: string;
  flight: BookingFlightSummary;
  passengers: PassengerResponse[];
}

export interface BoardingPass {
  id: number;
  pass_token: string;
  passenger_name: string;
  flight_number: string;
  origin_iata: string;
  origin_city: string;
  destination_iata: string;
  destination_city: string;
  terminal: string;
  gate: string;
  boarding_time: string;
  departure_time: string;
  seat_number: string;
  cabin_class: string;
  sequence_number: number;
  barcode_data: string;
  is_demo_document: boolean;
  issued_at: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: Role;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: Role;
  email: string;
  full_name: string;
}

export interface PassengerManifestItem {
  passenger_id: number;
  passenger_name: string;
  passport_number: string;
  nationality: string;
  seat_number: string;
  cabin_class: string;
  booking_reference: string;
  has_checked_in: boolean;
  meal_preference: string;
  special_requests?: string;
}

export interface FlightManifest {
  flight_id: number;
  flight_number: string;
  origin_iata: string;
  destination_iata: string;
  departure_time: string;
  status: FlightStatus;
  total_passengers: number;
  checked_in_count: number;
  passengers: PassengerManifestItem[];
}

export interface AuditLog {
  id: number;
  entity_name: string;
  entity_id: string;
  action: string;
  actor_email: string;
  details_json?: string;
  created_at: string;
}

export interface NotificationLog {
  id: number;
  recipient_email: string;
  notification_type: string;
  title: string;
  message: string;
  status: string;
  sent_at: string;
}

export interface RoutePopularityItem {
  route: string;
  origin_iata: string;
  destination_iata: string;
  passengers_count: number;
  revenue: number;
}

export interface CabinRevenueItem {
  cabin_class: string;
  passengers_count: number;
  revenue: number;
  percentage: number;
}

export interface DailyRevenueItem {
  date: string;
  revenue: number;
  bookings_count: number;
}

export interface AnalyticsOverview {
  total_revenue: number;
  total_bookings: number;
  total_passengers: number;
  fleet_load_factor: number;
  active_flights_count: number;
  top_routes: RoutePopularityItem[];
  revenue_by_cabin: CabinRevenueItem[];
  recent_trend: DailyRevenueItem[];
}
