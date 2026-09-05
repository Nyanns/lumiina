import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Calendar, 
  BadgeCheck, 
  Image as ImageIcon, 
  ArrowLeft, 
  Share2,
  Check,
  Edit3,
  MapPin,
  Globe,
  Camera,
  Loader2,
  Users,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { usersAPI } from '../api/client';
import { ArtworkCard } from '../components/ArtworkCard';
import { useAuth } from '../context/AuthContext';
import { useFollow } from '../context/FollowContext';
import { EditProfileModal, SocialBrandIcon } from '../components/EditProfileModal';
import { ImageCropModal } from '../components/ImageCropModal';
import { FollowListModal } from '../components/FollowListModal';

// Helper to format social platform destination URLs
const formatSocialUrl = (platform, handle) => {
  if (!handle) return '#';
  if (handle.startsWith('http://') || handle.startsWith('https://')) {
    return handle;
  }
  const clean = handle.replace(/^@/, '').trim();
  const p = platform?.toLowerCase();
  switch (p) {
    case 'x':
    case 'twitter':
      return `https://x.com/${clean}`;
    case 'instagram':
      return `https://instagram.com/${clean}`;
    case 'pawoo':
      return `https://pawoo.net/@${clean}`;
    case 'github':
      return `https://github.com/${clean}`;
    case 'youtube':
      return `https://youtube.com/@${clean}`;
    case 'deviantart':
      return `https://deviantart.com/${clean}`;
    default:
      return `https://${clean}`;
  }
};

