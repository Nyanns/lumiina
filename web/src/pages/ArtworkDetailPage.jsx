import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, 
  Heart, 
  MessageSquare, 
  Share2, 
  Trash2, 
  Send, 
  ExternalLink, 
  Calendar, 
  Check,
  Maximize2,
  Minimize2,
  X,
  Sun,
  Moon,
  Sparkles,
  Image as ImageIcon,
  MoreVertical,
  UserPlus,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { artworksAPI, commentsAPI, usersAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLikes } from '../context/LikesContext';
import { useFollow } from '../context/FollowContext';

export const ArtworkDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { getLikeInfo, toggleLike, syncFromServer } = useLikes();
  const { isFollowed, toggleFollow, setInitialFollowState, loadingMap } = useFollow();

  const [artwork, setArtwork] = useState(null);
  const [comments, setComments] = useState([]);
  const [artistWorks, setArtistWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Canvas display modes: 'oled' | 'studio' | 'clean'
  const [canvasBg, setCanvasBg] = useState('oled');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxFit, setLightboxFit] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [activeCommentMenu, setActiveCommentMenu] = useState(null);
  const commentsEndRef = useRef(null);

  const { isLiked, count: likeCount } = getLikeInfo(id, artwork?.like_count || 0);

  // Keyboard navigation: Escape closes lightbox / returns to feed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) {
          setLightboxOpen(false);
        } else if (deleteModalOpen) {
          setDeleteModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, deleteModalOpen]);

  const authorKey = artwork?.user?.username || (artwork?.user_id ? String(artwork.user_id) : null);
  const isFollowing = isFollowed(authorKey, artwork?.user?.is_following || false);
  const isFollowLoading = authorKey ? loadingMap[authorKey.toLowerCase()] : false;

  const handleToggleFollow = async () => {
    if (!artwork?.user && !artwork?.user_id) return;
    const target = artwork.user || { id: artwork.user_id };
    await toggleFollow(target);
  };

  // Close comment 3-dots menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-comment-menu]')) {
        setActiveCommentMenu(null);
      }
    };
    if (activeCommentMenu !== null) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeCommentMenu]);

  useEffect(() => {
    const fetchArtworkAndComments = async () => {
      setLoading(true);
      try {
        const [artRes, comRes] = await Promise.all([
          artworksAPI.getByID(id),
          commentsAPI.getByArtwork(id),
        ]);

        if (artRes.data?.data) {
          const art = artRes.data.data;
          setArtwork(art);
          syncFromServer(art);

          if (art.user?.id) {
            setInitialFollowState(art.user.id, art.user.is_following, art.user.followers_count);
            setInitialFollowState(art.user.username, art.user.is_following, art.user.followers_count);
          }

          // Canonical URL canonicalization: if visited with numeric/legacy id, replace URL to HashID
          if (art.id && String(id) !== String(art.id)) {
            navigate(`/artworks/${art.id}`, { replace: true });
          }

          // Fetch more works by this artist
          const artistIdentifier = art.user?.username || art.user_id;
          if (artistIdentifier) {
            try {
              const profileRes = await usersAPI.getProfile(artistIdentifier);
              const allWorks = profileRes.data?.data?.artworks || [];
              // Exclude currently viewed artwork
              const others = allWorks.filter((w) => String(w.id) !== String(art.id) && String(w.id) !== String(id));
              setArtistWorks(others.slice(0, 6));
            } catch (err) {
              console.warn('Could not load artist more works', err);
            }
          }
        }
        if (comRes.data?.data) setComments(comRes.data.data);
      } catch (err) {
        console.error('Failed to load artwork detail', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworkAndComments();
    window.scrollTo(0, 0);
  }, [id, isAuthenticated]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    setCommentError('');
    try {
      const res = await commentsAPI.create(id, newComment.trim());
      if (res.data?.data) {
        setComments((prev) => [...prev, res.data.data]);
        setNewComment('');
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      setCommentError(err.response?.data?.error || 'Failed to submit comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentsAPI.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete comment.');
    }
  };

  const handleConfirmDeleteArtwork = async () => {
    setDeleting(true);
    try {
      await artworksAPI.delete(id);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete artwork.');
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: artwork?.title || 'Lumiina Artwork',
          text: `Check out "${artwork?.title}" by ${artwork?.user?.username || 'an artist'} on Lumiina!`,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const getCanvasBgClass = () => {
    switch (canvasBg) {
      case 'oled':
        return 'bg-[#080a0e]';
      case 'studio':
        return 'bg-[#1e2229]'; // 18% Neutral Gray
      case 'clean':
        return 'bg-slate-100 dark:bg-[#161a22]';
      default:
        return 'bg-[#080a0e]';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0c0f14] flex items-center justify-center p-8 transition-colors">
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading masterpiece...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0c0f14] flex items-center justify-center p-8 transition-colors">
        <div className="text-center bg-white dark:bg-[#161a22] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Artwork Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">This illustration may have been removed or is unavailable.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0096fa] hover:bg-[#0085df] text-white rounded-full font-bold text-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  const isOwner =
    user &&
    (String(user.id) === String(artwork.user_id) ||
      (user.username &&
        artwork.user?.username &&
        user.username.toLowerCase() === artwork.user.username.toLowerCase()));

  const isOwnerOrAdmin = isOwner || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0f14] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-sky-100 selection:text-sky-900">
      <Helmet>
        <title>{artwork.title} by {artwork.user?.username || 'Artist'} — Lumiina</title>
        <meta name="description" content={artwork.description || `Anime illustration titled "${artwork.title}" by ${artwork.user?.username} on Lumiina.`} />
      </Helmet>

      {/* ========================================================================= */}
      {/* 1. SINGLE UNIFIED GALLERY HEADER (52px, Zero Clutter, No Double Headers)   */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#141820]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-3">
          
          {/* Top-Left: Tactile Back to Feed & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shrink-0 cursor-pointer"
              title="Return to feed (Esc)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Feed</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block shrink-0" />

            <div className="flex items-center gap-1.5 min-w-0 text-xs">
              <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-[280px]">
                {artwork.title}
              </span>
              <span className="text-slate-400 hidden md:inline">•</span>
              <Link
                to={`/profile/${artwork.user?.username || artwork.user_id}`}
                className="text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 font-medium truncate hidden md:inline transition-colors"
              >
                @{artwork.user?.username || 'artist'}
              </Link>
            </div>
          </div>

          {/* Top-Right: Minimal Actions (Theme, Delete, Profile) */}
          <div className="flex items-center gap-2 shrink-0">
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

            {/* Delete Button (Owner/Admin Only) */}
            {isOwnerOrAdmin && (
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="p-1.5 text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors cursor-pointer"
                title="Delete this artwork"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Profile Stamp / Sign In */}
            {isAuthenticated ? (
              <Link
                to={`/profile/${user?.username || user?.id}`}
                className="flex items-center gap-1.5 pl-1.5"
                title="My Profile"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0096fa] to-sky-400 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user?.username} className="w-full h-full object-cover" />
                  ) : (
                    user?.username?.[0] || 'U'
                  )}
                </div>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-bold bg-[#0096fa] hover:bg-[#0085df] text-white rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN VIEWPORT (Cinema Stage Left + Metadata / Discussion Right)         */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1520px] mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================================================= */}
          {/* LEFT: ARTWORK CINEMA STAGE (7-8 COLS)                                    */}
          {/* ======================================================================= */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            
            {/* Stage Box */}
            <div className={`relative ${getCanvasBgClass()} rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/90 shadow-sm overflow-hidden flex items-center justify-center min-h-[480px] max-h-[88vh] transition-colors group`}>
              
              {/* Artwork Image with Click-to-Zoom */}
              <img
                src={artwork.image_url}
                alt={artwork.title}
                onClick={() => setLightboxOpen(true)}
                className="max-h-[85vh] w-auto max-w-full object-contain mx-auto select-none cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.008]"
                title="Click to inspect in fullscreen"
              />

              {/* Floating Backdrop Switcher (Top Center) */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 flex items-center bg-slate-900/80 backdrop-blur-sm p-0.5 rounded-lg border border-white/10 text-[11px] font-semibold text-slate-300 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setCanvasBg('oled')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${canvasBg === 'oled' ? 'bg-white/20 text-white' : 'hover:text-white'}`}
                  title="OLED Dark Canvas"
                >
                  Dark
                </button>
                <button
                  onClick={() => setCanvasBg('studio')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${canvasBg === 'studio' ? 'bg-white/20 text-white' : 'hover:text-white'}`}
                  title="18% Neutral Studio Gray Canvas"
                >
                  Gray
                </button>
                <button
                  onClick={() => setCanvasBg('clean')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${canvasBg === 'clean' ? 'bg-white/20 text-white' : 'hover:text-white'}`}
                  title="Clean Bright Canvas"
                >
                  Light
                </button>
              </div>

              {/* Floating Quick Action Overlay (Bottom Right) */}
              <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2">
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/85 hover:bg-slate-950 text-white text-xs font-bold rounded-lg shadow-md backdrop-blur-xs border border-white/10 transition-all cursor-pointer"
                  title="Expand to Fullscreen (Click image or this button)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Inspect Detail</span>
                </button>

                <a
                  href={artwork.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-slate-900/85 hover:bg-slate-950 text-white rounded-lg shadow-md backdrop-blur-xs border border-white/10 transition-all"
                  title="Open original raw image file"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Resolution Pill (Bottom Left) */}
              <div className="absolute bottom-3.5 left-3.5 hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/75 text-slate-300 text-[10px] font-semibold rounded-md backdrop-blur-xs border border-white/10">
                <ImageIcon className="w-3 h-3 text-sky-400" />
                <span>Original Quality</span>
              </div>
            </div>

            {/* =================================================================== */}
            {/* "MORE FROM THIS ARTIST" STRIP (Pixiv Discovery Loop)                */}
            {/* =================================================================== */}
            {artistWorks.length > 0 && (
              <div className="bg-white dark:bg-[#141820] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      More by {artwork.user?.username || 'this Artist'}
                    </h3>
                  </div>
                  <Link
                    to={`/profile/${artwork.user?.username || artwork.user_id}`}
                    className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    View All
                  </Link>
                </div>

                {/* Horizontal Scroll Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
                  {artistWorks.map((work) => (
                    <Link
                      key={work.id}
                      to={`/artworks/${work.id}`}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xs hover:shadow-md transition-all"
                    >
                      <img
                        src={work.image_url}
                        alt={work.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-108"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                        <p className="text-[11px] font-bold text-white truncate">{work.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ======================================================================= */}
          {/* RIGHT: METADATA & INTERACTION PANEL (5-4 COLS)                          */}
          {/* ======================================================================= */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            
            {/* Unified Artwork & Artist Card */}
            <div className="bg-white dark:bg-[#141820] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col gap-5 transition-colors">
              
              {/* Creator Profile Section */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <Link
                  to={`/profile/${artwork.user?.username || artwork.user_id}`}
                  className="flex items-center gap-3 group min-w-0"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-base flex items-center justify-center uppercase shrink-0 shadow-2xs group-hover:border-sky-500 transition-colors overflow-hidden">
                    {artwork.user?.avatar_url ? (
                      <img src={artwork.user.avatar_url} alt={artwork.user?.username} className="w-full h-full object-cover" />
                    ) : (
                      artwork.user?.username?.[0] || 'A'
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 truncate transition-colors">
                      {artwork.user?.username || 'Artist'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {artwork.created_at
                        ? new Date(artwork.created_at).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Recently'}
                    </p>
                  </div>
                </Link>

                {isOwner ? (
                  <Link
                    to={`/profile/${artwork.user?.username || artwork.user_id}`}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full transition-colors shrink-0"
                  >
                    Profile
                  </Link>
                ) : (
                  <button
                    disabled={isFollowLoading}
                    onClick={handleToggleFollow}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer ${
                      isFollowing
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700'
                        : 'bg-[#0096fa] hover:bg-[#0085df] text-white shadow-xs hover:shadow active:scale-95'
                    }`}
                    title={isFollowing ? 'Click to unfollow' : 'Follow this creator'}
                  >
                    {isFollowLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Title & Description */}
              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {artwork.title}
                </h1>
                {artwork.description ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                    {artwork.description}
                  </p>
                ) : (
                  <p className="text-xs italic text-slate-400">No additional description provided.</p>
                )}
              </div>

              {/* Tags Row */}
              {artwork.tags && artwork.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {artwork.tags.map((t) => (
                    <Link
                      key={t.id || t.name}
                      to={`/?tag=${encodeURIComponent(t.name)}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 px-2.5 py-1 rounded-lg transition-colors border border-sky-100 dark:border-sky-800/60"
                    >
                      #{t.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Tactile Engagement Dock (Like + Share) */}
              <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    toggleLike(id, artwork.like_count || 0);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isLiked
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{isLiked ? `Liked (${likeCount})` : `Like (${likeCount})`}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
                  title="Share illustration link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                  <span>{copied ? 'Copied!' : 'Share'}</span>
                </button>
              </div>

            </div>

            {/* Discussion & Comments Thread */}
            <div className="bg-white dark:bg-[#141820] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col transition-colors">
              
              {/* Header */}
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-500" />
                  <span>Discussion ({comments.length})</span>
                </h2>
              </div>

              {/* Post Comment Input */}
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80">
                {isAuthenticated ? (
                  <form onSubmit={handlePostComment} className="flex flex-col gap-2">
                    {commentError && (
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{commentError}</p>
                    )}
                    <div className="flex items-center gap-3">
                      {/* Current user avatar (aligns with comment avatars below) */}
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center uppercase shrink-0 overflow-hidden">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt={user?.username} className="w-full h-full object-cover" />
                        ) : (
                          user?.username?.[0] || 'U'
                        )}
                      </div>
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write your thoughts..."
                          maxLength={500}
                          className="w-full pl-4 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700/80 focus:border-sky-500 rounded-full outline-none transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!newComment.trim() || submittingComment}
                          className="absolute right-1 p-1.5 bg-[#0096fa] hover:bg-[#0085df] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-full transition-colors cursor-pointer"
                          title="Send comment"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Want to join?{' '}
                      <Link to="/login" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
                        Sign in
                      </Link>
                    </p>
                  </div>
                )}
              </div>

              {/* Comments List */}
              <div className="flex flex-col max-h-[380px] overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    No comments yet. Be the first to share your appreciation!
                  </div>
                ) : (
                  comments.map((c) => {
                    const isAuthor =
                      c.user?.username &&
                      artwork.user?.username &&
                      c.user.username.toLowerCase() === artwork.user.username.toLowerCase();

                    const canDelete =
                      user &&
                      (String(user.id) === String(c.user_id) ||
                        (user.username &&
                          c.user?.username &&
                          user.username.toLowerCase() === c.user.username.toLowerCase()) ||
                        user.role === 'admin' ||
                        String(user.id) === String(artwork.user_id) ||
                        (user.username &&
                          artwork.user?.username &&
                          user.username.toLowerCase() === artwork.user.username.toLowerCase()));

                    return (
                      <div key={c.id} className="flex items-start gap-3 px-5 py-2.5 group hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100/80 dark:border-slate-800/60 last:border-b-0">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center uppercase shrink-0 mt-0.5 overflow-hidden">
                          {c.user?.avatar_url ? (
                            <img src={c.user.avatar_url} alt={c.user?.username} className="w-full h-full object-cover" />
                          ) : (
                            c.user?.username?.[0] || 'U'
                          )}
                        </div>
                        {/* Body */}
                        <div className="flex-1 min-w-0">
                          {/* Top line: name + badge + date + 3-dots menu */}
                          <div className="flex items-center justify-between gap-2 h-5">
                            <div className="flex items-center gap-1.5 text-xs min-w-0 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {c.user?.username || 'User'}
                              </span>
                              {isAuthor && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/60 rounded border border-sky-200 dark:border-sky-800 leading-none">
                                  Author
                                </span>
                              )}
                              <span className="text-slate-400 dark:text-slate-500">·</span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                                {c.created_at
                                  ? new Date(c.created_at).toLocaleDateString('en-US', {
                                      day: 'numeric',
                                      month: 'short',
                                    })
                                  : ''}
                              </span>
                            </div>

                            {/* 3-dots Menu (YouTube style) */}
                            {canDelete && (
                              <div className="relative shrink-0" data-comment-menu>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCommentMenu(activeCommentMenu === c.id ? null : c.id);
                                  }}
                                  className={`p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all cursor-pointer ${
                                    activeCommentMenu === c.id
                                      ? 'opacity-100 bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                                      : 'opacity-0 group-hover:opacity-100'
                                  }`}
                                  title="Comment options"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* Dropdown Menu */}
                                {activeCommentMenu === c.id && (
                                  <div className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-[#1e232d] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/80 py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveCommentMenu(null);
                                        handleDeleteComment(c.id);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-snug mt-1 break-words">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={commentsEndRef} />
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* 3. LIGHTBOX FULLSCREEN INSPECTOR MODAL                                    */}
      {/* ========================================================================= */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Lightbox Controls Bar */}
          <div 
            className="absolute top-4 inset-x-4 max-w-5xl mx-auto flex items-center justify-between text-white z-60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-xs font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
              <span>{artwork.title}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/70">by @{artwork.user?.username}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLightboxFit(!lightboxFit)}
                className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-full border border-white/15 transition-colors cursor-pointer"
                title={lightboxFit ? 'View at 100% Native Resolution' : 'Fit to Screen'}
              >
                {lightboxFit ? '100% Size' : 'Fit Screen'}
              </button>
              
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-1.5 bg-white/10 hover:bg-rose-500 rounded-full border border-white/15 transition-colors cursor-pointer"
                title="Close Inspector (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lightbox Image Stage */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-auto p-8"
            onClick={() => setLightboxOpen(false)}
          >
            <img
              src={artwork.image_url}
              alt={artwork.title}
              onClick={(e) => e.stopPropagation()}
              className={`${lightboxFit ? 'max-h-[90vh] max-w-[92vw] object-contain' : 'max-w-none'} rounded-lg shadow-2xl transition-all duration-200 select-none`}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SAFE DELETE CONFIRMATION MODAL                                         */}
      {/* ========================================================================= */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161a22] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Illustration?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently remove <span className="font-bold text-slate-900 dark:text-white">"{artwork.title}"</span> from Lumiina?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDeleteArtwork}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
