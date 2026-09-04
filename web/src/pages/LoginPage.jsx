import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authAPI.login({ identifier, password });
      if (res.data?.token) {
        login(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err) {
      const errPayload = err.response?.data?.error;
      const errMsg =
        typeof errPayload === 'object' && errPayload !== null
          ? errPayload.message || errPayload.code
          : typeof errPayload === 'string'
          ? errPayload
          : 'Failed to sign in. Please verify your email/username and password.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121519] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 font-sans transition-colors">
      <Helmet>
        <title>Sign In — Lumiina</title>
      </Helmet>

      {/* Back to Home Link */}
      <div className="w-full max-w-md mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Gallery
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-6 transition-colors">
        
        {/* Header with Official Wordmark Logo */}
        <div className="flex flex-col items-center text-center gap-2">
          <Link to="/" className="mb-2 group inline-block">
            <img
              src="/logo_wordmark.png"
              alt="Lumiina"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Sign in to post illustrations, like artworks, and join the discussion.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Email or Username
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. your_username or email"
              required
              className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-[#252a32] hover:bg-slate-100/70 dark:hover:bg-[#2c323c] focus:bg-white dark:focus:bg-[#21262d] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-950/40 rounded-xl font-medium outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-[#252a32] hover:bg-slate-100/70 dark:hover:bg-[#2c323c] focus:bg-white dark:focus:bg-[#21262d] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-950/40 rounded-xl font-medium outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !identifier || !password}
            className="w-full mt-2 py-3 bg-[#0096fa] hover:bg-[#0084e0] active:bg-[#0072c4] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-sm rounded-full shadow-sm transition-all cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
              Create Account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
