import React from 'react';
import { Plane, QrCode, Printer, AlertTriangle, ShieldCheck } from 'lucide-react';
import { BoardingPass } from '../../types';

export const SimulatedBoardingPass: React.FC<{ pass: BoardingPass }> = ({ pass }) => {
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto my-8">
      {/* Simulation Watermark Banner */}
      <div className="bg-amber-500/10 border-2 border-dashed border-amber-500/40 rounded-xl p-3 mb-6 flex items-center justify-between text-amber-900 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>
            SIMULATED DOCUMENT &bull; FOR PORTFOLIO DEMONSTRATION ONLY &bull; NOT A VALID AIRPORT TRAVEL CREDENTIAL
          </span>
        </div>
        <button
          onClick={handlePrint}
          className="bg-white hover:bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-300 text-amber-950 flex items-center gap-1.5 shadow-sm transition"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Pass</span>
        </button>
      </div>

      {/* Luxury Boarding Pass Body */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col md:flex-row print:shadow-none print:border-black">
        {/* Main Boarding Pass Section (Left 70%) */}
        <div className="flex-1 p-6 sm:p-8 border-b md:border-b-0 md:border-r border-dashed border-slate-300">
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-aerolux-burgundy flex items-center justify-center">
                <Plane className="w-5 h-5 text-aerolux-gold transform -rotate-45" />
              </div>
              <div>
                <h3 className="font-display text-xl font-black text-slate-900 tracking-wider">AEROLUX</h3>
                <p className="text-[10px] text-aerolux-burgundy font-bold uppercase tracking-widest">Imperial Boarding Pass</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-aerolux-burgundy text-white px-3 py-1 rounded text-xs font-black tracking-wider uppercase">
                {pass.cabin_class}
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-1">SEQ #{pass.sequence_number.toString().padStart(4, '0')}</p>
            </div>
          </div>

          {/* Passenger Name & Flight Route */}
          <div className="grid grid-cols-2 gap-4 my-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passenger Name</p>
              <p className="text-base font-black text-slate-900 font-mono uppercase tracking-tight">{pass.passenger_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flight Number</p>
              <p className="text-base font-black text-aerolux-burgundy font-mono tracking-tight">{pass.flight_number}</p>
            </div>
          </div>

          {/* Departure & Arrival Airports */}
          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between mb-6 border border-slate-100">
            <div>
              <span className="text-3xl font-black text-slate-900 font-mono">{pass.origin_iata}</span>
              <p className="text-xs font-semibold text-slate-600">{pass.origin_city}</p>
            </div>

            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(pass.departure_time)}</span>
              <div className="w-24 h-[2px] bg-aerolux-burgundy/40 relative my-1">
                <Plane className="w-3.5 h-3.5 text-aerolux-burgundy absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90" />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold uppercase">Non-Stop</span>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black text-slate-900 font-mono">{pass.destination_iata}</span>
              <p className="text-xs font-semibold text-slate-600">{pass.destination_city}</p>
            </div>
          </div>

          {/* Critical Boarding Details Grid */}
          <div className="grid grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-xl mb-6">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Terminal</p>
              <p className="text-lg font-black text-aerolux-gold font-mono">{pass.terminal}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Gate</p>
              <p className="text-lg font-black text-white font-mono">{pass.gate}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Boarding</p>
              <p className="text-lg font-black text-emerald-400 font-mono">{formatTime(pass.boarding_time)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Seat</p>
              <p className="text-lg font-black text-aerolux-gold font-mono">{pass.seat_number}</p>
            </div>
          </div>

          {/* Barcode Strip */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="font-mono text-xs text-slate-500 tracking-widest break-all">
              {pass.barcode_data}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              TOKEN: {pass.pass_token}
            </div>
          </div>
        </div>

        {/* Right Tear-off Stub (30%) */}
        <div className="w-full md:w-72 bg-slate-50/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="font-display font-bold text-slate-900 text-sm">AEROLUX</span>
              <span className="text-[10px] font-black uppercase text-aerolux-burgundy">{pass.cabin_class}</span>
            </div>

            <div className="my-4 space-y-2 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Passenger</span>
                <span className="font-bold text-slate-900 font-mono uppercase">{pass.passenger_name}</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Flight</span>
                  <span className="font-bold text-aerolux-burgundy font-mono">{pass.flight_number}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Date</span>
                  <span className="font-bold text-slate-800 font-mono">{formatDate(pass.departure_time)}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Route</span>
                  <span className="font-bold text-slate-800 font-mono">{pass.origin_iata} &rarr; {pass.destination_iata}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Gate</span>
                  <span className="font-bold text-slate-800 font-mono">{pass.gate}</span>
                </div>
              </div>
              <div className="p-2.5 bg-aerolux-burgundy text-white rounded-lg flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider">Seat Assignment</span>
                <span className="text-xl font-black font-mono text-aerolux-gold">{pass.seat_number}</span>
              </div>
            </div>
          </div>

          {/* QR Code Graphic & Verification */}
          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white p-2 border border-slate-300 rounded-lg shadow-inner flex items-center justify-center">
              <QrCode className="w-20 h-20 text-slate-900" />
            </div>
            <p className="text-[9px] text-slate-400 font-mono mt-2">DEMO BCBP SCAN READY</p>
          </div>
        </div>
      </div>
    </div>
  );
};
