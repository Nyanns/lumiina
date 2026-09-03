import React, { useState, useEffect } from 'react';
import { X, Calendar, Image as ImageIcon, BadgeCheck } from 'lucide-react';
import { usersAPI } from '../api/client';
import { ArtworkCard } from './ArtworkCard';

export const UserProfileModal = ({ userId, onClose, onArtworkClick, onTagClick }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        const res = await usersAPI.getProfile(userId);
        if (res.data?.data) {
          setProfile(res.data.data);
        }
      } catch (err) {
        setError('Gagal memuat profil artist');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Profil Artist Komunitas
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Memuat profil artist...
            </div>
          ) : error || !profile ? (
            <div className="py-16 text-center text-rose-600 text-sm">
              {error || 'Profil tidak ditemukan'}
            </div>
          ) : (
            <>
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 text-white font-black text-2xl flex items-center justify-center uppercase shadow-sm border-2 border-white">
                  {profile.username?.[0] || 'A'}
                </div>

                <div className="flex-1 flex flex-col items-center sm:items-start gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900">{profile.username}</h2>
                    {profile.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                        <BadgeCheck className="w-3.5 h-3.5 text-sky-600" /> Terverifikasi
                      </span>
                    )}
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                      {profile.role || 'regular'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Bergabung sejak {profile.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }) : '-'}
                  </p>

                  <p className="text-xs text-slate-600 mt-1">
                    Koleksi karya ilustrasi fan art dari <span className="font-semibold text-slate-800">{profile.username}</span> di platform Lumiina.
                  </p>
                </div>
              </div>

              {/* Uploaded Artworks Gallery */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  Karya yang Telah Diunggah ({profile.artworks?.length || 0})
                </h3>

                {!profile.artworks || profile.artworks.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-slate-100 text-xs text-slate-400">
                    Artist ini belum mengunggah karya publik.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {profile.artworks.map((art) => (
                      <ArtworkCard
                        key={art.id}
                        artwork={{ ...art, user: profile }}
                        onClick={() => { onArtworkClick(art); onClose(); }}
                        onTagClick={(t) => { onTagClick(t); onClose(); }}
                        onArtistClick={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
