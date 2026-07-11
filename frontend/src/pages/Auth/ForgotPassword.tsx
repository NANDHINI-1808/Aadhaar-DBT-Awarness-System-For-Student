import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || '/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error occurred.');
      }

      setSuccess('If the email is registered, a password reset link has been sent to your inbox.');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-govNavy"></div>

        <div className="text-center">
          <h3 className="text-2xl font-bold font-serifDisplay text-govNavy">Reset Password</h3>
          <p className="mt-2 text-xs text-slate-500">
            Enter your registered email to receive a password reset link
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-govNavy text-white hover:bg-[#071f3b] font-bold rounded-lg transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
            >
              <Mail className="w-4 h-4" />
              <span>{loading ? 'Sending link...' : 'Send Reset Link'}</span>
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
