import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHistory } from '../hooks/useHistory';
import { RecommendationHistory, UnifiedTrip } from '../services/historyService';
import { historyService } from '../services/historyService';
import Toast from './Toast';
import { authService } from '../services/authService';

// Travel quotes for loading state
const TRAVEL_QUOTES = [
  "Adventure is worthwhile in itself. — Amelia Earhart",
  "Travel makes one modest. You see what a tiny place you occupy in the world. — Gustave Flaubert",
  "The world is a book, and those who do not travel read only one page. — Saint Augustine",
  "Not all those who wander are lost. — J.R.R. Tolkien",
  "Travel is the only thing you buy that makes you richer. — Anonymous",
  "To travel is to live. — Hans Christian Andersen",
  "Life is either a daring adventure or nothing at all. — Helen Keller",
  "The journey of a thousand miles begins with a single step. — Lao Tzu",
  "Travel far, travel wide, travel light. — Anonymous",
  "I haven't been everywhere, but it's on my list. — Susan Sontag",
  "Collect moments, not things. — Anonymous",
  "Traveling – it leaves you speechless, then turns you into a storyteller. — Ibn Battuta",
  "Wherever you go becomes a part of you somehow. — Anita Desai",
  "Travel is fatal to prejudice, bigotry, and narrow-mindedness. — Mark Twain",
  "We travel not to escape life, but for life not to escape us. — Anonymous"
];

interface UnifiedTripItemProps {
  trip: UnifiedTrip;
  onView: (trip: UnifiedTrip) => void;
  onDelete: (tripId: string) => void;
  onShareTrip: (trip: UnifiedTrip) => void;
}

