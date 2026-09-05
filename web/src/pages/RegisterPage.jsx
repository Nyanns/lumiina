import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { authAPI } from '../api/client';
import { AuthLayout, SocialLoginIcons } from '../components/AuthLayout';

/**
 * RegisterPage
 * Exact Pixiv-styled Account Creation experience.
 * Features:
 * - Immersive full-screen background artwork with artist attribution
 * - Centered solid white card with official Lumiina wordmark & tagline
 * - Quick social signup buttons (Apple, Google, X, Facebook)
 * - Clean neutral input fields with inline password visibility toggles
 * - Enterprise password strength validator matching backend rules (8+ chars, upper, lower, digit, symbol)
 * - Pixiv Sky Blue primary CTA + clean secondary "Login" pill
 */
export const RegisterPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [socialToast, setSocialToast] = useState('');

  // Password validation matching backend Go ValidatePasswordStrength
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasNumber && hasSymbol;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await authAPI.register({
        username: username.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });
      setSuccess(
        res.data?.message ||
          'Account created successfully! Please check your email inbox to verify your account.'
      );
      setTimeout(() => {
        navigate('/login');
      }, 2200);
    } catch (err) {
      const errPayload = err.response?.data?.error;
      const errMsg =
        typeof errPayload === 'object' && errPayload !== null
          ? errPayload.message || errPayload.code
          : typeof errPayload === 'string'
          ? errPayload
          : 'Failed to create account. Please check your inputs and try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSelect = (platform) => {
    setSocialToast(`${platform} registration will be available soon with OAuth 2.0. Please register with email.`);
    setTimeout(() => setSocialToast(''), 4000);
  };

  return (
    <AuthLayout>
      <Helmet>
        <title>Create Account — Lumiina</title>
      </Helmet>

      {/* Header Label (Pixiv style) */}
      <div className="text-center mb-3">
        <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Create your Lumiina account
        </h2>
      </div>

      {/* Social Login Row */}
      <SocialLoginIcons onSelect={handleSocialSelect} />

      {socialToast && (
        <div className="mt-2.5 p-2 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-xl text-[11px] text-sky-800 dark:text-sky-300 text-center font-medium animate-in fade-in duration-150">
          {socialToast}
        </div>
      )}

      {/* Status Alerts */}
      {error && (
        <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleRegister} className="flex flex-col gap-2.5 mt-3">
        
        {/* Username */}
        <div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (e.g. kuro_illust)"
            required
            autoComplete="username"
            className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-slate-900 rounded-xl text-sm font-medium border border-transparent focus:border-[#0096fa] focus:ring-4 focus:ring-sky-100 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Email Address */}
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            autoComplete="email"
            className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-slate-900 rounded-xl text-sm font-medium border border-transparent focus:border-[#0096fa] focus:ring-4 focus:ring-sky-100 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min. 8 characters)"
            required
            autoComplete="new-password"
            className="w-full pl-4 pr-11 py-2.5 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-slate-900 rounded-xl text-sm font-medium border border-transparent focus:border-[#0096fa] focus:ring-4 focus:ring-sky-100 outline-none transition-all placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Real-time Password Strength Criteria (matching Go backend) */}
        {password.length > 0 && (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1 text-[11px]">
            <span className="font-bold text-slate-700">Password requirements:</span>
            <div className="grid grid-cols-2 gap-1 text-[10.5px]">
              <span className={`inline-flex items-center gap-1 ${hasMinLen ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                {hasMinLen ? '✓' : '•'} 8+ characters
              </span>
              <span className={`inline-flex items-center gap-1 ${hasUpper && hasLower ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                {hasUpper && hasLower ? '✓' : '•'} Upper & lower case
              </span>
              <span className={`inline-flex items-center gap-1 ${hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                {hasNumber ? '✓' : '•'} Number (0-9)
              </span>
              <span className={`inline-flex items-center gap-1 ${hasSymbol ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                {hasSymbol ? '✓' : '•'} Symbol (!@#$%)
              </span>
            </div>
          </div>
        )}

        {/* Confirm Password */}
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
            autoComplete="new-password"
            className="w-full pl-4 pr-11 py-2.5 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-slate-900 rounded-xl text-sm font-medium border border-transparent focus:border-[#0096fa] focus:ring-4 focus:ring-sky-100 outline-none transition-all placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
            title={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {confirmPassword.length > 0 && !passwordsMatch && (
          <span className="text-[11px] text-rose-500 font-medium px-1">
            Passwords do not match.
          </span>
        )}

        {/* Primary Action: Create Account (Pixiv Sky Blue Pill) */}
        <button
          type="submit"
          disabled={loading || !username || !email || !password || !passwordsMatch || !isPasswordValid}
          className="w-full mt-2 py-2.5 bg-[#0096fa] hover:bg-[#0084e0] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm rounded-full shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create account</span>
          )}
        </button>

        {/* Secondary Action: Login (Pixiv Soft Gray Pill) */}
        <Link
          to="/login"
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-full transition-colors text-center cursor-pointer active:scale-[0.99]"
        >
          Log in with existing account
        </Link>

        {/* Terms agreement note */}
        <p className="text-[11px] text-slate-500 text-center leading-relaxed mt-1">
          By continuing, you agree to Lumiina's{' '}
          <Link to="/terms" className="text-[#0096fa] hover:underline font-semibold">Terms of Use</Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-[#0096fa] hover:underline font-semibold">Privacy Policy</Link>.
        </p>

      </form>

    </AuthLayout>
  );
};
