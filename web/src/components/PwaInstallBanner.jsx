import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PwaInstallBanner = () => {
  const { isInstallable, installApp } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('lumiina_pwa_banner_dismissed');
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  if (!isInstallable || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('lumiina_pwa_banner_dismissed', 'true');
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setDismissed(true);
    }
  };

  return (
    <aside 
      aria-label="PWA Installation Banner"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 max-w-sm w-[calc(100%-2rem)] md:w-auto bg-white dark:bg-[#1f242c] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/40 p-3.5 sm:p-4 animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs shrink-0 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
          <img src="/pwa-192x192.png" alt="Lumiina" className="w-full h-full object-contain" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            Install Lumiina App
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/80 px-1.5 py-0.2 rounded-md">
              PWA
            </span>
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Install on your home screen for fullscreen viewing & instant offline launch.
          </p>

          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={handleInstall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Now</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Maybe later
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
