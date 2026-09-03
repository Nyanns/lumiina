import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, UploadCloud, Tag as TagIcon, AlertCircle } from 'lucide-react';
import { artworksAPI } from '../api/client';

export const UploadModal = ({ onClose, onArtworkCreated }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState(['AnimeArt']);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  // Animation state for error shake
  const [shake, setShake] = useState(false);

  const fileInputRef = useRef(null);

  // Clean up object URL when component unmounts or preview changes to prevent memory leak
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleFileSelect = (selectedFile) => {
    setError('');
    if (!selectedFile) return;
    if (selectedFile.size > 20 * 1024 * 1024) {
      triggerError('Maksimal ukuran file 20MB');
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      triggerError('Hanya mendukung format JPEG, PNG, atau WebP');
      return;
    }
    setFile(selectedFile);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  // Enforce blob URL protocol check to mitigate DOM-based text reinterpretation as HTML (CWE-079)
  const safePreviewUrl = previewUrl && previewUrl.startsWith('blob:') ? previewUrl : null;

  const handleAddTag = (e) => {
    e?.preventDefault();
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      if (tags.length >= 10) {
        triggerError('Maksimal 10 tag per karya');
        return;
      }
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return triggerError('Silakan pilih gambar terlebih dahulu');
    if (!title.trim()) return triggerError('Judul wajib diisi');

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
      triggerError(err.response?.data?.error || 'Gagal mengunggah. Coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Unggah Karya</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Bagikan keajaiban ilustrasimu ke komunitas Lumiina</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-6">
          <motion.form 
            onSubmit={handleSubmit} 
            className="flex flex-col gap-6"
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-5 h-5" /> {error}
              </div>
            )}

            {/* Drag & Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); }}
              className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
                safePreviewUrl ? 'border-sky-300 bg-sky-50' : 'border-slate-300 hover:border-sky-400 bg-slate-50 hover:bg-white'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files[0])} accept="image/jpeg,image/png,image/webp" className="hidden" />
              
              {safePreviewUrl ? (
                <div className="relative group flex flex-col items-center">
                  <img src={safePreviewUrl} alt="Preview" className="max-h-[300px] rounded-xl shadow-md object-contain group-hover:opacity-50 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-slate-900 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">Ganti Gambar</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Tarik & Lepas Gambar di Sini</h3>
                  <p className="text-sm font-medium text-slate-400 mt-1">Mendukung JPEG, PNG, WebP (Maks. 20MB)</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Judul Ilustrasi <span className="text-rose-500">*</span></label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Berikan judul yang menarik" className="px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 rounded-xl font-medium outline-none transition-all" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Cerita / Deskripsi</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ceritakan tool yang dipakai atau inspirasi di balik karya ini..." rows={3} className="px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 rounded-xl font-medium outline-none transition-all" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Tags Kategori</label>
              <div className="relative flex items-center gap-2">
                <TagIcon className="absolute left-4 text-slate-400 w-4 h-4" />
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)} placeholder="Ketik tag lalu tekan Enter..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 rounded-xl font-medium outline-none transition-all" />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                    #{tag}
                    <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-rose-600 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors">Batal</button>
              <button type="submit" disabled={uploading || !file || !title} className="px-8 py-3 font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 rounded-full shadow-md transition-colors flex items-center gap-2">
                {uploading ? 'Mengunggah...' : 'Publikasikan'}
              </button>
            </div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
};
