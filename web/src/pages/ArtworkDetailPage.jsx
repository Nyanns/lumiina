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
  Check 
} from 'lucide-react';
import { artworksAPI, commentsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLikes } from '../context/LikesContext';

export const ArtworkDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getLikeInfo, toggleLike, syncFromServer } = useLikes();

  const [artwork, setArtwork] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  const commentsEndRef = useRef(null);

  const { isLiked, count: likeCount } = getLikeInfo(id, artwork?.like_count || 0);

  useEffect(() => {
    const fetchArtworkAndComments = async () => {
      setLoading(true);
      try {
        const [artRes, comRes] = await Promise.all([
          artworksAPI.getByID(id),
          commentsAPI.getByArtwork(id),
        ]);
        if (artRes.data?.data) {
          setArtwork(artRes.data.data);
          syncFromServer(artRes.data.data);
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

  const handleDeleteArtwork = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this artwork?')) return;
    try {
      await artworksAPI.delete(id);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete artwork.');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121519] flex items-center justify-center p-8 transition-colors">
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading artwork details...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121519] flex items-center justify-center p-8 transition-colors">
        <div className="text-center bg-white dark:bg-[#1a1e24] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Artwork Not Found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This illustration may have been removed or is unavailable.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0096fa] text-white rounded-full font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  const isOwnerOrAdmin = user && (user.id === artwork.user_id || user.role === 'admin');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121519] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Helmet>
        <title>{artwork.title} by {artwork.user?.username || 'Artist'} — Lumiina</title>
        <meta name="description" content={artwork.description || `Anime illustration titled ${artwork.title} on Lumiina.`} />
      </Helmet>

      {/* Sub-Header Breadcrumb & Navigation */}
      <div className="bg-white dark:bg-[#1a1e24] border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30 transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

            {isOwnerOrAdmin && (
              <button
                onClick={handleDeleteArtwork}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors cursor-pointer"
                title="Delete this artwork"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Split Layout (Cinema Viewer Left + Meta/Discussion Right) */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cinema Image Canvas (Left 7-8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <div className="relative bg-[#0d0f12] rounded-3xl overflow-hidden border border-slate-800 shadow-lg flex items-center justify-center min-h-[500px] max-h-[85vh]">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="max-h-[85vh] w-auto max-w-full object-contain mx-auto select-none"
              />

              {/* Open Original Resolution Button */}
              <a
                href={artwork.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900/90 hover:bg-black text-white text-xs font-bold rounded-full shadow-lg transition-all border border-slate-700/60"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Resolution
              </a>
            </div>
          </div>

          {/* Right Info & Interaction Panel (5-4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            
            {/* Creator & Artwork Card */}
            <div className="bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-5 transition-colors">
              
              {/* Creator Info Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <Link
                  to={`/profile/${artwork.user?.id || artwork.user_id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-base flex items-center justify-center uppercase shrink-0 shadow-sm">
                    {artwork.user?.username?.[0] || 'A'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
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

                <Link
                  to={`/profile/${artwork.user?.id || artwork.user_id}`}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  Profile
                </Link>
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

              {/* Interaction Bar (Reactive Likes & Comments) */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
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
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{isLiked ? `Liked (${likeCount})` : `Like (${likeCount})`}</span>
                  </button>

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <span>{comments.length} Comments</span>
                  </span>
                </div>
              </div>

            </div>

            {/* Comments & Discussion Thread */}
            <div className="bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-4 transition-colors">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                Discussion ({comments.length})
              </h2>

              {/* Post Comment Input */}
              {isAuthenticated ? (
                <form onSubmit={handlePostComment} className="flex flex-col gap-2">
                  {commentError && (
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{commentError}</p>
                  )}
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write your thoughts or appreciation..."
                      maxLength={500}
                      className="w-full pl-4 pr-12 py-2.5 text-sm bg-slate-100 dark:bg-[#252a32] hover:bg-slate-200/50 dark:hover:bg-[#2c323c] focus:bg-white dark:focus:bg-[#21262d] text-slate-900 dark:text-white border border-transparent focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-950/40 rounded-full outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="absolute right-1.5 p-2 bg-[#0096fa] hover:bg-[#0084e0] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-full transition-colors cursor-pointer"
                      title="Send comment"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Want to join the conversation?{' '}
                    <Link to="/login" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
                      Sign in to your account
                    </Link>
                  </p>
                </div>
              )}

              {/* Comments List */}
              <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No comments yet. Be the first to share your thoughts!
                  </div>
                ) : (
                  comments.map((c) => {
                    const canDelete =
                      user &&
                      (user.id === c.user_id ||
                        user.role === 'admin' ||
                        user.id === artwork.user_id);
                    return (
                      <div key={c.id} className="flex items-start gap-2.5 p-2 rounded-xl group hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center uppercase shrink-0 mt-0.5">
                          {c.user?.username?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {c.user?.username || 'User'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.created_at
                                ? new Date(c.created_at).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                  })
                                : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-0.5 break-words">
                            {c.content}
                          </p>
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-[10px] font-bold text-rose-500 hover:underline mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
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
    </div>
  );
};
