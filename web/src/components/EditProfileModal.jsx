import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Trash2, 
  Plus, 
  Globe, 
  MapPin,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { usersAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ImageCropModal } from './ImageCropModal';

// Scalable brand SVG icons matching Pixiv's exact icon styles
export const SocialBrandIcon = ({ platform, className = "w-4 h-4" }) => {
  const p = platform?.toLowerCase();
  if (p === 'x' || p === 'twitter') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (p === 'instagram') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }
  if (p === 'pawoo' || p === 'mastodon') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.327 8.566c0-4.339-2.843-5.61-2.843-5.61C16.924 2.24 13.9 2 12.012 2h-.024C10.1 2 7.076 2.24 5.516 2.956c0 0-2.843 1.271-2.843 5.61 0 .993-.015 2.186.012 3.341.114 4.916.99 9.764 5.281 10.24 2.324.258 4.363-.077 5.704-.492l-.087-1.748c-1.879.447-3.861.34-4.542-.146-.665-.473-.787-1.15-.812-1.895 1.58.388 3.218.601 4.9.467 2.14-.17 4.184-.814 4.67-1.397.674-.808.835-2.61.835-4.148-.002-1.314-.006-2.584-.006-3.218zm-3.23 6.002h-2.128v-5.26c0-1.123-.472-1.693-1.413-1.693-1.042 0-1.564.674-1.564 2.012v2.909h-1.984v-2.909c0-1.338-.522-2.012-1.564-2.012-.941 0-1.413.57-1.413 1.693v5.26H5.903V9.17c0-1.123.287-2.012.862-2.666.59-.654 1.363-.988 2.322-.988 1.11 0 1.956.425 2.531 1.275l.382.641.382-.641c.575-.85 1.421-1.275 2.531-1.275.959 0 1.732.334 2.322.988.575.654.862 1.543.862 2.666v5.398z"/>
      </svg>
    );
  }
  if (p === 'github') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    );
  }
  if (p === 'youtube') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (p === 'deviantart') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.208 0l-4.73 9.07H9.897L8.293 12.14h4.48L7.42 24h5.347l4.73-9.07h4.581l1.604-3.07h-4.48L24 0z" />
      </svg>
    );
  }
  return <Globe className={className} />;
};

const AVAILABLE_PLATFORMS = [
  { id: 'x', name: 'X (Twitter)' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'pawoo', name: 'Pawoo' },
  { id: 'github', name: 'GitHub' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'deviantart', name: 'DeviantArt' },
  { id: 'website', name: 'Website / Portfolio' },
];

const parseInitialLinks = (raw) => {
  try {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && raw.trim()) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
};