export const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser, refreshUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [followModal, setFollowModal] = useState({ isOpen: false, tab: 'followers' });

  const { isFollowed, getFollowerCount, toggleFollow, setInitialFollowState, loadingMap } = useFollow();

  // Direct banner & avatar upload states
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropModalData, setCropModalData] = useState(null); // { file, type: 'avatar' | 'banner' }

  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const handleDirectBannerSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Banner image must not exceed 10MB.');
      return;
    }
    setCropModalData({ file, type: 'banner' });
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleDirectAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Avatar image must not exceed 5MB.');
      return;
    }
    setCropModalData({ file, type: 'avatar' });
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedFile) => {
    if (!cropModalData) return;
    const { type } = cropModalData;
    const fd = new FormData();

    if (type === 'banner') {
      setUploadingBanner(true);
      try {
        fd.append('banner', croppedFile);
        const res = await usersAPI.uploadBanner(fd);
        const newUrl = res.data?.banner_url;
        if (newUrl) {
          setProfile((prev) => ({ ...prev, banner_url: newUrl }));
          if (updateUser) updateUser({ banner_url: newUrl });
          if (refreshUser) refreshUser();
        }
      } catch (err) {
        const msg = err.response?.data?.error?.message || err.response?.data?.error || 'Failed to upload banner.';
        alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } finally {
        setUploadingBanner(false);
      }
    } else if (type === 'avatar') {
      setUploadingAvatar(true);
      try {
        fd.append('avatar', croppedFile);
        const res = await usersAPI.uploadAvatar(fd);
        const newUrl = res.data?.avatar_url;
        if (newUrl) {
          setProfile((prev) => ({ ...prev, avatar_url: newUrl }));
          if (updateUser) updateUser({ avatar_url: newUrl });
          if (refreshUser) refreshUser();
        }
      } catch (err) {
        const msg = err.response?.data?.error?.message || err.response?.data?.error || 'Failed to upload avatar.';
        alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await usersAPI.getProfile(id);
      if (res.data?.data) {
        const prof = res.data.data;
        setProfile(prof);
        if (prof.id) {
          setInitialFollowState(prof.id, prof.is_following, prof.followers_count);
          setInitialFollowState(prof.username, prof.is_following, prof.followers_count);
        }
        if (prof.username && id.toLowerCase() !== prof.username.toLowerCase()) {
          navigate(`/profile/${prof.username}`, { replace: true });
        }
      }
    } catch {
      setError('Artist profile not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchProfile();
      window.scrollTo(0, 0);
    }
  }, [id]);

  const handleShareProfile = () => {
    if (!profile?.username) return;
    const url = `${window.location.origin}/profile/${profile.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121519] flex items-center justify-center p-8 transition-colors">
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading artist profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121519] flex items-center justify-center p-6 transition-colors">
        <div className="bg-white dark:bg-[#1a1e24] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{error || 'Profile Not Found'}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This artist account does not exist or has been disabled.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0096fa] text-white rounded-full font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile =
    currentUser &&
    (String(currentUser.id) === String(profile.id) ||
      currentUser.username?.toLowerCase() === profile.username?.toLowerCase());

  const targetKey = profile?.username || (profile?.id ? String(profile.id) : null);
  const following = isFollowed(targetKey, profile?.is_following || false);
  const followersCount = getFollowerCount(targetKey, profile?.followers_count || 0);
  const followingCount = isOwnProfile
    ? (typeof currentUser?.following_count === 'number' ? currentUser.following_count : (profile?.following_count || 0))
    : (profile?.following_count || 0);
  const isFollowLoading = targetKey ? loadingMap[targetKey.toLowerCase()] : false;

  const handleFollowToggle = async () => {
    if (!profile) return;
    await toggleFollow(profile);
  };

  const artworksList = profile.artworks || [];

  // Parse social links safely
  let socialLinks = [];
  try {
    if (Array.isArray(profile.social_links)) {
      socialLinks = profile.social_links;
    } else if (typeof profile.social_links === 'string' && profile.social_links.trim()) {
      socialLinks = JSON.parse(profile.social_links);
    }
  } catch {
    socialLinks = [];
  }

  const bioText = profile.bio || '';
  const isBioLong = bioText.length > 280;
  const displayedBio = isBioLong && !isBioExpanded ? `${bioText.slice(0, 280)}...` : bioText;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121519] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Helmet>
        <title>
          {profile.display_name ? `${profile.display_name} (@${profile.username})` : profile.username} — Lumiina
        </title>
      </Helmet>

      {/* Pixiv-Inspired Full-Width Header Banner */}
      <div className="w-full relative h-48 sm:h-64 md:h-80 overflow-hidden bg-slate-100 dark:bg-[#181c24] border-b border-slate-200 dark:border-slate-800">
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt={`${profile.username}'s banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-200/70 dark:bg-[#1c212b] flex items-center justify-center text-slate-400 dark:text-slate-600 font-bold text-xs uppercase tracking-wider select-none">
            <span>No Header Banner Set</span>
          </div>
        )}

        {/* Top Floating Navigation */}
        <div className="absolute top-4 left-0 right-0 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full text-xs font-bold backdrop-blur-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
          </Link>

          {isOwnProfile && (
            <div>
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full text-xs font-bold backdrop-blur-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploadingBanner ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading Banner...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change Banner</span>
                  </>
                )}
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleDirectBannerSelect}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Container */}
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative -mt-16 sm:-mt-20 mb-8 flex flex-col gap-5">
          
          {/* Top Bar: Avatar & Action Buttons */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            {/* Overlapping Pixiv Circular Avatar */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-white dark:bg-[#1a1e24] border-4 border-white dark:border-[#1a1e24] shadow-lg flex items-center justify-center text-slate-800 dark:text-white font-black text-3xl sm:text-4xl uppercase select-none">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{profile.username?.[0] || 'A'}</span>
                )}
              </div>

              {isOwnProfile && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-1 right-1 p-2 bg-[#0096fa] hover:bg-[#0084e0] text-white rounded-full shadow-md transition-colors cursor-pointer border-2 border-white dark:border-[#1a1e24] disabled:opacity-50"
                    title="Change avatar"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleDirectAvatarSelect}
                  />
                </>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2.5">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-full font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit profile
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isFollowLoading}
                  onClick={handleFollowToggle}
                  className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    following
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 group'
                      : 'bg-[#0096fa] hover:bg-[#0084e0] text-white'
                  }`}
                >
                  {isFollowLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : following ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 group-hover:hidden" />
                      <span className="group-hover:hidden">Following</span>
                      <span className="hidden group-hover:inline">Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleShareProfile}
                className="inline-flex items-center gap-1.5 p-2.5 sm:px-4 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full font-bold text-xs transition-colors cursor-pointer"
                title="Share profile link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* User Details & Identity Section */}
          <div className="bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4 transition-colors">
            
            {/* Name, Handle & Verified Status */}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {profile.display_name || profile.username}
                </h1>
                {profile.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 px-2.5 py-0.5 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Verified
                  </span>
                )}
                {/* Note: REGULAR badge removed per user specification */}
                {profile.role && profile.role !== 'regular' && (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                    {profile.role}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                @{profile.username?.toLowerCase()}
              </p>
            </div>

            {/* Location & Social Media Row (Pixiv-Style) */}
            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600 dark:text-slate-300">
              {profile.location && (
                <div className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}

              {/* Social Media Link Icons */}
              <div className="flex items-center gap-2 flex-wrap">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title={`Website: ${profile.website}`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </a>
                )}

                {socialLinks.map((item, idx) => (
                  <a
                    key={idx}
                    href={formatSocialUrl(item.platform, item.handle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-sky-950/50 text-slate-700 hover:text-[#0096fa] dark:text-slate-200 dark:hover:text-[#0096fa] transition-colors"
                    title={`${item.platform.toUpperCase()}: ${item.handle}`}
                  >
                    <SocialBrandIcon platform={item.platform} className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Self Introduction / Bio */}
            {bioText ? (
              <div className="text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-3xl whitespace-pre-line">
                {displayedBio}
                {isBioLong && (
                  <button
                    type="button"
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="ml-2 text-xs font-bold text-[#0096fa] hover:underline cursor-pointer"
                  >
                    {isBioExpanded ? 'Show less' : 'View profile'}
                  </button>
                )}
              </div>
            ) : isOwnProfile ? (
              <p className="text-xs text-slate-400 italic">
                You haven&apos;t added a bio yet. Click &quot;Edit profile&quot; to introduce yourself to your fans!
              </p>
            ) : null}

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setFollowModal({ isOpen: true, tab: 'followers' })}
                className="flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer group"
                title="View followers"
              >
                <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400" />
                <strong className="text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">{followersCount}</strong> Followers
              </button>

              <button
                type="button"
                onClick={() => setFollowModal({ isOpen: true, tab: 'following' })}
                className="flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer group"
                title="View following"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400" />
                <strong className="text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">{followingCount}</strong> Following
              </button>

              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-800 dark:text-slate-200">{artworksList.length}</strong> Works
              </span>

              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Joined{' '}
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Recently'}
              </span>
            </div>
          </div>

        </div>

        {/* Gallery Sub-Navigation Tabs (Pixiv Standard) */}
        <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800 mb-6">
          <button
            type="button"
            className="pb-3 text-sm font-extrabold text-[#0096fa] border-b-2 border-[#0096fa] flex items-center gap-2 cursor-pointer"
          >
            <span>Illustrations</span>
            <span className="text-xs px-2 py-0.5 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-full font-bold">
              {artworksList.length}
            </span>
          </button>
        </div>

        {/* Artworks Grid */}
        <section>
          {artworksList.length === 0 ? (
            <div className="py-16 bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-8 flex flex-col items-center justify-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Artworks Published Yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
                {isOwnProfile
                  ? "You haven't posted any illustrations yet. Share your artwork with the world!"
                  : 'This artist has not posted any public illustrations yet.'}
              </p>
              {isOwnProfile && (
                <Link
                  to="/upload"
                  className="px-5 py-2 bg-[#0096fa] hover:bg-[#0084e0] text-white text-xs font-bold rounded-full transition-colors"
                >
                  Upload Your First Artwork
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {artworksList.map((artwork, idx) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={{ ...artwork, user: profile }}
                  index={idx}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdated={fetchProfile}
        />
      )}

      {/* Interactive Crop & Adjust Studio Modal */}
      {cropModalData && (
        <ImageCropModal
          imageSource={cropModalData.file}
          cropType={cropModalData.type}
          onClose={() => setCropModalData(null)}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Followers & Following List Modal */}
      <FollowListModal
        isOpen={followModal.isOpen}
        initialTab={followModal.tab}
        username={profile?.username}
        onClose={() => setFollowModal({ isOpen: false, tab: 'followers' })}
      />
    </div>
  );
};
