import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { bookmarksAPI } from '../api/client';
import { useNavigate } from 'react-router-dom';

const BookmarkContext = createContext(null);

export const BookmarkProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Store bookmark map: { [artworkId]: { isBookmarked: boolean, count: number } }
  const [bookmarksMap, setBookmarksMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  // Reset/clean bookmark states when logged out or when switching accounts
  useEffect(() => {
    if (!isAuthenticated) {
      setBookmarksMap((prev) => {
        const reset = {};
        for (const [k, v] of Object.entries(prev)) {
          reset[k] = { isBookmarked: false, count: v.count };
        }
        return reset;
      });
    }
  }, [isAuthenticated, user?.id]);

  // Sync artwork data from API response into bookmarksMap
  const syncFromServer = useCallback((artworks) => {
    if (!artworks) return;
    const list = Array.isArray(artworks) ? artworks : [artworks];
    if (list.length === 0) return;

    setBookmarksMap((prev) => {
      const updates = {};
      for (const art of list) {
        if (!art || art.id == null) continue;
        const key = String(art.id);
        updates[key] = {
          isBookmarked: isAuthenticated ? Boolean(art.is_bookmarked) : false,
          count: typeof art.bookmark_count === 'number' ? art.bookmark_count : (prev[key]?.count ?? 0),
        };
      }
      return { ...prev, ...updates };
    });
  }, [isAuthenticated]);

  const getBookmarkInfo = (artworkId, defaultCount = 0) => {
    const key = String(artworkId);
    const existing = bookmarksMap[key];

    // Guests: isBookmarked is ALWAYS false, but count reflects real community count
    if (!isAuthenticated) {
      const actualCount = existing?.count !== undefined ? existing.count : defaultCount;
      return { isBookmarked: false, count: actualCount };
    }

    if (existing) {
      return existing;
    }
    return { isBookmarked: false, count: defaultCount };
  };

  const toggleBookmark = async (artworkId, defaultCount = 0) => {
    // Guests must log in to bookmark
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }

    const key = String(artworkId);
    if (loadingMap[key]) return false;

    setLoadingMap((prev) => ({ ...prev, [key]: true }));

    const current = bookmarksMap[key] || { isBookmarked: false, count: defaultCount };
    const optimisticIsBookmarked = !current.isBookmarked;
    const optimisticCount = optimisticIsBookmarked
      ? current.count + 1
      : Math.max(0, current.count - 1);

    // Optimistic UI update
    setBookmarksMap((prev) => ({
      ...prev,
      [key]: {
        isBookmarked: optimisticIsBookmarked,
        count: optimisticCount,
      },
    }));

    try {
      const res = await bookmarksAPI.toggle(key);
      if (res.data?.data) {
        const { is_bookmarked, bookmark_count } = res.data.data;
        setBookmarksMap((prev) => ({
          ...prev,
          [key]: {
            isBookmarked: Boolean(is_bookmarked),
            count: typeof bookmark_count === 'number' ? bookmark_count : (is_bookmarked ? current.count + 1 : Math.max(0, current.count - 1)),
          },
        }));
      }
      return true;
    } catch (err) {
      console.error('Failed to sync bookmark with backend:', err);
      // Revert optimistic update on error
      setBookmarksMap((prev) => ({
        ...prev,
        [key]: current,
      }));
      return false;
    } finally {
      setLoadingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <BookmarkContext.Provider value={{ getBookmarkInfo, toggleBookmark, syncFromServer, loadingMap }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};
