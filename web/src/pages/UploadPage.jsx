import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { UploadCloud, X, ArrowLeft, Tag as TagIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { artworksAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const UploadPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState(['AnimeArt', 'Original']);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  const SUGGESTED_TAGS = [
    'AnimeArt',
    'Original',
    'FanArt',
    'GenshinImpact',
    'Vocaloid',
    'Frieren',
    'Cyberpunk',
    'DigitalPainting'
  ];

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('Image file size must be less than 20MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Only JPEG, PNG, and WebP formats are supported.');
      return;
    }

    setFile(selectedFile);
    setFileInfo({
      name: selectedFile.name,
      size: (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: selectedFile.type.split('/')[1].toUpperCase(),
    });

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleAddTag = (tagToAdd) => {
    const clean = (tagToAdd || tagInput).trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      if (tags.length >= 10) {
        setError('Maximum 10 tags per artwork.');
        return;
      }
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an illustration image to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Artwork title is required.');
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
        }, 800);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload artwork. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121519] flex items-center justify-center p-6 transition-colors">
        <div className="bg-white dark:bg-[#1a1e24] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sign in to Upload Works</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            You must be signed in to your Lumiina creator account before posting illustrations.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full py-2.5 bg-[#0096fa] hover:bg-[#0084e0] text-white font-bold text-sm rounded-full transition-colors"
            >
              Sign In to Account
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-full transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121519] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Helmet>
        <title>Upload Artwork — Lumiina</title>
      </Helmet>

      {/* Breadcrumb Header */}
      <div className="bg-white dark:bg-[#1a1e24] border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30 transition-colors">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Link>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Creator Studio
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Title Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Upload Illustration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Publish your original fan art and digital illustrations to the Lumiina community.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Artwork successfully published! Redirecting to artwork page...</span>
          </div>
        )}

        {/* 2-Column Form (Left: Dropzone, Right: Metadata Form) */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Dropzone & File Preview */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files[0]);
              }}
              className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center min-h-[420px] transition-all cursor-pointer bg-white dark:bg-[#1a1e24] ${
                previewUrl
                  ? 'border-sky-400 bg-sky-50/20 dark:bg-sky-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-sky-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files[0])}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />

              {previewUrl ? (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="relative max-h-[340px] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900/5 dark:bg-black/40">
                    <img
                      src={previewUrl}
                      alt="Upload Preview"
                      className="max-h-[340px] w-auto max-w-full object-contain rounded-2xl shadow-sm"
                    />
                  </div>
                  {fileInfo && (
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{fileInfo.type}</span>
                      <span>•</span>
                      <span>{fileInfo.size}</span>
                      <span>•</span>
                      <span className="text-sky-600 dark:text-sky-400 font-bold hover:underline">Click to change</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-6 gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Drag and drop your illustration here
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                    Supports high-resolution JPEG, PNG, or WebP up to 20MB in file size.
                  </p>
                  <button
                    type="button"
                    className="mt-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-full transition-colors pointer-events-none"
                  >
                    Select File from Device
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Metadata Form Fields */}
          <div className="lg:col-span-6 bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-5 transition-colors">
            
            {/* Title Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Frieren Gilded Sunset"
                maxLength={100}
                required
                className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-[#252a32] hover:bg-slate-100/70 dark:hover:bg-[#2c323c] focus:bg-white dark:focus:bg-[#21262d] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-950/40 rounded-xl font-medium outline-none transition-all"
              />
            </div>

            {/* Description Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Caption & Creator Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your creative process, tools used (Clip Studio Paint, Photoshop, Procreate), or character inspirations..."
                rows={4}
                className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-[#252a32] hover:bg-slate-100/70 dark:hover:bg-[#2c323c] focus:bg-white dark:focus:bg-[#21262d] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-950/40 rounded-xl font-medium outline-none transition-all resize-none"
              />
            </div>

            {/* Tags Input & Suggestions */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Category Tags (Max 10)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <TagIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type tag and press Enter..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-[#252a32] focus:bg-white dark:focus:bg-[#21262d] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-sky-400 rounded-xl outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-3.5 py-2 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-xl transition-colors cursor-pointer border border-sky-200 dark:border-sky-800"
                >
                  Add
                </button>
              </div>

              {/* Active Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 px-2.5 py-1 rounded-lg border border-sky-100 dark:border-sky-800/80"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-sky-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Suggestions */}
              <div className="pt-1.5">
                <span className="text-[11px] font-semibold text-slate-400 mr-2">Suggestions:</span>
                <div className="inline-flex flex-wrap gap-1.5">
                  {SUGGESTED_TAGS.filter((s) => !tags.includes(s)).slice(0, 5).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddTag(s)}
                      className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    >
                      +{s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <Link
                to="/"
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={uploading || !file || !title.trim()}
                className="px-6 py-2.5 bg-[#0096fa] hover:bg-[#0084e0] active:bg-[#0072c4] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-sm rounded-full shadow-sm transition-all cursor-pointer"
              >
                {uploading ? 'Publishing...' : 'Publish Artwork'}
              </button>
            </div>

          </div>

        </form>

      </main>
    </div>
  );
};
