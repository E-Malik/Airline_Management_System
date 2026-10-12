import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, Calendar, Bell, User, Clock, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Booking, NotificationLog } from '../types';
import { bookingService, adminService } from '../services/api';
import { FlightStatusBadge, BookingStatusBadge } from '../components/common/StatusBadge';

export const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'trips' | 'notifications'>('trips');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [tripsData, notifsData] = await Promise.all([
          bookingService.getMyTrips().catch(() => []),
          adminService.getNotifications().catch(() => [])
        ]);
        setBookings(tripsData);
        setNotifications(notifsData);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Welcome Banner */}
        <div className="bg-aerolux-burgundy text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-aerolux-burgundy-dark border border-amber-400/30 flex items-center justify-center text-aerolux-gold text-2xl font-bold font-display shadow-inner">
              {user ? user.full_name.charAt(0) : 'G'}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-aerolux-gold block">
                AeroLux SkyClub &bull; Platinum Elite
              </span>
              <h1 className="text-2xl font-bold font-display">{user ? user.full_name : 'Valued Guest'}</h1>
              <p className="text-xs text-rose-200 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl bg-aerolux-gold hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
            >
              Book New Flight
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('trips')}
            className={`pb-2 text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'trips'
                ? 'text-aerolux-burgundy border-b-2 border-aerolux-burgundy'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>My Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-2 text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'text-aerolux-burgundy border-b-2 border-aerolux-burgundy'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Flight Alerts &amp; Notifications ({notifications.length})</span>
          </button>
        </div>

        {/* Tab Content: Bookings */}
        {activeTab === 'trips' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-xs text-slate-500">Loading trips...</div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3 transform -rotate-45" />
                <h3 className="text-base font-bold text-slate-900">No active bookings found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Search our international routes to reserve your next luxury flight.
                </p>
                <Link
                  to="/"
                  className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-aerolux-burgundy text-white font-bold text-xs"
                >
                  Explore Flights
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black font-mono text-aerolux-burgundy">{b.booking_reference}</span>
                        <BookingStatusBadge status={b.status} />
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-700">
                        Total Paid: ${b.total_fare.toFixed(2)} USD
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-4 items-center">
                      <div className="md:col-span-8 flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-black font-mono text-slate-900">{b.flight.origin_iata}</span>
                          <p className="text-xs font-semibold text-slate-600">{b.flight.origin_city}</p>
                          <p className="text-[11px] text-slate-400">{new Date(b.flight.departure_time).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col items-center px-4">
                          <span className="text-xs font-bold text-slate-700">{b.flight.flight_number}</span>
                          <div className="w-20 h-[2px] bg-slate-300 my-1"></div>
                          <FlightStatusBadge status={b.flight.status} delayMinutes={b.flight.delay_minutes} />
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black font-mono text-slate-900">{b.flight.destination_iata}</span>
                          <p className="text-xs font-semibold text-slate-600">{b.flight.destination_city}</p>
                          <p className="text-[11px] text-slate-400">{new Date(b.flight.arrival_time).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="md:col-span-4 flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/lookup?pnr=${b.booking_reference}`)}
                          className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                        >
                          Manage Trip
                        </button>
                        {b.status === 'CONFIRMED' && (
                          <button
                            onClick={() => navigate(`/checkin?pnr=${b.booking_reference}`)}
                            className="px-4 py-2 rounded-lg bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white text-xs font-bold transition shadow-sm"
                          >
                            Check-In
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No notifications</h3>
                <p className="text-xs text-slate-500 mt-1">Operational updates and e-tickets will appear here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-rose-50 text-aerolux-burgundy flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(n.sent_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
