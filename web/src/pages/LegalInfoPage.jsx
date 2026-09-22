import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  BookOpen, 
  Sparkles, 
  Lock, 
  Sun, 
  Moon,
  Heart,
  Palette,
  Star,
  Maximize2,
  X,
  Check,
  Copy,
  Layers,
  Compass,
  Smile,
  Laptop,
  PenTool,
  Package,
  Footprints,
  Shield,
  Zap,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function LegalInfoPage({ defaultTab }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [copiedEmoji, setCopiedEmoji] = useState(null);

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

  const handleTabChange = (key) => {
    setActiveTab(key);
    navigate(`/${key}`);
  };

  const navItems = [
    { key: 'about', label: 'About & Mascot', icon: Sparkles, badge: 'Character Bible' },
    { key: 'guidelines', label: 'Community Guidelines', icon: BookOpen, badge: 'Content Standards' },
    { key: 'terms', label: 'Terms of Service', icon: FileText, badge: 'Artist Ownership' },
    { key: 'privacy', label: 'Privacy Policy', icon: ShieldCheck, badge: 'No Data Selling' },
  ];

  const metaConfig = {
    about: {
      title: 'About Lumiina — Creative Guide & Character Bible v1.0',
      description: 'Meet Lumiina, the official creative guide of the Lumiina art community. A small light in a big world, celebrating human anime artists and original fan art.',
      canonical: 'https://lumiina.art/about',
    },
    guidelines: {
      title: 'Community Guidelines — Content Standards & Safe Space | Lumiina',
      description: 'Explore Lumiina community guidelines, content classifications, anti-theft policies, and standards for a safe, welcoming anime art community.',
      canonical: 'https://lumiina.art/guidelines',
    },
    terms: {
      title: 'Terms of Service — 100% Artist Ownership Guarantee | Lumiina',
      description: 'Read the Lumiina Terms of Service. Creators retain 100% intellectual property rights. Strict anti-scraping and AI crawler restrictions.',
      canonical: 'https://lumiina.art/terms',
    },
    privacy: {
      title: 'Privacy Policy — No Data Selling & GDPR/CCPA Aligned | Lumiina',
      description: 'Lumiina privacy policy: We never sell creator portfolios or personal data to AI datasets or third-party brokers. Transparent data protection.',
      canonical: 'https://lumiina.art/privacy',
    },
  }[activeTab] || {
    title: 'Documentation & Legal Hub — Lumiina',
    description: 'Documentation, community guidelines, terms, and privacy policy for Lumiina.',
    canonical: 'https://lumiina.art/about',
  };

  const copyEmojiCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedEmoji(code);
    setTimeout(() => setCopiedEmoji(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f1f3f7] dark:bg-[#0b0f17] text-slate-800 dark:text-slate-200 transition-colors duration-200">
      <Helmet>
        <title>{metaConfig.title}</title>
        <meta name="description" content={metaConfig.description} />
        <link rel="canonical" href={metaConfig.canonical} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Lumiina" />
        <meta property="og:title" content={metaConfig.title} />
        <meta property="og:description" content={metaConfig.description} />
        <meta property="og:image" content="https://lumiina.art/mascot/bg2.png" />
        <meta property="og:url" content={metaConfig.canonical} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@lumiina_art" />
        <meta name="twitter:title" content={metaConfig.title} />
        <meta name="twitter:description" content={metaConfig.description} />
        <meta name="twitter:image" content="https://lumiina.art/mascot/bg2.png" />
      </Helmet>
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
              <img src="/logo_mark.png" alt="Lumiina" className="w-5 h-5 object-contain" />
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
                  Character Bible: <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">v1.0</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="lg:col-span-9 bg-white dark:bg-[#121722] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-10 shadow-xs">
            
            {/* TAB 1: ABOUT US & CHARACTER BIBLE (HUMAN-CRAFTED EDITORIAL DESIGN) */}
            {activeTab === 'about' && (
              <article className="space-y-12 animate-fadeIn text-slate-800 dark:text-slate-200">
                
                {/* 1. Header & Mission Manifesto */}
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span>Creative Guide & Community Manifesto</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    A Sanctuary for Digital Illustrators & Fan Artists
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                    Lumiina is an independent illustration sharing community built for anime, manga, and digital fan art creators. We reject algorithmic slop, intrusive advertising, and unauthorized data scraping — providing a calm, lightning-fast stage where human artistic craftsmanship is protected, celebrated, and preserved.
                  </p>
                </div>

                {/* 2. Official Mascot Hero Visual Spotlight */}
                <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 relative shadow-sm group">
                  <picture>
                    <source srcSet="/mascot/bg2.webp" type="image/webp" />
                    <img
                      src="/mascot/bg2.png"
                      alt="Lumiina — Official Creative Guide"
                      className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-[1.01] transition-transform duration-700 ease-out"
                    />
                  </picture>
                  <div className="p-6 sm:p-8 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent absolute inset-x-0 bottom-0 text-white flex flex-col justify-end">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/25 text-sky-300 border border-sky-400/30">
                        Official Character Property
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                        Character Bible v1.0
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                      <span>Lumiina</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-sky-200 uppercase tracking-wider">
                        Creative Guide
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 mt-1.5 max-w-2xl leading-relaxed">
                      "A small light in a big world. She does not create in place of the artist; she stays beside them, discovering, preserving, and illuminating the work they choose to share."
                    </p>
                    <div className="mt-3 text-xs font-medium text-sky-300 flex items-center gap-2">
                      <span>I'll always be by your side.</span>
                    </div>
                  </div>
                </div>

                {/* 3. The "Small Light" Lore & Philosophy */}
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-7 space-y-3">
                  <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-sm">
                    <Compass className="w-4 h-4" />
                    <span>The "Small Light" Philosophy</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Lumiina is born from the countless sketches, color experiments, and visual stories created by illustrators. In our universe, <strong>every creator carries an inner creative light</strong>. A viral artwork admired by millions has a brilliant blaze, but an intimate doodle shared with only a few friends holds that very same creative warmth.
                  </p>
                  <blockquote className="pl-3.5 border-l-2 border-sky-500 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 italic my-2">
                    "A small light is still a light."
                  </blockquote>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    This core belief defines Lumiina's role: <strong>the artist remains the sole protagonist</strong>. Lumiina never takes the spotlight away from creators; she is the companion and guardian who helps their light reach the world.
                  </p>
                </div>

                {/* 4. Character Profile Matrix */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      Character Profile & Specifications
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Production character matrix for cross-media consistency.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] shadow-2xs">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Name & Designation</span>
                      <strong className="text-slate-900 dark:text-white text-sm block mt-0.5">Lumiina</strong>
                      <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">Official Creative Guide</span>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] shadow-2xs">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Height & Birthday</span>
                      <strong className="text-slate-900 dark:text-white text-sm block mt-0.5">158 cm • July 7</strong>
                      <span className="text-[11px] text-slate-500">Star Festival (Tanabata)</span>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] shadow-2xs">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Archetype</span>
                      <strong className="text-slate-900 dark:text-white text-sm block mt-0.5">Creative Companion</strong>
                      <span className="text-[11px] text-slate-500">Calm, warm, curious, observant</span>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] shadow-2xs sm:col-span-2 lg:col-span-1">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Key Traits</span>
                      <span className="text-slate-800 dark:text-slate-200 mt-0.5 block font-medium">
                        Silver-white long hair, crystalline blue eyes, floating ahoge, ✦ + ● sparkle clip.
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] shadow-2xs sm:col-span-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Likes & Boundaries</span>
                      <span className="text-slate-800 dark:text-slate-200 mt-0.5 block font-medium">
                        Cherishes starry nights, blue hues, sketchbooks, and hard-working artists. Dislikes art theft, cluttered desks, and creators overworking without proper rest.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Visual DNA & Color System */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Palette className="w-4 h-4 text-sky-500" />
                      <span>Visual DNA & Color System</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Production palette tokens ensuring visual balance across illustration and UI.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] flex flex-col justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="w-6 h-6 rounded-md bg-[#F8FAFC] border border-slate-300 dark:border-slate-700 mb-2.5 shadow-2xs" />
                        <strong className="text-slate-900 dark:text-white block text-sm font-bold">Canvas White</strong>
                        <span className="font-mono text-[11px] text-slate-500">#F8FAFC</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        The oversized studio jacket and the limitless starting surface of every illustration.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] flex flex-col justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="w-6 h-6 rounded-md bg-[#0096FA] mb-2.5 shadow-2xs" />
                        <strong className="text-slate-900 dark:text-white block text-sm font-bold">Ice Blue Light</strong>
                        <span className="font-mono text-[11px] text-sky-500">#0096FA / #38BDF8</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Structural ribbons, hair highlights, and the luminous spark of imagination.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] flex flex-col justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="w-6 h-6 rounded-md bg-[#0F172A] mb-2.5 shadow-2xs" />
                        <strong className="text-slate-900 dark:text-white block text-sm font-bold">Deep Navy</strong>
                        <span className="font-mono text-[11px] text-slate-400">#0F172A</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Inner layer and dark shorts, providing structural grounding and lineart contrast.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="text-sky-500 font-mono">✦ + ●</span>
                        <span>The Signature Motif</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                        The geometric sparkle and orb icon connecting hairpins, zipper pulls, messenger strap, and sneakers.
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px] shrink-0">
                      Streetwear × Digital Craft
                    </div>
                  </div>
                </div>

                {/* 6. Production Reference Sheets Showcase */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-500" />
                        <span>Production Character Sheets & Turnarounds</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Click any sheet to inspect the native full-resolution file.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Sheet 1: Master Bible */}
                    <div 
                      onClick={() => setSelectedSheet('/mascot/character_bible_master.png')}
                      className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] shadow-2xs hover:shadow-md transition-all"
                    >
                      <div className="aspect-[3/2] overflow-hidden bg-slate-100 dark:bg-slate-950">
                        <img 
                          src="/mascot/character_bible_master.png" 
                          alt="Lumiina Master Character Bible" 
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>Master Reference Bible</span>
                            <span className="text-[10px] text-sky-500 font-mono">v1.0</span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Palette, turnarounds, facial close-ups & props</span>
                        </div>
                        <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition-colors" />
                      </div>
                    </div>

                    {/* Sheet 2: Full Turnaround */}
                    <div 
                      onClick={() => setSelectedSheet('/mascot/character_sheet_full.png')}
                      className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] shadow-2xs hover:shadow-md transition-all"
                    >
                      <div className="aspect-[3/2] overflow-hidden bg-slate-100 dark:bg-slate-950">
                        <img 
                          src="/mascot/character_sheet_full.png" 
                          alt="Lumiina Turnaround Sheet" 
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>Turnaround & Chibi Library</span>
                            <span className="text-[10px] text-sky-500 font-mono">3-View</span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Front, side, and back full-body models</span>
                        </div>
                        <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. Signature Gear & Props */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Package className="w-4 h-4 text-sky-500" />
                      <span>Signature Gear & Creative Toolkit</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Functional items carried by Lumiina during studio work and city explorations.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <Laptop className="w-3.5 h-3.5 text-sky-500" />
                        <span>Digital Drawing Tablet</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Her primary handheld device for companion sketches and discovering art across the gallery.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <PenTool className="w-3.5 h-3.5 text-sky-500" />
                        <span>Precision Stylus</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Equipped with a miniature star charm, symbolizing clean linework and deliberate brushstrokes.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span>Hoshi Plush Mascot</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        A soft companion plush carrying a blue star clip, resting beside her during late studio nights.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <Package className="w-3.5 h-3.5 text-sky-500" />
                        <span>Studio Messenger Bag</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Compact utility bag designed to hold reference sketchbooks and tablet cables.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <Eye className="w-3.5 h-3.5 text-sky-500" />
                        <span>Studio Sunglasses</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Worn casually during outdoor walks and relaxed cafe breaks.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <Footprints className="w-3.5 h-3.5 text-sky-500" />
                        <span>High-Top Sneakers</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Chunky white and ice-blue anime sneakers built for long days exploring artist exhibitions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 8. Official 9-Expression Sticker Library */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Smile className="w-4 h-4 text-sky-500" />
                      <span>Community Expression Stickers</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Available in comment sections. Click any sticker to copy its shortcode.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-9 gap-2.5">
                    {[
                      { id: 1, name: 'Happy', code: ':lumiina_1:', thumb: '/mascot/emojis/1_thumb.webp' },
                      { id: 2, name: 'Shy', code: ':lumiina_2:', thumb: '/mascot/emojis/2_thumb.webp' },
                      { id: 3, name: 'Excited', code: ':lumiina_3:', thumb: '/mascot/emojis/3_thumb.webp' },
                      { id: 4, name: 'Wink', code: ':lumiina_4:', thumb: '/mascot/emojis/4_thumb.webp' },
                      { id: 5, name: 'Pout', code: ':lumiina_5:', thumb: '/mascot/emojis/5_thumb.webp' },
                      { id: 6, name: 'Love', code: ':lumiina_6:', thumb: '/mascot/emojis/6_thumb.webp' },
                      { id: 7, name: 'Cool', code: ':lumiina_7:', thumb: '/mascot/emojis/7_thumb.webp' },
                      { id: 8, name: 'Peeking', code: ':lumiina_8:', thumb: '/mascot/emojis/8_thumb.webp' },
                      { id: 9, name: 'Thinking', code: ':lumiina_9:', thumb: '/mascot/emojis/9_thumb.webp' },
                    ].map((emoji) => {
                      const isCopied = copiedEmoji === emoji.code;
                      return (
                        <button
                          key={emoji.id}
                          type="button"
                          onClick={() => copyEmojiCode(emoji.code)}
                          className="group relative flex flex-col items-center p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-sm transition-all active:scale-95 cursor-pointer text-center"
                          title={`${emoji.name} — Click to copy ${emoji.code}`}
                        >
                          <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
                            <img
                              src={emoji.thumb}
                              alt={emoji.name}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-full">
                            {emoji.name}
                          </span>
                          <span className="text-[8px] font-mono text-slate-400 group-hover:text-sky-500 transition-colors">
                            {emoji.code}
                          </span>
                          {isCopied && (
                            <div className="absolute inset-0 bg-sky-600 rounded-xl flex flex-col items-center justify-center text-white text-[10px] font-bold animate-fadeIn">
                              <Check className="w-3.5 h-3.5 mb-0.5" />
                              Copied!
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 9. Core Platform Pillars */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      Platform Core Pillars
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      The engineering and ethical commitments governing Lumiina.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] shadow-2xs space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">100% Artist Ownership</h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Creators retain full intellectual property rights over every illustration they publish. We provide the gallery stage; you retain total sovereign copyright.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] shadow-2xs space-y-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Zero Unsolicited AI Scraping</h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        We actively prohibit automated data harvesting and never sell creator portfolios to commercial model training datasets. Art is meant for human connection.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] shadow-2xs space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">High-Speed Pure Architecture</h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Powered by Go, PostgreSQL, and Redis. Sub-millisecond response times, zero third-party behavioral ad trackers, and maximum image fidelity.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#141820] shadow-2xs space-y-2">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sanctuary for Creators</h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        A peaceful, constructive community celebrating original characters, VTubers, manga drawings, and personal artistic journeys.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 10. Open Architecture & Creator Call-to-Action */}
                <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Ready to share your illustrations?
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Open and free for artists worldwide. Powered by Go 1.22+ and PostgreSQL.
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      to="/"
                      className="px-4 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                    >
                      Explore Gallery
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 rounded-xl bg-[#0096fa] hover:bg-[#0082d6] text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Join Lumiina
                    </Link>
                  </div>
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <strong className="text-slate-900 dark:text-white">All-Ages (General Content)</strong>
                      </div>
                      Illustrations suitable for viewing in public. Includes character portraits, landscapes, fantasy action, and wholesome slice-of-life scenes.
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <strong className="text-slate-900 dark:text-white">Sensitive / Mature Warning</strong>
                      </div>
                      Works containing artistic swimwear, suggestive poses, or light fanservice must be uploaded with accurate content tags so viewers can filter their feeds appropriately.
                    </div>
                    <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <strong className="text-rose-900 dark:text-rose-200">Zero Tolerance Violations</strong>
                      </div>
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

      {/* Lightbox Modal for Character Turnaround Sheets */}
      {selectedSheet && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedSheet(null)}
        >
          <div 
            className="relative max-w-5xl max-h-[92vh] w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Lumiina Production Character Sheet (Click anywhere to close)</span>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedSheet(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[85vh] p-2 flex items-center justify-center bg-[#0d1117]">
              <img 
                src={selectedSheet} 
                alt="Lumiina Production Sheet" 
                className="w-auto h-auto max-w-full max-h-[82vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
