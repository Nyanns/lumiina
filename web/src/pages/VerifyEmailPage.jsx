import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, AlertTriangle, Loader2, ArrowRight, Mail, RefreshCw } from 'lucide-react';
import { authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [status, setStatus] = useState(token ? 'verifying' : 'error');
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState(token ? '' : 'No verification token was provided in the URL.');
  
  // Resend form state
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendFeedback, setResendFeedback] = useState('');
  
  // Auto-redirect countdown
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const runVerification = async () => {
      try {
        const res = await authAPI.verifyEmail(token);
        if (!isMounted) return;

        if (res.data?.token) {
          login(res.data.token, res.data.user);
          setVerifiedUser(res.data.user);
        }
        setStatus('success');
      } catch (err) {
        if (!isMounted) return;
        setStatus('error');
        const errPayload = err.response?.data?.error;
        const msg =
          typeof errPayload === 'string'
            ? errPayload
            : errPayload?.message || 'Verification link is invalid or has expired.';
        setErrorMsg(msg);
      }
    };

    runVerification();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Countdown timer on successful verification
  useEffect(() => {
    if (status !== 'success') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendFeedback('');

    try {
      const res = await authAPI.resendVerification(resendEmail);
      setResendFeedback(res.data?.message || 'If an unverified account exists, a new link has been sent.');
    } catch {
      setResendFeedback('If an unverified account exists, a new link has been sent.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Helmet>
        <title>
          {status === 'verifying'
            ? 'Verifying Email | Lumiina'
            : status === 'success'
            ? 'Account Verified | Lumiina'
            : 'Email Verification Issue | Lumiina'}
        </title>
      </Helmet>

      <div className="w-full max-w-[440px] bg-white dark:bg-[#1a1e24] rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800/80 p-8 sm:p-10 text-center relative z-10 transition-colors">
        
        {/* Brand Header */}
        <div className="mb-6">
          <Link to="/" className="inline-block group">
            <span className="text-3xl font-extrabold text-[#0096fa] tracking-tight group-hover:opacity-90 transition-opacity">
              Lumiina
            </span>
          </Link>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
            Account Activation
          </p>
        </div>

        {/* State 1: Verifying */}
        {status === 'verifying' && (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-[#0096fa]">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Verifying your email...
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                Communicating with security servers to activate your Lumiina creator account.
              </p>
            </div>
          </div>
        )}

        {/* State 2: Success */}
        {status === 'success' && (
          <div className="py-4 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center text-emerald-500 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Account Successfully Activated!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Welcome to Lumiina{verifiedUser?.username ? `, ` : ''}
                {verifiedUser?.username && (
                  <strong className="text-[#0096fa]">{verifiedUser.username}</strong>
                )}
                ! Your email has been confirmed and your session is active.
              </p>
            </div>

            <div className="p-3 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 rounded-xl text-xs text-[#0096fa] font-medium flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#0096fa] animate-pulse" />
              Redirecting to gallery in {countdown}s...
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full h-11 bg-[#0096fa] hover:bg-[#0084e0] active:scale-[0.99] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              Start Exploring <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State 3: Error / Link Invalid */}
        {status === 'error' && (
          <div className="py-2 space-y-6 text-left">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center text-amber-500 mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Activation Link Unavailable
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[320px] mx-auto">
                {errorMsg || 'The verification link is invalid, incomplete, or has expired after 24 hours.'}
              </p>
            </div>

            {/* Resend Activation Link Form */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Request a new activation link:
              </span>

              {resendFeedback && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  {resendFeedback}
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-2.5">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#0096fa] focus:ring-1 focus:ring-[#0096fa] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resendLoading || !resendEmail}
                  className="w-full h-10 bg-[#0096fa] hover:bg-[#0084e0] disabled:opacity-50 text-white rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  {resendLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Send New Activation Email
                </button>
              </form>
            </div>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-500 hover:text-[#0096fa] dark:text-slate-400 transition-colors"
              >
                Already verified? Return to Log In
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};
