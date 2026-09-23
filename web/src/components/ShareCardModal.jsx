import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  Loader2
} from 'lucide-react';

export const ShareCardModal = ({ isOpen, onClose, artwork }) => {
  const [cardTheme, setCardTheme] = useState('dark'); // 'dark' | 'light'
  const [generating, setGenerating] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);

  useEffect(() => {
    if (!isOpen || !artwork) return;

    let isCancelled = false;
    setGenerating(true);

    const generateCard = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Card dimensions: 1080 x 1350 px (Standard 4:5 social ratio)
        const W = 1080;
        const H = 1350;
        canvas.width = W;
        canvas.height = H;

        const isDarkTheme = cardTheme === 'dark';
        const bgColor = isDarkTheme ? '#0d1117' : '#ffffff';
        const cardInnerBg = isDarkTheme ? '#161b22' : '#f6f8fa';
        const textColor = isDarkTheme ? '#f0f6fc' : '#1f2328';
        const subtitleColor = isDarkTheme ? '#8b949e' : '#656d76';
        const borderColor = isDarkTheme ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
        const accentColor = '#0096fa'; // Lumiina Brand Blue

        // 1. Draw Clean Solid Background (No AI radial glow soup)
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, W, H);

        // 2. Draw Subtle Outer Border Frame
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 40, W - 80, H - 80);

        // 3. Load Artwork Image
        const artImg = new Image();
        artImg.crossOrigin = 'anonymous';

        await new Promise((resolve) => {
          artImg.onload = resolve;
          artImg.onerror = () => {
            console.warn('Canvas share card fallback on image error');
            resolve();
          };
          artImg.src = artwork.image_url;
        });

        if (isCancelled) return;

        // Image container geometry
        const imgX = 80;
        const imgY = 80;
        const imgW = W - 160;
        const imgH = 880;

        // Draw Image Matting Container
        ctx.fillStyle = cardInnerBg;
        roundRect(ctx, imgX, imgY, imgW, imgH, 16);
        ctx.fill();

        // Draw Artwork (object-contain with high quality)
        if (artImg.width > 0 && artImg.height > 0) {
          ctx.save();
          roundRect(ctx, imgX, imgY, imgW, imgH, 16);
          ctx.clip();

          const imgRatio = artImg.width / artImg.height;
          const containerRatio = imgW / imgH;
          let drawW, drawH, drawX, drawY;

          if (imgRatio > containerRatio) {
            drawW = imgW;
            drawH = imgW / imgRatio;
            drawX = imgX;
            drawY = imgY + (imgH - drawH) / 2;
          } else {
            drawH = imgH;
            drawW = imgH * imgRatio;
            drawX = imgX + (imgW - drawW) / 2;
            drawY = imgY;
          }

          ctx.drawImage(artImg, drawX, drawY, drawW, drawH);
          ctx.restore();
        }

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        roundRect(ctx, imgX, imgY, imgW, imgH, 16);
        ctx.stroke();

        // 4. Metadata Section (Clean Left-Aligned Exhibition Typography)
        const metaY = 1010;

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif';
        const title = artwork.title || 'Untitled';
        const truncatedTitle = title.length > 30 ? title.slice(0, 29) + '…' : title;
        ctx.fillText(truncatedTitle, 80, metaY);

        // Artist Credit
        const artistName = artwork.user?.display_name || artwork.user?.username || 'Artist';
        ctx.fillStyle = subtitleColor;
        ctx.font = '500 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif';
        ctx.fillText(`Artwork by @${artistName}`, 80, metaY + 46);

        // Tags Line
        if (artwork.tags && artwork.tags.length > 0) {
          const tagNames = artwork.tags.slice(0, 4).map((t) => typeof t === 'string' ? t : t.name);
          const tagStr = tagNames.map((n) => `#${n}`).join('   ');
          ctx.fillStyle = isDarkTheme ? '#58a6ff' : '#0969da';
          ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif';
          ctx.fillText(tagStr, 80, metaY + 92);
        }

        // 5. Minimalist Footer Placard
        const footerY = 1250;
        
        // Brand Mark
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif';
        ctx.fillText('✦ LUMIINA', 80, footerY);

        ctx.fillStyle = subtitleColor;
        ctx.font = '400 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif';
        ctx.fillText('lumiina.art', 240, footerY);

        // Right attribution note
        ctx.textAlign = 'right';
        ctx.fillStyle = subtitleColor;
        ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif';
        ctx.fillText('Anime Fan Art Community', W - 80, footerY);
        ctx.textAlign = 'left'; // Reset

        if (!isCancelled) {
          setPreviewDataUrl(canvas.toDataURL('image/png'));
          setGenerating(false);
        }
      } catch (err) {
        console.error('Failed to generate share card', err);
        if (!isCancelled) setGenerating(false);
      }
    };

    generateCard();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, artwork, cardTheme]);

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  const handleDownload = () => {
    if (!previewDataUrl) return;
    setDownloading(true);
    const link = document.createElement('a');
    const safeTitle = (artwork?.title || 'artwork').toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.download = `lumiina-${safeTitle}.png`;
    link.href = previewDataUrl;
    link.click();
    setTimeout(() => setDownloading(false), 600);
  };

  const handleCopyImage = async () => {
    if (!previewDataUrl) return;
    try {
      const res = await fetch(previewDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareTwitter = () => {
    const title = artwork?.title || 'Artwork';
    const artist = artwork?.user?.username ? `@${artwork.user.username}` : 'the creator';
    const url = `https://www.lumiina.art/artworks/${artwork?.id}`;
    const text = encodeURIComponent(`"${title}" by ${artist} on Lumiina ✦ #Lumiina #AnimeArt`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="relative z-10 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Export Artwork Card
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Exhibition catalog card format (4:5 vertical)
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/70 dark:border-slate-700/70 text-xs">
                <button
                  type="button"
                  onClick={() => setCardTheme('dark')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    cardTheme === 'dark'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setCardTheme('light')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    cardTheme === 'light'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Light
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 flex-1 overflow-y-auto flex flex-col items-center gap-5">
            {/* Card Preview */}
            <div className="relative w-full max-w-[280px] aspect-[4/5] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center shadow-md">
              {generating ? (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
                  <span className="text-xs">Rendering card...</span>
                </div>
              ) : previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Artwork Card Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-rose-500">Failed to render card.</div>
              )}
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-1">
              <button
                type="button"
                onClick={handleDownload}
                disabled={generating || downloading}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                disabled={generating}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {copiedImage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Image</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareTwitter}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Share on X</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
