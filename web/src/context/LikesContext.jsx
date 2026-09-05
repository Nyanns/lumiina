import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { likesAPI } from '../api/client';

const LikesContext = createContext();

export const LikesProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // Store likes map: { [artworkId]: { isLiked: boolean, count: number } }
  const [likesMap, setLikesMap] = useState({});

  // Reset/clean like states when logged out or when switching accounts
  useEffect(() => {
    if (!isAuthenticated) {
      setLikesMap((prev) => {
        const reset = {};
        for (const [k, v] of Object.entries(prev)) {
          reset[k] = { isLiked: false, count: v.count };
        }
        return reset;
      });
    }
  }, [isAuthenticated, user?.id]);

  // Sync artwork data from API response into likesMap
  const syncFromServer = useCallback((artworks) => {
    if (!artworks) return;
    const list = Array.isArray(artworks) ? artworks : [artworks];
    if (list.length === 0) return;

    setLikesMap((prev) => {
      const updates = {};
      for (const art of list) {
        if (!art || art.id == null) continue;
        const key = String(art.id);
        updates[key] = {
          isLiked: isAuthenticated ? Boolean(art.is_liked) : false,
          count: typeof art.like_count === 'number' ? art.like_count : (prev[key]?.count ?? 0),
        };
      }
      return { ...prev, ...updates };
    });
  }, [isAuthenticated]);

  const getLikeInfo = (artworkId, defaultCount = 0) => {
    const key = String(artworkId);
    const existing = likesMap[key];

    // Guests: isLiked is ALWAYS false, but count reflects real community like count
    if (!isAuthenticated) {
      const actualCount = existing?.count !== undefined ? existing.count : defaultCount;
      return { isLiked: false, count: actualCount };
    }

    // Authenticated: return existing state if tracked, otherwise fallback to default
    if (existing) {
      return existing;
    }
    return { isLiked: false, count: defaultCount };
  };

  const toggleLike = async (artworkId, defaultCount = 0) => {
    // Business logic guard: Guests cannot like artworks
    if (!isAuthenticated) {
      return false;
    }

    const key = String(artworkId);
    const current = likesMap[key] || { isLiked: false, count: defaultCount };
    const optimisticIsLiked = !current.isLiked;
    const optimisticCount = optimisticIsLiked
      ? current.count + 1
      : Math.max(0, current.count - 1);

    // Optimistic UI update
    setLikesMap((prev) => ({
      ...prev,
      [key]: {
        isLiked: optimisticIsLiked,
        count: optimisticCount,
      },
    }));

    // Server synchronization with Go Backend API
    try {
      const res = await likesAPI.toggle(key);
      if (res.data?.data) {
        const { is_liked, like_count } = res.data.data;
        setLikesMap((prev) => ({
          ...prev,
          [key]: {
            isLiked: Boolean(is_liked),
            count: typeof like_count === 'number' ? like_count : (is_liked ? current.count + 1 : Math.max(0, current.count - 1)),
          },
        }));
      }
      return true;
    } catch (err) {
      console.error('Failed to sync like with backend:', err);
      // Revert optimistic update on failure
      setLikesMap((prev) => ({
        ...prev,
        [key]: current,
      }));
      return false;
    }
  };

  return (
    <LikesContext.Provider value={{ getLikeInfo, toggleLike, syncFromServer }}>
      {children}
    </LikesContext.Provider>
  );
};

export const useLikes = () => {
  const context = useContext(LikesContext);
  if (!context) {
    throw new Error('useLikes must be used within a LikesProvider');
  }
  return context;
};
