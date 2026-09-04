import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Upload,
  X,
  Sun,
  Moon,
  Maximize2,
  Copy,
  Check,
  Pipette,
  Layers,
  Sparkles,
} from 'lucide-react';
import { artworksAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const UploadPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Core image state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileSpecs, setFileSpecs] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Advanced artist inspection workbench state
  const [palette, setPalette] = useState([]);
  const [copiedHex, setCopiedHex] = useState('');
  const [copiedAllPalette, setCopiedAllPalette] = useState(false);
  const [canvasBackdrop, setCanvasBackdrop] = useState('neutral'); // 'neutral' | 'dark' | 'light' | 'checker'
  const [viewMode, setViewMode] = useState('fit'); // 'fit' | 'crop'
  const [cropFocal, setCropFocal] = useState('center'); // 'top' | 'center' | 'bottom'
  const [valueCheckMode, setValueCheckMode] = useState(false); // B&W / Grayscale contrast check
  const [watermarkPreview, setWatermarkPreview] = useState(false); // Watermark placement preview
  const [sampledColor, setSampledColor] = useState(null); // Eyedropper sampled color
  const [zoomModalOpen, setZoomModalOpen] = useState(false);

  // Right-side simple metadata form (strictly clean)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState(['Original']);
  const [tagInput, setTagInput] = useState('');

  // Submission state
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);
  const imagePreviewRef = useRef(null);

  const SUGGESTED_TAGS = ['Original', 'FanArt', 'GenshinImpact', 'Frieren', 'DigitalArt', 'ConceptArt', 'Illustration'];

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Client-side dominant color palette extraction
  const extractPalette = (imgElement) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = 64;
      canvas.height = 64;
      ctx.drawImage(imgElement, 0, 0, 64, 64);
      const imgData = ctx.getImageData(0, 0, 64, 64).data;

      const buckets = {};
      for (let i = 0; i < imgData.length; i += 16) {
        const a = imgData[i + 3];
        if (a < 128) continue;
        const r = Math.round(imgData[i] / 32) * 32;
        const g = Math.round(imgData[i + 1] / 32) * 32;
        const b = Math.round(imgData[i + 2] / 32) * 32;
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        buckets[hex] = (buckets[hex] || 0) + 1;
      }

      const topColors = Object.entries(buckets)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([hex]) => hex);

      setPalette(topColors);
    } catch {
      setPalette([]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File size must be under 20MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Only PNG, JPG, and WebP formats are supported.');
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const megapixels = ((width * height) / 1000000).toFixed(1);
      const ratioVal = (width / height).toFixed(2);
      let ratioLabel = `${ratioVal}:1`;
      if (Math.abs(width / height - 1) < 0.05) ratioLabel = '1:1 Square';
      else if (Math.abs(width / height - 16 / 9) < 0.08) ratioLabel = '16:9 Landscape';
      else if (Math.abs(width / height - 4 / 3) < 0.08) ratioLabel = '4:3 Landscape';
      else if (Math.abs(width / height - 3 / 4) < 0.08) ratioLabel = '3:4 Portrait';
      else if (Math.abs(width / height - 9 / 16) < 0.08) ratioLabel = '9:16 Portrait';
      else if (height > width) ratioLabel = `Portrait (${ratioVal})`;
      else ratioLabel = `Landscape (${ratioVal})`;

      // Quality benchmark label
      let qualityClass = 'Standard HD';
      if (width >= 3840 || height >= 3840) qualityClass = '4K Ultra HD';
      else if (width >= 2560 || height >= 2560) qualityClass = '2K QHD Crisp';
      else if (width >= 1920 || height >= 1920) qualityClass = 'Full HD';

      setFileSpecs({
        name: selectedFile.name,
        sizeMB: (selectedFile.size / (1024 * 1024)).toFixed(2),
        width,
        height,
        megapixels,
        ratioLabel,
        qualityClass,
        format: selectedFile.type.split('/')[1].toUpperCase(),
      });

      extractPalette(img);
      setFile(selectedFile);
      setPreviewUrl(objectUrl);
    };

    img.onerror = () => {
      setError('Unable to read image file.');
    };

    img.src = objectUrl;
  };

  const handleRemoveFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl('');
    setFileSpecs(null);
    setPalette([]);
    setSampledColor(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Color Eyedropper
  const handleOpenEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          setSampledColor(hex);
          navigator.clipboard.writeText(hex);
          setCopiedHex(hex);
          setTimeout(() => setCopiedHex(''), 2000);
        }
      } catch {
        // User cancelled or unsupported
      }
    } else {
      // Fallback: pick the first palette color or notify
      if (palette.length > 0) {
        handleCopyHex(palette[0]);
      }
    }
  };

  const handleCopyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(''), 1500);
  };

  const handleCopyAllPalette = () => {
    if (palette.length === 0) return;
    const allHexes = palette.join(', ');
    navigator.clipboard.writeText(allHexes);
    setCopiedAllPalette(true);
    setTimeout(() => setCopiedAllPalette(false), 1500);
  };

  const handleAddTag = (rawTag) => {
    const raw = rawTag || tagInput;
    const clean = raw.trim().replace(/^#/, '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (clean && !tags.includes(clean)) {
      if (tags.length >= 10) {
        setError('Maximum 10 tags allowed.');
        return;
      }
      setTags([...tags, clean]);
      setTagInput('');
      setError('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!file) {
      setError('Please select an illustration to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('image', file);
    tags.forEach((tag) => formData.append('tags', tag));

    try {
      const res = await artworksAPI.create(formData);
      if (res.data?.data) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/artworks/${res.data.data.id}`);
        }, 500);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to publish artwork. Please check inputs and try again.';
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0c0f14] flex items-center justify-center p-6 text-slate-900 dark:text-slate-100 font-sans">
        <Helmet>
          <title>Sign In Required — Lumiina</title>
        </Helmet>
        <div className="bg-white dark:bg-[#161a22] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center max-w-sm w-full shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sign in to Upload</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            You must be signed in to your creator account to publish artworks to the gallery.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full py-2.5 bg-[#0096fa] hover:bg-[#0084e0] text-white font-semibold text-xs rounded-lg transition-colors shadow-xs text-center"
            >
              Sign In
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg transition-colors text-center border border-slate-200 dark:border-slate-700"
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Backdrop styling helper
  const getBackdropClass = () => {
    switch (canvasBackdrop) {
      case 'light':
        return 'bg-white';
      case 'dark':
        return 'bg-[#080a0d]';
      case 'checker':
        return 'bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] dark:bg-[linear-gradient(45deg,#232936_25%,transparent_25%),linear-gradient(-45deg,#232936_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#232936_75%),linear-gradient(-45deg,transparent_75%,#232936_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]';
      default:
        // Studio 18% Neutral Gray for optical color accuracy
        return 'bg-slate-100 dark:bg-[#131720]';
    }
  };

  // Crop focal alignment
  const getFocalClass = () => {
    if (viewMode !== 'crop') return 'object-contain';
    switch (cropFocal) {
      case 'top':
        return 'object-cover object-top';
      case 'bottom':
        return 'object-cover object-bottom';
      default:
        return 'object-cover object-center';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0f14] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Helmet>
        <title>{title.trim() ? `${title.trim()} — Upload` : 'Upload Illustration — Lumiina'}</title>
      </Helmet>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER (Minimalist, Industry-Standard & High Contrast)             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white dark:bg-[#161a22] border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          
          {/* Top-Left: Clean Navigation & Context */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Return to feed"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Feed</span>
            </Link>
            
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">Upload</span>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">New Illustration</span>
            </div>
          </div>

          {/* Top-Right: Tactile Segmented Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-0.5 p-1 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-[#202632] text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label="Toggle color theme"
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full transition-all ${
                !isDark ? 'bg-white text-amber-500 shadow-xs' : 'text-slate-400'
              }`}
            >
              <Sun className="w-3 h-3" />
            </span>
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full transition-all ${
                isDark ? 'bg-[#161a22] text-sky-400 shadow-xs' : 'text-slate-400'
              }`}
            >
              <Moon className="w-3 h-3" />
            </span>
          </button>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKBENCH                                                         */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1360px] mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/80 rounded-xl text-xs font-semibold text-rose-900 dark:text-rose-200 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-900/80 rounded-xl text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            Artwork published successfully. Redirecting to artwork showcase...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ===================================================================== */}
          {/* LEFT: ARTWORK CANVAS & ADVANCED ARTIST WORKBENCH (7 COLS)             */}
          {/* ===================================================================== */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Canvas Stage */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className={`rounded-2xl border-2 transition-all overflow-hidden bg-white dark:bg-[#161a22] shadow-xs ${
                isDragging
                  ? 'border-[#0096fa] bg-sky-50/30 dark:bg-sky-950/30 ring-4 ring-sky-200 dark:ring-sky-950/60'
                  : previewUrl
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />

              {previewUrl ? (
                /* Loaded Artwork Stage */
                <div className="flex flex-col">
                  
                  {/* Advanced Canvas Control Toolbar */}
                  <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#141820] flex items-center justify-between flex-wrap gap-2 text-xs">
                    
                    {/* View mode toggle: Fit original vs Grid Crop + Focal Point */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white dark:bg-[#1c222c] p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setViewMode('fit')}
                          className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                            viewMode === 'fit'
                              ? 'bg-slate-100 dark:bg-[#272f3e] text-[#0096fa] shadow-2xs font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Fit View
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('crop')}
                          className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                            viewMode === 'crop'
                              ? 'bg-slate-100 dark:bg-[#272f3e] text-[#0096fa] shadow-2xs font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title="Simulate 1:1 feed square thumbnail crop"
                        >
                          Feed Crop
                        </button>
                      </div>

                      {/* Focal Alignment Selector when in Crop mode */}
                      {viewMode === 'crop' && (
                        <div className="flex items-center gap-1 bg-white dark:bg-[#1c222c] p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]">
                          <span className="px-1.5 text-slate-400 font-medium">Focus:</span>
                          <button
                            type="button"
                            onClick={() => setCropFocal('top')}
                            className={`px-1.5 py-0.5 rounded cursor-pointer ${
                              cropFocal === 'top'
                                ? 'bg-[#0096fa] text-white font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title="Focus on top (e.g. character head/eyes)"
                          >
                            Top
                          </button>
                          <button
                            type="button"
                            onClick={() => setCropFocal('center')}
                            className={`px-1.5 py-0.5 rounded cursor-pointer ${
                              cropFocal === 'center'
                                ? 'bg-[#0096fa] text-white font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title="Focus center"
                          >
                            Center
                          </button>
                          <button
                            type="button"
                            onClick={() => setCropFocal('bottom')}
                            className={`px-1.5 py-0.5 rounded cursor-pointer ${
                              cropFocal === 'bottom'
                                ? 'bg-[#0096fa] text-white font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title="Focus bottom"
                          >
                            Bottom
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Advanced Artist Inspection Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      
                      {/* Value Check (B&W filter) */}
                      <button
                        type="button"
                        onClick={() => setValueCheckMode(!valueCheckMode)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                          valueCheckMode
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                            : 'bg-white dark:bg-[#1c222c] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                        title="Value Check: Toggle Black & White to inspect tonal contrast and light balance"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Value Check</span>
                      </button>

                      {/* Watermark placement preview */}
                      <button
                        type="button"
                        onClick={() => setWatermarkPreview(!watermarkPreview)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                          watermarkPreview
                            ? 'bg-[#0096fa] text-white border-[#0096fa]'
                            : 'bg-white dark:bg-[#1c222c] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                        title="Preview signature/watermark placement safety"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Watermark</span>
                      </button>

                      {/* Eyedropper Color Picker */}
                      {'EyeDropper' in window && (
                        <button
                          type="button"
                          onClick={handleOpenEyedropper}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-[#1c222c] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
                          title="Pick color from canvas"
                        >
                          <Pipette className="w-3 h-3 text-[#0096fa]" />
                          <span>Eyedropper</span>
                        </button>
                      )}

                      {/* Canvas backdrop selector */}
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 pl-1">
                        <button
                          type="button"
                          onClick={() => setCanvasBackdrop('neutral')}
                          className={`w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 bg-slate-300 dark:bg-[#20252e] cursor-pointer ${
                            canvasBackdrop === 'neutral' ? 'ring-2 ring-[#0096fa]' : ''
                          }`}
                          title="18% Neutral Gray (Studio Standard)"
                        />
                        <button
                          type="button"
                          onClick={() => setCanvasBackdrop('dark')}
                          className={`w-4 h-4 rounded-full border border-slate-600 bg-[#080a0d] cursor-pointer ${
                            canvasBackdrop === 'dark' ? 'ring-2 ring-[#0096fa]' : ''
                          }`}
                          title="Dark backdrop (test lineart contrast)"
                        />
                        <button
                          type="button"
                          onClick={() => setCanvasBackdrop('light')}
                          className={`w-4 h-4 rounded-full border border-slate-300 bg-white cursor-pointer ${
                            canvasBackdrop === 'light' ? 'ring-2 ring-[#0096fa]' : ''
                          }`}
                          title="Light backdrop"
                        />
                        <button
                          type="button"
                          onClick={() => setCanvasBackdrop('checker')}
                          className={`w-4 h-4 rounded-full border border-slate-400 bg-slate-300 cursor-pointer ${
                            canvasBackdrop === 'checker' ? 'ring-2 ring-[#0096fa]' : ''
                          }`}
                          title="Alpha transparency checkerboard"
                        />
                      </div>

                      <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

                      {/* Full res zoom inspect */}
                      <button
                        type="button"
                        onClick={() => setZoomModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-[#0096fa] dark:hover:text-[#0096fa] cursor-pointer"
                        title="Open full resolution inspection"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                    </div>

                  </div>

                  {/* Canvas Viewport */}
                  <div className={`relative min-h-[440px] max-h-[600px] w-full flex items-center justify-center p-4 overflow-hidden select-none transition-colors ${getBackdropClass()}`}>
                    <img
                      ref={imagePreviewRef}
                      src={previewUrl}
                      alt="Artwork Canvas"
                      style={{
                        filter: valueCheckMode ? 'grayscale(100%) contrast(1.08)' : 'none',
                      }}
                      className={`transition-all duration-150 ${
                        viewMode === 'fit'
                          ? 'max-h-[540px] w-auto max-w-full object-contain rounded-lg shadow-sm'
                          : `w-full aspect-square max-h-[540px] rounded-lg shadow-sm ${getFocalClass()}`
                      }`}
                    />

                    {/* Mode Overlay Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {viewMode === 'crop' && (
                        <div className="px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-semibold tracking-wide backdrop-blur-xs">
                          Feed 1:1 Thumbnail Preview ({cropFocal})
                        </div>
                      )}
                      {valueCheckMode && (
                        <div className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-bold tracking-wide shadow-xs">
                          Value Check: Grayscale
                        </div>
                      )}
                    </div>

                    {/* Watermark Placement Preview */}
                    {watermarkPreview && (
                      <div className="absolute bottom-6 right-6 px-3 py-1 rounded bg-black/60 text-white/90 text-xs font-mono font-medium tracking-wider select-none border border-white/20 backdrop-blur-xs shadow-lg pointer-events-none">
                        © {user?.username || 'artist'} • Lumiina
                      </div>
                    )}
                  </div>

                  {/* Spec Sheet & File Actions */}
                  {fileSpecs && (
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161a22] flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {fileSpecs.width} × {fileSpecs.height} px
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="font-semibold text-sky-600 dark:text-sky-400">
                          {fileSpecs.qualityClass}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span>{fileSpecs.ratioLabel}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span>{fileSpecs.megapixels} MP</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span>{fileSpecs.format} ({fileSpecs.sizeMB} MB)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="font-bold text-[#0096fa] hover:underline cursor-pointer"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dominant Color Palette Extractor & Tooling */}
                  {palette.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50 dark:bg-[#131720] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Harmonic Palette:
                        </span>
                        <div className="flex items-center gap-2">
                          {palette.map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => handleCopyHex(hex)}
                              className="group relative w-7 h-7 rounded-lg border border-black/15 dark:border-white/20 shadow-xs hover:scale-110 transition-transform cursor-pointer"
                              style={{ backgroundColor: hex }}
                              title={`Click to copy ${hex}`}
                            >
                              {copiedHex === hex && (
                                <span className="absolute inset-0 flex items-center justify-center text-white bg-black/50 rounded-lg">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Eyedropper Sampled Color Badge if active */}
                        {sampledColor && (
                          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Sampled:</span>
                            <span
                              className="w-4 h-4 rounded border border-black/10 shadow-2xs"
                              style={{ backgroundColor: sampledColor }}
                            />
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                              {sampledColor}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleCopyAllPalette}
                          className="inline-flex items-center gap-1 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedAllPalette ? 'Copied All' : 'Copy Palette'}</span>
                        </button>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {copiedHex ? `Copied ${copiedHex}` : 'Click swatch to copy hex'}
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                /* Clean Empty Dropzone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center text-center p-12 sm:p-16 min-h-[460px] cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#202632] text-slate-700 dark:text-slate-200 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                    Select an illustration or drag and drop
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 font-medium">
                    PNG, JPG, or WebP up to 20MB
                  </p>
                  <button
                    type="button"
                    className="px-5 py-2.5 bg-white dark:bg-[#222834] hover:bg-slate-100 dark:hover:bg-[#2a3140] text-slate-900 dark:text-slate-100 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-300 dark:border-slate-600 shadow-xs"
                  >
                    Browse File
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ===================================================================== */}
          {/* RIGHT: SIMPLE & STREAMLINED METADATA FORM (Clean & High Contrast)    */}
          {/* ===================================================================== */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-5 bg-white dark:bg-[#161a22] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col gap-5 transition-colors"
          >
            
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your artwork a title"
                maxLength={100}
                required
                className="px-3.5 py-2.5 text-sm bg-white dark:bg-[#12151c] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 focus:border-[#0096fa] dark:focus:border-[#0096fa] focus:ring-2 focus:ring-[#0096fa]/15 dark:focus:ring-[#0096fa]/25 rounded-lg outline-none transition-all font-medium shadow-2xs"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details, tools used, or inspiration (optional)"
                maxLength={1000}
                rows={4}
                className="px-3.5 py-2.5 text-sm bg-white dark:bg-[#12151c] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 focus:border-[#0096fa] dark:focus:border-[#0096fa] focus:ring-2 focus:ring-[#0096fa]/15 dark:focus:ring-[#0096fa]/25 rounded-lg outline-none transition-all resize-none font-medium shadow-2xs"
              />
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Tags ({tags.length}/10)
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Press Enter or Comma to add
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g. GenshinImpact, Frieren"
                  className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-[#12151c] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 focus:border-[#0096fa] dark:focus:border-[#0096fa] focus:ring-2 focus:ring-[#0096fa]/15 dark:focus:ring-[#0096fa]/25 rounded-lg outline-none transition-all font-medium shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-4 py-2 text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-[#222834] hover:bg-slate-200 dark:hover:bg-[#2a3140] border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Tag Chips */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-slate-100 dark:bg-[#202632] text-slate-900 dark:text-slate-100 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 shadow-2xs"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer ml-1"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Popular Suggestions (High Contrast) */}
              <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Popular:</span>
                {SUGGESTED_TAGS.filter((s) => !tags.includes(s)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddTag(s)}
                    className="text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#202632] hover:bg-slate-200 dark:hover:bg-[#2a3140] hover:text-slate-900 dark:hover:text-white px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer font-medium transition-colors"
                  >
                    #{s}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions (High Contrast Disabled & Active States) */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <Link
                to="/"
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={uploading || !file || !title.trim()}
                className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm ${
                  !file || !title.trim()
                    ? 'bg-slate-200 text-slate-600 dark:bg-[#202632] dark:text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-[#0096fa] hover:bg-[#0084e0] active:bg-[#0072c4] text-white shadow-md'
                }`}
              >
                {uploading ? 'Publishing...' : 'Publish Artwork'}
              </button>
            </div>

          </form>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* 3. FULL RESOLUTION INSPECTOR MODAL                                        */}
      {/* ========================================================================= */}
      {zoomModalOpen && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 text-white border-b border-white/20">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold">1:1 Native Resolution Inspector</span>
              {fileSpecs && (
                <span className="text-xs text-slate-300 font-mono">
                  {fileSpecs.width} × {fileSpecs.height} px • {fileSpecs.qualityClass} • {fileSpecs.sizeMB} MB
                </span>
              )}
            </div>
            <button
              onClick={() => setZoomModalOpen(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <img
              src={previewUrl}
              alt="Inspect Artwork"
              className="max-h-[85vh] max-w-[90vw] object-contain rounded shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};
