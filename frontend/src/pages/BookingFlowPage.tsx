import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Plane, User as UserIcon, Armchair, Luggage, CreditCard, CheckCircle2,
  AlertCircle, ChevronRight, Copy, Check, Sparkles, Shield
} from 'lucide-react';
import {
  Flight, CabinClass, SeatMapResponse, SeatItem,
  PassengerInput, AncillaryInput, AncillaryType, Booking
} from '../types';
import { flightService, seatService, bookingService } from '../services/api';
import { AircraftSeatMap } from '../components/seatmap/AircraftSeatMap';
import { useAuth } from '../context/AuthContext';

export const BookingFlowPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const flightId = Number(searchParams.get('flight_id'));
  const cabinClass = (searchParams.get('cabin_class') as CabinClass) || 'ECONOMY';
  const fareTier = searchParams.get('fare_tier') || 'FLEX';
  const passengerCount = Number(searchParams.get('passengers')) || 1;

  // Wizard Step: 1 = Passengers, 2 = Seats, 3 = Extras, 4 = Payment, 5 = Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [seatMap, setSeatMap] = useState<SeatMapResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form State: Contact
  const [contactName, setContactName] = useState<string>(user?.full_name || '');
  const [contactEmail, setContactEmail] = useState<string>(user?.email || '');
  const [contactPhone, setContactPhone] = useState<string>(user?.phone || '+971 50 123 4567');

  // Form State: Passengers
  const [passengers, setPassengers] = useState<PassengerInput[]>(() =>
    Array.from({ length: passengerCount }, (_, i) => ({
      first_name: i === 0 && user ? user.full_name.split(' ')[0] : '',
      last_name: i === 0 && user ? user.full_name.split(' ').slice(1).join(' ') || 'Traveler' : '',
      passport_number: '',
      nationality: 'AE',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      meal_preference: 'Standard',
      special_requests: ''
    }))
  );

  // Form State: Seat Selection (passengerIndex -> seatId)
  const [selectedSeatIds, setSelectedSeatIds] = useState<Record<number, number>>({});
  const [selectedSeatObjects, setSelectedSeatObjects] = useState<Record<number, SeatItem>>({});
  const [activePassengerIndex, setActivePassengerIndex] = useState<number>(0);

  // Form State: Ancillaries
  const [selectedAncillaries, setSelectedAncillaries] = useState<AncillaryInput[]>([]);

  // Form State: Payment
  const [cardNumber, setCardNumber] = useState<string>('4242424242424242');
  const [cardHolder, setCardHolder] = useState<string>(user?.full_name || 'Lord Sterling');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('123');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Confirmation result
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [copiedPnr, setCopiedPnr] = useState<boolean>(false);

  useEffect(() => {
    if (!flightId) {
      navigate('/');
      return;
    }

    const loadFlightData = async () => {
      setLoading(true);
      try {
        const [flightData, seatData] = await Promise.all([
          flightService.getFlight(flightId, cabinClass),
          seatService.getSeatMap(flightId)
        ]);
        setFlight(flightData);
        setSeatMap(seatData);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load flight and seat configuration.');
      } finally {
        setLoading(false);
      }
    };

    loadFlightData();
  }, [flightId, cabinClass, navigate]);

  const handlePassengerChange = (index: number, field: keyof PassengerInput, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleSeatSelect = (passengerIdx: number, seat: SeatItem) => {
    setSelectedSeatIds((prev) => ({ ...prev, [passengerIdx]: seat.id }));
    setSelectedSeatObjects((prev) => ({ ...prev, [passengerIdx]: seat }));

    // Auto-advance to next passenger if more exist
    if (passengerIdx < passengerCount - 1) {
      setActivePassengerIndex(passengerIdx + 1);
    }
  };

  const toggleAncillary = (serviceType: AncillaryType, description: string) => {
    const exists = selectedAncillaries.some((a) => a.service_type === serviceType);
    if (exists) {
      setSelectedAncillaries(selectedAncillaries.filter((a) => a.service_type !== serviceType));
    } else {
      setSelectedAncillaries([...selectedAncillaries, { service_type: serviceType, description }]);
    }
  };

  const handleQuickFillCard = () => {
    setCardNumber('4242424242424242');
    setCardHolder(contactName || 'Alexander Sterling');
    setCardExpiry('12/28');
    setCardCvv('789');
  };

  // Price calculations
  const calculateEstimatedTotal = () => {
    if (!flight) return 0;
    const tier = flight.fare_tiers.find((t) => t.tier_name === fareTier);
    const baseFare = tier ? tier.total_price : flight.price_economy;
    const passengersBase = baseFare * passengerCount;

    // Extra seat charges
    const seatCharges = Object.values(selectedSeatObjects).reduce((acc, s) => acc + s.extra_charge, 0);

    // Ancillaries
    const ancillariesTotal = selectedAncillaries.length * 50; // standard approx

    // Tax 12% + $45 fuel surcharge per pax
    const taxes = passengersBase * 0.12 + 45 * passengerCount;

    return passengersBase + seatCharges + ancillariesTotal + taxes;
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const finalPassengers = passengers.map((p, idx) => ({
        ...p,
        seat_id: selectedSeatIds[idx] || undefined
      }));

      const res = await bookingService.createBooking({
        flight_id: flightId,
        cabin_class: cabinClass,
        fare_tier: fareTier,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        passengers: finalPassengers,
        ancillaries: selectedAncillaries,
        payment: {
          card_number: cardNumber.replace(/\s+/g, ''),
          card_holder: cardHolder,
          expiry: cardExpiry,
          cvv: cardCvv
        }
      });

      setConfirmedBooking(res);
      setCurrentStep(5);
    } catch (err: any) {
      console.error('Booking submission failed', err);
      setError(err.response?.data?.detail || 'Booking confirmation failed. Please check seat selection or details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-aerolux-burgundy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-slate-700">Loading flight reservation engine...</p>
        </div>
      </div>
    );
  }

  if (error && !flight) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-900">{error}</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-aerolux-burgundy text-white font-bold text-xs"
        >
          Return to Flight Search
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Step Indicator Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-sm mb-6">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-aerolux-burgundy' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${currentStep >= 1 ? 'bg-aerolux-burgundy text-white' : 'bg-slate-100 text-slate-400'}`}>
                1
              </div>
              <span className="hidden sm:inline">Passengers</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300" />

            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-aerolux-burgundy' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${currentStep >= 2 ? 'bg-aerolux-burgundy text-white' : 'bg-slate-100 text-slate-400'}`}>
                2
              </div>
              <span className="hidden sm:inline">Seats</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300" />

            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-aerolux-burgundy' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${currentStep >= 3 ? 'bg-aerolux-burgundy text-white' : 'bg-slate-100 text-slate-400'}`}>
                3
              </div>
              <span className="hidden sm:inline">Ancillaries</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300" />

            <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-aerolux-burgundy' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${currentStep >= 4 ? 'bg-aerolux-burgundy text-white' : 'bg-slate-100 text-slate-400'}`}>
                4
              </div>
              <span className="hidden sm:inline">Review & Pay</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl mb-6 flex items-center gap-3 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: PASSENGERS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Primary Contact Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Alexander Sterling"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Email Address (For Confirmation & E-Ticket)</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. guest@example.com"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mobile Telephone</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {passengers.map((p, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <UserIcon className="w-4 h-4 text-aerolux-burgundy" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Passenger {idx + 1} of {passengerCount} Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">First Given Name(s)</label>
                    <input
                      type="text"
                      required
                      value={p.first_name}
                      onChange={(e) => handlePassengerChange(idx, 'first_name', e.target.value)}
                      placeholder="As shown on Passport"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Last / Surname</label>
                    <input
                      type="text"
                      required
                      value={p.last_name}
                      onChange={(e) => handlePassengerChange(idx, 'last_name', e.target.value)}
                      placeholder="Surname"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Passport Number</label>
                    <input
                      type="text"
                      required
                      value={p.passport_number}
                      onChange={(e) => handlePassengerChange(idx, 'passport_number', e.target.value)}
                      placeholder="Passport ID (e.g. GB998822)"
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nationality</label>
                    <input
                      type="text"
                      required
                      value={p.nationality}
                      onChange={(e) => handlePassengerChange(idx, 'nationality', e.target.value)}
                      placeholder="Country code or name (e.g. AE, GB, US)"
                      className="w-full px-3 py-2 border rounded-lg text-sm uppercase focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Meal Preference</label>
                    <select
                      value={p.meal_preference}
                      onChange={(e) => handlePassengerChange(idx, 'meal_preference', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                    >
                      <option value="Standard">Standard Chef Special</option>
                      <option value="Vegetarian">Vegetarian Jain / Lacto</option>
                      <option value="Halal">Certified Halal Gourmet</option>
                      <option value="Kosher">Glatt Kosher</option>
                      <option value="Gluten-Free">Gluten-Free Dining</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Special Assistance</label>
                    <input
                      type="text"
                      value={p.special_requests || ''}
                      onChange={(e) => handlePassengerChange(idx, 'special_requests', e.target.value)}
                      placeholder="e.g. Wheelchair, bassinet"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!contactName || !contactEmail) {
                    alert('Please enter contact name and email.');
                    return;
                  }
                  for (let i = 0; i < passengers.length; i++) {
                    if (!passengers[i].first_name || !passengers[i].last_name || !passengers[i].passport_number) {
                      alert(`Please complete name and passport details for Passenger ${i + 1}.`);
                      return;
                    }
                  }
                  setCurrentStep(2);
                }}
                className="px-8 py-3 rounded-xl bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white text-xs font-bold shadow-md"
              >
                Continue to Seat Selection &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SEAT SELECTION */}
        {currentStep === 2 && seatMap && (
          <div className="space-y-6">
            {/* Passenger Selector Tabs */}
            <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-slate-200">
              {passengers.map((p, idx) => {
                const assignedSeat = selectedSeatObjects[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePassengerIndex(idx)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                      activePassengerIndex === idx
                        ? 'bg-aerolux-burgundy text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{p.first_name || `Passenger ${idx + 1}`}</span>
                    <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                      {assignedSeat ? assignedSeat.seat_number : 'Unassigned'}
                    </span>
                  </button>
                );
              })}
            </div>

            <AircraftSeatMap
              seatMap={seatMap}
              activePassengerIndex={activePassengerIndex}
              passengerNames={passengers.map((p) => `${p.first_name} ${p.last_name}`)}
              selectedSeatIds={selectedSeatIds}
              onSeatSelect={handleSeatSelect}
              allowedCabinClass={cabinClass}
            />

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Back to Passengers
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-8 py-3 rounded-xl bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white text-xs font-bold shadow-md"
              >
                Continue to Ancillary Services &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ANCILLARIES */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-2">Enhance Your Imperial Journey</h3>
              <p className="text-xs text-slate-500 mb-6">Select optional extras to tailor your airport and inflight comfort.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Extra Baggage */}
                <div
                  onClick={() => toggleAncillary('EXTRA_BAGGAGE', 'Additional 23kg Checked Bag')}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-4 ${
                    selectedAncillaries.some((a) => a.service_type === 'EXTRA_BAGGAGE')
                      ? 'bg-rose-50 border-aerolux-burgundy ring-2 ring-aerolux-burgundy/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <Luggage className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-900">Additional Checked Bag (23kg)</h4>
                      <span className="text-xs font-bold text-slate-900 font-mono">+$50 USD</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Pre-purchase extra luggage allowance and save up to 40% compared to airport rates.</p>
                  </div>
                </div>

                {/* SkyLounge Pass */}
                <div
                  onClick={() => toggleAncillary('LOUNGE_ACCESS', 'Flagship SkyLounge Pass at DXB Terminal 3')}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-4 ${
                    selectedAncillaries.some((a) => a.service_type === 'LOUNGE_ACCESS')
                      ? 'bg-rose-50 border-aerolux-burgundy ring-2 ring-aerolux-burgundy/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-900">SkyLounge Flagship Pass</h4>
                      <span className="text-xs font-bold text-slate-900 font-mono">+$60 USD</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Buffet dining, barista coffee, shower suites, and quiet resting pods prior to departure.</p>
                  </div>
                </div>

                {/* Gourmet Dining */}
                <div
                  onClick={() => toggleAncillary('MEAL_UPGRADE', "Sommelier & Chef's Reserve Dining Upgrade")}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-4 ${
                    selectedAncillaries.some((a) => a.service_type === 'MEAL_UPGRADE')
                      ? 'bg-rose-50 border-aerolux-burgundy ring-2 ring-aerolux-burgundy/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-900">Chef's Reserve Dining Upgrade</h4>
                      <span className="text-xs font-bold text-slate-900 font-mono">+$25 USD</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Four-course signature dinner served with vintage dessert pairing and confectionery.</p>
                  </div>
                </div>

                {/* Priority Boarding */}
                <div
                  onClick={() => toggleAncillary('PRIORITY_BOARDING', 'Zone 1 Priority Check-in & Boarding')}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-4 ${
                    selectedAncillaries.some((a) => a.service_type === 'PRIORITY_BOARDING')
                      ? 'bg-rose-50 border-aerolux-burgundy ring-2 ring-aerolux-burgundy/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-900">Priority Security & Boarding</h4>
                      <span className="text-xs font-bold text-slate-900 font-mono">+$20 USD</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Fast-track dedicated security screening lane and Group 1 early aircraft boarding.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Back to Seats
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-8 py-3 rounded-xl bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white text-xs font-bold shadow-md"
              >
                Proceed to Review & Payment &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & SIMULATED PAYMENT */}
        {currentStep === 4 && flight && (
          <form onSubmit={handleSubmitBooking} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Simulated Payment Form */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-aerolux-burgundy" />
                    <h3 className="text-base font-bold text-slate-900">Simulated Payment Processing</h3>
                  </div>
                  {/* Quick Fill Button */}
                  <button
                    type="button"
                    onClick={handleQuickFillCard}
                    className="text-xs font-bold text-aerolux-burgundy bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-md border border-rose-200 transition"
                  >
                    1-Click Fill Demo Card
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mb-6">
                  <p className="font-semibold">Simulated Environment Notice</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    This is a secure portfolio simulation. No real financial charges occur. Do NOT enter real credit cards.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Simulated Card Number</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full px-3 py-2.5 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Cardholder Full Name</label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Lord Sterling"
                      className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Expiry Date (MM/YY)</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full px-3 py-2.5 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Security CVV</label>
                      <input
                        type="text"
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        className="w-full px-3 py-2.5 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Server-Calculated Fare Summary */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                    Booking Fare Breakdown
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Flight {flight.flight_number} ({passengerCount}x {cabinClass} {fareTier})</span>
                      <span className="font-mono font-bold text-slate-900">
                        ${(flight.price_economy * passengerCount).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Assigned Seats ({passengerCount} seats)</span>
                      <span className="font-mono font-bold text-slate-900">
                        ${Object.values(selectedSeatObjects).reduce((acc, s) => acc + s.extra_charge, 0).toFixed(2)}
                      </span>
                    </div>

                    {selectedAncillaries.length > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Ancillary Add-ons ({selectedAncillaries.length})</span>
                        <span className="font-mono font-bold text-slate-900">
                          ${(selectedAncillaries.length * 50).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>Airport Authority Taxes & Fuel Surcharge</span>
                      <span className="font-mono font-bold text-slate-900">
                        ${((flight.price_economy * passengerCount * 0.12) + (45 * passengerCount)).toFixed(2)}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-slate-900">Total Authoritative Price</span>
                      <span className="text-2xl font-black text-aerolux-burgundy font-mono">
                        ${calculateEstimatedTotal().toFixed(2)} <span className="text-xs text-slate-500 font-normal">USD</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Verifying & Locking Seats...</span>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 text-aerolux-gold" />
                        <span>Confirm & Authorize Reservation</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
                    Protected by atomic database transaction &amp; concurrency locking.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Back to Ancillaries
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: CONFIRMATION */}
        {currentStep === 5 && confirmedBooking && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl max-w-3xl mx-auto text-center animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Booking Confirmed</span>
            <h2 className="font-display text-3xl font-bold text-slate-900 mt-1 mb-2">Welcome Aboard AeroLux</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              Your flight reservation has been transactionally confirmed and recorded in PostgreSQL. An e-ticket receipt was generated.
            </p>

            {/* PNR Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md mx-auto mb-8">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking Reference (PNR)</p>
              <div className="flex items-center justify-center gap-3 my-2">
                <span className="text-4xl font-black font-mono tracking-widest text-aerolux-burgundy">
                  {confirmedBooking.booking_reference}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(confirmedBooking.booking_reference);
                    setCopiedPnr(true);
                    setTimeout(() => setCopiedPnr(false), 2000);
                  }}
                  className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 transition"
                  title="Copy PNR"
                >
                  {copiedPnr ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Contact: <strong className="text-slate-800">{confirmedBooking.contact_email}</strong>
              </p>
            </div>

            {/* Flight Summary Box */}
            <div className="bg-slate-900 text-white rounded-xl p-5 text-left mb-8 max-w-md mx-auto">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
                <span className="font-bold text-sm text-aerolux-gold">{confirmedBooking.flight.flight_number}</span>
                <span className="text-xs font-mono text-slate-400">{confirmedBooking.flight.status}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span>{confirmedBooking.flight.origin_iata}</span>
                <span className="text-slate-500 font-normal">&rarr;</span>
                <span>{confirmedBooking.flight.destination_iata}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                <span>Total Paid:</span>
                <span className="font-mono font-bold text-white">${confirmedBooking.total_fare.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to={`/checkin?pnr=${confirmedBooking.booking_reference}`}
                className="px-6 py-3 rounded-xl bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white font-bold text-xs shadow-md transition"
              >
                Proceed to Online Check-In
              </Link>
              <Link
                to="/lookup"
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
              >
                View in Booking Lookup
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
