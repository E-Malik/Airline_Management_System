import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plane, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, switchRoleDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState<string>('customer@aerolux.com');
  const [password, setPassword] = useState<string>('Customer@123456');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFastDemoLogin = async (demoEmail: string, demoPass: string, targetPath: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setError(null);
    try {
      await switchRoleDemo(demoEmail, demoPass);
      navigate(targetPath);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-aerolux-burgundy flex items-center justify-center">
            <Plane className="w-6 h-6 text-aerolux-gold transform -rotate-45" />
          </div>
          <span className="font-display text-2xl font-bold text-slate-900 tracking-wider">AEROLUX</span>
        </Link>
        <h2 className="text-xl font-bold text-slate-900">Sign in to your Account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Access your bookings, boarding passes, and SkyClub privileges.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200/80 rounded-2xl sm:px-10">
          {/* Quick Demo Logins Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs">
            <span className="font-bold text-slate-700 block mb-2 uppercase text-[10px] tracking-wider">
              1-Click Instant Demo Accounts
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleFastDemoLogin('customer@aerolux.com', 'Customer@123456', '/dashboard')}
                className="w-full text-left px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-800 flex justify-between items-center transition"
              >
                <span>Customer (Catherine Grey)</span>
                <span className="text-aerolux-burgundy font-bold">&rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => handleFastDemoLogin('staff@aerolux.com', 'Staff@123456', '/admin')}
                className="w-full text-left px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-200 text-slate-800 flex justify-between items-center transition"
              >
                <span>Operations Staff (Marcus Vance)</span>
                <span className="text-amber-700 font-bold">&rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => handleFastDemoLogin('admin@aerolux.com', 'Admin@123456', '/admin')}
                className="w-full text-left px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:border-purple-200 text-slate-800 flex justify-between items-center transition"
              >
                <span>System Admin (Lord Sterling)</span>
                <span className="text-purple-700 font-bold">&rarr;</span>
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-aerolux-burgundy focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-aerolux-burgundy hover:bg-aerolux-burgundy-light text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-aerolux-burgundy font-bold hover:underline">
              Register with SkyClub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
