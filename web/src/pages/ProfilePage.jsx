import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Calendar, 
  BadgeCheck, 
  Image as ImageIcon, 
  ArrowLeft, 
  Sparkles,
  Upload,
  Share2,
  Check
} from 'lucide-react';
import { usersAPI } from '../api/client';
import { ArtworkCard } from '../components/ArtworkCard';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShareProfile = () => {
    if (!profile?.username) return;
    const url = `${window.location.origin}/profile/${profile.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await usersAPI.getProfile(id);
        if (res.data?.data) {
          const prof = res.data.data;
          setProfile(prof);
          // Canonical URL canonicalization: if visited with numeric or legacy id (e.g. /profile/1), replace URL to vanity handle (/profile/Nyanns)
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

    if (id) {
      fetchProfile();
      window.scrollTo(0, 0);
    }
  }, [id, navigate]);

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
  const artworksList = profile.artworks || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121519] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Helmet>
        <title>{profile.username} (@{profile.username}) — Lumiina Gallery</title>
      </Helmet>

      {/* Profile Header Banner (X / Pixiv inspired) */}
      <div className="w-full bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 h-44 sm:h-56 relative">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-start pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>
      </div>

      {/* Main Profile Info Card (Overlapping Banner) */}
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
        <div className="relative -mt-16 sm:-mt-20 mb-8 flex flex-col gap-6">
          
          {/* Avatar & Action Button Row */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            {/* Circular Overlapping Avatar */}
            <div className="relative">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white dark:bg-[#1a1e24] border-4 border-white dark:border-[#1a1e24] shadow-md flex items-center justify-center text-slate-800 dark:text-white font-extrabold text-3xl sm:text-4xl uppercase select-none">
                {profile.username?.[0] || 'A'}
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleShareProfile}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full font-bold text-xs transition-colors cursor-pointer"
                title="Share artist profile"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Link Copied!' : 'Share'}</span>
              </button>

              {isOwnProfile ? (
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0096fa] hover:bg-[#0084e0] text-white rounded-full font-bold text-xs shadow-sm transition-all"
                >
                  <Upload className="w-4 h-4" /> Post New Artwork
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setFollowing(!following)}
                  className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-sm transition-all cursor-pointer ${
                    following
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600'
                      : 'bg-[#0096fa] hover:bg-[#0084e0] text-white'
                  }`}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          {/* User Bio & Meta Details */}
          <div className="bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-4 transition-colors">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {profile.username}
                </h1>
                {profile.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Verified
                  </span>
                )}
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {profile.role || 'regular'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">@{profile.username?.toLowerCase()}</p>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl">
              Digital illustrator and fan artist on Lumiina. Passionate about sharing visual stories and character designs.
            </p>

            {/* Metadata Badges */}
            <div className="flex items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
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

              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-800 dark:text-slate-200">{artworksList.length}</strong> Works Uploaded
              </span>
            </div>
          </div>

        </div>

        {/* Gallery Section */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" /> Artworks ({artworksList.length})
            </h2>
          </div>

          {artworksList.length === 0 ? (
            <div className="py-16 bg-white dark:bg-[#1a1e24] rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-8 flex flex-col items-center justify-center shadow-sm">
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
    </div>
  );
};
