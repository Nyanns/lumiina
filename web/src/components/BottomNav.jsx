import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Plus, Bookmark, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * BottomNav Component
 * Modern 2026 Thumb-Zone Navigation Bar for Mobile Viewports (< 768px).
 *
 * Features:
 * - 5 Essential Destinations: Feed, Explore, Center Upload CTA, Bookmarks, and Profile.
 * - Hardware Safe-Area Support (env(safe-area-inset-bottom)) for notch / gesture bar devices.
 * - Tactile active states with Pixiv Sky Blue (#0096fa) accents.
 * - High accessibility (48px+ touch targets).
 */
export const BottomNav = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const currentPath = location.pathname;

  // Don't render on auth pages
  if (['/login', '/register', '/forgot-password'].includes(currentPath)) {
    return null;
  }

  // Active state checkers
  const isHomeActive = currentPath === '/' && !location.search.includes('tab=');
  const isExploreActive = currentPath === '/trending' || currentPath === '/recommended' || (currentPath === '/' && location.search.includes('search='));
  const isUploadActive = currentPath === '/upload';
  const isBookmarksActive = currentPath.includes('tab=bookmarks') || (isAuthenticated && currentPath === `/profile/${user?.username || user?.id}` && location.search.includes('tab=bookmarks'));
  const isProfileActive = isAuthenticated && (currentPath === `/profile/${user?.username || user?.id}` || currentPath === '/profile/me') && !location.search.includes('tab=bookmarks');

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#161a22]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] transition-colors"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2">
        
        {/* 1. Feed / Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors cursor-pointer ${
            isHomeActive 
              ? 'text-[#0096fa]' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className={`text-[10px] tracking-tight mt-0.5 ${isHomeActive ? 'font-bold' : 'font-medium'}`}>
            Home
          </span>
        </Link>

        {/* 2. Explore / Discovery */}
        <Link
          to="/trending"
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors cursor-pointer ${
            isExploreActive 
              ? 'text-[#0096fa]' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Compass className={`w-5 h-5 ${isExploreActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className={`text-[10px] tracking-tight mt-0.5 ${isExploreActive ? 'font-bold' : 'font-medium'}`}>
            Explore
          </span>
        </Link>

        {/* 3. Center Prominent Upload CTA */}
        <Link
          to={isAuthenticated ? '/upload' : '/login'}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center group cursor-pointer"
          aria-label="Upload new artwork"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0096fa] to-sky-400 text-white flex items-center justify-center shadow-md shadow-sky-500/25 group-active:scale-95 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.75]" />
          </div>
          <span className="sr-only">Upload</span>
        </Link>

        {/* 4. Bookmarks */}
        <Link
          to={isAuthenticated ? `/profile/${user?.username || user?.id}?tab=bookmarks` : '/login'}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors cursor-pointer ${
            isBookmarksActive 
              ? 'text-[#0096fa]' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarksActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className={`text-[10px] tracking-tight mt-0.5 ${isBookmarksActive ? 'font-bold' : 'font-medium'}`}>
            Saved
          </span>
        </Link>

        {/* 5. Profile or Sign In */}
        <Link
          to={isAuthenticated ? `/profile/${user?.username || user?.id}` : '/login'}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors cursor-pointer ${
            isProfileActive 
              ? 'text-[#0096fa]' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {isAuthenticated && user?.avatar_url ? (
            <div className={`w-5 h-5 rounded-full overflow-hidden border ${isProfileActive ? 'border-[#0096fa] ring-1 ring-[#0096fa]' : 'border-slate-300 dark:border-slate-700'}`}>
              <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
            </div>
          ) : (
            <User className={`w-5 h-5 ${isProfileActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          )}
          <span className={`text-[10px] tracking-tight mt-0.5 ${isProfileActive ? 'font-bold' : 'font-medium'}`}>
            {isAuthenticated ? 'Profile' : 'Sign In'}
          </span>
        </Link>

      </div>
    </nav>
  );
};
