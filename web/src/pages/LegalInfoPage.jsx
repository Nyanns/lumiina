import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  BookOpen, 
  Sparkles, 
  Lock, 
  EyeOff, 
  HeartHandshake, 
  AlertTriangle, 
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function LegalInfoPage({ defaultTab }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Determine active tab from path or prop
  const getTabFromPath = () => {
    const path = location.pathname.replace('/', '').toLowerCase();
    if (['about', 'guidelines', 'terms', 'privacy'].includes(path)) {
      return path;
    }
    return defaultTab || 'about';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);

  useEffect(() => {
    setActiveTab(getTabFromPath());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    navigate(`/${tabKey}`);
  };

  const navItems = [
    { key: 'about', label: 'About Us', icon: Sparkles, badge: 'Mascots & Mission' },
    { key: 'guidelines', label: 'Community Guidelines', icon: BookOpen, badge: 'Content Standards' },
    { key: 'terms', label: 'Terms of Service', icon: FileText, badge: 'Artist Ownership' },
    { key: 'privacy', label: 'Privacy Policy', icon: ShieldCheck, badge: 'No Data Selling' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-800 dark:text-slate-200 transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#121722]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Gallery</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2">
              <img src="/logo_icon.png" alt="Lumiina" className="w-5 h-5 object-contain rounded" />
              <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">Lumiina Docs & Legal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-3 lg:sticky lg:top-20">
            <div className="bg-white dark:bg-[#121722] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3 shadow-xs">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Documentation Hub
              </div>
              <nav className="space-y-1 mt-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleTabChange(item.key)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                        isActive
                          ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 px-3">
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  Last updated: <span className="font-medium text-slate-600 dark:text-slate-400">September 2026</span>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Version: <span className="font-mono text-slate-600 dark:text-slate-400">2.1.0-prod</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="lg:col-span-9 bg-white dark:bg-[#121722] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-10 shadow-xs">
            
            {/* TAB 1: ABOUT US */}
            {activeTab === 'about' && (
              <article className="space-y-8 animate-fadeIn">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50 mb-3">
                    <Sparkles className="w-3 h-3" />
                    <span>Our Story & Mission</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    About Lumiina
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Lumiina is an independent illustration sharing community crafted for anime, manga, and digital fan art creators. Built from the ground up to celebrate human artistic craft without artificial noise.
                  </p>
                </div>

                {/* Mascots Banner Spotlight */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 relative">
                  <img
                    src="/lumi_ina_studio_hd.jpg"
                    alt="Lumi and Ina at the Art Studio"
                    className="w-full h-64 sm:h-80 object-cover object-top"
                  />
                  <div className="p-4 sm:p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute inset-x-0 bottom-0 text-white">
                    <div className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                      Official Lumiina Mascots
                    </div>
                    <div className="text-lg font-bold">Lumi & Ina</div>
                    <p className="text-xs text-slate-200 mt-1 max-w-xl">
                      <strong>Lumi</strong> (The Golden Light) represents bright passion, bold brushstrokes, and creative courage. <strong>Ina</strong> (The Gentle Silver) represents quiet contemplation, patience, and meticulous digital craftsmanship.
                    </p>
                  </div>
                </div>

                {/* Core Pillars */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Our Core Pillars
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs mb-2.5">
                        01
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Artist-First Ownership</h3>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Creators retain 100% intellectual property rights over their original works. We provide the stage, you keep the crown.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs mb-2.5">
                        02
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Zero Unsolicited AI Scraping</h3>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        We reject selling creator portfolios to third-party generative AI datasets. Your art is meant for human eyes and appreciation.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs mb-2.5">
                        03
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">High-Speed Pure Architecture</h3>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Engineered with Go, PostgreSQL, and React. Sub-millisecond response times, zero bloated tracking scripts, and maximum visual fidelity.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs mb-2.5">
                        04
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Respectful Fan Community</h3>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        A supportive space celebrating original anime characters, VTubers, manga adaptations, and personal creative visions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Want to join our creator roster?</div>
                    <div className="text-[11px] text-slate-500">Registration is open and free for all illustrators.</div>
                  </div>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-xl bg-[#0096fa] hover:bg-[#0082d6] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                  >
                    Create Account
                  </Link>
                </div>
              </article>
            )}

            {/* TAB 2: COMMUNITY GUIDELINES */}
            {activeTab === 'guidelines' && (
              <article className="space-y-8 animate-fadeIn">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50 mb-3">
                    <BookOpen className="w-3 h-3" />
                    <span>Safe & Welcoming Atmosphere</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Community Guidelines
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    These guidelines help ensure Lumiina remains a peaceful, encouraging sanctuary for artists and fans worldwide. By participating, you agree to uphold these standards.
                  </p>
                </div>

                {/* Content Standards */}
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    1. Artwork Classification & Age Appropriateness
                  </h2>
                  <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <strong className="text-slate-900 dark:text-white block mb-1">🟢 All-Ages (General Content)</strong>
                      Illustrations suitable for viewing in public. Includes character portraits, landscapes, fantasy action, and wholesome slice-of-life scenes.
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <strong className="text-slate-900 dark:text-white block mb-1">🟡 Sensitive / Mature Warning</strong>
                      Works containing artistic swimwear, suggestive poses, or light fanservice must be uploaded with accurate content tags so viewers can filter their feeds appropriately.
                    </div>
                    <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300">
                      <strong className="text-rose-900 dark:text-rose-200 block mb-1">🔴 Zero Tolerance Violations</strong>
                      The following result in permanent ban and immediate law enforcement escalation: Child Sexual Abuse Material (CSAM/CSAE), real-life gore/violence, hate speech, non-consensual imagery, and doxxing.
                    </div>
                  </div>
                </div>

                {/* Respect for Original Creators */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    2. Creator Integrity & Anti-Theft
                  </h2>
                  <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <li><strong className="text-slate-900 dark:text-white">Only Post Your Own Art:</strong> You must be the original creator or have explicit written permission from the copyright owner. Reposting others' artwork without consent is strictly prohibited.</li>
                    <li><strong className="text-slate-900 dark:text-white">Anti-AI Slop & Transparency:</strong> Mass-generated, uncurated AI spam designed to flood feeds is forbidden. If AI-assisted tools were utilized in your pipeline, you must disclose it honestly via tags.</li>
                    <li><strong className="text-slate-900 dark:text-white">No Impersonation:</strong> Registering handles to impersonate established artists, studios, or public figures will result in immediate suspension.</li>
                  </ul>
                </div>

                {/* Etiquette */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    3. Commenting & Interaction Etiquette
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Treat fellow community members with kindness. Constructive artistic feedback is welcome when solicited; harassment, derogatory comments, unsolicited commercial advertisements, and spam bots will not be tolerated.
                  </p>
                </div>
              </article>
            )}

            {/* TAB 3: TERMS OF SERVICE */}
            {activeTab === 'terms' && (
              <article className="space-y-8 animate-fadeIn">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50 mb-3">
                    <FileText className="w-3 h-3" />
                    <span>Binding User Agreement</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Terms of Service
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Welcome to Lumiina. By accessing or creating an account on Lumiina, you agree to be bound by these Terms of Service. Please read them carefully.
                  </p>
                </div>

                {/* Section 1 */}
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    1. Ownership & Copyright Guarantee
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong className="text-slate-900 dark:text-white">You retain 100% intellectual property ownership</strong> of all illustrations, characters, and text you upload to Lumiina. Uploading content to Lumiina does NOT transfer your copyright to us.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong>Limited Platform License:</strong> By posting artwork, you grant Lumiina a non-exclusive, worldwide, royalty-free license solely to host, cache, compress, resize, format, and display your work to other users as part of providing the Lumiina service. We will never sell your artwork or license it to third parties without your explicit authorization.
                  </p>
                </div>

                {/* Section 2 */}
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    2. User Accounts & Security
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account credentials. You must provide a valid email address during registration and use a strong password meeting our entropy requirements. Lumiina is not liable for losses caused by unauthorized access resulting from compromised user credentials.
                  </p>
                </div>

                {/* Section 3 */}
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    3. Anti-Scraping & Data Crawling Restrictions
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Automated extraction of images, artist metadata, or user records using web scrapers, spiders, or unauthorized API scripts is strictly prohibited. Specifically, <strong className="text-slate-900 dark:text-white">using Lumiina-hosted artwork for training machine learning or generative AI models without explicit written consent from the respective artists is an actionable breach of contract</strong> and subject to immediate technical blocking and legal remedy.
                  </p>
                </div>

                {/* Section 4 */}
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    4. DMCA & Notice of Copyright Infringement
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Lumiina respects intellectual property rights and adheres to standard DMCA takedown procedures. If you believe your copyrighted work is being displayed on Lumiina without authorization, please submit a notice containing proof of ownership and the artwork link to:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 font-mono text-xs text-sky-600 dark:text-sky-400">
                    dmca@lumiina.art • Subject: DMCA Takedown Notice
                  </div>
                </div>

                {/* Section 5 */}
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    5. Account Termination
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    You may terminate your account at any time. Lumiina reserves the right to suspend or terminate accounts that repeatedly violate these Terms or our Community Guidelines without prior liability.
                  </p>
                </div>
              </article>
            )}

            {/* TAB 4: PRIVACY POLICY */}
            {activeTab === 'privacy' && (
              <article className="space-y-8 animate-fadeIn">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 mb-3">
                    <Lock className="w-3 h-3" />
                    <span>Transparent Data Protection</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Privacy Policy
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Your privacy is not a luxury; it is a fundamental right. Lumiina operates under a strict data-minimization philosophy: we collect only what is strictly required to deliver a high-performance art platform.
                  </p>
                </div>

                {/* Core Guarantee */}
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 space-y-1">
                  <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>The Lumiina Privacy Guarantee</span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    We will <strong>NEVER</strong> sell, rent, or trade your personal email, username, or uploaded artworks to third-party data brokers, ad networks, or commercial AI training operations.
                  </p>
                </div>

                {/* Data Collection */}
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    1. Information We Collect
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <strong className="text-slate-900 dark:text-white block mb-1">Account Information</strong>
                      Username, email address, salted bcrypt password hash (we never store plain-text passwords), bio, avatar, and banner.
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <strong className="text-slate-900 dark:text-white block mb-1">Creative Content</strong>
                      Your uploaded illustrations, titles, descriptions, tags, bookmark collections, and comments.
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <strong className="text-slate-900 dark:text-white block mb-1">Technical Security Logs</strong>
                      Temporary IP address, user-agent, and request timestamps used exclusively for rate limiting, DDoS defense, and session security.
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <strong className="text-slate-900 dark:text-white block mb-1">Local State & Cookies</strong>
                      JWT authentication tokens and UI theme preferences stored in local storage. Zero third-party cross-site advertising cookies.
                    </div>
                  </div>
                </div>

                {/* Data Storage & Security */}
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    2. Security & Encryption
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    All data in transit is encrypted using modern TLS 1.3. User passwords are protected using industry-standard adaptive bcrypt hashing with individual cryptographic salts. Server endpoints are hardened against ID enumeration, brute-force intrusions, and timing attacks.
                  </p>
                </div>

                {/* User Rights */}
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    3. Your Privacy Rights (GDPR & CCPA Aligned)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    You have full sovereignty over your digital footprint on Lumiina:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <li><strong>Right to Access:</strong> View all your active profile data and uploaded portfolio anytime.</li>
                    <li><strong>Right to Rectification:</strong> Edit your profile info, bio, avatar, and banner in real-time.</li>
                    <li><strong>Right to Erasure (Right to be Forgotten):</strong> Request permanent deletion of your account and all associated artwork records.</li>
                  </ul>
                </div>

                {/* Contact */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Privacy Inquiries</div>
                  <p className="text-xs text-slate-500">
                    Questions regarding data security or rights exercise may be sent to <span className="font-mono text-sky-600 dark:text-sky-400">privacy@lumiina.art</span>.
                  </p>
                </div>
              </article>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
