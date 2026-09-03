import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Eye } from 'lucide-react';

export const ArtworkCard = ({ artwork, index, onClick, onTagClick, onArtistClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      onClick={() => onClick(artwork)}
      className="group relative bg-white rounded-[20px] overflow-hidden transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-transparent hover:border-slate-200/60 flex flex-col"
    >
      {/* Image Container with Organic Masonry Ratio */}
      <div className="relative w-full bg-slate-100 overflow-hidden">
        {!isLoaded && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse" />
        )}
        <img
          src={artwork.image_url}
          alt={`Ilustrasi ${artwork.title} oleh ${artwork.user?.username}`}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Subtle Dark Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Action Button (Visible on Hover) */}
        <div className="absolute top-3 right-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out z-10">
          <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-slate-800 flex items-center justify-center shadow-lg hover:scale-110 hover:bg-white transition-transform">
            <Eye className="w-4 h-4" />
          </div>
        </div>

        {/* Bottom Details (Appears on Hover over image) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out z-10">
          <h3 className="font-bold text-white text-base leading-tight drop-shadow-md mb-1 line-clamp-2">
            {artwork.title}
          </h3>
          
          <div className="flex items-center justify-between">
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (artwork.user?.id) onArtistClick(artwork.user.id);
              }}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold text-[10px] flex items-center justify-center uppercase shadow-sm">
                {artwork.user?.username?.[0] || 'A'}
              </div>
              <span className="font-semibold text-white/90 text-xs drop-shadow-sm">
                {artwork.user?.username || 'Artist'}
              </span>
            </div>

            {artwork.comments && artwork.comments.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-white/90 drop-shadow-sm bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                <MessageSquare className="w-3 h-3" />
                {artwork.comments.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
};
