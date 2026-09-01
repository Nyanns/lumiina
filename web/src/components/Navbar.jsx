import React from 'react';
import { Search, Upload, LogIn, User, LogOut, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({
  searchQuery,
  onSearchChange,
  activeTag,
  onTagSelect,
  onOpenUpload,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  const POPULAR_TAGS = [
    'Semua',
    'GenshinImpact',
    'Vocaloid',
    'Frieren',
    'Cyberpunk',
    'Original',
    'Illustration',
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Mascots */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => { onSearchChange(''); onTagSelect('Semua'); }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              L
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">Lumiina</span>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none">by Lumi & Ina</p>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari fan art, judul anime, deskripsi, atau artist..."
                className="w-full pl-10 pr-10 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-full border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all duration-150"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions & User State */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isAuthenticated ? (
              <>
                <button
                  onClick={onOpenUpload}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-full shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Unggah Karya</span>
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <button
                    onClick={() => onOpenProfile(user?.id)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
                    title="Buka Profil"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase border border-slate-300">
                      {user?.username?.[0] || 'U'}
                    </div>
                    <span className="hidden md:inline text-xs font-semibold">{user?.username}</span>
                  </button>

                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                    title="Keluar"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 border border-sky-200 rounded-full transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Daftar</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Tag Filter Pills */}
        <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto no-scrollbar border-t border-slate-100">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0 mr-1" />
          {POPULAR_TAGS.map((tag) => {
            const isSelected = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => onTagSelect(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tag === 'Semua' ? '🔥 Semua Karya' : `#${tag}`}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
