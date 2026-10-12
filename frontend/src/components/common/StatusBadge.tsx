import React from 'react';
import { FlightStatus, BookingStatus, CabinClass } from '../../types';

export const FlightStatusBadge: React.FC<{ status: FlightStatus; delayMinutes?: number }> = ({ status, delayMinutes }) => {
  switch (status) {
    case 'SCHEDULED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Scheduled</span>;
    case 'BOARDING':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">Now Boarding</span>;
    case 'DEPARTED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">En Route</span>;
    case 'DELAYED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Delayed {delayMinutes ? `(+${delayMinutes}m)` : ''}
        </span>
      );
    case 'ARRIVED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Landed</span>;
    case 'CANCELLED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">Cancelled</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
  }
};

export const BookingStatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
  switch (status) {
    case 'CONFIRMED':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Confirmed</span>;
    case 'CANCELLED':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Cancelled</span>;
    case 'COMPLETED':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">Completed</span>;
    default:
      return <span>{status}</span>;
  }
};

export const CabinClassBadge: React.FC<{ cabinClass: CabinClass | string }> = ({ cabinClass }) => {
  switch (cabinClass) {
    case 'FIRST':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">First Class</span>;
    case 'BUSINESS':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wider uppercase bg-rose-100 text-rose-950 border border-rose-300">Business Class</span>;
    case 'PREMIUM_ECONOMY':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wider uppercase bg-indigo-100 text-indigo-900 border border-indigo-200">Prem. Economy</span>;
    case 'ECONOMY':
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium uppercase bg-slate-100 text-slate-700">Economy</span>;
  }
};
