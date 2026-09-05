import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useLikes } from '../context/LikesContext';
import { useAuth } from '../context/AuthContext';

export const HorizontalWorksCarousel = ({
  title = "Works",
  showAllTo = "/",
  artworks = [],
}) => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getLikeInfo, toggleLike } = useLikes();

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const hasOverflow = scrollWidth > clientWidth + 10;
      setCanScrollLeft(hasOverflow && scrollLeft > 10);
      setCanScrollRight(hasOverflow && scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [artworks]);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScrollability, 350);
    }
  };

  if (!artworks || artworks.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 pb-2 relative group/carousel">
      {/* Header: Title & Pixiv Style "Show all" Link */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>
        <Link
          to={showAllTo}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          Show all
        </Link>
      </div>

      {/* Carousel Container with Inside Floating Scroll Buttons */}
      <div className="relative">
        {/* Left Scroll Button (Only shown if scrolled right) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="absolute left-1 top-20 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Right Scroll Button (Only shown if content overflows) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="absolute right-1 top-20 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}

        {/* X-Axis Scrollable Row (Pixiv Carousel Style) */}
        <div
          ref={scrollRef}
          onScroll={checkScrollability}
          className="flex items-start gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1.5 -mx-1 px-1"
        >
        {artworks.map((art) => {
          const { isLiked, count: likeCount } = getLikeInfo(art.id, art.like_count || 0);

          return (
            <div
              key={art.id}
              onClick={() => navigate(`/artworks/${art.id}`)}
              className="flex flex-col gap-2 shrink-0 w-36 sm:w-44 group cursor-pointer"
            >
              {/* Square Image with docked like button */}
              <div className="relative w-36 sm:w-44 h-36 sm:h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-200">
                <img
                  src={art.image_url}
                  alt={art.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Docked Like Heart Button (Bottom Right) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    toggleLike(art.id, art.like_count || 0);
                  }}
                  className={`absolute bottom-2 right-2 p-1.5 rounded-full shadow-md transition-all cursor-pointer ${
                    isLiked
                      ? 'bg-white text-rose-600 dark:bg-slate-900 dark:text-rose-500'
                      : 'bg-black/50 hover:bg-black/70 text-white'
                  }`}
                  title="Like artwork"
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              {/* Title & Creator under thumbnail */}
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {art.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                  <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[9px] flex items-center justify-center uppercase shrink-0 overflow-hidden">
                    {art.user?.avatar_url ? (
                      <img src={art.user.avatar_url} alt={art.user?.username} className="w-full h-full object-cover" />
                    ) : (
                      art.user?.username?.[0] || 'A'
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {art.user?.username || 'Artist'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
};

