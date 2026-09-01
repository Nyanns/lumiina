import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Trash2, Send, Calendar, User, Tag, ExternalLink } from 'lucide-react';
import { commentsAPI, artworksAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const ArtworkModal = ({ artwork: initialArtwork, onClose, onTagClick, onArtistClick, onArtworkDeleted }) => {
  const { user, isAuthenticated } = useAuth();
  const [artwork, setArtwork] = useState(initialArtwork);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch full artwork details and comments
  useEffect(() => {
    if (!initialArtwork?.id) return;

    const fetchDetails = async () => {
      try {
        const [artRes, comRes] = await Promise.all([
          artworksAPI.getByID(initialArtwork.id),
          commentsAPI.getByArtwork(initialArtwork.id),
        ]);
        if (artRes.data?.data) {
          setArtwork(artRes.data.data);
        }
        if (comRes.data?.data) {
          setComments(comRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load artwork details', err);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchDetails();
  }, [initialArtwork?.id]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    setErrorMsg('');
    try {
      const res = await commentsAPI.create(artwork.id, newComment.trim());
      if (res.data?.data) {
        setComments((prev) => [res.data.data, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Gagal mengirim komentar');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Hapus komentar ini?')) return;
    try {
      await commentsAPI.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus komentar');
    }
  };

  const handleDeleteArtwork = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus karya ini secara permanen?')) return;
    try {
      await artworksAPI.delete(artwork.id);
      onArtworkDeleted(artwork.id);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus karya');
    }
  };

  const isOwnerOrAdmin = user && (user.id === artwork.user_id || user.role === 'admin');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row max-h-[92vh] border border-slate-200">
        
        {/* Left Side: Artwork Image Viewer */}
        <div className="lg:w-3/5 bg-slate-950 flex items-center justify-center relative min-h-[300px] lg:min-h-[600px] p-4">
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-md"
          />
          <a
            href={artwork.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 backdrop-blur-xs transition-colors"
            title="Buka gambar resolusi penuh"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Resolusi Penuh
          </a>
        </div>

        {/* Right Side: Artwork Info & Comments Panel */}
        <div className="lg:w-2/5 flex flex-col h-full bg-white divide-y divide-slate-100 overflow-hidden">
          
          {/* Header Bar */}
          <div className="p-4 flex items-center justify-between gap-2 shrink-0">
            <div
              onClick={() => { onArtistClick(artwork.user?.id || artwork.user_id); onClose(); }}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-800 font-bold text-sm flex items-center justify-center uppercase border border-sky-200">
                {artwork.user?.username?.[0] || 'A'}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 leading-tight">
                  {artwork.user?.username || 'Artist'}
                </h4>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {artwork.created_at ? new Date(artwork.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Baru saja'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isOwnerOrAdmin && (
                <button
                  onClick={handleDeleteArtwork}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Karya"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Description & Tags */}
          <div className="p-4 flex flex-col gap-3 shrink-0 bg-slate-50/50 max-h-48 overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 leading-snug">{artwork.title}</h2>
            {artwork.description && (
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {artwork.description}
              </p>
            )}

            {artwork.tags && artwork.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {artwork.tags.map((tag) => (
                  <button
                    key={tag.id || tag.name}
                    onClick={() => { onTagClick(tag.name); onClose(); }}
                    className="text-[11px] font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comments List */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 min-h-[160px]">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
              Komentar ({comments.length})
            </h4>

            {loadingComments ? (
              <div className="flex items-center justify-center py-8 text-xs text-slate-400">
                Memuat komentar...
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-slate-400">
                <p>Belum ada komentar untuk karya ini.</p>
                <p className="text-[11px] text-slate-400 mt-1">Jadilah yang pertama memberikan apresiasi!</p>
              </div>
            ) : (
              comments.map((c) => {
                const canDelete = user && (user.id === c.user_id || user.role === 'admin' || user.id === artwork.user_id);
                return (
                  <div key={c.id} className="flex items-start gap-2.5 group/com text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 uppercase border border-slate-200">
                      {c.user?.username?.[0] || 'U'}
                    </div>
                    <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-[11px]">
                          {c.user?.username || 'Pengguna'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {c.created_at ? new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-normal">{c.content}</p>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-0 group-hover/com:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                        title="Hapus Komentar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Comment Form Box */}
          <div className="p-3 bg-white shrink-0">
            {isAuthenticated ? (
              <form onSubmit={handlePostComment} className="flex flex-col gap-1.5">
                {errorMsg && <p className="text-[11px] text-rose-600">{errorMsg}</p>}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tulis komentar apresiasi..."
                    maxLength={500}
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-100 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-full border border-slate-200 focus:border-sky-500 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="p-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-full shadow-xs transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                <span>Silakan login terlebih dahulu untuk menulis komentar.</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
