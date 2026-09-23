import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command } from 'lucide-react';

export const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: 'Global Navigation',
      shortcuts: [
        { keys: ['⌘', 'K'], label: 'Open Command Palette' },
        { keys: ['/'], label: 'Quick Search' },
        { keys: ['?'], label: 'Show this shortcuts cheatsheet' },
        { keys: ['Esc'], label: 'Close open dialogs, modals, or focus mode' },
      ],
    },
    {
      title: 'Artwork Viewer & Details',
      shortcuts: [
        { keys: ['L'], label: 'Like / Unlike artwork' },
        { keys: ['B'], label: 'Bookmark / Unbookmark artwork' },
        { keys: ['F'], label: 'Toggle Focus / Zen Cinema mode' },
        { keys: ['S'], label: 'Export Art Showcase Card' },
        { keys: ['←', '→'], label: 'Navigate previous / next artwork' },
        { keys: ['Double Click'], label: 'Heart burst like on artwork' },
      ],
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative z-10 w-full max-w-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                <Keyboard className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Keyboard Shortcuts
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {sections.map((sec) => (
              <div key={sec.title} className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {sec.title}
                </h4>
                <div className="space-y-1.5">
                  {sec.shortcuts.map((sc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {sc.label}
                      </span>
                      <div className="flex items-center gap-1">
                        {sc.keys.map((k, ki) => (
                          <kbd
                            key={ki}
                            className="min-w-[24px] h-6 px-1.5 inline-flex items-center justify-center text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs"
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
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              Pro-tip: Press <kbd className="font-mono bg-white dark:bg-slate-700 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-[10px]">?</kbd> at any time to toggle this modal.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
