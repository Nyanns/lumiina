import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Upload, 
  LogOut, 
  X, 
  ChevronDown, 
  Moon, 
  Sun, 
  Bookmark, 
  Globe,
  User 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Navbar = ({ searchQuery, onSearchChange }) => {
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [postDropdownOpen, setPostDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const postDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (postDropdownRef.current && !postDropdownRef.current.contains(e.target)) {
        setPostDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearch);
    }
    if (location.pathname !== '/') {
      navigate(`/?search=${encodeURIComponent(localSearch)}`);
    }
  };

  const handleClear = () => {
    setLocalSearch('');
    if (onSearchChange) onSearchChange('');
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#1a1e24] border-b border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 sm:gap-6">
          
          {/* Brand Logo: Official Lumiina Wordmark (Pixiv Style) */}
          <Link 
            to="/" 
            className="flex items-center shrink-0 py-1"
            title="Lumiina — Anime Fan Art Platform"
          >
            <img 
              src="/logo_wordmark.png" 
              alt="Lumiina" 
              className="h-7 sm:h-[30px] w-auto object-contain" 
            />
          </Link>

          {/* Search Box (Pixiv inspired) */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="flex-1 max-w-xl relative hidden md:block"
          >
            <div className="relative group">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-sky-600 transition-colors pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  if (onSearchChange) onSearchChange(e.target.value);
                }}
                placeholder="Search illustrations, tags, or creators..."
                className="w-full pl-10 pr-9 py-2 text-sm bg-slate-100 dark:bg-[#252a32] hover:bg-slate-200/70 dark:hover:bg-[#2c323c] focus:bg-white dark:focus:bg-[#21262d] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-full border border-transparent focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950/40 transition-all outline-none"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Navigation & Action CTAs */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Crafted Anti-Slop Theme Toggle (Segmented tactile control) */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-0.5 p-1 rounded-full border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-[#252a32] text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer shadow-xs"
              title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
              aria-label="Toggle color theme"
            >
              <span 
                className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${
                  !isDark 
                    ? 'bg-white text-amber-500 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </span>
              <span 
                className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${
                  isDark 
                    ? 'bg-[#1a1e24] text-sky-400 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </span>
            </button>

            {isAuthenticated ? (
              <>
                {/* Pixiv-style Post Dropdown / Button */}
                <div className="relative" ref={postDropdownRef}>
                  <button
                    onClick={() => setPostDropdownOpen(!postDropdownOpen)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#252a32] hover:bg-slate-200 dark:hover:bg-[#303642] rounded-full transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
                  >
                    <span>Post</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${postDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {postDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1f242c] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/80 py-2 z-50">
                      <Link
                        to="/upload"
                        onClick={() => setPostDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 transition-colors"
                      >
                        <Upload className="w-4 h-4 text-sky-600" />
                        <span>Artwork / Illustration</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Pixiv-style User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      const next = !profileDropdownOpen;
                      setProfileDropdownOpen(next);
                      if (next && refreshUser) refreshUser();
                    }}
                    className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-sky-400 transition-all cursor-pointer"
                    aria-label="User profile menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-sky-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user?.username} className="w-full h-full object-cover" />
                      ) : (
                        user?.username?.[0] || 'U'
                      )}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown Menu (Exact Pixiv Style - Screenshot 4) */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1a1e24] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-800">
                      
                      {/* Dropdown Header: Banner & Avatar */}
                      <div className="relative">
                        {user?.banner_url ? (
                          <img src={user.banner_url} alt="Banner" className="h-16 w-full object-cover" />
                        ) : (
                          <div className="h-16 w-full bg-slate-200 dark:bg-[#252a32] border-b border-slate-300/40 dark:border-slate-700/60" />
                        )}
                        <div className="px-4 pb-3 pt-2 flex flex-col">
                          <div className="relative -mt-9 mb-1.5">
                            <div className="w-14 h-14 rounded-full bg-white dark:bg-[#1a1e24] p-0.5 shadow-md inline-block">
                              <div className="w-full h-full rounded-full bg-slate-800 dark:bg-sky-600 text-white flex items-center justify-center font-extrabold text-lg uppercase overflow-hidden">
                                {user?.avatar_url ? (
                                  <img src={user.avatar_url} alt={user?.username} className="w-full h-full object-cover" />
                                ) : (
                                  user?.username?.[0] || 'U'
                                )}
                              </div>
                            </div>
                          </div>

                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {user?.display_name || user?.username}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium truncate">
                            @{user?.username?.toLowerCase()}
                          </p>

                          {/* Stats Row */}
                          <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-600 dark:text-slate-400">
                            <Link
                              to={`/profile/${user?.username || user?.id}?tab=following`}
                              onClick={() => setProfileDropdownOpen(false)}
                              className="hover:text-[#0096fa] transition-colors cursor-pointer"
                            >
                              <strong className="text-slate-900 dark:text-white font-bold">{user?.following_count ?? 0}</strong> Following
                            </Link>
                            <Link
                              to={`/profile/${user?.username || user?.id}?tab=followers`}
                              onClick={() => setProfileDropdownOpen(false)}
                              className="hover:text-[#0096fa] transition-colors cursor-pointer"
                            >
                              <strong className="text-slate-900 dark:text-white font-bold">{user?.followers_count ?? 0}</strong> Followers
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Primary Links */}
                      <div className="py-1.5">
                        <Link
                          to={`/profile/${user?.username || user?.id}`}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-[#0096fa] hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                        >
                          <User className="w-4 h-4 text-[#0096fa]" />
                          <span>View Profile</span>
                        </Link>
                        <Link
                          to={`/profile/${user?.username || user?.id}`}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-slate-400" />
                          <span>Bookmarks</span>
                        </Link>
                      </div>

                      {/* Preferences & Dark Theme Toggle */}
                      <div className="py-2 px-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-2 text-slate-500">
                            <Globe className="w-3.5 h-3.5" /> Language
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">English</span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1">
                          <span className="flex items-center gap-2 text-slate-500">
                            {isDark ? <Moon className="w-3.5 h-3.5 text-sky-400" /> : <Sun className="w-3.5 h-3.5" />}
                            Dark Theme
                          </span>
                          <button
                            type="button"
                            onClick={toggleTheme}
                            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                              isDark ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
                            }`}
                          >
                            <div className="w-4 h-4 rounded-full bg-white shadow-md transition-transform" />
                          </button>
                        </div>
                      </div>

                      {/* Logout */}
                      <div className="py-1.5">
                        <button
                          onClick={() => {
                            logout();
                            setProfileDropdownOpen(false);
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center">
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0096fa] hover:bg-[#0084e0] active:scale-95 rounded-full shadow-xs transition-all"
                >
                  <span>Sign Up</span>
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
