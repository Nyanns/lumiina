import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { authAPI } from '../api/client';
import { AuthLayout } from '../components/AuthLayout';

/**
 * ForgotPasswordPage
 * Pixiv-styled Password Recovery experience.
 */
export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await authAPI.forgotPassword(email.trim());
      setSuccess(
        res.data?.message ||
          'Password reset instructions have been sent to your email (valid for 15 minutes).'
      );
    } catch (err) {
      const errPayload = err.response?.data?.error;
      const errMsg =
        typeof errPayload === 'object' && errPayload !== null
          ? errPayload.message || errPayload.code
          : typeof errPayload === 'string'
          ? errPayload
          : 'Failed to process password recovery. Please verify your email and try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Helmet>
        <title>Password Recovery — Lumiina</title>
      </Helmet>

      {/* Header Label (Pixiv style) */}
      <div className="text-center mb-3">
        <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Reset your password
        </h2>
        <p className="text-[11px] text-slate-400 mt-1">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-3">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Registered email address"
            required
            autoComplete="email"
            className="w-full px-4 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-slate-900 rounded-xl text-sm font-medium border border-transparent focus:border-[#0096fa] focus:ring-4 focus:ring-sky-100 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Primary Action: Send Reset Link */}
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full mt-2 py-2.5 bg-[#0096fa] hover:bg-[#0084e0] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm rounded-full shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending Instructions...</span>
            </>
          ) : (
            <span>Send Instructions</span>
          )}
        </button>

        {/* Secondary Action: Back to Login */}
        <Link
          to="/login"
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-full transition-colors text-center cursor-pointer active:scale-[0.99]"
        >
          Back to Login
        </Link>
      </form>
    </AuthLayout>
  );
};
