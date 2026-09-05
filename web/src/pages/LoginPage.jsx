import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AuthLayout, SocialLoginIcons } from '../components/AuthLayout';

/**
 * LoginPage
 * Exact Pixiv-styled Login experience (matching accounts.pixiv.net/login).
 * Features:
 * - Immersive full-screen background artwork with artist attribution
 * - Centered solid white card with official Lumiina wordmark & tagline
 * - Social login quick buttons (Apple, Google, X, Facebook)
 * - Clean neutral input fields with inline password visibility toggle
 * - Pixiv Sky Blue primary CTA + clean secondary "Create account" pill
 * - Forgot password navigation link
 */
export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socialToast, setSocialToast] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return;

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
          : 'Invalid email/username or password. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSelect = (platform) => {
    setSocialToast(`${platform} sign-in will be available soon with OAuth 2.0. Please use email or username.`);
    setTimeout(() => setSocialToast(''), 4000);
  };

  return (
    <AuthLayout>
      <Helmet>
        <title>Login — Lumiina</title>
      </Helmet>

      {/* Header Label (Pixiv style) */}
      <div className="text-center mb-4">
        <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Log in with an existing account
        </h2>
      </div>

      {/* Social Login Row */}
      <SocialLoginIcons onSelect={handleSocialSelect} />

      {socialToast && (
        <div className="mt-2.5 p-2 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-xl text-[11px] text-sky-800 dark:text-sky-300 text-center font-medium animate-in fade-in duration-150">
          {socialToast}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Inputs (Pixiv Style: Soft Gray Background, Inset Padding) */}
      <form onSubmit={handleLogin} className="flex flex-col gap-3 mt-4">
        
        {/* Email or Username */}
        <div className="relative">
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="E-mail address or username"
            required
            autoComplete="username"
            className="w-full px-4 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-slate-900 rounded-xl text-sm font-medium border border-transparent focus:border-[#0096fa] focus:ring-4 focus:ring-sky-100 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Password with Inline Show/Hide Toggle */}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
            className="w-full pl-4 pr-11 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-slate-900 rounded-xl text-sm font-medium border border-transparent focus:border-[#0096fa] focus:ring-4 focus:ring-sky-100 outline-none transition-all placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Action: Log In (Pixiv Blue Pill Button) */}
        <button
          type="submit"
          disabled={loading || !identifier || !password}
          className="w-full mt-2 py-2.5 bg-[#0096fa] hover:bg-[#0084e0] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm rounded-full shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Logging In...</span>
            </>
          ) : (
            <span>Log In</span>
          )}
        </button>

        {/* Secondary Action: Create Account (Pixiv Soft Gray Pill Button) */}
        <Link
          to="/register"
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-full transition-colors text-center cursor-pointer active:scale-[0.99]"
        >
          Create account
        </Link>

        {/* Forgot Password Link */}
        <div className="text-center pt-1">
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-slate-500 hover:text-[#0096fa] transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

      </form>

    </AuthLayout>
  );
};
