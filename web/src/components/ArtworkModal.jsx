import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, MessageSquare, Trash2, Send, Calendar, ExternalLink } from 'lucide-react';
import { commentsAPI, artworksAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';

export const ArtworkModal = ({ artwork: initialArtwork, onClose, onTagClick, onArtistClick, onArtworkDeleted }) => {
  const { user, isAuthenticated } = useAuth();
  const [artwork, setArtwork] = useState(initialArtwork);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (!initialArtwork?.id) return;
    const fetchDetails = async () => {
      try {
        const [artRes, comRes] = await Promise.all([
          artworksAPI.getByID(initialArtwork.id),
          commentsAPI.getByArtwork(initialArtwork.id),
        ]);
        if (artRes.data?.data) setArtwork(artRes.data.data);
        if (comRes.data?.data) setComments(comRes.data.data);
      } catch (err) {
        console.error('Failed to load details', err);
      } finally {
        setLoadingComments(false);
      }
    };
    fetchDetails();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, [initialArtwork?.id]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);
    setErrorMsg('');
    try {
      const res = await commentsAPI.create(artwork.id, newComment.trim());
      if (res.data?.data) {
        setComments((prev) => [...prev, res.data.data]);
        setNewComment('');
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit comment.');
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
    if (!window.confirm('Permanently delete this artwork?')) return;
    try {
      await artworksAPI.delete(artwork.id);
      onArtworkDeleted(artwork.id);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete artwork.');
    }
  };

  const isOwnerOrAdmin = user && (user.id === artwork.user_id || user.role === 'admin');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/80 backdrop-blur-sm">
      <Helmet>
        <title>{artwork.title} by {artwork.user?.username || 'Artist'} — Lumiina</title>
        <meta name="description" content={artwork.description || `Anime illustration titled ${artwork.title} on Lumiina.`} />
      </Helmet>

      {/* Backdrop Click Area */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose} 
        className="absolute inset-0 cursor-zoom-out" 
      />

      {/* Modal Container */}
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-screen-2xl h-full flex flex-col lg:flex-row bg-white shadow-2xl overflow-hidden"
      >
        {/* Close Button (Absolute Top Right for Mobile) */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 z-50 p-2 bg-slate-900/50 text-white rounded-full hover:bg-slate-900 backdrop-blur-sm transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Pitch-Black Full-Bleed Image Viewer */}
        <div className="lg:flex-1 bg-black flex flex-col items-center justify-center relative overflow-hidden h-[45vh] lg:h-full">
          <img
            src={artwork.image_url}
            alt={`${artwork.title} by ${artwork.user?.username}`}
            className="w-full h-full object-contain"
          />
          <a
            href={artwork.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-colors"
            title="Full Resolution"
          >
            <ExternalLink className="w-4 h-4" /> Open Full Resolution
          </a>
        </div>

        {/* Right Side: Clean White Sidebar */}
        <div className="lg:w-[420px] xl:w-[480px] h-full flex flex-col bg-white overflow-hidden border-l border-slate-200">
          
          {/* Header Actions */}
          <div className="p-5 flex items-center justify-between border-b border-slate-100 shrink-0">
            <h3 className="font-bold text-slate-800">Artwork Details</h3>
            <div className="flex items-center gap-2">
              {isOwnerOrAdmin && (
                <button onClick={handleDeleteArtwork} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors cursor-pointer" title="Delete Artwork">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full hidden lg:block transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            {/* Context Info */}
            <div className="p-6 flex flex-col gap-5 border-b border-slate-100">
              <div 
                onClick={() => { onArtistClick(artwork.user?.id || artwork.user_id); onClose(); }}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg uppercase shadow-sm group-hover:shadow-md transition-all">
                  {artwork.user?.username?.[0] || 'A'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {artwork.user?.username || 'Artist'}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {artwork.created_at ? new Date(artwork.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                  </p>
                </div>
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-slate-900 leading-tight mb-2">{artwork.title}</h1>
                {artwork.description && (
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {artwork.description}
                  </p>
                )}
              </div>

              {artwork.tags && artwork.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {artwork.tags.map((tag) => (
                    <button
                      key={tag.id || tag.name}
                      onClick={() => { onTagClick(tag.name); onClose(); }}
                      className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-transparent hover:border-sky-200 px-3 py-1.5 rounded-md transition-all cursor-pointer"
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Comments List */}
            <div className="p-6 flex flex-col gap-4 flex-1">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600" /> Discussion ({comments.length})
              </h4>

              {loadingComments ? (
                <div className="text-center py-8 text-sm text-slate-400 font-medium animate-pulse">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-700">No comments yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Be the first to share your thoughts on this artwork!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {comments.map((c) => {
                    const canDelete = user && (user.id === c.user_id || user.role === 'admin' || user.id === artwork.user_id);
                    return (
                      <div key={c.id} className="flex items-start gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                          {c.user?.username?.[0] || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 text-sm">{c.user?.username || 'User'}</span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl rounded-tl-sm border border-slate-100">{c.content}</p>
                          {canDelete && (
                            <button onClick={() => handleDeleteComment(c.id)} className="text-[11px] font-bold text-rose-500 hover:text-rose-700 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Comment Input Sticky Bottom */}
          <div className="p-4 border-t border-slate-200 bg-white shrink-0">
            {isAuthenticated ? (
              <form onSubmit={handlePostComment} className="flex flex-col gap-2">
                {errorMsg && <p className="text-xs font-bold text-rose-600">{errorMsg}</p>}
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write your thoughts or appreciation..."
                    maxLength={500}
                    className="w-full pl-4 pr-12 py-3 text-sm bg-slate-100 focus:bg-white border border-transparent focus:border-sky-400 focus:ring-4 focus:ring-sky-50 rounded-full outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="absolute right-2 p-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white rounded-full transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-3 bg-slate-50 rounded-full border border-slate-200 text-sm font-semibold text-slate-500">
                Please sign in to join the discussion.
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
};
