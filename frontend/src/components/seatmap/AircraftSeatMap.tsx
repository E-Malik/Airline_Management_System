import React from 'react';
import { Armchair, Sparkles, AlertCircle, Check, Info } from 'lucide-react';
import { SeatMapResponse, SeatItem, CabinClass } from '../../types';

interface AircraftSeatMapProps {
  seatMap: SeatMapResponse;
  activePassengerIndex: number;
  passengerNames: string[];
  selectedSeatIds: Record<number, number>; // passengerIndex -> seatId
  onSeatSelect: (passengerIndex: number, seat: SeatItem) => void;
  allowedCabinClass: CabinClass;
}

export const AircraftSeatMap: React.FC<AircraftSeatMapProps> = ({
  seatMap,
  activePassengerIndex,
  passengerNames,
  selectedSeatIds,
  onSeatSelect,
  allowedCabinClass
}) => {
  // Find which seats are currently selected across all passengers
  const currentlySelectedIds = new Set(Object.values(selectedSeatIds));

  // Determine if a seat is selected by the active passenger
  const activePassengerSeatId = selectedSeatIds[activePassengerIndex];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Select Seat for <span className="text-aerolux-burgundy">{passengerNames[activePassengerIndex] || `Passenger ${activePassengerIndex + 1}`}</span>
          </h3>
          <p className="text-xs text-slate-500">
            Aircraft: <strong className="text-slate-800">{seatMap.aircraft_model}</strong> &bull; Total {seatMap.total_seats} seats
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border border-slate-300 bg-white"></div>
            <span className="text-slate-600">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-aerolux-burgundy text-white flex items-center justify-center text-[10px]">
              <Check className="w-3 h-3" />
            </div>
            <span className="text-slate-600 font-medium">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-slate-200 text-slate-400 flex items-center justify-center text-[10px]">
              &times;
            </div>
            <span className="text-slate-600">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border-2 border-amber-400 bg-amber-50"></div>
            <span className="text-slate-600">Extra Legroom</span>
          </div>
        </div>
      </div>

      {/* Aircraft Fuselage Graphic Body */}
      <div className="mt-6 flex flex-col items-center">
        {/* Cockpit / Nose Cone */}
        <div className="w-36 h-20 rounded-t-full border-t-4 border-l-4 border-r-4 border-slate-300 bg-gradient-to-b from-slate-100 to-white flex items-center justify-center shadow-inner mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flight Deck</span>
        </div>

        {/* Cabins Container */}
        <div className="w-full max-w-2xl border-l-4 border-r-4 border-slate-300 bg-slate-50/50 p-4 sm:p-6 rounded-lg space-y-8">
          {Object.entries(seatMap.cabins).map(([cabinName, cabin]) => {
            const isTargetCabin = cabin.cabin_class === allowedCabinClass;

            return (
              <div
                key={cabinName}
                className={`p-4 rounded-xl transition-all ${
                  isTargetCabin
                    ? 'bg-white border-2 border-aerolux-burgundy/30 shadow-sm'
                    : 'bg-slate-100/60 opacity-60 pointer-events-none border border-slate-200'
                }`}
              >
                {/* Cabin Class Divider */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-aerolux-gold" />
                    {cabinName.replace('_', ' ')}
                  </span>
                  {!isTargetCabin && (
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-200 px-2 py-0.5 rounded">
                      Reserved for {cabinName.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Column Headers (A, B, C ... H, J, K) */}
                <div className="flex justify-center mb-2">
                  <div className="grid grid-flow-col auto-cols-max gap-2 text-center text-xs font-bold text-slate-400">
                    {cabin.columns.map((col, idx) => (
                      <span key={idx} className="w-8">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rows Grid */}
                <div className="space-y-2">
                  {cabin.rows.map((row) => (
                    <div key={row.row_num} className="flex items-center justify-center gap-2">
                      {/* Row Number Left */}
                      <span className="w-6 text-right text-xs font-mono font-bold text-slate-400">
                        {row.row_num}
                      </span>

                      {/* Row Seats */}
                      <div className="grid grid-flow-col auto-cols-max gap-2">
                        {row.seats.map((seat, seatIdx) => {
                          if (!seat) {
                            // Aisle space
                            return <div key={`aisle-${seatIdx}`} className="w-4" />;
                          }

                          const isOccupied = !seat.is_available;
                          const isSelectedByCurrent = seat.id === activePassengerSeatId;
                          const isSelectedByOther = currentlySelectedIds.has(seat.id) && !isSelectedByCurrent;
                          const isSelectable = isTargetCabin && !isOccupied && !isSelectedByOther;

                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={!isSelectable}
                              onClick={() => isSelectable && onSeatSelect(activePassengerIndex, seat)}
                              title={`Seat ${seat.seat_number}${seat.extra_charge > 0 ? ` (+$${seat.extra_charge})` : ''}`}
                              className={`w-8 h-9 rounded-md flex flex-col items-center justify-center text-[10px] font-bold transition-all relative ${
                                isSelectedByCurrent
                                  ? 'bg-aerolux-burgundy text-white shadow-md ring-2 ring-aerolux-burgundy/40 scale-105'
                                  : isSelectedByOther
                                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                  : isOccupied
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                  : seat.is_extra_legroom
                                  ? 'bg-amber-50 text-amber-900 border-2 border-amber-400 hover:bg-amber-100 hover:scale-105'
                                  : 'bg-white text-slate-800 border border-slate-300 hover:border-aerolux-burgundy hover:text-aerolux-burgundy hover:scale-105'
                              }`}
                            >
                              <span>{seat.col_letter}</span>
                              {seat.extra_charge > 0 && !isSelectedByCurrent && (
                                <span className="text-[8px] text-amber-600 font-mono font-semibold">+${seat.extra_charge}</span>
                              )}
                              {isSelectedByCurrent && <Check className="w-3 h-3 text-aerolux-gold mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Row Number Right */}
                      <span className="w-6 text-left text-xs font-mono font-bold text-slate-400">
                        {row.row_num}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
