import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, AlertCircle, CheckCircle, Plane, User, XCircle, RefreshCw } from 'lucide-react';
import { Booking } from '../types';
import { bookingService } from '../services/api';
import { FlightStatusBadge, BookingStatusBadge } from '../components/common/StatusBadge';

export const BookingLookupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [pnr, setPnr] = useState<string>(searchParams.get('pnr') || '');
  const [lastName, setLastName] = useState<string>('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pnr || !lastName) {
      setError('Please provide both Booking Reference and Passenger Surname.');
      return;
    }

    setLoading(true);
    setError(null);
    setActionMessage(null);

    try {
      const res = await bookingService.lookupBooking(pnr.trim().toUpperCase(), lastName.trim());
      setBooking(res);
    } catch (err: any) {
      console.error('Lookup failed', err);
      setError(err.response?.data?.detail || 'Booking not found. Please verify the 6-character PNR and passenger surname.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoPnr: string, demoSurname: string) => {
    setPnr(demoPnr);
    setLastName(demoSurname);
    setError(null);
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    if (!window.confirm(`Are you sure you wish to cancel booking ${booking.booking_reference}? Any seat allocations will be released.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await bookingService.cancelBooking(booking.booking_reference);
      setActionMessage(res.message);
      // Refresh booking details
      const refreshed = await bookingService.lookupBooking(booking.booking_reference, lastName);
      setBooking(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cancel booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-slate-900">Manage Your Booking</h1>
          <p className="text-xs text-slate-500 mt-1">
            Retrieve your itinerary, modify preferences, select seats, or process cancellations.
          </p>
        </div>

        {/* Lookup Search Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-8">
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Booking Reference (PNR)</label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value.toUpperCase())}
                  placeholder="e.g. ALX701"
                  className="w-full px-3 py-2.5 border rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Passenger Surname</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Sterling"
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              {/* Quick Demo Pre-fills */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">Quick Demo PNRs:</span>
                <button
                  type="button"
                  onClick={() => handleFillDemo('ALX701', 'Sterling')}
                  className="text-aerolux-burgundy font-bold underline hover:text-aerolux-burgundy-light"
                >
                  ALX701 (Sterling)
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Search className="w-4 h-4 text-aerolux-gold" />
                <span>{loading ? 'Locating Itinerary...' : 'Retrieve Itinerary'}</span>
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {actionMessage && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>

        {/* Retrieved Booking Display */}
        {booking && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-aerolux-burgundy text-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-aerolux-gold block">
                  AeroLux Imperial Itinerary
                </span>
                <h2 className="text-2xl font-black font-mono tracking-wider">{booking.booking_reference}</h2>
                <p className="text-xs text-rose-200 mt-0.5">Booked on {new Date(booking.created_at).toLocaleDateString()}</p>
              </div>

              <div className="flex items-center gap-3">
                <BookingStatusBadge status={booking.status} />
                <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded text-white">
                  ${booking.total_fare.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Flight segment */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 text-aerolux-burgundy flex items-center justify-center">
                    <Plane className="w-5 h-5 transform -rotate-45" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{booking.flight.flight_number}</h3>
                    <p className="text-xs text-slate-500">{booking.flight.aircraft_model} &bull; Terminal {booking.flight.terminal}</p>
                  </div>
                </div>

                <FlightStatusBadge status={booking.flight.status} delayMinutes={booking.flight.delay_minutes} />
              </div>

              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-slate-900 font-mono">{booking.flight.origin_iata}</span>
                  <p className="text-xs font-semibold text-slate-600">{booking.flight.origin_city}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{new Date(booking.flight.departure_time).toLocaleString()}</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-20 h-[2px] bg-slate-300 relative my-2">
                    <Plane className="w-3.5 h-3.5 text-aerolux-burgundy absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Direct</span>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 font-mono">{booking.flight.destination_iata}</span>
                  <p className="text-xs font-semibold text-slate-600">{booking.flight.destination_city}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{new Date(booking.flight.arrival_time).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Passengers & Seats */}
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Passenger & Seat Allocations</h3>
              <div className="space-y-3">
                {booking.passengers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-bold text-slate-900">{p.first_name} {p.last_name}</p>
                        <p className="text-slate-500 text-[11px]">Passport: {p.passport_number} &bull; Meal: {p.meal_preference}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Assigned Seat</span>
                        <span className="font-mono font-bold text-aerolux-burgundy text-sm">{p.seat_number || 'Unassigned'}</span>
                      </div>
                      {p.has_checked_in && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Checked-In
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-6 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
              {booking.status === 'CONFIRMED' ? (
                <>
                  <button
                    onClick={handleCancelBooking}
                    className="px-4 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Booking & Demo Refund</span>
                  </button>

                  <button
                    onClick={() => navigate(`/checkin?pnr=${booking.booking_reference}`)}
                    className="px-6 py-2.5 rounded-lg bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white text-xs font-bold transition shadow-sm"
                  >
                    Proceed to Online Check-In &rarr;
                  </button>
                </>
              ) : (
                <div className="w-full text-center py-2 text-xs text-slate-500 font-semibold">
                  This booking has been cancelled. Seat allocations have been released back to flight inventory.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