export const EditProfileModal = ({ profile, onClose, onProfileUpdated }) => {
  const { refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [location, setLocation] = useState(profile.location || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [socialLinks, setSocialLinks] = useState(() => parseInitialLinks(profile.social_links));

  // Files and previews
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || '');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(profile.banner_url || '');
  const [cropModalData, setCropModalData] = useState(null); // { file, type: 'avatar' | 'banner' }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar image must not exceed 5MB.');
      return;
    }
    setError('');
    setCropModalData({ file, type: 'avatar' });
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Banner image must not exceed 10MB.');
      return;
    }
    setError('');
    setCropModalData({ file, type: 'banner' });
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleCropComplete = (croppedFile) => {
    if (!cropModalData) return;
    if (cropModalData.type === 'avatar') {
      setAvatarFile(croppedFile);
      setAvatarPreview(URL.createObjectURL(croppedFile));
    } else {
      setBannerFile(croppedFile);
      setBannerPreview(URL.createObjectURL(croppedFile));
    }
    setCropModalData(null);
  };

  const handleAddSocialLink = () => {
    if (socialLinks.length >= 8) return;
    setSocialLinks([...socialLinks, { platform: 'x', handle: '' }]);
  };

  const handleRemoveSocialLink = (index) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSocialLinkChange = (index, field, value) => {
    const updated = [...socialLinks];
    updated[index][field] = value;
    setSocialLinks(updated);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Upload new avatar if a file was selected
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        await usersAPI.uploadAvatar(fd);
      }

      // Step 2: Upload new banner if a file was selected
      if (bannerFile) {
        const fd = new FormData();
        fd.append('banner', bannerFile);
        await usersAPI.uploadBanner(fd);
      }

      // Step 3: Sanitize social links, always include empty-string fields to clear them
      const cleanSocialLinks = socialLinks
        .filter((l) => l.handle && l.handle.trim() !== '')
        .map((l) => ({ platform: l.platform.toLowerCase(), handle: l.handle.trim() }));

      // Step 4: Update all text profile fields
      // Always send even empty strings so backend can clear them
      await usersAPI.updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        social_links: JSON.stringify(cleanSocialLinks),
      });

      setSuccess('Profile saved successfully!');

      // Step 5: Re-fetch fresh profile from server — authoritative source of truth
      // This picks up the actual Cloudinary URLs saved by the backend
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
      if (refreshUser) {
        refreshUser();
      }

      setTimeout(() => onClose(), 700);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to save profile changes. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="bg-white dark:bg-[#1a1e24] w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto transition-colors">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Edit profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(85vh-130px)] flex flex-col gap-6">

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Banner & Avatar Customization Studio */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Profile images & Header banner
            </span>

            {/* Banner Preview Area */}
            <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#1a1f28] group border border-slate-200 dark:border-slate-700 shadow-inner">
              {bannerPreview ? (
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-semibold select-none">
                  No Banner Set
                </div>
              )}

              {/* Banner Upload Button */}
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-xs transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Change Banner</span>
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleBannerChange}
              />
            </div>

            {/* Avatar Preview (Overlapping Banner) */}
            <div className="relative -mt-12 ml-4 flex items-end gap-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white dark:bg-[#1a1e24] border-4 border-white dark:border-[#1a1e24] shadow-md flex items-center justify-center text-slate-700 dark:text-white font-extrabold text-3xl uppercase select-none">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>{profile.username?.[0] || 'U'}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={loading}
                  className="absolute bottom-0 right-0 p-2 bg-[#0096fa] hover:bg-[#0084e0] text-white rounded-full shadow-md transition-colors cursor-pointer border-2 border-white dark:border-[#1a1e24] disabled:opacity-50"
                  title="Change avatar image"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
              </div>

              {/* Pending upload indicator pills */}
              <div className="mb-1 flex flex-col gap-0.5">
                {avatarFile && <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">✓ New avatar ready</span>}
                {bannerFile && <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">✓ New banner ready</span>}
              </div>
            </div>
          </div>

          {/* Nickname / Display Name */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Nickname / Display Name
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                {displayName.length}/50
              </span>
            </div>
            <input
              type="text"
              value={displayName}
              maxLength={50}
              placeholder={profile.username}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#20252d] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0096fa] transition-all"
            />
          </div>

          {/* Self Introduction (Bio) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Self introduction
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                {bio.length}/1000
              </span>
            </div>
            <textarea
              rows={4}
              value={bio}
              maxLength={1000}
              placeholder="Tell other artists and fans about yourself, your art style, and your tools..."
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#20252d] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0096fa] transition-all resize-y"
            />
          </div>

          {/* Location & Website Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location
              </label>
              <input
                type="text"
                value={location}
                maxLength={100}
                placeholder="e.g. Indonesia (Public)"
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#20252d] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0096fa] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> Website / Portfolio
              </label>
              <input
                type="url"
                value={website}
                maxLength={255}
                placeholder="https://..."
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#20252d] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0096fa] transition-all"
              />
            </div>
          </div>

          {/* Social Media Manager */}
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Social media
              </label>
              {socialLinks.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddSocialLink}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0096fa] hover:text-[#0084e0] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add media
                </button>
              )}
            </div>

            {socialLinks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No social media links added yet. Click &quot;Add media&quot; to link your X, Instagram, or Pawoo accounts.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {socialLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {/* Platform Selector */}
                    <div className="w-40 shrink-0">
                      <select
                        value={link.platform}
                        onChange={(e) => handleSocialLinkChange(idx, 'platform', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#20252d] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0096fa]"
                      >
                        {AVAILABLE_PLATFORMS.map((plat) => (
                          <option key={plat.id} value={plat.id}>
                            {plat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Handle or URL Input */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={link.handle}
                        placeholder={
                          link.platform === 'x' || link.platform === 'instagram'
                            ? '@username'
                            : 'Username or URL'
                        }
                        onChange={(e) => handleSocialLinkChange(idx, 'handle', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#20252d] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0096fa]"
                      />
                    </div>

                    {/* Delete Row Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSocialLink(idx)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Remove link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </form>

        {/* Footer Action Bar */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#161a1f] border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0096fa] hover:bg-[#0084e0] disabled:opacity-60 text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></>
            ) : (
              <span>Save changes</span>
            )}
          </button>
        </div>

      </div>

      {/* Interactive Crop & Adjust Studio Modal */}
      {cropModalData && (
        <ImageCropModal
          imageSource={cropModalData.file}
          cropType={cropModalData.type}
          onClose={() => setCropModalData(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
