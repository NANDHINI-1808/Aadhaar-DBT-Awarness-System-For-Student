import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if redirected from verification page
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      setSuccess('Your email address has been successfully verified! You can now log in.');
    }
  }, [location]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (!user.wizardCompleted) {
        navigate('/wizard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(email, password);
      // Auth context will update user, and useEffect will redirect
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Accent strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-govNavy"></div>

        <div className="text-center">
          <h3 className="text-2xl font-bold font-serifDisplay text-govNavy">Student Portal Login</h3>
          <p className="mt-2 text-xs text-slate-500">
            Access your scholarship profile, matches, and DBT readiness checks
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-lg flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold text-slate-600 mb-1">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white focus:border-govNavy"
                placeholder="student@example.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-600">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-govNavy hover:text-govSaffron transition"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white focus:border-govNavy"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-govNavy text-white hover:bg-[#071f3b] font-bold rounded-lg transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Logging in...' : 'Sign In'}</span>
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-govNavy hover:text-govSaffron transition">
              Register Here (Step 0)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
