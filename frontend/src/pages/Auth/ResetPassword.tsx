import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tok = params.get('token');
    if (tok) {
      setToken(tok);
    } else {
      setError('Invalid reset link or reset token is missing.');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Reset failed.');
      }

      setSuccess('Your password has been successfully reset. You can now log in.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-govSaffron"></div>

        <div className="text-center">
          <h3 className="text-2xl font-bold font-serifDisplay text-govNavy">Create New Password</h3>
          <p className="mt-2 text-xs text-slate-500">
            Set your new login credentials
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

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="new-pass" className="block text-xs font-semibold text-slate-600 mb-1">
                New Password
              </label>
              <input
                id="new-pass"
                type="password"
                required
                disabled={!token}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white focus:border-govNavy"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-pass" className="block text-xs font-semibold text-slate-600 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirm-pass"
                type="password"
                required
                disabled={!token}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white focus:border-govNavy"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-3 px-4 bg-govNavy text-white hover:bg-[#071f3b] font-bold rounded-lg transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs font-bold text-govNavy hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
