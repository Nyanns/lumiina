import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  TrendingUp, 
  Upload, 
  Tag, 
  BookOpen, 
  ShieldCheck, 
  Keyboard, 
  ArrowRight,
  X,
  Compass
} from 'lucide-react';
import { artworksAPI } from '../api/client';

export const CommandPalette = ({ isOpen, onClose, onOpenShortcuts }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liveResults, setLiveResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  const baseActions = [
    { id: 'explore', title: 'Explore All Artworks', icon: Compass, path: '/explore', category: 'Navigation' },
    { id: 'trending', title: 'Trending Illustrations', icon: TrendingUp, path: '/trending', category: 'Navigation' },
    { id: 'upload', title: 'Upload Illustration', icon: Upload, path: '/upload', category: 'Actions' },
    { id: 'tag-frieren', title: '#Frieren', icon: Tag, path: '/?tag=Frieren', category: 'Tags' },
    { id: 'tag-genshin', title: '#GenshinImpact', icon: Tag, path: '/?tag=GenshinImpact', category: 'Tags' },
    { id: 'tag-mha', title: '#BokuNoHeroAcademia', icon: Tag, path: '/?tag=BokuNoHeroAcademia', category: 'Tags' },
    { id: 'about', title: 'About & Lore', icon: BookOpen, path: '/about', category: 'Info' },
    { id: 'guidelines', title: 'Community Guidelines', icon: ShieldCheck, path: '/guidelines', category: 'Info' },
    { 
      id: 'shortcuts', 
      title: 'Keyboard Shortcuts', 
      icon: Keyboard, 
      action: () => {
        onClose();
        if (onOpenShortcuts) onOpenShortcuts();
      }, 
      category: 'Help' 
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setLiveResults([]);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setLiveResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await artworksAPI.getAll({ search: query.trim(), limit: 5 });
        if (res.data?.data) {
          setLiveResults(res.data.data.map((art) => ({
            id: `art-${art.id}`,
            title: art.title,
            subtitle: `@${art.user?.username || 'artist'}`,
            image: art.image_url,
            path: `/artworks/${art.id}`,
            category: 'Artworks',
          })));
        }
      } catch (err) {
        console.error('Command search error:', err);
      } finally {
        setSearching(false);
      }
    }, 180);

    return () => clearTimeout(timeout);
  }, [query]);

  const filteredBase = query.trim()
    ? baseActions.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()))
    : baseActions;

  const allItems = [
    ...(liveResults.length > 0 ? liveResults : []),
    ...filteredBase,
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        executeItem(allItems[selectedIndex]);
      } else if (query.trim()) {
        onClose();
        navigate(`/?search=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeItem = (item) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -8 }}
          transition={{ duration: 0.12 }}
          className="relative z-10 w-full max-w-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Search Input Bar (Raycast / Linear style) */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search illustrations, tags, or jump to page..."
              className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[360px] overflow-y-auto p-1.5 space-y-0.5">
            {allItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No matching results for "{query}".
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/?search=${encodeURIComponent(query.trim())}`);
                    }}
                    className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium hover:underline cursor-pointer"
                  >
                    <span>Search gallery for "{query}"</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              allItems.map((item, index) => {
                const isSelected = selectedIndex === index;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-7 h-7 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : Icon ? (
                        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : null}

                      <div className="min-w-0">
                        <span className="text-xs font-medium truncate block">
                          {item.title}
                        </span>
                        {item.subtitle && (
                          <span className="text-[11px] text-slate-400 truncate block">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-medium text-slate-400">
                        {item.category}
                      </span>
                      {isSelected && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts Legend (Clean neutral) */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="bg-white dark:bg-slate-700 px-1 rounded border border-slate-200 dark:border-slate-600 text-[10px]">
                  ↑↓
                </kbd>{' '}
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-white dark:bg-slate-700 px-1 rounded border border-slate-200 dark:border-slate-600 text-[10px]">
                  ↵
                </kbd>{' '}
                Select
              </span>
            </div>
            <span>Press ? for shortcuts</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
