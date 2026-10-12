import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plane, Filter, ArrowUpDown, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { Flight, CabinClass } from '../types';
import { flightService } from '../services/api';
import { FlightCard } from '../components/flight/FlightCard';
import { FlightSearchWidget } from '../components/flight/FlightSearchWidget';

export const FlightResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const origin = searchParams.get('origin') || 'DXB';
  const destination = searchParams.get('destination') || 'LHR';
  const departureDate = searchParams.get('departure_date') || new Date().toISOString().split('T')[0];
  const cabinClass = (searchParams.get('cabin_class') as CabinClass) || 'ECONOMY';
  const passengers = Number(searchParams.get('passengers')) || 1;

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditSearch, setShowEditSearch] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'price' | 'departure' | 'duration'>('price');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await flightService.searchFlights({
          origin,
          destination,
          departure_date: departureDate,
          cabin_class: cabinClass,
          passengers
        });
        setFlights(data);
      } catch (err: any) {
        console.error('Error fetching search results', err);
        setError(err.response?.data?.detail || 'Failed to retrieve flight schedules. Please try another date or route.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [origin, destination, departureDate, cabinClass, passengers]);

  // Sort logic
  const sortedFlights = [...flights].sort((a, b) => {
    if (sortBy === 'price') {
      const priceA = a.fare_tiers.length > 0 ? a.fare_tiers[0].total_price : a.price_economy;
      const priceB = b.fare_tiers.length > 0 ? b.fare_tiers[0].total_price : b.price_economy;
      return priceA - priceB;
    } else if (sortBy === 'departure') {
      return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
    } else if (sortBy === 'duration') {
      return a.duration_minutes - b.duration_minutes;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Context Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-slate-900 font-mono">{origin}</span>
              <Plane className="w-5 h-5 text-aerolux-burgundy transform rotate-90" />
              <span className="text-2xl font-black text-slate-900 font-mono">{destination}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Date: <strong className="text-slate-800">{departureDate}</strong> &bull; Cabin: <strong className="text-slate-800">{cabinClass}</strong> &bull; Passengers: <strong className="text-slate-800">{passengers}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditSearch(!showEditSearch)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
            >
              {showEditSearch ? 'Close Search' : 'Modify Search'}
            </button>
          </div>
        </div>

        {/* Collapsible Edit Search Widget */}
        {showEditSearch && (
          <div className="mb-6 animate-fadeIn">
            <FlightSearchWidget
              initialValues={{ origin, destination, departure_date: departureDate, cabin_class: cabinClass, passengers }}
              compact
            />
          </div>
        )}

        {/* Sorting controls */}
        {!loading && flights.length > 0 && (
          <div className="flex justify-between items-center mb-4 text-xs">
            <p className="text-slate-500 font-medium">
              Found <strong className="text-slate-900">{flights.length}</strong> available flights
            </p>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="price">Lowest Price</option>
                <option value="departure">Earliest Departure</option>
                <option value="duration">Shortest Duration</option>
              </select>
            </div>
          </div>
        )}

        {/* Results List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="h-12 bg-slate-100 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No Flights Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-2.5 rounded-xl bg-aerolux-burgundy text-white font-bold text-xs shadow-sm hover:bg-aerolux-burgundy-light transition"
            >
              Search Alternative Route
            </button>
          </div>
        ) : flights.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Plane className="w-12 h-12 text-slate-300 mx-auto mb-4 transform -rotate-45" />
            <h3 className="text-lg font-bold text-slate-900">No scheduled flights on this date</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Please choose another date or check our flagship daily routes between DXB, LHR, JFK, SIN, and HND.
            </p>
            <button
              onClick={() => setShowEditSearch(true)}
              className="mt-6 px-6 py-2.5 rounded-xl bg-aerolux-burgundy text-white font-bold text-xs shadow-sm hover:bg-aerolux-burgundy-light transition"
            >
              Change Date
            </button>
          </div>
        ) : (
          <div>
            {sortedFlights.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                cabinClass={cabinClass}
                passengers={passengers}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
