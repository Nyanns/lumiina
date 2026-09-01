import React, { useState, useRef } from 'react';
import { X, UploadCloud, Image as ImageIcon, Plus, Tag as TagIcon, AlertCircle } from 'lucide-react';
import { artworksAPI } from '../api/client';

export const UploadModal = ({ onClose, onArtworkCreated }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState(['AnimeArt', 'Original']);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    // Validate size (max 20MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('Ukuran file melebihi batas maksimal 20MB');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Format file tidak didukung. Harap pilih gambar JPEG, PNG, atau WebP.');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleAddTag = (e) => {
    e?.preventDefault();
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      if (tags.length >= 10) {
        setError('Maksimal 10 tag per karya');
        return;
      }
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Silakan pilih file gambar untuk diunggah');
      return;
    }
    if (!title.trim()) {
      setError('Judul karya wajib diisi');
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
        onArtworkCreated(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengunggah karya. Pastikan format valid.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Unggah Karya Ilustrasi</h2>
            <p className="text-xs text-slate-500">Bagikan kreasi fan art terbarumu kepada komunitas Lumiina</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileSelect(e.dataTransfer.files[0]);
            }}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
              previewUrl
                ? 'border-sky-300 bg-sky-50/20'
                : 'border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-slate-50'
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
              <div className="relative flex flex-col items-center gap-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-56 rounded-lg object-contain shadow-xs"
                />
                <span className="text-xs font-semibold text-sky-600 hover:text-sky-700">
                  Ganti Gambar
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Klik untuk memilih file atau seret gambar ke sini
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mendukung JPEG, PNG, atau WebP (Maks. 20MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">Judul Karya *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Hatsune Miku — Moonlight Serenade"
              maxLength={150}
              required
              className="px-3.5 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
            />
          </div>

          {/* Description Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">Deskripsi / Cerita Karya</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan proses pembuatan, tools yang dipakai, atau detail ilustrasi ini..."
              rows={3}
              maxLength={1000}
              className="px-3.5 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all"
            />
          </div>

          {/* Tag Chips */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Tags (Maks. 10)</span>
              <span className="text-[11px] text-slate-400 font-normal">Tekan Enter untuk menambah</span>
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <TagIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                  placeholder="Ketik tag (misal: Vocaloid, Miku) lalu Enter"
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
              >
                + Tambah
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !title.trim()}
              className="px-6 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:bg-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mengunggah ke CDN...</span>
                </>
              ) : (
                <span>Publikasikan Karya</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
