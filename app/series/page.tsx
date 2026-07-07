"use client";
import { Search, Filter, ChevronDown } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Series } from "@/lib/supabase";
import { NetflixCard } from "@/components/NetflixCard";

type SeriesWithVJ = Series & {
  vjs: { id: string; name: string } | null;
  season_count?: number;
};

type VJ = {
  id: string;
  name: string;
};

export default function SeriesPage() {
  const [series, setSeries] = useState<SeriesWithVJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVJ, setSelectedVJ] = useState<string>("");
  const [availableVJs, setAvailableVJs] = useState<VJ[]>([]);
  const [showVJDropdown, setShowVJDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSeries, setTotalSeries] = useState(0);

  const seriesPerPage = 48;

  const fetchAvailableVJs = useCallback(async () => {
    try {
      const api = await import('@/lib/api');
      const vjData = await api.getVJs();
      setAvailableVJs(vjData || []);
    } catch (error) {
      console.error('Error fetching VJs:', error);
    }
  }, []);

  // selectedVJ is already the VJ name (getVJs maps id=name), pass it directly
  const fetchSeries = useCallback(async (page: number, query = "", vjName = "") => {
    setLoading(true);
    try {
      const api = await import('@/lib/api');
      const seriesData = await api.searchSeries(query, seriesPerPage, page, vjName || undefined);
      setSeries(seriesData as any[]);
      setTotalSeries(seriesData.length === seriesPerPage ? page * seriesPerPage + 1 : (page - 1) * seriesPerPage + seriesData.length);
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  }, [seriesPerPage]);

  // Initial load
  useEffect(() => {
    fetchSeries(1);
    fetchAvailableVJs();
  }, [fetchSeries, fetchAvailableVJs]);

  // Handle pagination changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchSeries(currentPage, searchQuery, selectedVJ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Handle search/VJ filter with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchSeries(1, searchQuery, selectedVJ);
      }
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedVJ]);

  const clearFilters = () => {
    setSelectedVJ("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalSeries / seriesPerPage);
  const isFiltering = searchQuery.trim().length > 0 || !!selectedVJ;
  const selectedVJLabel = availableVJs.find(vj => vj.id === selectedVJ)?.name;

  return (
    <div className="min-h-screen bg-black text-white py-8 flex flex-col items-center">
      <div className="container mx-auto px-4 sm:px-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Series</h1>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-[#E50914] transition-colors" />
            <input
              type="text"
              placeholder="Search series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1a1a1a] border border-gray-800 rounded-none text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914] transition-colors text-sm tracking-wide"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowVJDropdown(!showVJDropdown)}
                className={`flex items-center gap-2 px-4 py-3 border text-sm font-medium tracking-wider uppercase transition-all ${
                  selectedVJ
                    ? 'bg-[#E50914] border-[#E50914] text-white'
                    : 'bg-[#1a1a1a] border-gray-800 text-gray-400 hover:border-[#E50914] hover:text-white'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {selectedVJLabel || 'VJ'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showVJDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showVJDropdown && (
                <div className="absolute top-full left-0 mt-0 w-52 bg-[#111] border border-gray-800 shadow-2xl z-50 max-h-[50vh] overflow-y-auto scrollbar-hide">
                  <button
                    onClick={() => { setSelectedVJ(""); setShowVJDropdown(false); }}
                    className="w-full text-left px-4 py-3 text-xs text-gray-500 hover:text-white hover:bg-[#1a1a1a] uppercase tracking-wider transition-colors"
                  >
                    All VJs
                  </button>
                  {availableVJs.map((vj) => (
                    <button
                      key={vj.id}
                      onClick={() => { setSelectedVJ(vj.id); setShowVJDropdown(false); }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-[#1a1a1a] transition-colors ${
                        selectedVJ === vj.id ? 'text-[#E50914] font-semibold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {vj.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {(selectedVJ || searchQuery) && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 border border-gray-800 text-gray-500 hover:border-red-600 hover:text-red-400 text-xs uppercase tracking-wider transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search Results Info */}
        <div className="mb-6">
          {(searchQuery || selectedVJ) && (
            <p className="text-gray-400 mb-4">
              {loading ? 'Searching...' : `${series.length} results`}
              {searchQuery && ` for "${searchQuery}"`}
              {selectedVJ && ` by ${selectedVJLabel}`}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <span className="inline-flex items-center justify-center font-bold tracking-widest text-2xl text-[#E50914]">
  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
</span>
          </div>
        )}

        {/* Series Grid */}
        {!loading && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-2 gap-y-4">
            {series.map((show) => (
              <NetflixCard key={show.id} content={show} type="series" />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && (searchQuery || selectedVJ) && series.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No series found</h3>
            <p className="text-gray-500">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-800 text-gray-400 hover:border-[#E50914] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs uppercase tracking-wider transition-all"
            >
              Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 text-sm transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#E50914] text-white'
                        : 'border border-gray-800 text-gray-400 hover:border-[#E50914] hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-800 text-gray-400 hover:border-[#E50914] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs uppercase tracking-wider transition-all"
            >
              Next
            </button>
          </div>
        )}

        {isFiltering && (
          <div className="text-center mt-6 text-gray-600 text-xs uppercase tracking-widest">
            {series.length} result{series.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
            {selectedVJ && ` · ${selectedVJLabel}`}
          </div>
        )}
      </div>
    </div>
  );
}

