import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { artworksAPI, tagsAPI } from '../api/client';
import { ArtworkCard } from '../components/ArtworkCard';
import { useLikes } from '../context/LikesContext';
import { useBookmarks } from '../context/BookmarkContext';

export const ArtworksDiscoveryPage = ({ defaultTab }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { syncFromServer: syncLikes } = useLikes();
  const { syncFromServer: syncBookmarks } = useBookmarks();

  const getInitialTab = () => {
    if (defaultTab) return defaultTab;
    if (location.pathname === '/recommended') return 'recommended';
    return 'trending';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [selectedTag, setSelectedTag] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.pathname === '/recommended') setActiveTab('recommended');
    else if (location.pathname === '/trending') setActiveTab('trending');
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedTag('');
    navigate(tab === 'trending' ? '/trending' : '/recommended', { replace: true });
  };

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await tagsAPI.getPopular({ limit: 12 });
        if (res.data?.data && Array.isArray(res.data.data)) {
          setTags(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch tags', err);
      }
    };
    fetchTags();
  }, []);

  const fetchArtworks = useCallback(async () => {
    setLoading(true);
    try {
      const res = activeTab === 'trending'
        ? await artworksAPI.getTrending({ limit: 48 })
        : await artworksAPI.getRecommended({ limit: 48 });

      if (res?.data?.data) {
        setArtworks(res.data.data);
        syncLikes(res.data.data);
        syncBookmarks(res.data.data);
      } else {
        setArtworks([]);
      }
    } catch {
      setArtworks([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, syncLikes, syncBookmarks]);

  useEffect(() => { fetchArtworks(); }, [fetchArtworks]);

  const filteredArtworks = selectedTag
    ? artworks.filter((art) =>
        art.tags?.some((t) => {
          const name = typeof t === 'string' ? t : t?.name;
          return name && name.toLowerCase() === selectedTag.toLowerCase();
        })
      )
    : artworks;

  const pageTitle = activeTab === 'trending'
    ? 'Trending — Lumiina'
    : 'Recommended — Lumiina';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121519] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={activeTab === 'trending' ? 'Popular illustrations on Lumiina' : 'Recommended illustrations on Lumiina'} />
      </Helmet>

      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4">

        {/* Compact top bar: back link + tab switcher + count */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              ← Feed
            </Link>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Tab switcher — text only, no icons */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/70 rounded-lg">
              <button
                type="button"
                onClick={() => handleTabChange('trending')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'trending'
                    ? 'bg-white dark:bg-[#1e2229] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Trending
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('recommended')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'recommended'
                    ? 'bg-white dark:bg-[#1e2229] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Recommended
              </button>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
            {filteredArtworks.length} works
          </span>
        </div>

        {/* Tag filter chips */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedTag('')}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer border transition-colors ${
                !selectedTag
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                  : 'bg-white dark:bg-[#1e2229] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              All
            </button>
            {tags.map((t, idx) => {
              const tagName = typeof t === 'string' ? t : t?.name || '';
              if (!tagName) return null;
              const active = selectedTag.toLowerCase() === tagName.toLowerCase();
              return (
                <button
                  key={t?.id || tagName || idx}
                  type="button"
                  onClick={() => setSelectedTag(active ? '' : tagName)}
                  className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer border transition-colors ${
                    active
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                      : 'bg-white dark:bg-[#1e2229] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {tagName}
                </button>
              );
            })}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1a1e24] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-pulse">
                <div className="w-full aspect-[3/4] bg-slate-200 dark:bg-slate-800" />
                <div className="p-3 flex flex-col gap-2">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-14" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {selectedTag ? `No results for "${selectedTag}"` : 'No artworks yet'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
              {selectedTag ? 'Try another tag or show all.' : 'Check back later.'}
            </p>
            {selectedTag ? (
              <button
                type="button"
                onClick={() => setSelectedTag('')}
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer transition-colors hover:bg-slate-700 dark:hover:bg-slate-200"
              >
                Show all
              </button>
            ) : (
              <Link
                to="/"
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-colors hover:bg-slate-700 dark:hover:bg-slate-200"
              >
                Back to feed
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredArtworks.map((artwork, idx) => (
              <ArtworkCard key={artwork.id} artwork={artwork} index={idx} />
            ))}
          </div>
        )}

      </main>
    </div>
  );
};
