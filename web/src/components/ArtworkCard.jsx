import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Eye } from 'lucide-react';
import { useLikes } from '../context/LikesContext';
import { useAuth } from '../context/AuthContext';

export const ArtworkCard = ({ artwork, index }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getLikeInfo, toggleLike } = useLikes();

  const { isLiked, count: likeCount } = getLikeInfo(artwork.id, artwork.like_count || 0);

  const handleCardClick = (e) => {
    if (e.target.closest('.author-link') || e.target.closest('.action-btn')) {
      return;
    }
    navigate(`/artworks/${artwork.id}`);
  };

  const handleLikeToggle = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    toggleLike(artwork.id, artwork.like_count || 0);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.25), ease: 'easeOut' }}
      onClick={handleCardClick}
      className="group bg-white dark:bg-[#1a1e24] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col hover:-translate-y-1"
    >
      {/* Artwork Image */}
      <div className="relative w-full bg-slate-100 dark:bg-[#121519] overflow-hidden">
        {!isLoaded && (
          <div className="w-full aspect-[3/4] bg-slate-200 dark:bg-slate-800 animate-pulse" />
        )}
        <img
          src={artwork.image_url}
          alt={artwork.title}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
          }`}
        />

        {/* Hover Hint */}
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-900/80 text-white px-2 py-1 rounded-full shadow-sm">
            <Eye className="w-3 h-3" /> View
          </span>
        </div>
      </div>

      {/* Under-Thumbnail Metadata (Pixiv & YouTube style) */}
      <div className="p-3.5 flex flex-col gap-2">
        {/* Title */}
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
          {artwork.title}
        </h3>

        {/* Creator Row & Engagement Stats */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Creator Link */}
          <Link
            to={`/profile/${artwork.user?.id || artwork.user_id}`}
            className="author-link flex items-center gap-1.5 hover:opacity-80 transition-opacity min-w-0"
            title={`View ${artwork.user?.username}'s profile`}
          >
            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
              {artwork.user?.username?.[0] || 'A'}
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
              {artwork.user?.username || 'Artist'}
            </span>
          </Link>

          {/* Action Counters (Likes & Comments) */}
          <div className="flex items-center gap-2.5 shrink-0 text-slate-400">
            <button
              type="button"
              onClick={handleLikeToggle}
              className={`action-btn flex items-center gap-1 text-xs font-semibold hover:text-rose-600 transition-colors cursor-pointer p-0.5 ${
                isLiked ? 'text-rose-600 dark:text-rose-500' : 'text-slate-400 dark:text-slate-500'
              }`}
              title="Like this artwork"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="font-bold">{likeCount}</span>
            </button>

            {((artwork.comment_count || 0) > 0 || (artwork.comments && artwork.comments.length > 0)) && (
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{artwork.comment_count ?? artwork.comments?.length ?? 0}</span>
              </span>
            )}
          </div>
        </div>

        {/* Tag Badges */}
        {artwork.tags && artwork.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 overflow-hidden max-h-5">
            {artwork.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id || tag.name}
                className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded transition-colors"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
};
