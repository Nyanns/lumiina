import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ArtworkCard } from './components/ArtworkCard';
import { ArtworkModal } from './components/ArtworkModal';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { artworksAPI } from './api/client';
import { useAuth } from './context/AuthContext';
import { Sparkles, Layers, ChevronLeft, ChevronRight, RefreshCw, Upload, Heart, Compass } from 'lucide-react';

export default function App() {
  const { isAuthenticated } = useAuth();

  // Feed & Filter State
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('Semua');

  // Modal State
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const LIMIT = 20;

  // Fetch artworks from Backend API
  const fetchArtworks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: LIMIT,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (activeTag !== 'Semua') {
        params.tag = activeTag;
      }

      const res = await artworksAPI.getAll(params);
      if (res.data?.data) {
        setArtworks(res.data.data);
        setTotal(res.data.total || res.data.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch artworks', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, activeTag]);

  // Debounce search input & trigger fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArtworks();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchArtworks]);

  const handleTagSelect = (tag) => {
    setActiveTag(tag);
    setPage(1);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleArtworkCreated = (newArt) => {
    setArtworks((prev) => [newArt, ...prev]);
    fetchArtworks();
  };

  const handleArtworkDeleted = (deletedId) => {
    setArtworks((prev) => prev.filter((a) => a.id !== deletedId));
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Sticky Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        activeTag={activeTag}
        onTagSelect={handleTagSelect}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={(id) => setSelectedUserId(id)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* Welcome Banner (Hero Sub-section) */}
        {!searchQuery && activeTag === 'Semua' && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 text-white p-6 sm:p-8 shadow-sm">
            <div className="relative z-10 max-w-2xl flex flex-col gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-sky-100 text-xs font-semibold backdrop-blur-xs w-fit">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mascot Resmi: Lumi & Ina</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ruang Apresiasi Fan Art & Ilustrasi Anime
              </h1>
              <p className="text-sm text-sky-100/90 leading-relaxed">
                Jelajahi ribuan karya ilustrasi berkualitas tinggi dari kreator komunitas. Unggah karya seni favoritmu, ikuti artist, dan bagikan inspirasi!
              </p>

              {!isAuthenticated && (
                <div className="pt-2">
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="px-5 py-2.5 bg-white text-sky-700 hover:bg-sky-50 active:bg-sky-100 rounded-full font-bold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    Mulai Bergabung Sekarang →
                  </button>
                </div>
              )}
            </div>

            {/* Decorative background circle */}
            <div className="absolute -right-12 -bottom-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-sky-600" />
              {searchQuery
                ? `Hasil Pencarian: "${searchQuery}"`
                : activeTag !== 'Semua'
                ? `Koleksi Tag #${activeTag}`
                : 'Karya Terbaru'}
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan {artworks.length} dari {total} karya terdaftar
            </p>
          </div>

          <button
            onClick={fetchArtworks}
            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors cursor-pointer"
            title="Muat Ulang Feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>

        {/* Artwork Grid Feed */}
        {loading && artworks.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-3 flex flex-col gap-3 animate-pulse">
                <div className="w-full aspect-4/3 bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : artworks.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200/80 p-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Tidak ada karya yang cocok</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              {searchQuery || activeTag !== 'Semua'
                ? 'Coba gunakan kata kunci lain atau pilih tag yang lebih umum.'
                : 'Belum ada karya yang diunggah. Jadilah artist pertama yang membagikan ilustrasi!'}
            </p>
            {isAuthenticated ? (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Unggah Sekarang
              </button>
            ) : (
              <button
                onClick={() => { setSearchQuery(''); setActiveTag('Semua'); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onClick={(art) => setSelectedArtwork(art)}
                onTagClick={(tag) => handleTagSelect(tag)}
                onArtistClick={(userId) => setSelectedUserId(userId)}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-6 pb-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>

            <span className="text-xs font-semibold text-slate-600 px-2">
              Halaman {page} dari {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Berikutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </main>

      {/* Modern Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center">
              L
            </div>
            <span className="font-semibold text-slate-700">Lumiina</span>
            <span>— Redesign Platform Fan Art Anime (Mascots: Lumi & Ina)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Go Gin Backend • PostgreSQL • Redis</span>
            <a
              href="http://localhost:8080/swagger/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline font-medium"
            >
              Swagger API Docs ↗
            </a>
          </div>
        </div>
      </footer>

      {/* Modals Layer */}
      {selectedArtwork && (
        <ArtworkModal
          artwork={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
          onTagClick={handleTagSelect}
          onArtistClick={(id) => setSelectedUserId(id)}
          onArtworkDeleted={handleArtworkDeleted}
        />
      )}

      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onArtworkCreated={handleArtworkCreated}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
        />
      )}

      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onArtworkClick={(art) => setSelectedArtwork(art)}
          onTagClick={handleTagSelect}
        />
      )}

    </div>
  );
}
