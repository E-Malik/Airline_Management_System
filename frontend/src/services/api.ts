import axios from 'axios';
import {
  Airport, Flight, SeatMapResponse, CreateBookingRequest, Booking,
  BoardingPass, User, AuthResponse, FlightManifest, AuditLog,
  NotificationLog, AnalyticsOverview, CabinClass, FlightStatus
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aerolux_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Services
export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: { email: string; password: string; full_name: string; phone?: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
  changePassword: async (current_password: string, new_password: string) => {
    const res = await api.post('/auth/change-password', { current_password, new_password });
    return res.data;
  }
};

// Flight Services
export const flightService = {
  getAirports: async (): Promise<Airport[]> => {
    const res = await api.get<Airport[]>('/flights/airports');
    return res.data;
  },
  searchFlights: async (params: {
    origin: string;
    destination: string;
    departure_date: string;
    cabin_class?: CabinClass;
    passengers?: number;
  }): Promise<Flight[]> => {
    const res = await api.get<Flight[]>('/flights/search', { params });
    return res.data;
  },
  getFlight: async (id: number, cabin_class: CabinClass = 'ECONOMY'): Promise<Flight> => {
    const res = await api.get<Flight>(`/flights/${id}`, { params: { cabin_class } });
    return res.data;
  }
};

// Seat Services
export const seatService = {
  getSeatMap: async (flightId: number): Promise<SeatMapResponse> => {
    const res = await api.get<SeatMapResponse>(`/seats/${flightId}`);
    return res.data;
  }
};

// Booking Services
export const bookingService = {
  createBooking: async (data: CreateBookingRequest): Promise<Booking> => {
    const res = await api.post<Booking>('/bookings/', data);
    return res.data;
  },
  lookupBooking: async (booking_reference: string, last_name: string): Promise<Booking> => {
    const res = await api.post<Booking>('/bookings/lookup', { booking_reference, last_name });
    return res.data;
  },
  getMyTrips: async (): Promise<Booking[]> => {
    const res = await api.get<Booking[]>('/bookings/my-trips');
    return res.data;
  },
  cancelBooking: async (bookingReference: string) => {
    const res = await api.post(`/bookings/${bookingReference}/cancel`);
    return res.data;
  }
};

// Check-in Services
export const checkInService = {
  checkIn: async (booking_reference: string, passenger_id: number, dangerous_goods_declaration_accepted: boolean): Promise<BoardingPass> => {
    const res = await api.post<BoardingPass>('/checkin/', {
      booking_reference,
      passenger_id,
      dangerous_goods_declaration_accepted
    });
    return res.data;
  },
  getBoardingPass: async (passToken: string): Promise<BoardingPass> => {
    const res = await api.get<BoardingPass>(`/checkin/boarding-pass/${passToken}`);
    return res.data;
  }
};

// Admin & Operations Services
export const adminService = {
  getFlights: async (status_filter?: FlightStatus): Promise<Flight[]> => {
    const res = await api.get<Flight[]>('/admin/flights', { params: { status_filter } });
    return res.data;
  },
  updateFlightStatus: async (flightId: number, data: { status: FlightStatus; delay_minutes?: number; gate?: string; terminal?: string }): Promise<Flight> => {
    const res = await api.patch<Flight>(`/admin/flights/${flightId}/status`, data);
    return res.data;
  },
  getManifest: async (flightId: number): Promise<FlightManifest> => {
    const res = await api.get<FlightManifest>(`/admin/flights/${flightId}/manifest`);
    return res.data;
  },
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await api.get<AuditLog[]>('/admin/audit-logs');
    return res.data;
  },
  getNotifications: async (): Promise<NotificationLog[]> => {
    const res = await api.get<NotificationLog[]>('/admin/notifications');
    return res.data;
  }
};

// Analytics Services
export const analyticsService = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    const res = await api.get<AnalyticsOverview>('/analytics/overview');
    return res.data;
  }
};

export default api;
