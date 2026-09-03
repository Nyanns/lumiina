import React, { useState, useEffect, useCallback } from 'react';
import Masonry from 'react-masonry-css';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { ArtworkCard } from './components/ArtworkCard';
import { ArtworkModal } from './components/ArtworkModal';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { artworksAPI } from './api/client';
import { useAuth } from './context/AuthContext';
import { Layers, ChevronLeft, ChevronRight, RefreshCw, Upload, Compass } from 'lucide-react';

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

  // Masonry breakpoints
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 2
  };

  const fetchArtworks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeTag !== 'Semua') params.tag = activeTag;

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

  // Dynamic Page Title
  let pageTitle = "Lumiina — Platform Fan Art Anime & Ilustrasi";
  if (searchQuery) pageTitle = `Pencarian: ${searchQuery} - Lumiina`;
  else if (activeTag !== 'Semua') pageTitle = `#${activeTag} - Lumiina`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content="Jelajahi dan apresiasi karya fan art anime berkualitas tinggi dari kreator berbakat di komunitas Lumiina." />
      </Helmet>

      {/* Ultra-minimal Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        activeTag={activeTag}
        onTagSelect={handleTagSelect}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={(id) => setSelectedUserId(id)}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        
        {/* Welcome Hero (Gallery-first) */}
        {!searchQuery && activeTag === 'Semua' && (
          <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-10 shadow-lg border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-900/40 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-2xl flex flex-col gap-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Ruang Apresiasi Ilustrasi Anime & Fan Art
              </h1>
              <p className="text-base text-slate-300 leading-relaxed font-medium">
                Temukan lebih dari {Math.max(total, 1000).toLocaleString('id-ID')} ilustrasi resolusi tinggi dari kreator berbakat. Jadilah bagian dari komunitas kreatif Lumiina (Dikelola oleh Lumi & Ina).
              </p>
              {!isAuthenticated && (
                <div className="pt-2">
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white rounded-full font-bold text-sm shadow-md transition-colors cursor-pointer"
                  >
                    Mulai Eksplorasi →
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Feed Header */}
        <header className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <Compass className="w-5 h-5 text-sky-600" />
              {searchQuery
                ? `Hasil Pencarian: "${searchQuery}"`
                : activeTag !== 'Semua'
                ? `Koleksi Tag #${activeTag}`
                : 'Ilustrasi Terbaru'}
            </h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {total} KARYA DITEMUKAN
            </p>
          </div>
          <button
            onClick={fetchArtworks}
            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors cursor-pointer"
            title="Muat Ulang Feed"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </header>

        {/* Masonry Artwork Grid */}
        <section aria-label="Artwork Feed" className="w-full">
          {loading && artworks.length === 0 ? (
            <Masonry breakpointCols={breakpointColumnsObj} className="my-masonry-grid" columnClassName="my-masonry-grid_column">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-3 flex flex-col gap-3 animate-pulse shadow-sm">
                  <div className={`w-full bg-slate-100 rounded-xl ${i % 2 === 0 ? 'aspect-4/5' : 'aspect-square'}`} />
                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                </div>
              ))}
            </Masonry>
          ) : artworks.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mb-4">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tidak ada karya yang cocok</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-2 mb-6">
                Coba gunakan kata kunci lain atau pilih tag yang lebih umum. Atau jadilah artist pertama yang membagikan ilustrasi ini!
              </p>
              {isAuthenticated ? (
                <button onClick={() => setIsUploadOpen(true)} className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-full font-semibold shadow-md transition-colors flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" /> Unggah Sekarang
                </button>
              ) : (
                <button onClick={() => { setSearchQuery(''); setActiveTag('Semua'); }} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-semibold transition-colors cursor-pointer">
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {artworks.map((artwork, index) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  index={index}
                  onClick={(art) => setSelectedArtwork(art)}
                  onTagClick={(tag) => handleTagSelect(tag)}
                  onArtistClick={(userId) => setSelectedUserId(userId)}
                />
              ))}
            </Masonry>
          )}
        </section>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-8 pb-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2.5 text-sm font-bold rounded-full border-2 border-slate-200 bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
            <span className="text-sm font-bold text-slate-600 px-2">
              Halaman {page} dari {totalPages}
            </span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2.5 text-sm font-bold rounded-full border-2 border-slate-200 bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer">
              Berikutnya <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center">L</div>
            <span className="font-bold text-slate-800">Lumiina</span>
            <span>— Redesign Platform Fan Art Anime</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <span>Powered by Go & React</span>
            <a href="http://localhost:8080/swagger/index.html" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-700">API Documentation ↗</a>
          </div>
        </div>
      </footer>

      {/* Modal Layers with AnimatePresence */}
      <AnimatePresence>
        {selectedArtwork && (
          <ArtworkModal
            artwork={selectedArtwork}
            onClose={() => setSelectedArtwork(null)}
            onTagClick={handleTagSelect}
            onArtistClick={(id) => setSelectedUserId(id)}
            onArtworkDeleted={handleArtworkDeleted}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUploadOpen && (
          <UploadModal onClose={() => setIsUploadOpen(false)} onArtworkCreated={handleArtworkCreated} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal onClose={() => setIsAuthOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedUserId && (
          <UserProfileModal
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
            onArtworkClick={(art) => setSelectedArtwork(art)}
            onTagClick={handleTagSelect}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
