import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Check, 
  Calendar,
  User,
  Link as LinkIcon
} from 'lucide-react';
import { useLikes } from '../context/LikesContext';
import { useBookmarks } from '../context/BookmarkContext';
import { useAuth } from '../context/AuthContext';

export const FeedPostCard = ({ artwork, index }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getLikeInfo, toggleLike } = useLikes();
  const { getBookmarkInfo, toggleBookmark } = useBookmarks();
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { isBookmarked, count: bookmarkCount } = getBookmarkInfo(artwork.id, artwork.bookmark_count || 0);
  const { isLiked, count: likeCount } = getLikeInfo(artwork.id, artwork.like_count || 0);

  const tagList = Array.isArray(artwork.tags)
    ? artwork.tags.map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean)
    : [];
  const tagsPrefix = tagList.slice(0, 3).join(', ');
  const artistName = artwork.user?.display_name || artwork.user?.username || 'Creator';
  const artworkTooltip = tagsPrefix
    ? `${tagsPrefix} / ${artwork.title} - ${artistName}`
    : `${artwork.title} - ${artistName}`;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const handleLike = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    toggleLike(artwork.id, artwork.like_count || 0);
  };

  const handleShare = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const url = `${window.location.origin}/artworks/${artwork.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    toggleBookmark(artwork.id, artwork.bookmark_count || 0);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25), ease: 'easeOut' }}
      className="bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col transition-colors"
    >
      {/* Top Header: Creator Info & More Options (World-Class Feed Standard) */}
      <div className="p-4 flex items-center justify-between">
        <Link
          to={`/profile/${artwork.user?.username || artwork.user_id}`}
          className="flex items-center gap-3 group min-w-0"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center uppercase shrink-0 shadow-xs overflow-hidden">
            {artwork.user?.avatar_url ? (
              <img src={artwork.user.avatar_url} alt={artwork.user?.username} className="w-full h-full object-cover" />
            ) : (
              artwork.user?.username?.[0] || 'A'
            )}
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

        {/* Top-Right Context Menu (Replacing isolated share button) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="More options"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#1f242c] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/80 py-1.5 z-30">
              <button
                type="button"
                onClick={(e) => {
                  handleShare(e);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy artwork link</span>
              </button>
              <Link
                to={`/profile/${artwork.user?.username || artwork.user_id}`}
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>View artist profile</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Illustration Display */}
      <Link 
        to={`/artworks/${artwork.id}`}
        title={artworkTooltip}
        className="relative w-full bg-[#0e1115] flex items-center justify-center cursor-pointer group overflow-hidden max-h-[700px] block"
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
      </Link>

      {/* Action Row & Metadata (Instagram, Cara & Pixiv Gold Standard) */}
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        {/* Engagement Actions: Like, Comment, Share on Left | Bookmark on Right */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Heart Like */}
            <button
              type="button"
              onClick={handleLike}
              className={`group flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isLiked
                  ? 'text-rose-600 dark:text-rose-500'
                  : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-500'
              }`}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart className={`w-5 h-5 transition-transform active:scale-125 ${isLiked ? 'fill-rose-500 text-rose-500' : 'group-hover:scale-110'}`} />
              <span>{likeCount}</span>
            </button>

            {/* Comment Bubble */}
            <Link
              to={`/artworks/${artwork.id}`}
              className="group flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              title="View comments"
            >
              <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>{artwork.comment_count ?? artwork.comments?.length ?? 0}</span>
            </Link>

            {/* Share / Copy Link Action (Placed with engagement actions!) */}
            <button
              type="button"
              onClick={handleShare}
              className="group flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
              title="Share artwork"
            >
              {copied ? (
                <Check className="w-5 h-5 text-emerald-500" />
              ) : (
                <Share2 className="w-5 h-5 transition-transform group-hover:scale-110" />
              )}
              {copied && (
                <span className="text-xs text-emerald-500 font-semibold">Copied!</span>
              )}
            </button>
          </div>

          {/* Bookmark Action on Right (Standard across Instagram, Twitter, Cara) */}
          <button
            type="button"
            onClick={handleBookmark}
            className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
              isBookmarked
                ? 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark artwork'}
            aria-label="Bookmark artwork"
          >
            <Bookmark className={`w-5 h-5 transition-transform active:scale-125 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
            {bookmarkCount > 0 && (
              <span className="text-xs font-bold tabular-nums pr-0.5">{bookmarkCount}</span>
            )}
          </button>
        </div>

        {/* Title & Caption */}
        <div className="flex flex-col gap-1">
          <Link
            to={`/artworks/${artwork.id}`}
            title={artworkTooltip}
            className="block group/title"
          >
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white group-hover/title:text-sky-600 dark:group-hover/title:text-sky-400 transition-colors">
              {artwork.title}
            </h4>
          </Link>
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
