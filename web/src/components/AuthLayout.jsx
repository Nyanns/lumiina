import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';

/**
 * AuthLayout
 * Authentic Pixiv-inspired immersive full-bleed artwork layout for Login & Register.
 * Features:
 * - High-resolution full-bleed anime artwork background
 * - Bottom-right artist credit badge ("Featured Creator / VISIONS")
 * - Bottom-left minimalist legal links (Terms, Help, Language, Copyright)
 * - Top-left subtle back-to-gallery button
 * - Centered solid white/slate card with official Lumiina wordmark & tagline
 */
export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-x-hidden font-sans select-none">
      
      {/* 1. Fullscreen Background Artwork (Pixiv Style) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/auth_bg_default.jpg"
          alt="Lumiina Featured Artwork"
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Subtle dark vignette to make the white card pop crisply without muting the art */}
        <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]" />
      </div>

      {/* 2. Top-Left Floating Navigation */}
      <div className="fixed top-4 left-4 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black/45 hover:bg-black/65 text-white rounded-full text-xs font-bold backdrop-blur-xs transition-all shadow-xs border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Gallery
        </Link>
      </div>

      {/* 3. Bottom-Right Artwork Attribution Card (Pixiv Style) */}
      <Link
        to="/about"
        className="fixed bottom-4 right-6 z-20 hidden md:flex items-center gap-3 p-2 pr-4 bg-slate-900/80 hover:bg-slate-900/95 backdrop-blur-md border border-white/15 rounded-2xl shadow-xl transition-all hover:scale-[1.02] text-left group"
      >
        <img
          src="/lumi_ina_studio_hd.jpg"
          alt="Lumi & Ina"
          className="w-10 h-10 rounded-xl object-cover border border-white/20"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
            Lumi & Ina — Art Studio
          </span>
          <span className="text-[10px] text-slate-300">
            Art by <strong className="text-white">@lumiina_studio</strong>
          </span>
          <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider mt-0.5">
            LUMIINA OFFICIAL MASCOTS
          </span>
        </div>
      </Link>

      {/* 4. Bottom-Left Minimalist Legal Footer (Pixiv Style) */}
      <div className="fixed bottom-4 left-6 z-20 hidden md:flex items-center gap-3.5 text-[11px] font-medium text-white/85 drop-shadow-sm">
        <Link to="/about" className="hover:text-white hover:underline transition-colors">About Lumiina</Link>
        <span>•</span>
        <Link to="/terms" className="hover:text-white hover:underline transition-colors">Terms of Use</Link>
        <span>•</span>
        <Link to="/privacy" className="hover:text-white hover:underline transition-colors">Privacy Policy</Link>
        <span>•</span>
        <Link to="/guidelines" className="hover:text-white hover:underline transition-colors">Guidelines</Link>
        <span>•</span>
        <span className="inline-flex items-center gap-1">
          <Globe className="w-3 h-3" /> English
        </span>
        <span>•</span>
        <span>© Lumiina</span>
      </div>

      {/* 5. Central Floating Card (Pixiv Pure White Card) */}
      <div className="w-full max-w-[430px] bg-white text-slate-900 rounded-[28px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-slate-100 z-10 my-auto flex flex-col transition-all">
        
        {/* Centered Logo & Pixiv Tagline */}
        <div className="flex flex-col items-center text-center mb-5">
          <Link to="/" className="inline-block transition-transform active:scale-95">
            <img
              src="/logo_wordmark.png"
              alt="Lumiina"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>
          <p className="text-[12px] font-bold text-[#0096fa] tracking-tight mt-1.5">
            Your creative journey awaits
          </p>
        </div>

        {/* Page Form Content */}
        {children}



      </div>

    </div>
  );
};

// Scalable SVG Social Login Icons (Apple, Google, X, Facebook)
export const SocialLoginIcons = ({ onSelect }) => {
  return (
    <div className="flex items-center justify-center gap-3.5 my-1">
      {/* Apple */}
      <button
        type="button"
        onClick={() => onSelect?.('Apple')}
        className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
        title="Continue with Apple"
        aria-label="Continue with Apple"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.92.04-2.06.62-2.73 1.4-.57.66-.99 1.73-.87 2.76 1.03.08 2.07-.56 2.68-1.31z"/>
        </svg>
      </button>

      {/* Google */}
      <button
        type="button"
        onClick={() => onSelect?.('Google')}
        className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
        title="Continue with Google"
        aria-label="Continue with Google"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      </button>

      {/* X (Twitter) */}
      <button
        type="button"
        onClick={() => onSelect?.('X')}
        className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
        title="Continue with X"
        aria-label="Continue with X"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </button>

      {/* Facebook */}
      <button
        type="button"
        onClick={() => onSelect?.('Facebook')}
        className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[#1877F2] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
        title="Continue with Facebook"
        aria-label="Continue with Facebook"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </button>
    </div>
  );
};
