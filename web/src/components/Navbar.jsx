import React from 'react';
import { Search, Upload, LogIn, LogOut, X, Sparkles } from 'lucide-react';
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
  const POPULAR_TAGS = ['Semua', 'GenshinImpact', 'Vocaloid', 'Frieren', 'Cyberpunk', 'Original'];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Row */}
        <div className="flex items-center justify-between h-16 gap-6">
          
          {/* Brand */}
          <div 
            className="flex items-center gap-3 shrink-0 cursor-pointer group" 
            onClick={() => { onSearchChange(''); onTagSelect('Semua'); }}
            role="button"
            tabIndex={0}
          >
            <div className="w-9 h-9 rounded-xl bg-sky-600 group-hover:bg-sky-500 transition-colors flex items-center justify-center text-white font-bold text-lg shadow-sm">
              L
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">Lumiina</h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Platform Fan Art</p>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-2xl relative hidden sm:block">
            <div className="relative group">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-sky-500 transition-colors pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari ilustrasi, gaya seni, atau kreator..."
                className="w-full pl-11 pr-10 py-2.5 text-sm bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-full border border-transparent focus:border-sky-300 focus:ring-4 focus:ring-sky-100 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <nav className="flex items-center gap-3 shrink-0" aria-label="User navigation">
            {isAuthenticated ? (
              <>
                <button
                  onClick={onOpenUpload}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-full shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden md:inline">Unggah</span>
                </button>

                <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenProfile(user?.id)}
                    className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer pr-3"
                    aria-label="View Profile"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {user?.username?.[0] || 'U'}
                    </div>
                    <span className="hidden md:block text-sm font-bold text-slate-700">{user?.username}</span>
                  </button>

                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                    title="Keluar"
                  >
                    <LogOut className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 rounded-full transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Daftar</span>
              </button>
            )}
          </nav>

        </div>

        {/* Tags Row */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar border-t border-slate-100/60 mt-1">
          <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mr-2" />
          {POPULAR_TAGS.map((tag) => {
            const isSelected = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => onTagSelect(tag)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
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
