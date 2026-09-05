import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { artworksAPI, usersAPI, tagsAPI } from '../api/client';
import { FeedPostCard } from '../components/FeedPostCard';
import { HorizontalWorksCarousel } from '../components/HorizontalWorksCarousel';
import { 
  Upload, 
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLikes } from '../context/LikesContext';
import { useFollow } from '../context/FollowContext';

export const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const { syncFromServer } = useLikes();
  const { isFollowed: isFollowedGlobal, toggleFollow, setInitialFollowState, loadingMap } = useFollow();
  const [searchParams, setSearchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';
  const queryTag = searchParams.get('tag') || '';

  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Dual-Axis X-sections state (Trending & Recommended from Go Backend)
  const [trendingArtworks, setTrendingArtworks] = useState([]);
  const [recommendedArtworks, setRecommendedArtworks] = useState([]);

  // Recommended users & dynamic database tags state
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [popularTags, setPopularTags] = useState([]);

  const LIMIT = 12;
  const loadMoreRef = useRef(null);

  // Fetch Main Feed artworks (Sumbu-Y)
  const fetchArtworks = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    }
    try {
      const currentPage = reset ? 1 : page;
      const params = { page: currentPage, limit: LIMIT };
      if (querySearch.trim()) params.search = querySearch.trim();
      if (queryTag) params.tag = queryTag;

      const res = await artworksAPI.getAll(params);
      if (res.data?.data) {
        const fetched = res.data.data;
        const totalCount = res.data.total || fetched.length;

        if (reset) {
          setArtworks(fetched);
        } else {
          setArtworks((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newItems = fetched.filter((a) => !existingIds.has(a.id));
            return [...prev, ...newItems];
          });
        }

        syncFromServer(fetched);

        setTotal(totalCount);
        setHasMore(fetched.length === LIMIT);
      }
    } catch (err) {
      console.error('Failed to load artworks', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, querySearch, queryTag]);

  useEffect(() => {
    fetchArtworks(true);
  }, [querySearch, queryTag, isAuthenticated]);

  // Fetch Dual-Axis Horizontal Sections (Trending & Recommended)
  useEffect(() => {
    const fetchCarousels = async () => {
      try {
        const [trendingRes, recRes] = await Promise.all([
          artworksAPI.getTrending({ limit: 10 }),
          artworksAPI.getRecommended({ limit: 10 }),
        ]);
        if (trendingRes.data?.data) {
          setTrendingArtworks(trendingRes.data.data);
          syncFromServer(trendingRes.data.data);
        }
        if (recRes.data?.data) {
          setRecommendedArtworks(recRes.data.data);
          syncFromServer(recRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load carousel sections', err);
      }
    };

    fetchCarousels();
  }, [isAuthenticated]);

  // Fetch Real Popular Tags from PostgreSQL database
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await tagsAPI.getPopular({ limit: 15 });
        if (res.data?.data && Array.isArray(res.data.data)) {
          setPopularTags(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load popular tags', err);
      }
    };

    fetchTags();
  }, [isAuthenticated]);

  // Fetch recommended users (only for authenticated users, strictly excluding self)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setRecommendedUsers([]);
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await usersAPI.search('');
        if (res.data?.data && Array.isArray(res.data.data)) {
          // Business Logic: Strictly exclude the currently authenticated user
          const otherUsers = res.data.data.filter((u) => {
            if (user?.username && u.username?.toLowerCase() === user.username.toLowerCase()) return false;
            if (user?.id && String(u.id) === String(user.id)) return false;
            return true;
          });
          otherUsers.forEach((u) => {
            if (u.id) setInitialFollowState(u.id, u.is_following, u.followers_count);
            if (u.username) setInitialFollowState(u.username, u.is_following, u.followers_count);
          });
          setRecommendedUsers(otherUsers.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load recommended users', err);
      }
    };
    fetchUsers();
  }, [isAuthenticated, user?.id, user?.username, setInitialFollowState]);

  // Infinite Scroll Trigger (Y-Axis)
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setLoadingMore(true);
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '120px' }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  useEffect(() => {
    if (page > 1) {
      fetchArtworks(false);
    }
  }, [page]);

  const handleTagClick = (tag) => {
    const newParams = new URLSearchParams(searchParams);
    if (queryTag === tag) {
      newParams.delete('tag');
    } else {
      newParams.set('tag', tag);
    }
    setSearchParams(newParams);
  };

  const handleFollowToggle = async (targetUser) => {
    await toggleFollow(targetUser);
  };

  let pageTitle = "Lumiina — Anime Fan Art & Illustration Platform";
  if (querySearch) pageTitle = `Search "${querySearch}" — Lumiina`;
  else if (queryTag) pageTitle = `#${queryTag} — Lumiina`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121519] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content="Explore high-quality anime illustrations and fan art by creators on Lumiina." />
      </Helmet>

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Active Filter Hint */}
        {(querySearch || queryTag) && (
          <div className="flex items-center justify-between bg-white dark:bg-[#1a1e24] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Filter active:</span>
              {querySearch && (
                <span className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800">
                  Search: "{querySearch}"
                </span>
              )}
              {queryTag && (
                <span className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800">
                  Tag: #{queryTag}
                </span>
              )}
            </div>
            <button
              onClick={() => setSearchParams({})}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* 2-Column Responsive Layout: Main Column on Left (8/9 cols) + Sidebar on Right (4/3 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Feed Column */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
            
            {/* ======================================================== */}
            {/* SECTION 1 & 2: Dual-Axis X Horizontal Scrolls             */}
            {/* ======================================================== */}
            {!querySearch && !queryTag && (
              <div className="flex flex-col gap-7">
                {/* Section X-1: Trending Artwork */}
                {trendingArtworks.length > 0 && (
                  <HorizontalWorksCarousel
                    title="Trending Artwork"
                    artworks={trendingArtworks}
                  />
                )}

                {/* Section Divider (Pembatas antara kedua section sumbu X) */}
                {trendingArtworks.length > 0 && recommendedArtworks.length > 0 && (
                  <div className="w-full border-t border-slate-200/80 dark:border-slate-800 my-1" />
                )}

                {/* Section X-2: Recommended Artwork */}
                {recommendedArtworks.length > 0 && (
                  <HorizontalWorksCarousel
                    title="Recommended Artwork"
                    artworks={recommendedArtworks}
                  />
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 3: Y-Axis Infinite Scroll Feed (Instagram Style)  */}
            {/* ======================================================== */}
            <div className="flex flex-col gap-6 pt-1">
              
              {/* Clean Separator Line (Garis Pemisah tanpa teks) */}
              <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />

              {/* Feed Content */}
              {loading && artworks.length === 0 ? (
                <div className="flex flex-col gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                      </div>
                      <div className="w-full h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : artworks.length === 0 ? (
                <div className="py-20 bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-8 flex flex-col items-center justify-center shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No Artworks Found</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6">
                    {querySearch || queryTag
                      ? 'Try using different keywords or check out trending tags.'
                      : 'Be the first artist to publish an illustration on Lumiina!'}
                  </p>
                  {isAuthenticated ? (
                    <Link
                      to="/upload"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0096fa] hover:bg-[#0084e0] text-white rounded-full font-bold text-sm shadow-sm transition-all"
                    >
                      <Upload className="w-4 h-4" /> Upload Now
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-full font-bold text-sm transition-all"
                    >
                      Sign In to Post
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {artworks.map((artwork, index) => (
                    <FeedPostCard
                      key={artwork.id}
                      artwork={artwork}
                      index={index}
                    />
                  ))}

                  {/* Infinite Scroll Trigger Observer */}
                  <div ref={loadMoreRef} className="w-full py-8 flex items-center justify-center">
                    {loadingMore ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        <span>Loading more artworks...</span>
                      </div>
                    ) : hasMore ? (
                      <span className="text-xs text-slate-400 dark:text-slate-600">Scroll to discover more</span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-600 font-medium">
                        You have reached the end of the feed.
                      </span>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Right Sidebar Column (Sticky - Pixiv Style) */}
          <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5 sticky top-24">
            
            {/* Widget 1: Daily Spotlight (Sorotan Hari Ini) */}
            <div className="bg-white dark:bg-[#1a1e24] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Daily Spotlight
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ranked</span>
              </div>

              {artworks.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {artworks.slice(0, 3).map((art, idx) => (
                    <Link
                      key={art.id}
                      to={`/artworks/${art.id}`}
                      className="flex items-center gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1.5 rounded-xl transition-colors"
                    >
                      <span className="text-sm font-black text-slate-300 dark:text-slate-600 group-hover:text-sky-600 w-4 text-center">
                        {idx + 1}
                      </span>
                      <img
                        src={art.image_url}
                        alt={art.title}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-sky-600 transition-colors">
                          {art.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          by {art.user?.username || 'Artist'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">No spotlight artworks yet.</p>
              )}
            </div>

            {/* Widget 2: Popular Tags (100% Real from PostgreSQL Database) */}
            <div className="bg-white dark:bg-[#1a1e24] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Popular Tags
              </h3>
              
              <div className="flex flex-wrap gap-1.5 pt-1">
                {popularTags.length > 0 ? (
                  popularTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        queryTag === tag
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-1 italic">
                    No tags in database yet.
                  </p>
                )}
              </div>
            </div>

            {/* Widget 3: Recommended Users (Hidden for guests, strictly excludes current user) */}
            {isAuthenticated && (
              <div className="bg-white dark:bg-[#1a1e24] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Recommended Users
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  {recommendedUsers.length > 0 ? (
                    recommendedUsers.map((u) => {
                      const userKey = u.username || String(u.id);
                      const isFollowed = isFollowedGlobal(u, u.is_following || false);
                      const isFollowLoading = userKey ? loadingMap[userKey.toLowerCase()] : false;
                      return (
                        <div key={u.id} className="flex items-center justify-between gap-3">
                          <Link
                            to={`/profile/${u.username || u.id}`}
                            className="flex items-center gap-2.5 min-w-0 group"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center uppercase shrink-0 border border-slate-200 dark:border-slate-600 overflow-hidden">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                              ) : (
                                u.username?.[0] || 'A'
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-sky-600 transition-colors">
                                {u.username}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate">
                                @{u.username?.toLowerCase()}
                              </p>
                            </div>
                          </Link>

                          <button
                            type="button"
                            disabled={isFollowLoading}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFollowToggle(u);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isFollowed
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                                : 'bg-[#0096fa] hover:bg-[#0084e0] text-white shadow-xs'
                            }`}
                          >
                            {isFollowLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isFollowed ? (
                              'Following'
                            ) : (
                              'Follow'
                            )}
                          </button>
                        </div>
                      );
                    })
                  ) : null}
                </div>
              </div>
            )}

            {/* Widget 4: Application Footer (Clean & Simple) */}
            <div className="bg-white dark:bg-[#1a1e24] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col gap-3.5 transition-colors">
              
              {/* Brand */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <img src="/logo_icon.png" alt="Lumiina" className="w-7 h-7 object-contain rounded-md shadow-xs" />
                <div className="flex flex-col leading-none">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight">Lumiina</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Illustration & Creator Community</span>
                </div>
              </div>

              {/* Clean Legal & Navigation Links */}
              <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                <Link to="/guidelines" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  Guidelines
                </Link>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <Link to="/terms" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  Terms
                </Link>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <Link to="/privacy" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  Privacy
                </Link>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <Link to="/about" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  About Us
                </Link>
              </div>

              {/* Simple Copyright */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500">
                <span>© 2026 Lumiina, Inc.</span>
              </div>

            </div>

          </aside>

        </div>

      </main>
    </div>
  );
};
