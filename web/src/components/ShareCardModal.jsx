import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  Loader2,
  Layers
} from 'lucide-react';

export const ShareCardModal = ({ isOpen, onClose, artwork }) => {
  const canvasRef = useRef(null);
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

        // Card specs: 1080 x 1350 px (Standard 4:5 social sharing ratio)
        const W = 1080;
        const H = 1350;
        canvas.width = W;
        canvas.height = H;

        const isDarkTheme = cardTheme === 'dark';
        const bgColor = isDarkTheme ? '#0f141c' : '#ffffff';
        const cardInnerBg = isDarkTheme ? '#18202c' : '#f8fafc';
        const textColor = isDarkTheme ? '#ffffff' : '#0f172a';
        const subtitleColor = isDarkTheme ? '#94a3b8' : '#64748b';
        const borderColor = isDarkTheme ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
        const accentColor = '#0096fa'; // Lumiina Brand Blue

        // 1. Draw Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, W, H);

        // 2. Draw Decorative Ambient Glow for dark theme
        if (isDarkTheme) {
          const gradient = ctx.createRadialGradient(W / 2, 400, 100, W / 2, 400, 600);
          gradient.addColorStop(0, 'rgba(0, 150, 250, 0.15)');
          gradient.addColorStop(1, 'rgba(15, 20, 28, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, W, H);
        }

        // 3. Draw Outer Border Frame
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(36, 36, W - 72, H - 72);

        // 4. Load & Draw Artwork Image
        const artImg = new Image();
        artImg.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
          artImg.onload = resolve;
          artImg.onerror = () => {
            console.warn('CORS restricted image in canvas share card, proceeding with fallback');
            resolve();
          };
          artImg.src = artwork.image_url;
        });

        if (isCancelled) return;

        // Image placement bounds
        const imgX = 72;
        const imgY = 72;
        const imgW = W - 144;
        const imgH = 880;

        // Draw Image Container Background
        ctx.fillStyle = cardInnerBg;
        roundRect(ctx, imgX, imgY, imgW, imgH, 24);
        ctx.fill();

        // Draw Image fitted (object-contain with crisp letterbox)
        if (artImg.width > 0 && artImg.height > 0) {
          ctx.save();
          roundRect(ctx, imgX, imgY, imgW, imgH, 24);
          ctx.clip();

          // Calculate aspect ratio fit
          const imgRatio = artImg.width / artImg.height;
          const containerRatio = imgW / imgH;
          let drawW, drawH, drawX, drawY;

          if (imgRatio > containerRatio) {
            // Wider
            drawW = imgW;
            drawH = imgW / imgRatio;
            drawX = imgX;
            drawY = imgY + (imgH - drawH) / 2;
          } else {
            // Taller
            drawH = imgH;
            drawW = imgH * imgRatio;
            drawX = imgX + (imgW - drawW) / 2;
            drawY = imgY;
          }

          ctx.drawImage(artImg, drawX, drawY, drawW, drawH);
          ctx.restore();
        }

        // Draw Image Container Border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        roundRect(ctx, imgX, imgY, imgW, imgH, 24);
        ctx.stroke();

        // 5. Draw Metadata Section
        const metaY = 1000;

        // Artwork Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const title = artwork.title || 'Untitled Artwork';
        const truncatedTitle = title.length > 32 ? title.slice(0, 31) + '…' : title;
        ctx.fillText(truncatedTitle, 76, metaY);

        // Artist Info Row
        const artistName = artwork.user?.display_name || artwork.user?.username || 'Creator';
        ctx.fillStyle = subtitleColor;
        ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`By @${artistName}`, 76, metaY + 48);

        // Tags Pills
        if (artwork.tags && artwork.tags.length > 0) {
          const tags = artwork.tags.slice(0, 3);
          let currentTagX = 76;
          const tagY = metaY + 84;

          ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          tags.forEach((tag) => {
            const tagName = typeof tag === 'string' ? tag : tag.name;
            const tagText = `#${tagName}`;
            const textWidth = ctx.measureText(tagText).width;
            const pillW = textWidth + 28;
            const pillH = 38;

            ctx.fillStyle = isDarkTheme ? '#232d3d' : '#e2e8f0';
            roundRect(ctx, currentTagX, tagY, pillW, pillH, 12);
            ctx.fill();

            ctx.fillStyle = isDarkTheme ? '#93c5fd' : '#0284c7';
            ctx.fillText(tagText, currentTagX + 14, tagY + 26);

            currentTagX += pillW + 12;
          });
        }

        // 6. Draw Lumiina Branding Footer
        const footerY = 1260;
        
        // Brand Symbol & Wordmark
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('✦ LUMIINA.ART', 76, footerY);

        ctx.fillStyle = subtitleColor;
        ctx.font = '400 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Curated Anime Fan Art Community', 76, footerY + 34);

        // Verified Showcase Badge on right
        const badgeText = 'OFFICIAL SHOWCASE';
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const badgeW = ctx.measureText(badgeText).width + 36;
        const badgeX = W - 76 - badgeW;
        const badgeY = footerY - 26;

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        roundRect(ctx, badgeX, badgeY, badgeW, 44, 22);
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.fillText(badgeText, badgeX + 18, badgeY + 29);

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

  // Helper function to draw rounded rectangle in canvas
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

  // Action: Download Image
  const handleDownload = () => {
    if (!previewDataUrl) return;
    setDownloading(true);
    const link = document.createElement('a');
    const safeTitle = (artwork?.title || 'artwork').toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.download = `lumiina-${safeTitle}-${artwork?.id || 'card'}.png`;
    link.href = previewDataUrl;
    link.click();
    setTimeout(() => setDownloading(false), 800);
  };

  // Action: Copy Image to Clipboard
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
      console.warn('Clipboard image write failed, falling back to link', err);
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Action: Copy Direct Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Action: Share to X (Twitter)
  const handleShareTwitter = () => {
    const title = artwork?.title || 'Artwork';
    const artist = artwork?.user?.username ? `@${artwork.user.username}` : 'the artist';
    const url = `https://www.lumiina.art/artworks/${artwork?.id}`;
    const text = encodeURIComponent(`Check out "${title}" by ${artist} on Lumiina! ✦ #Lumiina #AnimeArt`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Export Art Showcase Card
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ready-to-share collector card for Twitter, Discord, and Instagram
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center gap-6">
            {/* Theme Selector */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setCardTheme('dark')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  cardTheme === 'dark'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Studio Dark
              </button>
              <button
                type="button"
                onClick={() => setCardTheme('light')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  cardTheme === 'light'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Gallery Light
              </button>
            </div>

            {/* Card Preview Window */}
            <div className="relative w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-slate-950 flex items-center justify-center">
              {generating ? (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                  <span className="text-xs font-medium">Generating high-res card...</span>
                </div>
              ) : previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Artwork Showcase Card"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-rose-500">Failed to generate preview.</div>
              )}
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
              <button
                type="button"
                onClick={handleDownload}
                disabled={generating || downloading}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {copiedImage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied Image!</span>
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
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Share on X</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
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
