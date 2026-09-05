import React, { useState, useEffect } from 'react';
import { X, Users, UserCheck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { followsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFollow } from '../context/FollowContext';

export const FollowListModal = ({ isOpen, onClose, username, initialTab = 'followers' }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'followers' | 'following'
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const { user: currentUser } = useAuth();
  const { isFollowed, toggleFollow, setInitialFollowState, loadingMap } = useFollow();

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setPage(1);
      setUsers([]);
    }
  }, [isOpen, initialTab, username]);

  useEffect(() => {
    if (!isOpen || !username) return;

    let isMounted = true;

    const fetchList = async () => {
      setLoading(true);
      try {
        const apiCall = activeTab === 'followers' ? followsAPI.getFollowers : followsAPI.getFollowing;
        const res = await apiCall(username, page, 20);
        if (isMounted && res.data?.data) {
          const fetchedUsers = res.data.data.users || [];
          const pagination = res.data.data.pagination || {};
          fetchedUsers.forEach((u) => {
            if (u.id) setInitialFollowState(u.id, u.is_following);
            if (u.username) setInitialFollowState(u.username, u.is_following);
          });
          setUsers(fetchedUsers);
          setTotal(pagination.total || 0);
          setHasMore(pagination.total > page * 20);
        }
      } catch (err) {
        console.error('Failed to load follow list', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchList();

    return () => {
      isMounted = false;
    };
  }, [isOpen, username, activeTab, page]);

  if (!isOpen) return null;

  const handleTabChange = (tab) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setPage(1);
    setUsers([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-[#1a1e24] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col my-auto max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              @{username}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={() => handleTabChange('followers')}
            className={`flex-1 py-3 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'followers'
                ? 'border-[#0096fa] text-[#0096fa] bg-white dark:bg-[#1a1e24]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Followers</span>
            {activeTab === 'followers' && total > 0 && (
              <span className="bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-full text-[10px]">
                {total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('following')}
            className={`flex-1 py-3 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'following'
                ? 'border-[#0096fa] text-[#0096fa] bg-white dark:bg-[#1a1e24]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Following</span>
            {activeTab === 'following' && total > 0 && (
              <span className="bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-full text-[10px]">
                {total}
              </span>
            )}
          </button>
        </div>

        {/* List Content */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3 min-h-[260px] max-h-[500px]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
              <span className="text-xs font-medium">Loading {activeTab}...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500 gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                {activeTab === 'followers' ? <Users className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
              </div>
              <p className="text-xs font-medium">
                {activeTab === 'followers'
                  ? 'No followers yet.'
                  : 'Not following anyone yet.'}
              </p>
            </div>
          ) : (
            users.map((u) => {
              const userKey = u.username || String(u.id);
              const isFollowing = isFollowed(userKey, u.is_following || false);
              const isUserLoading = userKey ? loadingMap[userKey.toLowerCase()] : false;
              const isSelf = currentUser && (
                (currentUser.username && u.username && currentUser.username.toLowerCase() === u.username.toLowerCase()) ||
                (currentUser.id && u.id && String(currentUser.id) === String(u.id))
              );

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <Link
                    to={`/profile/${u.username || u.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center uppercase shrink-0 border border-slate-200 dark:border-slate-600 overflow-hidden">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        u.username?.[0] || 'U'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600 transition-colors">
                        {u.display_name || u.username}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        @{u.username?.toLowerCase()}
                      </p>
                      {u.bio && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </Link>

                  {!isSelf && (
                    <button
                      type="button"
                      disabled={isUserLoading}
                      onClick={() => toggleFollow(u)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        isFollowing
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                          : 'bg-[#0096fa] hover:bg-[#0084e0] text-white shadow-xs'
                      }`}
                    >
                      {isUserLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isFollowing ? (
                        'Following'
                      ) : (
                        'Follow'
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
