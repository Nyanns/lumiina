import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { followsAPI } from '../api/client';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const FollowContext = createContext(null);

export function FollowProvider({ children }) {
  const { user, updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  // followedMap stores boolean status keyed by numeric ID and/or username
  const [followedMap, setFollowedMap] = useState({});
  // followersCountMap stores follower count keyed by numeric ID and/or username
  const [followersCountMap, setFollowersCountMap] = useState({});
  // loadingMap tracks ongoing toggle requests
  const [loadingMap, setLoadingMap] = useState({});

  // Automatically preload current authenticated user's following list on mount or login
  useEffect(() => {
    if (!user) {
      setFollowedMap({});
      return;
    }

    const loadMyFollowing = async () => {
      try {
        const identifier = user.username || user.id;
        const res = await followsAPI.getFollowing(identifier, 1, 100);
        if (res.data?.data?.users && Array.isArray(res.data.data.users)) {
          const map = {};
          res.data.data.users.forEach((u) => {
            if (u.id) map[String(u.id).toLowerCase()] = true;
            if (u.username) map[String(u.username).toLowerCase()] = true;
          });
          setFollowedMap((prev) => ({ ...prev, ...map }));
        }
      } catch (e) {
        console.warn('Preloading following list notice:', e?.message || e);
      }
    };

    loadMyFollowing();
  }, [user?.id, user?.username]);

  const setInitialFollowState = useCallback((targetKey, isFollowing, count) => {
    if (!targetKey) return;
    const key = String(targetKey).toLowerCase();
    setFollowedMap((prev) => {
      if (typeof prev[key] !== 'undefined') {
        if (isFollowing && !prev[key]) {
          return { ...prev, [key]: true };
        }
        return prev;
      }
      return {
        ...prev,
        [key]: Boolean(isFollowing),
      };
    });
    if (typeof count === 'number') {
      setFollowersCountMap((prev) => {
        if (typeof prev[key] !== 'undefined') return prev;
        return {
          ...prev,
          [key]: count,
        };
      });
    }
  }, []);

  const isFollowed = useCallback(
    (target, fallback = false) => {
      if (!target) return fallback;
      if (typeof target === 'object') {
        const uKey = target.username ? String(target.username).toLowerCase() : null;
        const idKey = target.id ? String(target.id).toLowerCase() : null;
        if (uKey && typeof followedMap[uKey] !== 'undefined') return followedMap[uKey];
        if (idKey && typeof followedMap[idKey] !== 'undefined') return followedMap[idKey];
        return target.is_following ?? fallback;
      }
      const key = String(target).toLowerCase();
      if (typeof followedMap[key] !== 'undefined') {
        return followedMap[key];
      }
      return fallback;
    },
    [followedMap]
  );

  const getFollowerCount = useCallback(
    (target, fallback = 0) => {
      if (!target) return fallback;
      if (typeof target === 'object') {
        const uKey = target.username ? String(target.username).toLowerCase() : null;
        const idKey = target.id ? String(target.id).toLowerCase() : null;
        if (uKey && typeof followersCountMap[uKey] !== 'undefined') return followersCountMap[uKey];
        if (idKey && typeof followersCountMap[idKey] !== 'undefined') return followersCountMap[idKey];
        return target.followers_count ?? fallback;
      }
      const key = String(target).toLowerCase();
      if (typeof followersCountMap[key] !== 'undefined') {
        return followersCountMap[key];
      }
      return fallback;
    },
    [followersCountMap]
  );

  const toggleFollow = useCallback(
    async (target) => {
      if (!target) return { success: false };

      // 1. If not logged in, navigate to login
      if (!user) {
        navigate('/login');
        return { success: false, requireAuth: true };
      }

      const targetId = target.id;
      const targetUsername = target.username;
      const targetIdentifier = targetUsername || targetId;

      // 2. Prevent self-following (handles username and numeric/string IDs)
      const isSameUser =
        (user.username && targetUsername && user.username.toLowerCase() === targetUsername.toLowerCase()) ||
        (user.id && targetId && String(user.id).toLowerCase() === String(targetId).toLowerCase());

      if (isSameUser) {
        return { success: false, isSelf: true };
      }

      const idKey = targetId ? String(targetId).toLowerCase() : null;
      const userKey = targetUsername ? String(targetUsername).toLowerCase() : null;
      const activeKey = userKey || idKey;

      if (loadingMap[activeKey]) return { success: false };

      setLoadingMap((prev) => ({ ...prev, [activeKey]: true }));

      // Current state before toggle
      const prevFollowed = isFollowed(target, target.is_following || false);
      const prevCount = getFollowerCount(target, target.followers_count || 0);

      const nextFollowed = !prevFollowed;
      const nextCount = nextFollowed ? prevCount + 1 : Math.max(0, prevCount - 1);

      // Optimistic update
      const updateState = (following, count) => {
        setFollowedMap((prev) => {
          const updated = { ...prev };
          if (idKey) updated[idKey] = following;
          if (userKey) updated[userKey] = following;
          return updated;
        });
        setFollowersCountMap((prev) => {
          const updated = { ...prev };
          if (idKey) updated[idKey] = count;
          if (userKey) updated[userKey] = count;
          return updated;
        });
      };

      updateState(nextFollowed, nextCount);

      try {
        const res = await followsAPI.toggle(targetIdentifier);
        const data = res.data?.data;
        if (data) {
          updateState(data.is_following, data.followers_count);

          // Synchronize authenticated user's following count in global state
          if (updateUser) {
            const currentCount = typeof user?.following_count === 'number' ? user.following_count : 0;
            const updatedFollowing = data.is_following
              ? currentCount + 1
              : Math.max(0, currentCount - 1);
            updateUser({ following_count: updatedFollowing });
          }
          if (refreshUser) {
            refreshUser();
          }

          return { success: true, isFollowing: data.is_following, count: data.followers_count };
        }
        return { success: true, isFollowing: nextFollowed, count: nextCount };
      } catch (err) {
        // Revert on error
        updateState(prevFollowed, prevCount);
        console.error('Follow toggle error:', err);
        return { success: false, error: err };
      } finally {
        setLoadingMap((prev) => ({ ...prev, [activeKey]: false }));
      }
    },
    [user, updateUser, refreshUser, navigate, isFollowed, getFollowerCount, loadingMap]
  );

  return (
    <FollowContext.Provider
      value={{
        isFollowed,
        getFollowerCount,
        toggleFollow,
        setInitialFollowState,
        loadingMap,
      }}
    >
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
}
