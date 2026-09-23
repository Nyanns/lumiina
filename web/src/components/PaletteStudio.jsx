import React, { useState, useEffect } from 'react';
import { Palette, Check, Copy } from 'lucide-react';
import { extractPaletteFromImage } from '../utils/colorExtractor';

export const PaletteStudio = ({ imageUrl, artworkTitle }) => {
  const [palette, setPalette] = useState([]);
  const [copiedHex, setCopiedHex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!imageUrl) {
      setPalette([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    extractPaletteFromImage(imageUrl, 6).then((colors) => {
      if (isMounted) {
        setPalette(colors);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  if (loading || palette.length === 0) {
    return null;
  }

  const handleCopy = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const handleCopyAll = () => {
    const allHexes = palette.map((c) => c.hex).join(', ');
    navigator.clipboard.writeText(allHexes);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1800);
  };

  return (
    <div className="bg-white dark:bg-[#1a1e24] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Color Palette
          </h4>
        </div>
        <button
          type="button"
          onClick={handleCopyAll}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Copy full palette HEX codes"
        >
          {copiedAll ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">Copied All!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy All</span>
            </>
          )}
        </button>
      </div>

      {/* Palette Swatches Bar */}
      <div className="grid grid-cols-6 gap-2">
        {palette.map((color) => {
          const isCopied = copiedHex === color.hex;
          return (
            <button
              key={color.hex}
              type="button"
              onClick={() => handleCopy(color.hex)}
              className="group relative flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
              title={`Click to copy ${color.hex}`}
            >
              <div
                className="w-full aspect-square rounded-xl shadow-sm border border-black/10 dark:border-white/10 group-hover:scale-105 group-active:scale-95 transition-all duration-150 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: color.hex }}
              >
                {isCopied && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white drop-shadow" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                {isCopied ? 'COPIED' : color.hex}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
