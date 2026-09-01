import React, { useState } from 'react';
import { MessageSquare, Heart, Eye } from 'lucide-react';

export const ArtworkCard = ({ artwork, onClick, onTagClick, onArtistClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <article
      onClick={() => onClick(artwork)}
      className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer"
    >
      {/* Image Container with organic aspect ratio */}
      <div className="relative w-full bg-slate-100 overflow-hidden aspect-4/3 sm:aspect-auto">
        {!isLoaded && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse" />
        )}
        <img
          src={artwork.image_url}
          alt={artwork.title}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-auto object-cover group-hover:scale-103 transition-transform duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
          <span className="text-white text-xs font-semibold flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> Lihat Detail
          </span>
        </div>
      </div>

      {/* Details Box */}
      <div className="p-3.5 flex flex-col gap-2">
        <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-sky-600 transition-colors">
          {artwork.title}
        </h3>

        {/* Tags */}
        {artwork.tags && artwork.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {artwork.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id || tag.name}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag.name);
                }}
                className="text-[11px] font-medium text-slate-500 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 px-2 py-0.5 rounded-md transition-colors"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Author Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-0.5 text-xs text-slate-500">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (artwork.user?.id) onArtistClick(artwork.user.id);
            }}
            className="flex items-center gap-2 hover:text-slate-900"
          >
            <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center uppercase">
              {artwork.user?.username?.[0] || 'A'}
            </div>
            <span className="font-medium text-slate-700 truncate max-w-[120px]">
              {artwork.user?.username || 'Artist'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="flex items-center gap-1 text-[11px]">
              <MessageSquare className="w-3.5 h-3.5" />
              {artwork.comments?.length || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
