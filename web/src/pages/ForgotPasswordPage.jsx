import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authAPI } from '../api/client';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await authAPI.forgotPassword(email);
      setSuccess(
        res.data?.message ||
          'Password reset instructions have been sent to your email (valid for 15 minutes).'
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to process password reset request.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121519] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 font-sans transition-colors">
      <Helmet>
        <title>Password Recovery — Lumiina</title>
      </Helmet>

      {/* Back to Login Link */}
      <div className="w-full max-w-md mb-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-6 transition-colors">
        
        <div className="flex flex-col items-center text-center gap-2">
          <Link to="/" className="mb-2 group inline-block">
            <img
              src="/logo_wordmark.png"
              alt="Lumiina"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Password Recovery
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Enter your registered email address to receive password reset instructions.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Registered Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              required
              className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-[#252a32] hover:bg-slate-100/70 dark:hover:bg-[#2c323c] focus:bg-white dark:focus:bg-[#21262d] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-950/40 rounded-xl font-medium outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full mt-2 py-3 bg-[#0096fa] hover:bg-[#0084e0] active:bg-[#0072c4] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-sm rounded-full shadow-sm transition-all cursor-pointer"
          >
            {loading ? 'Sending Instructions...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <Link to="/login" className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
            ← Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};
