"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FullPageSpinner } from "@/components/LoadingSpinner";
import { Play, Download, Check, ThumbsUp, Share2, ChevronDown } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import { useAuth } from "@/components/AuthProvider";
import { getProfile, Profile } from "@/lib/profiles";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import { canUserDownload } from "@/lib/subscriptions";
import { supabase, Series, SeriesWithVJ, Season, Episode, EpisodeWithSeason, MovieWithVJ } from "@/lib/supabase";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import { NetflixCard } from "@/components/NetflixCard";

export default function SeriesDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isPremium, loading: authLoading } = useAuth();

  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [allEpisodes, setAllEpisodes] = useState<EpisodeWithSeason[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeWithSeason | null>(null);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"episodes" | "more">("episodes");
  const [relatedSeries, setRelatedSeries] = useState<SeriesWithVJ[]>([]);
  const [trailerUrl, setTrailerUrl] = useState<string>("");
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<"play" | "download">("play");
  const [castInfo, setCastInfo] = useState<{ starring: string; creators: string }>({ starring: "", creators: "" });

  const { watchHistory, addToWatchlist, removeFromWatchlist, isInWatchlist, updateWatchProgress } = useUserPreferences();
  const progress = series ? watchHistory[series.id] : null;
  const initialTime = progress ? progress.progress : 0;
  const isWatchlisted = series ? isInWatchlist(series.id) : false;

  const dataFetchedRef = React.useRef<string | null>(null);

  useEffect(() => {
    async function fetchSeriesData() {
      if (!params.id || dataFetchedRef.current === params.id) return;

      try {
        const api = await import("@/lib/api");
        const seriesData = await api.getSeriesById(params.id as string) as SeriesWithVJ;
        if (!seriesData) throw new Error("Series not found");

        let seasonsList: Season[] = [];
        let loadedEpisodes: EpisodeWithSeason[] = [];

        if ((seriesData as any).seasons?.length > 0) {
          seasonsList = (seriesData as any).seasons;
          const firstSeason = seasonsList[0] as any;
          const firstSeasonNum = firstSeason.season_number || firstSeason.order || 1;
          setActiveSeasonId(firstSeason.id || String(firstSeasonNum));

          const seasonsWithEpisodes = await Promise.all(
            seasonsList.map(async (season: any) => {
              const seasonNum = season.season_number || season.order || 1;
              const seasonId = season.id || String(seasonNum);
              let seasonEps: any[] = Array.isArray(season.episodes) && season.episodes.length > 0
                ? season.episodes
                : await api.getEpisodes(params.id as string, seasonNum) || [];

              const mappedEps = seasonEps.map((e: any) => ({
                ...e,
                seasonName: season.name || `Season ${seasonNum}`,
                seasonOrder: seasonNum,
                season_id: seasonId,
              })) as unknown as EpisodeWithSeason[];
              loadedEpisodes = [...loadedEpisodes, ...mappedEps];
              return { ...season, episodes: seasonEps, id: seasonId };
            })
          );
          (seriesData as any).seasons = seasonsWithEpisodes;
          setSeasons(seasonsWithEpisodes);
        } else {
          const episodes = await api.getEpisodes(params.id as string, 1);
          if (episodes.length > 0) {
            const seasonId = "season-1";
            setActiveSeasonId(seasonId);
            loadedEpisodes = episodes.map((e: any) => ({
              ...e, seasonName: "Season 1", seasonOrder: 1, season_id: seasonId,
            })) as unknown as EpisodeWithSeason[];
            const mockSeason = { id: seasonId, name: "Season 1", order: 1, series_id: params.id as string, published: true, created_at: new Date().toISOString(), episodes } as Season & { episodes: any };
            (seriesData as any).seasons = [mockSeason];
            setSeasons([mockSeason]);
          }
        }

        const allEps = loadedEpisodes.sort((a, b) => {
          if (a.seasonOrder !== b.seasonOrder) return a.seasonOrder - b.seasonOrder;
          return a.episode_number - b.episode_number;
        });
        setAllEpisodes(allEps);

        const savedProgress = JSON.parse(localStorage.getItem("streamit_history") || "{}")[params.id as string];
        if (savedProgress?.episode) {
          const epToSelect = allEps.find(e => e.seasonOrder === savedProgress.season && e.episode_number === savedProgress.episode);
          if (epToSelect) { setSelectedEpisode(epToSelect); setActiveSeasonId(epToSelect.season_id); }
        }

        setSeries(seriesData);

        fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId: params.id, contentType: "series", userId: user?.id || null }),
        }).catch(() => {});

        // Trailer goes in its own section — fetch separately
        try {
          const trailers = await api.getSeriesTrailers(params.id as string);
          if (trailers?.[0]?.key) setTrailerUrl(`https://www.youtube.com/watch?v=${trailers[0].key}`);
        } catch {}

        setLoading(false);

        if ((seriesData?.genre_ids?.length ?? 0) > 0) {
          try {
            const rel = await api.getRelatedSeriesByGenre(params.id as string, seriesData.genre_ids as string[], 10) as SeriesWithVJ[];
            setRelatedSeries(rel || []);
          } catch {}
        }

        // Fetch cast info from TMDB via MovieCast logic
        try {
          const tmdbRes = await fetch(`/api/search?q=${encodeURIComponent(seriesData.title)}&type=series`);
          if (tmdbRes.ok) {
            const tmdbData = await tmdbRes.json();
            if (tmdbData?.results?.[0]?.id) {
              const credRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbData.results[0].id}/credits?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`);
              if (credRes.ok) {
                const cred = await credRes.json();
                const starring = (cred.cast || []).slice(0, 3).map((c: any) => c.name).join(", ");
                const creators = (cred.crew || []).filter((c: any) => c.job === "Creator" || c.department === "Writing").slice(0, 2).map((c: any) => c.name).join(", ");
                setCastInfo({ starring, creators });
              }
            }
          }
        } catch {}

        dataFetchedRef.current = params.id as string;
      } catch (error) {
        console.error("Error fetching series:", error);
        setLoading(false);
      }
    }
    fetchSeriesData();
  }, [params.id, user?.id]);

  const handleEpisodeSelect = async (episode: EpisodeWithSeason) => {
    setSelectedEpisode(episode);
    if (!user?.id) { setAuthAction("play"); setShowAuthModal(true); return; }
    if (episode.premium && !isPremium) { router.push("/payment"); return; }
    try {
      const api = await import("@/lib/api");
      const streamData = await api.getEpisodeStream(params.id as string, episode.seasonOrder || 1, episode.episode_number);
      if (streamData?.video_url) setStreamUrl(streamData.video_url);
      else alert("This episode is not available for watching");
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleVideoEnded = useCallback(() => {
    // Auto-advance to first episode when stream ends
    if (allEpisodes.length > 0) {
      const firstEp = allEpisodes[0];
      if (!firstEp.premium || isPremium) handleEpisodeSelect(firstEp);
    }
  }, [allEpisodes, isPremium]);

  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (series && selectedEpisode) {
      updateWatchProgress({
        id: series.id, type: "series", progress: currentTime, duration,
        timestamp: Date.now(), title: series.title,
        poster_url: series.thumbnail_url || series.cover_image_url,
        season: selectedEpisode.seasonOrder, episode: selectedEpisode.episode_number,
      });
    }
  }, [series, selectedEpisode, updateWatchProgress]);

  const handleDownload = async (episode: EpisodeWithSeason) => {
    setSelectedEpisode(episode);
    if (!user?.id) { setAuthAction("download"); setShowAuthModal(true); return; }
    if (episode.premium && !isPremium) { router.push("/payment"); return; }
    const allowed = await canUserDownload(user.id);
    if (!allowed) { router.push("/payment"); return; }
    setShowDownloadModal(true);
  };

  const handleDownloadNow = async () => {
    if (!selectedEpisode) return;
    const cleanTitle = series?.title.replace(/[^a-zA-Z0-9\s\-_.]/g, "").trim() || "Series";
    const cleanEp = selectedEpisode.title.replace(/[^a-zA-Z0-9\s\-_.]/g, "").trim();
    const filename = `${cleanTitle} - S${selectedEpisode.seasonOrder}E${selectedEpisode.episode_number} - ${cleanEp}.mp4`;
    window.open(`/api/download?id=${params.id}&type=episode&season=${selectedEpisode.seasonOrder || 1}&episode=${selectedEpisode.episode_number}&filename=${encodeURIComponent(filename)}`, "_blank");
    setShowDownloadModal(false);
  };

  if (loading || authLoading) return <FullPageSpinner text="Loading series details..." />;

  if (!series) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Series Not Found</h1>
          <Button className="bg-[#E50914] hover:bg-[#b80710]" onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const coverImage = series.cover_image_url || `https://via.placeholder.com/1920x1080/141414/e50914?text=${encodeURIComponent(series.title)}`;
  const currentEpisodeIndex = selectedEpisode ? allEpisodes.findIndex(e => e.id === selectedEpisode.id) : -1;
  const activeSeason = seasons.find(s => s.id === activeSeasonId);
  const activeEpisodes = allEpisodes.filter(ep => ep.season_id === activeSeasonId);
  const releaseYear = series.release_date ? new Date(typeof series.release_date === "string" ? series.release_date.replace(/ /g, "T") : series.release_date).getFullYear() : "2024";

  return (
    <div className="min-h-screen bg-[#141414] text-white">

      {/* Hero — video player or cover image with play button */}
      <section className="relative w-full aspect-video bg-black">
        {streamUrl ? (
          <div className="w-full h-full relative">
            <VideoPlayer
              src={streamUrl}
              title={selectedEpisode ? `${selectedEpisode.seasonName} E${selectedEpisode.episode_number}: ${selectedEpisode.title}` : series.title}
              onEnded={handleVideoEnded}
              isPremiumContent={selectedEpisode?.premium || false}
              poster={coverImage}
              episodes={allEpisodes}
              currentEpisodeIndex={currentEpisodeIndex}
              onEpisodeSelect={handleEpisodeSelect}
              contentType="series"
              initialTime={(selectedEpisode && progress && progress.episode === selectedEpisode.episode_number && progress.season === selectedEpisode.seasonOrder) ? initialTime : 0}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        ) : (
          <div className="w-full h-full relative">
            <Image src={coverImage} alt={series.title} fill className="object-cover" priority />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Back button */}
            <button onClick={() => router.back()} className="absolute top-4 left-4 z-10 text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {/* Centered play button */}
            <button
              onClick={() => allEpisodes.length > 0 && handleEpisodeSelect(allEpisodes[0])}
              className="absolute inset-0 flex items-center justify-center z-10"
              aria-label="Play"
            >
              <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
            </button>
          </div>
        )}
      </section>

      {/* Details Section */}
      <section className="px-4 pt-5 pb-2">
        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">{series.title}</h1>

        {/* Meta row: match%, year, rating, seasons */}
        <div className="flex items-center gap-3 text-sm mb-3 flex-wrap">
          <span className="text-[#46d369] font-bold">98% Match</span>
          <span className="text-gray-300">{releaseYear}</span>
          <span className="border border-gray-500 text-gray-300 text-xs px-1">13+</span>
          <span className="text-gray-300">{seasons.length} {seasons.length === 1 ? "Season" : "Seasons"}</span>
        </div>

        {/* Description */}
        <p className="text-gray-200 text-sm leading-relaxed mb-3">
          {series.description || "No description provided."}
        </p>

        {/* Starring / Creators */}
        {castInfo.starring && (
          <p className="text-xs text-gray-400 mb-1">
            <span className="text-gray-300 font-semibold">Starring: </span>{castInfo.starring}
          </p>
        )}
        {castInfo.creators && (
          <p className="text-xs text-gray-400 mb-4">
            <span className="text-gray-300 font-semibold">Creators: </span>{castInfo.creators}
          </p>
        )}

        {/* Action buttons: My List, Rate, Share */}
        <div className="flex items-center gap-6 py-4 border-b border-gray-800">
          <button
            onClick={() => isWatchlisted ? removeFromWatchlist(series.id) : addToWatchlist(series.id, "series")}
            className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors"
          >
            <Check className={`w-6 h-6 ${isWatchlisted ? "text-white" : "text-gray-300"}`} />
            <span className="text-xs">My List</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors">
            <ThumbsUp className="w-6 h-6" />
            <span className="text-xs">Rate</span>
          </button>
          <button
            onClick={() => {
              if (navigator.share) navigator.share({ title: series.title, url: window.location.href }).catch(() => {});
              else navigator.clipboard.writeText(window.location.href).catch(() => {});
            }}
            className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors"
          >
            <Share2 className="w-6 h-6" />
            <span className="text-xs">Share</span>
          </button>
        </div>
      </section>

      {/* Trailer Section — auto-plays below action buttons */}
      {trailerUrl && (
        <section className="px-4 pb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Trailer</h2>
          <div className="relative w-full aspect-video bg-black overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${trailerUrl.match(/(?:youtu\.be\/|watch\?v=)([^&?]+)/)?.[1]}?autoplay=1&mute=1&rel=0&modestbranding=1`}
              title={`${series.title} — Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        </section>
      )}

      {/* Tabs: EPISODES | MORE LIKE THIS */}
      <section className="px-4 mt-2">
        <div className="flex gap-6 border-b border-gray-800 mb-4">
          <button
            onClick={() => setActiveTab("episodes")}
            className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === "episodes" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            Episodes
            {activeTab === "episodes" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914]" />}
          </button>
          <button
            onClick={() => setActiveTab("more")}
            className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === "more" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            More Like This
            {activeTab === "more" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914]" />}
          </button>
        </div>

        {activeTab === "episodes" && (
          <div>
            {/* Season dropdown */}
            {seasons.length > 0 && (
              <div className="relative inline-block mb-4">
                <button
                  onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                  className="flex items-center gap-2 bg-[#333] text-white font-bold px-4 py-2 rounded text-sm"
                >
                  {activeSeason?.name || `Season 1`}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showSeasonDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-[#333] rounded shadow-xl z-20 min-w-[140px]">
                    {seasons.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setActiveSeasonId(s.id); setShowSeasonDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[#444] transition-colors ${s.id === activeSeasonId ? "text-white font-bold" : "text-gray-300"}`}
                      >
                        {s.name || `Season ${(s as any).order || 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mobile: compact rows | Desktop: rich cards grid */}
            {/* Mobile rows */}
            <div className="flex flex-col divide-y divide-gray-800/50 md:hidden">
              {activeEpisodes.map(episode => (
                <div key={episode.id} className="flex items-center gap-3 py-3">
                  <div
                    className="relative flex-shrink-0 w-28 aspect-video rounded overflow-hidden cursor-pointer"
                    onClick={() => handleEpisodeSelect(episode)}
                  >
                    <Image src={episode.thumbnail_url || coverImage} alt={episode.title} fill className="object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                      <div className="w-8 h-8 rounded-full border border-white/80 flex items-center justify-center bg-black/30">
                        <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{episode.episode_number}. {episode.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{episode.description || ""}</p>
                    <p className="text-gray-500 text-xs mt-1">{episode.duration || "22m"}</p>
                  </div>
                  <button onClick={() => handleDownload(episode)} className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1" aria-label="Download">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop cards grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
              {activeEpisodes.map(episode => (
                <div
                  key={episode.id}
                  className="group bg-[#0d0d0d] border border-gray-900 hover:border-gray-700 transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => handleEpisodeSelect(episode)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    <Image src={episode.thumbnail_url || coverImage} alt={episode.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full border border-white/60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 font-mono">{episode.duration || "22m"}</div>
                    <div className="absolute bottom-2 left-2 text-gray-400 text-[10px] font-mono">E{episode.episode_number}</div>
                  </div>
                  {/* Info */}
                  <div className="p-3 bg-[#111]">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-white font-semibold text-sm line-clamp-1 flex-1 tracking-wide">
                        {episode.episode_number}. {episode.title}
                      </p>
                      <button
                        onClick={e => { e.stopPropagation(); handleDownload(episode); }}
                        className="flex-shrink-0 text-gray-600 hover:text-white transition-colors"
                        aria-label="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                      {episode.description || "A new chapter unfolds in this gripping episode."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "more" && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-2 gap-y-4 pb-8">
            {relatedSeries.length > 0 ? relatedSeries.map(s => (
              <NetflixCard key={s.id} content={s} type="series" />
            )) : (
              <p className="text-gray-500 text-sm col-span-3 py-8 text-center">No similar series found.</p>
            )}
          </div>
        )}
      </section>

      {/* Download Modal — Netflix style */}
      {showDownloadModal && selectedEpisode && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={() => setShowDownloadModal(false)}>
          <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-sm w-full text-center border border-gray-800 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-[#E50914]/10 border border-[#E50914]/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <Download className="w-6 h-6 text-[#E50914]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Download Episode</h2>
            <p className="text-gray-400 text-sm mb-6">S{selectedEpisode.seasonOrder}E{selectedEpisode.episode_number}: {selectedEpisode.title}</p>
            <button className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-3 rounded-lg mb-3 transition-colors" onClick={handleDownloadNow}>Download Now</button>
            <button className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors" onClick={() => setShowDownloadModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} action={authAction} requirePremium={Boolean(selectedEpisode?.premium)} />
    </div>
  );
}
