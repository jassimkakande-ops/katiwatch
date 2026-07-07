import Image from "next/image";
import Link from "next/link";
import type { TMDBMovie } from '@/lib/types/tmdb';

interface MovieCardProps {
  content: TMDBMovie;
}

export default function MovieCard({ content }: MovieCardProps) {
  const title = content.title || 'Unknown Title';
  const releaseDate = content.release_date;
  const posterPath = content.poster_path;

  return (
    <Link href={`/non-translated/movies/${content.id}`} className="group block">
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-900">
        <Image
          src={posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : `https://via.placeholder.com/300x450/1f2937/f97316?text=${encodeURIComponent(title)}`}
          alt={title}
          fill
          className="object-cover"
        />
        
        {/* Rating badge - bottom left */}
        {content.vote_average && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            <span className="text-yellow-500">⭐</span>
            <span className="text-xs font-bold text-white">{content.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>
    
      {/* Title - below card */}
      <h3 className="text-xs font-medium text-white mt-2 truncate">{title}</h3>
      
      {/* Meta info */}
      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
        {releaseDate && (
          <span>{new Date(typeof releaseDate === "string" ? releaseDate.replace(/ /g, "T") : releaseDate).getFullYear()}</span>
        )}
      </div>
    </Link>
  );
}