import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Award, Sparkles, Shield, Wifi, Coffee, Utensils, Compass, ArrowRight } from 'lucide-react';
import { FlightSearchWidget } from '../components/flight/FlightSearchWidget';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const destinations = [
    {
      city: 'London Heathrow',
      code: 'LHR',
      country: 'United Kingdom',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
      price: '$750',
      cabin: 'Boeing 777-300ER'
    },
    {
      city: 'Tokyo Haneda',
      code: 'HND',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
      price: '$840',
      cabin: 'Airbus A350-900'
    },
    {
      city: 'Singapore Changi',
      code: 'SIN',
      country: 'Singapore',
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
      price: '$620',
      cabin: 'Airbus A380-800'
    },
    {
      city: 'New York JFK',
      code: 'JFK',
      country: 'United States',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
      price: '$950',
      cabin: 'Boeing 777-300ER'
    },
    {
      city: 'Paris Charles de Gaulle',
      code: 'CDG',
      country: 'France',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
      price: '$680',
      cabin: 'Airbus A350-900'
    },
    {
      city: 'Sydney Kingsford',
      code: 'SYD',
      country: 'Australia',
      image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
      price: '$1,100',
      cabin: 'Airbus A380-800'
    }
  ];

  const handleQuickBook = (destCode: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    navigate(`/results?origin=DXB&destination=${destCode}&departure_date=${dateStr}&cabin_class=ECONOMY&passengers=1`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative bg-aerolux-burgundy text-white overflow-hidden py-16 sm:py-24">
        {/* Subtle patterned backdrop */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-900/60 border border-rose-700/60 text-aerolux-gold text-xs font-bold tracking-widest uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              The Pinnacle of International Flight
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-4">
              Fly in Unrivaled Luxury with AeroLux
            </h1>
            <p className="text-base sm:text-lg text-rose-100 font-light leading-relaxed">
              Experience the world's most sophisticated long-haul journeys. Connecting Dubai to London, New York, Tokyo, and Sydney with private suites and Michelin-inspired gastronomy.
            </p>
          </div>

          {/* Search Widget floating in hero */}
          <div className="max-w-5xl mx-auto">
            <FlightSearchWidget />
          </div>
        </div>
      </div>

      {/* Luxury Fleet Showcase */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl font-bold text-slate-900">The AeroLux Imperial Fleet</h2>
            <p className="text-sm text-slate-500 mt-2">
              Engineered for seamless long-range comfort across continents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="aerolux-card p-6 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-aerolux-burgundy/10 flex items-center justify-center text-aerolux-burgundy mb-4">
                <Plane className="w-6 h-6 transform -rotate-45" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Airbus A380-800 Flagship</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Double-deck superjumbo featuring onboard shower spas and the iconic upper-deck SkyLounge.</p>
              <div className="text-xs font-semibold text-aerolux-burgundy flex items-center gap-1">
                <span>14 First Suites &bull; 76 Business Lie-Flat</span>
              </div>
            </div>

            <div className="aerolux-card p-6 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 mb-4">
                <Plane className="w-6 h-6 transform -rotate-45" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Boeing 777-300ER Triple Seven</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Twin-engine long-range widebody with fully enclosed First Class private suites with virtual windows.</p>
              <div className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                <span>Ultra Long Range &bull; Game-Changer Cabin</span>
              </div>
            </div>

            <div className="aerolux-card p-6 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4">
                <Plane className="w-6 h-6 transform -rotate-45" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Airbus A350-900 XWB</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Advanced composite aerodynamics with hospital-grade HEPA filtered cabin air renewed every 2 minutes.</p>
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <span>Whisper-Quiet Cabin &bull; 25% Lower Emissions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Global Destinations */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl font-bold text-slate-900">Featured Global Destinations</h2>
            <p className="text-sm text-slate-500 mt-1">Direct flagship routes from Dubai International Hub (DXB)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((d) => (
            <div
              key={d.code}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              onClick={() => handleQuickBook(d.code)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={d.image}
                  alt={d.city}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-black px-2.5 py-1 rounded-md shadow-sm">
                  {d.code}
                </div>
                <div className="absolute bottom-3 left-4 text-white">
                  <h3 className="font-bold text-lg leading-tight">{d.city}</h3>
                  <p className="text-xs text-slate-300 font-light">{d.country}</p>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between bg-white">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">{d.cabin}</p>
                  <p className="text-sm font-black text-aerolux-burgundy">
                    From {d.price} <span className="text-[10px] font-normal text-slate-500">USD</span>
                  </p>
                </div>
                <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-aerolux-burgundy group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Guest Experience Pillars */}
      <section className="py-16 bg-slate-100/60 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl font-bold text-slate-900">The AeroLux Standard</h2>
            <p className="text-sm text-slate-500 mt-2">Every detail curated to elevate your journey above the clouds.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Gourmet Dining</h4>
              <p className="text-xs text-slate-500">Multi-course menus prepared with regionally inspired seasonal ingredients.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-aerolux-burgundy flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">SkyNet High-Speed Wi-Fi</h4>
              <p className="text-xs text-slate-500">Satellite connectivity for streaming, work, and messaging throughout your flight.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">SkyLounge Access</h4>
              <p className="text-xs text-slate-500">Relax in private flagship lounges in Dubai, London, New York, and Singapore.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Guaranteed Integrity</h4>
              <p className="text-xs text-slate-500">Transactional seat allocation & instant simulated boarding pass generation.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
