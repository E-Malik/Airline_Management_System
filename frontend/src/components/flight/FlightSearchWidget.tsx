import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaneTakeoff, PlaneLanding, Calendar, Users, Armchair, ArrowRightLeft, Search } from 'lucide-react';
import { Airport, CabinClass } from '../../types';
import { flightService } from '../../services/api';

export const FlightSearchWidget: React.FC<{ initialValues?: any; compact?: boolean }> = ({ initialValues, compact }) => {
  const navigate = useNavigate();
  const [airports, setAirports] = useState<Airport[]>([]);
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [origin, setOrigin] = useState<string>(initialValues?.origin || 'DXB');
  const [destination, setDestination] = useState<string>(initialValues?.destination || 'LHR');
  
  // Format tomorrow as default date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];
  
  const [departureDate, setDepartureDate] = useState<string>(initialValues?.departure_date || defaultDateStr);
  const [cabinClass, setCabinClass] = useState<CabinClass>(initialValues?.cabin_class || 'ECONOMY');
  const [passengers, setPassengers] = useState<number>(initialValues?.passengers || 1);
  const [loadingAirports, setLoadingAirports] = useState<boolean>(true);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const data = await flightService.getAirports();
        setAirports(data);
      } catch (err) {
        console.error('Failed to load airports', err);
      } finally {
        setLoadingAirports(false);
      }
    };
    fetchAirports();
  }, []);

  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;
    if (origin === destination) {
      alert('Origin and destination airports must be different.');
      return;
    }

    const query = new URLSearchParams({
      origin,
      destination,
      departure_date: departureDate,
      cabin_class: cabinClass,
      passengers: passengers.toString(),
    });

    navigate(`/results?${query.toString()}`);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden ${compact ? 'p-4' : 'p-6 sm:p-8'}`}>
      {/* Search Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        {/* Trip type buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setTripType('one-way')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
              tripType === 'one-way' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            One Way
          </button>
          <button
            type="button"
            onClick={() => setTripType('round-trip')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
              tripType === 'round-trip' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Round Trip
          </button>
        </div>

        {/* Cabin Class & Passengers dropdowns */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
            <Armchair className="w-3.5 h-3.5 text-aerolux-burgundy" />
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as CabinClass)}
              className="bg-transparent focus:outline-none cursor-pointer text-xs font-semibold"
            >
              <option value="ECONOMY">Economy Class</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business Class</option>
              <option value="FIRST">First Class Suites</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
            <Users className="w-3.5 h-3.5 text-aerolux-burgundy" />
            <select
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="bg-transparent focus:outline-none cursor-pointer text-xs font-semibold"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Search Inputs Grid */}
      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Origin Airport */}
          <div className="md:col-span-4 relative bg-slate-50 hover:bg-slate-100/80 transition border border-slate-200 rounded-xl p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <PlaneTakeoff className="w-3.5 h-3.5 text-aerolux-burgundy" />
              Departure Airport
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              {airports.map((a) => (
                <option key={a.iata_code} value={a.iata_code}>
                  {a.city} ({a.iata_code}) - {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap button */}
          <div className="hidden md:flex md:col-span-1 justify-center -mx-3 z-10">
            <button
              type="button"
              onClick={handleSwapAirports}
              className="w-8 h-8 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-600 hover:text-aerolux-burgundy hover:border-aerolux-burgundy transition"
              title="Swap origin and destination"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination Airport */}
          <div className="md:col-span-4 relative bg-slate-50 hover:bg-slate-100/80 transition border border-slate-200 rounded-xl p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <PlaneLanding className="w-3.5 h-3.5 text-aerolux-burgundy" />
              Arrival Airport
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              {airports.map((a) => (
                <option key={a.iata_code} value={a.iata_code}>
                  {a.city} ({a.iata_code}) - {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="md:col-span-3 bg-slate-50 hover:bg-slate-100/80 transition border border-slate-200 rounded-xl p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-aerolux-burgundy" />
              Travel Date
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 text-aerolux-gold" />
            <span>Search Luxury Flights</span>
          </button>
        </div>
      </form>
    </div>
  );
};