const UnifiedTripItem: React.FC<UnifiedTripItemProps> = ({ trip, onView, onDelete, onShareTrip }) => {
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      apps: '📱',
      food: '🍽️',
      music: '🎵',
      lingo: '🗣️',
      packing: '🎒',
      itinerary: '🗺️',
      unknown: '📋'
    };
    return icons[type as keyof typeof icons] || icons.unknown;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      apps: 'bg-teal-100 text-teal-800 border-teal-200',
      food: 'bg-orange-100 text-orange-800 border-orange-200',
      music: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      lingo: 'bg-sky-100 text-sky-800 border-sky-200',
      packing: 'bg-violet-100 text-violet-800 border-violet-200',
      itinerary: 'bg-blue-100 text-blue-800 border-blue-200',
      unknown: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.unknown;
  };

  return (
    <div 
      onClick={() => onView(trip)}
      className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col h-full"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-3 sm:p-4 text-white">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xl sm:text-2xl">🗺️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
              {trip.tripName || trip.destination}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
              <svg className="w-3 h-3 text-violet-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-violet-100 text-xs truncate">{trip.destination}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Date and Count with icons */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatShortDate(trip.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{trip.recommendation_count} recommendations</span>
          </div>
        </div>

        {/* Features with icons */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {trip.recommendation_types.slice(0, 4).map((type, index) => (
              <span key={index} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${getTypeColor(type)}`}>
                <span className="text-sm">{getTypeIcon(type)}</span>
                <span className="capitalize">{type}</span>
              </span>
            ))}
            {trip.recommendation_types.length > 4 && (
              <span className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                +{trip.recommendation_types.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons - Stuck to bottom */}
        <div className="flex gap-2 mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(trip)}
            className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">View</span>
          </button>
          <button
            onClick={() => onShareTrip(trip)}
            className="px-3 py-2.5 sm:py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center touch-manipulation min-w-[44px]"
            title="Share"
            aria-label="Share trip"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(trip.tripId);
            }}
            className="px-3 py-2.5 sm:py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center justify-center touch-manipulation min-w-[44px]"
            title="Delete"
            aria-label="Delete trip"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

interface HistoryItemProps {
  item: RecommendationHistory;
  onDelete: (id: string) => void;
  onView: (item: RecommendationHistory) => void;
  onShare: (item: RecommendationHistory) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onDelete, onView, onShare }) => {
  const getTypeIcon = (type: string) => {
    const icons = {
      apps: '📱',
      food: '🍽️',
      music: '🎵',
      lingo: '🗣️',
      packing: '🎒',
      itinerary: '🗺️',
      unknown: '📋'
    };
    return icons[type as keyof typeof icons] || icons.unknown;
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      apps: 'from-teal-500 to-teal-600',
      food: 'from-orange-500 to-orange-600',
      music: 'from-fuchsia-500 to-fuchsia-600',
      lingo: 'from-sky-500 to-sky-600',
      packing: 'from-violet-500 to-violet-600',
      itinerary: 'from-blue-500 to-blue-600',
      unknown: 'from-gray-500 to-gray-600'
    };
    return colors[type as keyof typeof colors] || colors.unknown;
  };

  const getTypeAccentColor = (type: string) => {
    const colors = {
      apps: 'bg-teal-100 text-teal-800 border-teal-200',
      food: 'bg-orange-100 text-orange-800 border-orange-200',
      music: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      lingo: 'bg-sky-100 text-sky-800 border-sky-200',
      packing: 'bg-violet-100 text-violet-800 border-violet-200',
      itinerary: 'bg-blue-100 text-blue-800 border-blue-200',
      unknown: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.unknown;
  };

  return (
    <div 
      onClick={() => onView(item)}
      className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col h-full"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${getTypeColor(item.recommendationType)} p-3 sm:p-4 text-white`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xl sm:text-2xl">{getTypeIcon(item.recommendationType)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
              {item.title || item.destination}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
              <svg className="w-3 h-3 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-white/80 text-xs truncate">{item.destination}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Date and Count with icons */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatShortDate(item.created_at)}</span>
          </div>
          {item.total_items_count !== undefined && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{item.total_items_count} items</span>
            </div>
          )}
        </div>

        {/* Action buttons - Stuck to bottom */}
        <div className="flex gap-2 mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(item)}
            className={`flex-1 bg-gradient-to-r ${getTypeColor(item.recommendationType)} text-white px-3 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">View</span>
          </button>
          <button
            onClick={() => onShare(item)}
            className="px-3 py-2.5 sm:py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center touch-manipulation min-w-[44px]"
            title="Share"
            aria-label="Share recommendation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="px-3 py-2.5 sm:py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center justify-center touch-manipulation min-w-[44px]"
            title="Delete"
            aria-label="Delete recommendation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const History: React.FC<{ onBack: () => void; onNavigateToResult: (type: string, responseData: any, requestData: any, isHistoryView: boolean) => void }> = ({ onBack, onNavigateToResult }) => {
  const {
    history,
    pagination,
    loading,
    error,
    destinations,
    tags,
    recommendationTypes,
    filters,
    setFilters,
    loadHistory,
    updateRecommendation,
    deleteRecommendation
  } = useHistory();

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  
  // Unified trip state
  const [unifiedTrips, setUnifiedTrips] = useState<UnifiedTrip[]>([]);
  const [allUnifiedTrips, setAllUnifiedTrips] = useState<UnifiedTrip[]>([]); // Store all trips for filtering
  const [unifiedTripsLoading, setUnifiedTripsLoading] = useState(false);
  
  // Combined items type
  type CombinedItem = { type: 'individual'; data: RecommendationHistory } | { type: 'unified'; data: UnifiedTrip };
  
  // Infinite scroll state - accumulate all loaded items
  const [allLoadedHistory, setAllLoadedHistory] = useState<RecommendationHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Trip type filter state
  const [tripTypeFilter, setTripTypeFilter] = useState<'all' | 'individual' | 'unified'>('all');
  
  // Count state
  const [totalIndividualCount, setTotalIndividualCount] = useState<number>(0);
  const [totalUnifiedCount, setTotalUnifiedCount] = useState<number>(0);
  
  // Loading quote state
  const [currentQuote, setCurrentQuote] = useState<string>('');
  
  // Set initial quote and rotate quotes while loading
  useEffect(() => {
    if (loading) {
      // Set initial random quote
      const randomIndex = Math.floor(Math.random() * TRAVEL_QUOTES.length);
      setCurrentQuote(TRAVEL_QUOTES[randomIndex]);
      
      // Rotate quotes every 3 seconds while loading
      const quoteInterval = setInterval(() => {
        const newRandomIndex = Math.floor(Math.random() * TRAVEL_QUOTES.length);
        setCurrentQuote(TRAVEL_QUOTES[newRandomIndex]);
      }, 3000);
      
      return () => clearInterval(quoteInterval);
    } else {
      // Clear quote when not loading
      setCurrentQuote('');
    }
  }, [loading]);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setHasMore(true);
    // Apply filters immediately
    setFilters({
      search: value || undefined
    });
    
    // Apply filters to unified trips immediately
    const filteredTrips = filterUnifiedTrips(allUnifiedTrips, value);
    setUnifiedTrips(filteredTrips);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTripTypeFilter('all');
    setCurrentPage(1);
    setHasMore(true);
    setFilters({});
    
    // Clear unified trip filters
    setUnifiedTrips(allUnifiedTrips);
  };
  
  // Update allLoadedHistory when history changes from the hook
  useEffect(() => {
    if (history.length > 0) {
      setAllLoadedHistory(history);
      // Set hasMore based on pagination
      if (pagination) {
        const moreAvailable = pagination.page < pagination.totalPages;
        setHasMore(moreAvailable);
      }
    }
  }, [history, pagination]);
  
  // Load more individual recommendations
  const loadMoreHistory = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    
    // Check if user is authenticated before making API call
    if (!authService.isAuthenticated()) {
      setHasMore(false);
      return;
    }
    
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await historyService.getHistory(nextPage, 10, filters);
      
      // Append the new data
      setAllLoadedHistory(prev => [...prev, ...response.data]);
      setCurrentPage(nextPage);
      
      // Check if there are more pages
      if (nextPage >= response.pagination.totalPages) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more history:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, currentPage, filters]);
  
  // Scroll detection for infinite scroll using IntersectionObserver
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreHistory();
        }
      },
      { rootMargin: '300px' }
    );

    // Create a sentinel element to observe
    const sentinel = document.createElement('div');
    sentinel.id = 'infinite-scroll-sentinel';
    sentinel.style.height = '1px';
    
    // Find the last item container
    const observerTarget = document.querySelector('.grid');
    if (observerTarget && observerTarget.parentNode) {
      observerTarget.parentNode.insertBefore(sentinel, observerTarget.nextSibling);
      observer.observe(sentinel);
    }

    return () => {
      observer.disconnect();
      const existingSentinel = document.getElementById('infinite-scroll-sentinel');
      if (existingSentinel) {
        existingSentinel.remove();
      }
    };
  }, [hasMore, loading, loadingMore, loadMoreHistory]);
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    setAllLoadedHistory([]); // Clear accumulated history when filters change
    setLoadingMore(false);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recommendation?')) {
      if (!authService.isAuthenticated()) {
        setToast({ message: 'Your session has expired. Please sign in again.', type: 'error' });
        return;
      }
      try {
        await deleteRecommendation(id);
      } catch (error) {
        // Failed to delete recommendation
      }
    }
  };

  const handleView = (item: RecommendationHistory) => {
    // Navigate to the shareable link for this recommendation
    const shareUrl = `${window.location.origin}/share/${item.id}`;
    window.open(shareUrl, '_blank');
  };

  const handleShare = async (item: RecommendationHistory) => {
    if (!authService.isAuthenticated()) {
      setToast({ message: 'Your session has expired. Please sign in again.', type: 'error' });
      return;
    }
    try {
      const shareUrl = `${window.location.origin}/share/${item.id}`;
      await navigator.clipboard.writeText(shareUrl);
      
      setToast({ message: 'Shareable link copied to clipboard!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to copy link. Please try again.', type: 'error' });
    }
  };

  const handleShareTrip = async (trip: UnifiedTrip) => {
    if (!authService.isAuthenticated()) {
      setToast({ message: 'Your session has expired. Please sign in again.', type: 'error' });
      return;
    }
    try {
      const shareUrl = `${window.location.origin}/share/${trip.tripId}`;
      await navigator.clipboard.writeText(shareUrl);
      
      setToast({ message: 'Shareable link copied to clipboard!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to copy link. Please try again.', type: 'error' });
    }
  };

  // Count handlers
  const loadTotalCounts = async () => {
    if (!authService.isAuthenticated()) {
      return;
    }
    
    try {
      // Load total individual count (without filters)
      const individualResponse = await historyService.getHistory(1, 1, {});
      setTotalIndividualCount(individualResponse.pagination.total);
      
      // For unified trips, we'll load all trips to get accurate count
      // This is not ideal for performance, but the API doesn't provide total count
      const allUnifiedTrips = await historyService.getUnifiedTrips(1, 1000); // Load up to 1000 trips
      setTotalUnifiedCount(allUnifiedTrips.length);
    } catch (error) {
      // Failed to load total counts
    }
  };

  // Unified trip filtering function
  const filterUnifiedTrips = (trips: UnifiedTrip[], searchTerm: string) => {
    return trips.filter(trip => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          trip.tripName?.toLowerCase().includes(searchLower) ||
          trip.destination.toLowerCase().includes(searchLower) ||
          trip.language.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  };

  // Unified trip handlers
  const loadUnifiedTrips = async () => {
    if (!authService.isAuthenticated()) {
      setUnifiedTripsLoading(false);
      return;
    }
    
    setUnifiedTripsLoading(true);
    try {
      const trips = await historyService.getUnifiedTrips();
      setAllUnifiedTrips(trips); // Store all trips
      
      // Apply current filters
      const filteredTrips = filterUnifiedTrips(trips, searchTerm);
      setUnifiedTrips(filteredTrips);
    } catch (error) {
      // Failed to load unified trips
    } finally {
      setUnifiedTripsLoading(false);
    }
  };

  const handleViewUnifiedTrip = async (trip: UnifiedTrip) => {
    // Navigate to the shareable link for this unified trip
    const shareUrl = `${window.location.origin}/share/${trip.tripId}`;
    window.open(shareUrl, '_blank');
  };

  const handleDeleteUnifiedTrip = async (tripId: string) => {
    if (window.confirm('Are you sure you want to delete this unified trip? This will delete all associated recommendations.')) {
      if (!authService.isAuthenticated()) {
        setToast({ message: 'Your session has expired. Please sign in again.', type: 'error' });
        return;
      }
      try {
        await historyService.deleteUnifiedTrip(tripId);
        setUnifiedTrips(prev => prev.filter(trip => trip.tripId !== tripId));
        setAllUnifiedTrips(prev => prev.filter(trip => trip.tripId !== tripId));
        setTotalUnifiedCount(prev => prev - 1);
      } catch (error) {
        // Failed to delete unified trip
      }
    }
  };

  // Load unified trips and total counts when component mounts
  useEffect(() => {
    // Check if user is authenticated before making API calls
    if (!authService.isAuthenticated()) {
      return;
    }
    
    loadUnifiedTrips();
    loadTotalCounts();
  }, []);

  // Update counts when filters change
  useEffect(() => {
    if (pagination) {
      setTotalIndividualCount(pagination.total);
    }
  }, [pagination]);


  // Sorting function
  const sortByTime = (items: any[], dateField: string = 'created_at') => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a[dateField]).getTime();
      const dateB = new Date(b[dateField]).getTime();
      return dateB - dateA; // Most recent first
    });
  };

  // Use allLoadedHistory for display instead of history
  const sortedHistory = useMemo(() => {
    const dataToSort = allLoadedHistory.length > 0 ? allLoadedHistory : history;
    return sortByTime(dataToSort);
  }, [allLoadedHistory, history]);
  const sortedUnifiedTrips = useMemo(() => sortByTime(unifiedTrips), [unifiedTrips]);

  // Combine and sort all items by creation date (most recent first)
  // Use useMemo to ensure immediate updates when filter changes
  const combinedItems = useMemo(() => {
    const combined: CombinedItem[] = [];
    
    // Add items based on filter
    if (tripTypeFilter === 'all') {
      // Add all individual recommendations
      sortedHistory.forEach(item => {
        combined.push({ type: 'individual', data: item });
      });
      // Add all unified trips
      sortedUnifiedTrips.forEach(trip => {
        combined.push({ type: 'unified', data: trip });
      });
    } else if (tripTypeFilter === 'individual') {
      // Add only individual recommendations
      sortedHistory.forEach(item => {
        combined.push({ type: 'individual', data: item });
      });
    } else if (tripTypeFilter === 'unified') {
      // Add only unified trips
      sortedUnifiedTrips.forEach(trip => {
        combined.push({ type: 'unified', data: trip });
      });
    }
    
    // Sort by creation date (most recent first)
    combined.sort((a, b) => {
      const dateA = new Date(a.data.created_at).getTime();
      const dateB = new Date(b.data.created_at).getTime();
      return dateB - dateA;
    });
    
    return combined;
  }, [sortedHistory, sortedUnifiedTrips, tripTypeFilter]);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Filters - Modernized Design */}
        <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-xl border-2 border-violet-100/50 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Filter & Search
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search Bar - Enhanced */}
              <div className="relative flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchTermChange(e.target.value)}
                    placeholder="Search trips, destinations..."
                    className="w-full pl-9 sm:pl-11 pr-9 sm:pr-10 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50 to-violet-50/30 border-2 border-violet-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-400 text-base font-medium text-slate-700 placeholder:text-slate-400 transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => handleSearchTermChange('')}
                      className="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center touch-manipulation"
                      aria-label="Clear search"
                    >
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Trip Type Filter */}
              <div className="w-full sm:w-auto sm:min-w-[180px] lg:w-52">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Trip Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <select
                    value={tripTypeFilter}
                    onChange={(e) => setTripTypeFilter(e.target.value as 'all' | 'individual' | 'unified')}
                    className="w-full pl-9 sm:pl-11 pr-9 sm:pr-10 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50 to-violet-50/30 border-2 border-violet-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-400 text-sm sm:text-base font-medium text-slate-700 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer touch-manipulation"
                  >
                    <option value="all">All</option>
                    <option value="individual">Individual</option>
                    <option value="unified">Unified</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Clear Button - Enhanced */}
              <div className="w-full sm:w-auto sm:flex sm:items-end">
                <button
                  onClick={handleClearFilters}
                  disabled={!searchTerm && tripTypeFilter === 'all'}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 disabled:from-slate-50 disabled:to-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border-2 border-slate-300 hover:border-slate-400 disabled:border-slate-200 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || tripTypeFilter !== 'all') && (
              <div className="pt-3 sm:pt-4 border-t-2 border-violet-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 w-full sm:w-auto">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-violet-100 text-violet-800 rounded-lg text-xs sm:text-sm font-medium border border-violet-200">
                      <span className="truncate max-w-[150px] sm:max-w-none">Search: "{searchTerm}"</span>
                      <button
                        onClick={() => handleSearchTermChange('')}
                        className="hover:text-violet-900 transition-colors touch-manipulation flex-shrink-0"
                        aria-label="Remove search filter"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {tripTypeFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-xs sm:text-sm font-medium border border-purple-200">
                      <span>Type: {tripTypeFilter === 'individual' ? 'Individual' : 'Unified'}</span>
                      <button
                        onClick={() => setTripTypeFilter('all')}
                        className="hover:text-purple-900 transition-colors touch-manipulation flex-shrink-0"
                        aria-label="Remove type filter"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Results - Attractive Loading State */}
        {loading && (
          <div className="text-center py-16 sm:py-20">
            <div className="max-w-md mx-auto">
              {/* Animated Loader */}
              <div className="relative mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto relative">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 border-4 border-violet-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
                  
                  {/* Middle pulsing ring */}
                  <div className="absolute inset-2 border-4 border-purple-200 rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 border-4 border-transparent border-r-purple-500 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                  
                  {/* Inner icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-violet-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Loading Text */}
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Loading Your Adventures
                </h3>
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              
              {/* Quote Display */}
              {currentQuote && (
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-violet-100 shadow-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-violet-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-3.312.817-5.546 3.271-5.546 6.818v7.021h6.568v4.99h-10.981zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-3.313.817-5.547 3.271-5.547 6.818v7.021h6.568v4.99h-10.981z"/>
                    </svg>
                    <p className="text-sm sm:text-base text-slate-700 italic leading-relaxed font-medium">
                      {currentQuote}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Combined Results - Show items sorted by creation date (most recent first) */}
        {!loading && !error && combinedItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
              {combinedItems.map((combinedItem, index) => {
                  if (combinedItem.type === 'individual') {
                    return (
                      <HistoryItem
                        key={`individual-${combinedItem.data.id}`}
                        item={combinedItem.data}
                        onDelete={handleDelete}
                        onView={handleView}
                        onShare={handleShare}
                      />
                    );
                  } else {
                    return (
                      <UnifiedTripItem
                        key={`unified-${combinedItem.data.tripId}`}
                        trip={combinedItem.data}
                        onView={handleViewUnifiedTrip}
                        onDelete={handleDeleteUnifiedTrip}
                        onShareTrip={handleShareTrip}
                      />
                    );
                  }
                })}
            </div>

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="flex justify-center items-center py-6">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && combinedItems.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📭</span>
            </div>
            <p className="text-slate-600">No results found</p>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default History;