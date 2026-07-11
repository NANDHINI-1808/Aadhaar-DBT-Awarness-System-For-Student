import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, AlertTriangle, Mail } from 'lucide-react';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const backendUrl = import.meta.env.VITE_API_URL || '/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Registration failed.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      const res = await fetch(`${backendUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setResendMsg(data.message || 'Verification link resent.');
    } catch {
      setResendMsg('Error sending verification. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-govSaffron"></div>
          <div className="w-16 h-16 bg-govCream rounded-full flex items-center justify-center text-govSaffron mx-auto border border-govSaffron/20 shadow-inner">
            <Mail className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold font-serifDisplay text-govNavy">Verify Your Email</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            We have sent a verification link to <strong className="text-slate-900">{email}</strong>.
            Please check your inbox (or spam folder) and click the link to verify your account.
          </p>
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-xs bg-govNavy text-white hover:bg-[#071f3b] px-4 py-2 rounded-lg font-semibold transition"
            >
              {resending ? 'Resending...' : 'Resend Verification Email'}
            </button>
            {resendMsg && <p className="text-xs font-semibold text-govGreen">{resendMsg}</p>}
            <p className="text-xs text-slate-500">
              Already verified?{' '}
              <Link to="/login" className="font-bold text-govNavy hover:underline">
                Proceed to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Accent strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-govSaffron"></div>

        <div className="text-center">
          <h3 className="text-2xl font-bold font-serifDisplay text-govNavy">Create Student Account</h3>
          <p className="mt-2 text-xs text-slate-500">
            Step 0 of the profile matching wizard. Build your portal account.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
              <label htmlFor="password" className="block text-xs font-semibold text-slate-600 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white focus:border-govNavy"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-600 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
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
              disabled={loading}
              className="w-full py-3 px-4 bg-govNavy text-white hover:bg-[#071f3b] font-bold rounded-lg transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating Account...' : 'Register (Step 0)'}</span>
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-govNavy hover:text-govSaffron transition">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
