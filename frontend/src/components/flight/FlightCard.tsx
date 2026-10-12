import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Clock, ShieldCheck, Luggage, RefreshCw, ChevronDown, ChevronUp, Check, ArrowRight } from 'lucide-react';
import { Flight, CabinClass, FareTierDetail } from '../../types';
import { FlightStatusBadge, CabinClassBadge } from '../common/StatusBadge';

interface FlightCardProps {
  flight: Flight;
  cabinClass: CabinClass;
  passengers: number;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, cabinClass, passengers }) => {
  const navigate = useNavigate();
  const [showFares, setShowFares] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<FareTierDetail | null>(
    flight.fare_tiers.length > 0 ? flight.fare_tiers[1] || flight.fare_tiers[0] : null
  );

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const handleProceedToBooking = (tier: FareTierDetail) => {
    navigate(`/booking?flight_id=${flight.id}&cabin_class=${cabinClass}&fare_tier=${tier.tier_name}&passengers=${passengers}`);
  };

  // Base price for display
  const startingPrice = flight.fare_tiers.length > 0
    ? Math.min(...flight.fare_tiers.map(t => t.total_price))
    : flight.price_economy;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all mb-4 overflow-hidden">
      {/* Flight Schedule Bar */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Airline & Aircraft details */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-aerolux-burgundy flex items-center justify-center shadow-inner">
              <Plane className="w-6 h-6 text-aerolux-gold transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">{flight.flight_number}</span>
                <FlightStatusBadge status={flight.status} delayMinutes={flight.delay_minutes} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {flight.aircraft.model} &bull; {flight.available_seats_count} seats left
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex-1 max-w-xl flex items-center justify-between gap-3">
            {/* Origin */}
            <div className="text-left min-w-[70px]">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">{formatTime(flight.departure_time)}</span>
              <p className="text-sm font-bold text-slate-700">{flight.route.origin_iata}</p>
              <p className="text-[11px] text-slate-500 truncate">{flight.route.origin_airport?.city}</p>
            </div>

            {/* Flight line graphic */}
            <div className="flex-1 px-4 flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatDuration(flight.duration_minutes)}
              </span>
              <div className="w-full relative flex items-center">
                <div className="w-2 h-2 rounded-full border-2 border-aerolux-burgundy bg-white"></div>
                <div className="flex-1 h-[2px] bg-slate-200 relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                    <Plane className="w-3.5 h-3.5 text-aerolux-burgundy transform rotate-90" />
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full border-2 border-aerolux-burgundy bg-aerolux-burgundy"></div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 mt-1 uppercase tracking-wider">Non-Stop Direct</span>
            </div>

            {/* Destination */}
            <div className="text-right min-w-[70px]">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">{formatTime(flight.arrival_time)}</span>
              <p className="text-sm font-bold text-slate-700">{flight.route.destination_iata}</p>
              <p className="text-[11px] text-slate-500 truncate">{flight.route.destination_airport?.city}</p>
            </div>
          </div>

          {/* Price & Action */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
            <div className="text-left sm:text-right">
              <p className="text-[11px] text-slate-500 font-medium">Starting from</p>
              <p className="text-2xl font-extrabold text-aerolux-burgundy font-mono tracking-tight">
                ${startingPrice.toFixed(0)} <span className="text-xs font-medium text-slate-500">USD</span>
              </p>
            </div>

            <button
              onClick={() => setShowFares(!showFares)}
              className="mt-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <span>{showFares ? 'Hide Fares' : 'View Fare Tiers'}</span>
              {showFares ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Fare Tiers Selection Drawer */}
      {showFares && (
        <div className="bg-slate-50 border-t border-slate-200/90 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CabinClassBadge cabinClass={cabinClass} />
              <h4 className="text-sm font-bold text-slate-800">Select your Fare Tier</h4>
            </div>
            <p className="text-xs text-slate-500">All prices include checked luggage & taxes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {flight.fare_tiers.map((tier) => {
              const isSelected = selectedTier?.tier_name === tier.tier_name;
              return (
                <div
                  key={tier.tier_name}
                  onClick={() => setSelectedTier(tier)}
                  className={`rounded-xl p-4 border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-aerolux-burgundy ring-2 ring-aerolux-burgundy/20 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                        {tier.tier_name.replace('_', ' ')}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{tier.description}</p>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-aerolux-burgundy text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="my-3 pb-3 border-b border-slate-100">
                    <span className="text-xl font-black text-slate-900 font-mono">
                      ${tier.total_price.toFixed(0)}
                    </span>
                    <span className="text-xs text-slate-500 font-normal"> / passenger</span>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <li className="flex items-center gap-2">
                      <Luggage className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tier.baggage_allowance}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tier.refundable ? 'Refundable fare' : 'Non-refundable'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tier.seat_selection_free ? 'Complimentary seat selection' : 'Seat selection from $15'}</span>
                    </li>
                  </ul>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProceedToBooking(tier);
                    }}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <span>Select {tier.tier_name.replace('_', ' ')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
