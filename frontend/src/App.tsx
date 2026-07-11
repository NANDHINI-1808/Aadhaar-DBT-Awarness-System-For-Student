import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { ResetPassword } from './pages/Auth/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { ProfileWizard } from './pages/ProfileWizard';
import { Resources } from './pages/Resources';
import { AdminDashboard } from './pages/AdminDashboard';
import { AIGuide } from './components/AIGuide';
import './locales/i18n';

// Protected Route Wrapper for Students
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-govCream">
        <div className="w-10 h-10 border-4 border-govNavy border-t-govSaffron rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Protected Admin Route Wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-govCream">
        <div className="w-10 h-10 border-4 border-govNavy border-t-govSaffron rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/resources" element={<Resources />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wizard"
            element={
              <ProtectedRoute>
                <ProfileWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating AI chat agent */}
      <AIGuide />

      {/* Government Footer */}
      <footer className="bg-[#05162a] text-slate-400 text-xs py-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="font-semibold tracking-wider text-slate-300">
            Aadhaar DBT for Students Portal
          </p>
          <p className="max-w-xl mx-auto text-[11px] leading-relaxed text-slate-500">
            This is an awareness and self-service portal managed by the Department of Social Justice & Empowerment (DoSJE), Ministry of Social Justice & Empowerment, Government of India.
          </p>
          <hr className="border-slate-800 max-w-sm mx-auto" />
          <p className="text-[10px] text-slate-600">
            © 2026 Ministry of Social Justice & Empowerment. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
