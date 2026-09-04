import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, Share2, MoreHorizontal, Check, Calendar } from 'lucide-react';
import { useLikes } from '../context/LikesContext';
import { useAuth } from '../context/AuthContext';

export const FeedPostCard = ({ artwork, index }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getLikeInfo, toggleLike } = useLikes();
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { isLiked, count: likeCount } = getLikeInfo(artwork.id, artwork.like_count || 0);

  const handleLike = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    toggleLike(artwork.id, artwork.like_count || 0);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/artworks/${artwork.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25), ease: 'easeOut' }}
      className="bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col transition-colors"
    >
      {/* Top Header: Creator Info (Instagram & Pixiv Style) */}
      <div className="p-4 flex items-center justify-between">
        <Link
          to={`/profile/${artwork.user?.id || artwork.user_id}`}
          className="flex items-center gap-3 group min-w-0"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center uppercase shrink-0 shadow-xs">
            {artwork.user?.username?.[0] || 'A'}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              {artwork.user?.username || 'Artist'}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {artwork.created_at
                ? new Date(artwork.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Recently'}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Share artwork"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Illustration Display */}
      <div 
        onClick={() => navigate(`/artworks/${artwork.id}`)}
        className="relative w-full bg-[#0e1115] flex items-center justify-center cursor-pointer group overflow-hidden max-h-[700px]"
      >
        {!imageLoaded && (
          <div className="w-full aspect-[4/5] bg-slate-200 dark:bg-slate-800 animate-pulse" />
        )}
        <img
          src={artwork.image_url}
          alt={artwork.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-auto max-h-[700px] object-contain transition-transform duration-300 group-hover:scale-[1.01] ${
            imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
          }`}
        />
      </div>

      {/* Action Row & Metadata (Instagram & Pixiv Style) */}
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        {/* Engagement Actions (Heart Like, Comment Bubble, Share) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm font-bold transition-all cursor-pointer ${
                isLiked
                  ? 'text-rose-600 dark:text-rose-500'
                  : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{likeCount}</span>
            </button>

            <Link
              to={`/artworks/${artwork.id}`}
              className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span>{artwork.comment_count ?? artwork.comments?.length ?? 0}</span>
            </Link>
          </div>

          <Link
            to={`/artworks/${artwork.id}`}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            View Details →
          </Link>
        </div>

        {/* Title & Caption */}
        <div className="flex flex-col gap-1">
          <h4 
            onClick={() => navigate(`/artworks/${artwork.id}`)}
            className="font-extrabold text-base text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
          >
            {artwork.title}
          </h4>
          {artwork.description && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
              {artwork.description}
            </p>
          )}
        </div>

        {/* Tag Chips */}
        {artwork.tags && artwork.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {artwork.tags.map((tag) => (
              <Link
                key={tag.id || tag.name}
                to={`/?tag=${encodeURIComponent(tag.name)}`}
                className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 px-2.5 py-1 rounded-lg transition-colors border border-sky-100 dark:border-sky-800/60"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
};
