import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, ShieldCheck, Search, Plane, User } from 'lucide-react';
import { Booking, BoardingPass, PassengerResponse } from '../types';
import { bookingService, checkInService } from '../services/api';
import { SimulatedBoardingPass } from '../components/boarding/SimulatedBoardingPass';

export const CheckInPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialPnr = searchParams.get('pnr') || '';

  const [pnr, setPnr] = useState<string>(initialPnr);
  const [lastName, setLastName] = useState<string>('Sterling');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [selectedPassenger, setSelectedPassenger] = useState<PassengerResponse | null>(null);
  const [dangerousGoodsAccepted, setDangerousGoodsAccepted] = useState<boolean>(true);
  const [boardingPass, setBoardingPass] = useState<BoardingPass | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookupBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pnr || !lastName) {
      setError('Please provide Booking Reference and Passenger Surname.');
      return;
    }

    setLoading(true);
    setError(null);
    setBoardingPass(null);

    try {
      const res = await bookingService.lookupBooking(pnr.trim().toUpperCase(), lastName.trim());
      setBooking(res);
      if (res.passengers.length > 0) {
        setSelectedPassenger(res.passengers[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Booking not found or surname does not match.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPnr) {
      handleLookupBooking();
    }
  }, [initialPnr]);

  const handlePerformCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !selectedPassenger) return;

    if (!dangerousGoodsAccepted) {
      alert('You must acknowledge the civil aviation dangerous goods declaration.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bp = await checkInService.checkIn(
        booking.booking_reference,
        selectedPassenger.id,
        dangerousGoodsAccepted
      );
      setBoardingPass(bp);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Online check-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
            <CheckCircle className="w-3.5 h-3.5" />
            Online Check-In Open 48 Hours Prior
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Online Check-In & Boarding Pass</h1>
          <p className="text-xs text-slate-500 mt-1">
            Check-in online to confirm baggage safety, review seat allocations, and receive your digital boarding pass.
          </p>
        </div>

        {/* If boarding pass was generated, show it! */}
        {boardingPass ? (
          <div className="animate-fadeIn">
            <SimulatedBoardingPass pass={boardingPass} />
            <div className="text-center mt-6">
              <button
                onClick={() => setBoardingPass(null)}
                className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
              >
                &larr; Check-In Another Passenger
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Locate Itinerary */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                1. Locate Flight Itinerary
              </h3>

              <form onSubmit={handleLookupBooking} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Booking Reference (PNR)</label>
                  <input
                    type="text"
                    required
                    value={pnr}
                    onChange={(e) => setPnr(e.target.value.toUpperCase())}
                    placeholder="e.g. ALX701"
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Passenger Surname</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sterling"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Find Booking</span>
                  </button>
                </div>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Step 2: Passenger Selection & Safety Declaration */}
            {booking && (
              <form onSubmit={handlePerformCheckIn} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm animate-fadeIn space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">2. Select Passenger to Check In</h3>
                  <div className="space-y-2">
                    {booking.passengers.map((p) => {
                      const isSelected = selectedPassenger?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPassenger(p)}
                          className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-rose-50/60 border-aerolux-burgundy ring-2 ring-aerolux-burgundy/20'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-aerolux-burgundy text-white' : 'bg-slate-100 text-slate-500'}`}>
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{p.first_name} {p.last_name}</p>
                              <p className="text-xs text-slate-500">Passport: {p.passport_number} &bull; Meal: {p.meal_preference}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Seat</span>
                            <span className="text-base font-black font-mono text-aerolux-burgundy">{p.seat_number || 'Auto-assigning'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Safety Declaration */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>International Civil Aviation Dangerous Goods Declaration</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Passengers are strictly prohibited from carrying hazardous items in baggage, including loose lithium-ion battery packs exceeding 100Wh, compressed gases, flammable liquids, or toxic agents.
                  </p>
                  <label className="flex items-center gap-2 pt-2 cursor-pointer font-semibold text-amber-950">
                    <input
                      type="checkbox"
                      checked={dangerousGoodsAccepted}
                      onChange={(e) => setDangerousGoodsAccepted(e.target.checked)}
                      className="rounded text-aerolux-burgundy focus:ring-aerolux-burgundy w-4 h-4 cursor-pointer"
                    />
                    <span>I declare that I am carrying no restricted dangerous goods in my baggage.</span>
                  </label>
                </div>

                {/* Submit Check-In */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !dangerousGoodsAccepted}
                    className="px-8 py-3 rounded-xl bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 text-aerolux-gold" />
                    <span>{loading ? 'Issuing Boarding Pass...' : 'Complete Check-In & Generate Boarding Pass'}</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
