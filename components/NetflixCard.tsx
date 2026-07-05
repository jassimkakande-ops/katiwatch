import Link from "next/link";
import Image from "next/image";
import { Movie, Series } from "@/lib/supabase";
import { Play, Star, Crown } from "lucide-react";
import React from "react";

// Streamit-style card component for both movies and series
type TMDBGenreMovie = {
  id: number | string;
  title?: string;
  poster_url?: string;
  cover_url?: string;
  description?: string;
  release_date?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
};

type NetflixCardProps = {
  content: Movie | Series | TMDBGenreMovie;
  type: "movie" | "series";
  isNonTranslated?: boolean;
};

export const NetflixCard = ({ content, type, isNonTranslated = false }: NetflixCardProps) => {
  const getHref = () => {
    if (isNonTranslated) {
      return `/non-translated/${type === "movie" ? "movies" : "series"}/${content.id}`;
    }
    return `/${type === "movie" ? "movies" : "series"}/${content.id}`;
  };

  const getRating = () => {
    if ('rating' in content && typeof content.rating === 'number') {
      return content.rating.toFixed(1);
    }
    return (Math.random() * 2 + 7).toFixed(1);
  };

  const isPremium: boolean = Boolean(('premium' in content && content.premium) || ('is_premium' in content && content.is_premium));
  const vjName: string | null = ('vjs' in content && (content.vjs as any)?.name) ? (content.vjs as any).name : null;

  return (
    <Link href={getHref()} className="group block">
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-900">
        <Image
          src={
            content.thumbnail_url ||
            content.cover_image_url ||
            (('poster_url' in content && content.poster_url) ? content.poster_url : undefined) ||
            `https://via.placeholder.com/240x360/1f2937/e50914?text=${encodeURIComponent(content.title || '')}`
          }
          alt={content.title || `Poster for ${type}`}
          fill
          className="object-cover"
          sizes="(max-width:480px) 33vw, (max-width:768px) 25vw, (max-width:1024px) 20vw, (max-width:1280px) 16vw, 12vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/240x360/1f2937/e50914?text=${encodeURIComponent(content.title || '')}`;
          }}
        />

        {/* Rating badge - bottom left */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-bold text-white">{getRating()}</span>
        </div>

        {/* Premium badge - top right corner if premium */}
        {isPremium && (
          <div className="absolute top-2 right-2">
            <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] font-bold text-yellow-400 shadow-lg flex items-center gap-1 uppercase">
              <Crown className="w-2.5 h-2.5" style={{ color: '#FFD700', filter: 'drop-shadow(0 0 2px #FFD700)' }} />
              <span>Premium</span>
            </div>
          </div>
        )}
      </div>

      {/* Title - below card */}
      <h3 className="text-xs font-medium text-white mt-2 truncate">
        {content.title}
      </h3>
      
      {/* Meta info */}
      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
        {content.release_date && (
          <span>{new Date(content.release_date).getFullYear()}</span>
        )}
        {vjName && (
          <>
            <span>•</span>
            <span className="text-[#E50914] truncate">{vjName}</span>
          </>
        )}
      </div>
    </Link>
  );
};

