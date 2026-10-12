import React, { useState, useEffect } from 'react';
import {
  Shield, Plane, Users, BarChart3, History, Edit3, Plus,
  AlertCircle, CheckCircle, RefreshCw, X, TrendingUp, DollarSign
} from 'lucide-react';
import {
  Flight, FlightStatus, FlightManifest, AuditLog,
  AnalyticsOverview, NotificationLog
} from '../types';
import { adminService, analyticsService } from '../services/api';
import { FlightStatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const AdminDashboardPage: React.FC = () => {
  const { user, role } = useAuth();

  const [activeTab, setActiveTab] = useState<'flights' | 'manifest' | 'analytics' | 'audit'>('flights');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Flight Status Modal State
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [newStatus, setNewStatus] = useState<FlightStatus>('SCHEDULED');
  const [delayMinutes, setDelayMinutes] = useState<number>(0);
  const [gate, setGate] = useState<string>('');
  const [terminal, setTerminal] = useState<string>('');
  const [updatingFlight, setUpdatingFlight] = useState<boolean>(false);

  // Manifest Modal State
  const [manifestFlightId, setManifestFlightId] = useState<number | null>(null);
  const [manifestData, setManifestData] = useState<FlightManifest | null>(null);
  const [loadingManifest, setLoadingManifest] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [flightsData, analyticsData, auditData] = await Promise.all([
        adminService.getFlights(),
        analyticsService.getOverview().catch(() => null),
        adminService.getAuditLogs().catch(() => [])
      ]);
      setFlights(flightsData);
      setAnalytics(analyticsData);
      setAuditLogs(auditData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load administrative control center.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenStatusModal = (f: Flight) => {
    setSelectedFlight(f);
    setNewStatus(f.status);
    setDelayMinutes(f.delay_minutes);
    setGate(f.gate);
    setTerminal(f.terminal);
  };

  const handleSaveFlightStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlight) return;
    setUpdatingFlight(true);
    try {
      await adminService.updateFlightStatus(selectedFlight.id, {
        status: newStatus,
        delay_minutes: Number(delayMinutes),
        gate,
        terminal
      });
      setSelectedFlight(null);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update flight status.');
    } finally {
      setUpdatingFlight(false);
    }
  };

  const handleViewManifest = async (flightId: number) => {
    setManifestFlightId(flightId);
    setLoadingManifest(true);
    try {
      const m = await adminService.getManifest(flightId);
      setManifestData(m);
    } catch (err: any) {
      alert('Failed to load passenger manifest.');
    } finally {
      setLoadingManifest(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Ops Header */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                AeroLux OCC &bull; Operations Control Center
              </span>
            </div>
            <h1 className="text-2xl font-bold font-display text-white">Operations &amp; Admin Hub</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Role: <strong className="text-aerolux-gold">{role}</strong> &bull; Authenticated as {user?.email}
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Operations</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('flights')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'flights' ? 'bg-aerolux-burgundy text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>Flight Operations ({flights.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'analytics' ? 'bg-aerolux-burgundy text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics &amp; Load Factor</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'audit' ? 'bg-aerolux-burgundy text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>System Audit &amp; Event Trail ({auditLogs.length})</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: FLIGHT OPERATIONS TABLE */}
        {activeTab === 'flights' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">Flight</th>
                    <th className="px-6 py-4">Route</th>
                    <th className="px-6 py-4">Aircraft</th>
                    <th className="px-6 py-4">Departure (UTC)</th>
                    <th className="px-6 py-4">Gate &bull; Term</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {flights.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-black font-mono text-slate-900">{f.flight_number}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">{f.route.origin_iata} &rarr; {f.route.destination_iata}</span>
                        <span className="block text-[11px] text-slate-400">{f.route.distance_km} km</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{f.aircraft.model}</td>
                      <td className="px-6 py-4 font-mono text-slate-800">
                        {new Date(f.departure_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-900">Gate {f.gate}</span>
                        <span className="text-slate-500 block text-[11px]">T{f.terminal}</span>
                      </td>
                      <td className="px-6 py-4">
                        <FlightStatusBadge status={f.status} delayMinutes={f.delay_minutes} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleViewManifest(f.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition"
                        >
                          Manifest
                        </button>
                        <button
                          onClick={() => handleOpenStatusModal(f)}
                          className="px-2.5 py-1.5 rounded-lg bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white font-bold transition shadow-sm"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS OVERVIEW */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Booked Revenue</span>
                <p className="text-2xl font-black font-mono text-aerolux-burgundy mt-1">
                  ${analytics.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Live transactional records</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Fleet Load Factor</span>
                <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                  {analytics.fleet_load_factor}%
                </p>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Capacity occupancy across fleet</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Confirmed Bookings</span>
                <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                  {analytics.total_bookings}
                </p>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Unique PNR reservations</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Passengers Traveled</span>
                <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                  {analytics.total_passengers}
                </p>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Across all cabin classes</span>
              </div>
            </div>

            {/* Top Routes & Cabin Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Routes */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                  Most Popular Flight Routes
                </h3>
                <div className="space-y-3">
                  {analytics.top_routes.map((r, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 text-xs">
                      <span className="font-bold text-slate-800">{r.route}</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-aerolux-burgundy">{r.passengers_count} passengers</span>
                        <span className="block text-[10px] text-slate-400 font-mono">${r.revenue.toFixed(0)} revenue</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cabin Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                  Revenue Share by Cabin Class
                </h3>
                <div className="space-y-3">
                  {analytics.revenue_by_cabin.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-50 text-xs">
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-slate-800">{c.cabin_class.replace('_', ' ')}</span>
                        <span className="font-mono text-slate-900">{c.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-aerolux-burgundy h-full" style={{ width: `${c.percentage}%` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{c.passengers_count} passengers booked</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT & EVENT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">Timestamp (UTC)</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Entity</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Payload Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-3 font-mono text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-800">{log.entity_name} #{log.entity_id}</td>
                      <td className="px-6 py-3 text-slate-600 font-mono text-[11px]">{log.actor_email}</td>
                      <td className="px-6 py-3 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                        {log.details_json || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: UPDATE FLIGHT STATUS */}
        {selectedFlight && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Update Flight {selectedFlight.flight_number}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedFlight.route.origin_iata} &rarr; {selectedFlight.route.destination_iata}</p>
                </div>
                <button onClick={() => setSelectedFlight(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFlightStatus} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operational State</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as FlightStatus)}
                    className="w-full px-3 py-2 border rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="BOARDING">BOARDING</option>
                    <option value="DEPARTED">DEPARTED</option>
                    <option value="DELAYED">DELAYED</option>
                    <option value="ARRIVED">ARRIVED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Delay (Minutes)</label>
                    <input
                      type="number"
                      value={delayMinutes}
                      onChange={(e) => setDelayMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Departure Gate</label>
                    <input
                      type="text"
                      value={gate}
                      onChange={(e) => setGate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Terminal</label>
                    <input
                      type="text"
                      value={terminal}
                      onChange={(e) => setTerminal(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                  <strong>EDA Trigger Notice:</strong> Updating status emits a <code>FlightStatusChanged</code> domain event to the Transactional Outbox, automatically alerting all booked passengers via simulated notifications.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFlight(null)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingFlight}
                    className="px-6 py-2 rounded-lg bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white font-bold shadow-sm"
                  >
                    {updatingFlight ? 'Broadcasting...' : 'Save & Broadcast'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: PASSENGER MANIFEST */}
        {manifestFlightId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Official Passenger Flight Manifest
                  </h3>
                  <p className="text-xs text-slate-500">
                    Flight ID #{manifestFlightId} &bull; Total Checked-In: {manifestData?.checked_in_count || 0} / {manifestData?.total_passengers || 0}
                  </p>
                </div>
                <button onClick={() => setManifestFlightId(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingManifest ? (
                <div className="text-center py-12 text-xs text-slate-500">Extracting flight manifest...</div>
              ) : manifestData && manifestData.passengers.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">No confirmed bookings on this flight yet.</div>
              ) : (
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5">Seat</th>
                        <th className="px-4 py-2.5">Passenger Name</th>
                        <th className="px-4 py-2.5">Passport</th>
                        <th className="px-4 py-2.5">Cabin</th>
                        <th className="px-4 py-2.5">PNR</th>
                        <th className="px-4 py-2.5">Check-In Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {manifestData?.passengers.map((p) => (
                        <tr key={p.passenger_id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-bold font-mono text-aerolux-burgundy">{p.seat_number}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-800">{p.passenger_name}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-600">{p.passport_number} ({p.nationality})</td>
                          <td className="px-4 py-2.5 text-slate-600">{p.cabin_class}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-800">{p.booking_reference}</td>
                          <td className="px-4 py-2.5">
                            {p.has_checked_in ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Checked In
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
