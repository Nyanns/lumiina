import React, { useRef, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

export const LUMIINA_STICKERS = [
  { id: 1, name: 'Happy', code: ':lumiina_happy:', aliases: [':lumiina_1:'], thumb: '/mascot/emojis/1_thumb.webp', full: '/mascot/emojis/1.png' },
  { id: 2, name: 'Shy', code: ':lumiina_shy:', aliases: [':lumiina_2:'], thumb: '/mascot/emojis/2_thumb.webp', full: '/mascot/emojis/2.png' },
  { id: 3, name: 'Excited', code: ':lumiina_excited:', aliases: [':lumiina_3:'], thumb: '/mascot/emojis/3_thumb.webp', full: '/mascot/emojis/3.png' },
  { id: 4, name: 'Wink', code: ':lumiina_wink:', aliases: [':lumiina_4:'], thumb: '/mascot/emojis/4_thumb.webp', full: '/mascot/emojis/4.png' },
  { id: 5, name: 'Pout', code: ':lumiina_pout:', aliases: [':lumiina_5:'], thumb: '/mascot/emojis/5_thumb.webp', full: '/mascot/emojis/5.png' },
  { id: 6, name: 'Love', code: ':lumiina_love:', aliases: [':lumiina_6:'], thumb: '/mascot/emojis/6_thumb.webp', full: '/mascot/emojis/6.png' },
  { id: 7, name: 'Cool', code: ':lumiina_cool:', aliases: [':lumiina_7:'], thumb: '/mascot/emojis/7_thumb.webp', full: '/mascot/emojis/7.png' },
  { id: 8, name: 'Tablet', code: ':lumiina_tablet:', aliases: [':lumiina_8:'], thumb: '/mascot/emojis/8_thumb.webp', full: '/mascot/emojis/8.png' },
  { id: 9, name: 'Thinking', code: ':lumiina_thinking:', aliases: [':lumiina_9:'], thumb: '/mascot/emojis/9_thumb.webp', full: '/mascot/emojis/9.png' },
];

/**
 * Helper to render comment text with embedded Lumiina stickers.
 * Automatically parses :lumiina_xxx: or :lumiina_1: shortcodes into cute inline sticker images.
 */
export function renderCommentText(text) {
  if (!text) return '';
  
  // Create mapping of code -> sticker
  const codeMap = {};
  LUMIINA_STICKERS.forEach(st => {
    codeMap[st.code.toLowerCase()] = st;
    st.aliases?.forEach(a => {
      codeMap[a.toLowerCase()] = st;
    });
  });

  const regex = /(:lumiina_[a-z0-9_]+:)/gi;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const match = codeMap[part.toLowerCase()];
    if (match) {
      return (
        <span key={index} className="inline-flex items-center align-middle mx-1 my-0.5">
          <img
            src={match.thumb}
            alt={match.name}
            title={`${match.name} (${match.code})`}
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain inline-block hover:scale-125 transition-transform select-none"
            loading="lazy"
          />
        </span>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * LumiinaStickerPicker Popover
 * Allows creators and viewers to select official Lumiina stickers for discussions and comments.
 */
export const LumiinaStickerPicker = ({ isOpen, onClose, onSelect }) => {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full right-0 mb-2 w-72 sm:w-80 bg-white dark:bg-[#181c24] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-40 animate-fadeIn select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
          <Sparkles className="w-3.5 h-3.5 text-[#0096fa]" />
          <span>Lumiina Stickers</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-[#0096fa] font-mono">
            9 Emojis
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close sticker picker"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stickers Grid */}
      <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
        {LUMIINA_STICKERS.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            onClick={() => {
              onSelect(sticker.code);
              onClose();
            }}
            className="group flex flex-col items-center justify-center p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-transparent hover:border-sky-200 dark:hover:border-sky-800/60 transition-all active:scale-95 cursor-pointer text-center"
            title={`${sticker.name} (${sticker.code})`}
          >
            <div className="w-12 h-12 flex items-center justify-center p-0.5 group-hover:scale-110 transition-transform">
              <img
                src={sticker.thumb}
                alt={sticker.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mt-1 truncate max-w-full">
              {sticker.name}
            </span>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center">
        Click to insert sticker shortcode
      </div>
    </div>
  );
};
