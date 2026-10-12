import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plane, User as UserIcon, Shield, Search, CheckCircle, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, role, logout, switchRoleDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-aerolux-burgundy text-white shadow-lg border-b border-rose-900/40">
      {/* Top micro-bar for Quick Demo Role Switching */}
      <div className="bg-aerolux-burgundy-dark text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center border-b border-rose-950/40">
        <div className="flex items-center gap-2 text-rose-200">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="hidden sm:inline font-medium">AeroLux Global Hub &bull; DXB Terminal 3 &bull; 24/7 Operations</span>
          <span className="sm:hidden font-medium">DXB Hub Active</span>
        </div>

        {/* Demo Fast Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setDemoMenuOpen(!demoMenuOpen)}
            className="flex items-center gap-1.5 bg-rose-900/60 hover:bg-rose-800/80 text-rose-100 px-2.5 py-0.5 rounded text-xs transition border border-rose-700/50"
          >
            <span>Role: <strong className="text-aerolux-gold">{user ? user.role : 'Guest'}</strong></span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {demoMenuOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white text-slate-800 rounded-md shadow-xl py-1 z-50 border border-slate-200 text-xs">
              <div className="px-3 py-1.5 font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                1-Click Demo Accounts
              </div>
              <button
                onClick={() => {
                  switchRoleDemo('customer@aerolux.com', 'Customer@123456');
                  setDemoMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">Customer</p>
                  <p className="text-slate-500 text-[10px]">customer@aerolux.com</p>
                </div>
                <span className="text-emerald-600 font-bold">&rarr;</span>
              </button>
              <button
                onClick={() => {
                  switchRoleDemo('staff@aerolux.com', 'Staff@123456');
                  setDemoMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">Operations Staff</p>
                  <p className="text-slate-500 text-[10px]">staff@aerolux.com</p>
                </div>
                <span className="text-amber-600 font-bold">&rarr;</span>
              </button>
              <button
                onClick={() => {
                  switchRoleDemo('admin@aerolux.com', 'Admin@123456');
                  setDemoMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">System Admin</p>
                  <p className="text-slate-500 text-[10px]">admin@aerolux.com</p>
                </div>
                <span className="text-purple-600 font-bold">&rarr;</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-aerolux-burgundy-dark rounded-[7px] flex items-center justify-center">
                <Plane className="w-6 h-6 text-aerolux-gold transform -rotate-45" />
              </div>
            </div>
            <div>
              <span className="font-display text-2xl font-bold tracking-wider text-white">AEROLUX</span>
              <span className="block text-[10px] tracking-widest uppercase text-aerolux-gold font-sans font-semibold">
                Airways &bull; Imperial
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive('/') ? 'bg-rose-900/60 text-aerolux-gold' : 'text-slate-200 hover:text-white hover:bg-rose-900/30'
              }`}
            >
              Book Flights
            </Link>
            <Link
              to="/lookup"
              className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                isActive('/lookup') ? 'bg-rose-900/60 text-aerolux-gold' : 'text-slate-200 hover:text-white hover:bg-rose-900/30'
              }`}
            >
              <Search className="w-4 h-4 text-aerolux-gold" />
              Manage Booking
            </Link>
            <Link
              to="/checkin"
              className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                isActive('/checkin') ? 'bg-rose-900/60 text-aerolux-gold' : 'text-slate-200 hover:text-white hover:bg-rose-900/30'
              }`}
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Check-In
            </Link>

            {user && (
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/dashboard') ? 'bg-rose-900/60 text-aerolux-gold' : 'text-slate-200 hover:text-white hover:bg-rose-900/30'
                }`}
              >
                My Trips
              </Link>
            )}

            {(role === 'STAFF' || role === 'ADMIN') && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-semibold transition flex items-center gap-1.5 border border-amber-400/30 ${
                  isActive('/admin') ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-amber-500/10 text-aerolux-gold hover:bg-amber-500/20'
                }`}
              >
                <Shield className="w-4 h-4" />
                Operations Hub
              </Link>
            )}
          </nav>

          {/* User Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-white">{user.full_name}</p>
                  <p className="text-[10px] text-rose-300 font-mono">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-full bg-rose-900/60 hover:bg-rose-800 text-rose-200 hover:text-white transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-md text-sm font-semibold text-white hover:bg-rose-900/40 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-md text-sm font-semibold bg-aerolux-gold hover:bg-amber-400 text-slate-950 transition shadow-sm"
                >
                  Join SkyClub
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-rose-200 hover:text-white hover:bg-rose-900/60"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-aerolux-burgundy-dark border-t border-rose-900 px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded text-base font-medium text-slate-100 hover:bg-rose-900/50"
          >
            Book Flights
          </Link>
          <Link
            to="/lookup"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded text-base font-medium text-slate-100 hover:bg-rose-900/50"
          >
            Manage Booking
          </Link>
          <Link
            to="/checkin"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded text-base font-medium text-slate-100 hover:bg-rose-900/50"
          >
            Online Check-In
          </Link>
          {user && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-base font-medium text-slate-100 hover:bg-rose-900/50"
            >
              My Trips
            </Link>
          )}
          {(role === 'STAFF' || role === 'ADMIN') && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-base font-medium text-aerolux-gold bg-amber-500/10"
            >
              Operations Hub
            </Link>
          )}

          <div className="pt-4 border-t border-rose-900 flex justify-between items-center">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-sm font-semibold text-white">{user.full_name}</p>
                  <p className="text-xs text-rose-300">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs bg-rose-800 text-white rounded"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-rose-900/60 rounded text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-aerolux-gold text-slate-950 font-semibold rounded text-sm"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
