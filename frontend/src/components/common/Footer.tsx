import React from 'react';
import { Plane, ShieldCheck, Globe, Award, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-aerolux-charcoal text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-aerolux-burgundy flex items-center justify-center">
                <Plane className="w-5 h-5 text-aerolux-gold transform -rotate-45" />
              </div>
              <span className="font-display text-xl font-bold text-white tracking-wider">AEROLUX</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The pinnacle of international flight. Delivering unparalleled luxury, cutting-edge widebody fleet engineering, and bespoke guest experiences across six continents.
            </p>
            <div className="flex items-center gap-2 text-xs text-aerolux-gold font-medium">
              <Award className="w-4 h-4" />
              <span>World's Leading First Class Cabin 2026</span>
            </div>
          </div>

          {/* Quick Hub Routes */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs mb-4">Flagship Routes</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-white transition">Dubai (DXB) &harr; London Heathrow (LHR)</span></li>
              <li><span className="hover:text-white transition">Dubai (DXB) &harr; New York (JFK)</span></li>
              <li><span className="hover:text-white transition">Dubai (DXB) &harr; Singapore Changi (SIN)</span></li>
              <li><span className="hover:text-white transition">Dubai (DXB) &harr; Tokyo Haneda (HND)</span></li>
              <li><span className="hover:text-white transition">Dubai (DXB) &harr; Sydney Kingsford (SYD)</span></li>
            </ul>
          </div>

          {/* Flight Experience */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs mb-4">Travel Experience</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-white transition">First Class Private Suites</span></li>
              <li><span className="hover:text-white transition">Business Lie-Flat Experience</span></li>
              <li><span className="hover:text-white transition">Gourmet In-Flight Dining</span></li>
              <li><span className="hover:text-white transition">Airbus A380 SkyLounge</span></li>
              <li><span className="hover:text-white transition">Chauffeured Airport Concierge</span></li>
            </ul>
          </div>

          {/* Portfolio & Architecture Notice */}
          <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-white mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Portfolio & Simulation Notice</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              This application is an original software engineering platform built with FastAPI, PostgreSQL, and React. All flights, bookings, payments, and boarding passes are simulated.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">
              Hybrid MVC &bull; Transactional Outbox EDA &bull; JWT Auth
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} AeroLux Airlines International. All rights reserved.</p>
          <div className="flex space-x-6 text-[11px]">
            <span>Conditions of Carriage</span>
            <span>Privacy Policy</span>
            <span>Simulated System Disclaimer</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
