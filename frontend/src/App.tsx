import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { FlightResultsPage } from './pages/FlightResultsPage';
import { BookingFlowPage } from './pages/BookingFlowPage';
import { BookingLookupPage } from './pages/BookingLookupPage';
import { CheckInPage } from './pages/CheckInPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/results" element={<FlightResultsPage />} />
              <Route path="/booking" element={<BookingFlowPage />} />
              <Route path="/lookup" element={<BookingLookupPage />} />
              <Route path="/checkin" element={<CheckInPage />} />
              <Route path="/dashboard" element={<CustomerDashboardPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
