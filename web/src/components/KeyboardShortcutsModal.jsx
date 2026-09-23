import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

export const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: 'Global Navigation',
      shortcuts: [
        { keys: ['⌘', 'K'], label: 'Open Command Palette' },
        { keys: ['/'], label: 'Quick Search' },
        { keys: ['?'], label: 'Show this shortcuts cheatsheet' },
        { keys: ['Esc'], label: 'Close open dialogs or focus mode' },
      ],
    },
    {
      title: 'Artwork Viewer',
      shortcuts: [
        { keys: ['L'], label: 'Like / Unlike illustration' },
        { keys: ['B'], label: 'Bookmark / Unbookmark' },
        { keys: ['F'], label: 'Zen Cinema Mode' },
        { keys: ['S'], label: 'Export Artwork Card' },
        { keys: ['←', '→'], label: 'Previous / Next work by artist' },
        { keys: ['Double Click'], label: 'Quick like' },
      ],
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.12 }}
          className="relative z-10 w-full max-w-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Keyboard Shortcuts
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {sections.map((sec) => (
              <div key={sec.title} className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {sec.title}
                </h4>
                <div className="space-y-1">
                  {sec.shortcuts.map((sc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {sc.label}
                      </span>
                      <div className="flex items-center gap-1">
                        {sc.keys.map((k, ki) => (
                          <kbd
                            key={ki}
                            className="min-w-[22px] h-5 px-1.5 inline-flex items-center justify-center text-[10px] font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 font-mono">
              Press <kbd className="bg-white dark:bg-slate-700 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-[10px]">?</kbd> anytime to toggle
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
