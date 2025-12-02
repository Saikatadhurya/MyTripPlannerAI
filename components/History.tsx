import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHistory } from '../hooks/useHistory';
import { RecommendationHistory, UnifiedTrip } from '../services/historyService';
import BackToHomeButton from './BackToHomeButton';
import { historyService } from '../services/historyService';
import Toast from './Toast';
import { authService } from '../services/authService';

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
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <span className="text-2xl">🗺️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {trip.tripName || trip.destination}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <svg className="w-3 h-3 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-violet-100 text-xs truncate">{trip.destination}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
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
            className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3 py-2.5 rounded-lg text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
          <button
            onClick={() => onShareTrip(trip)}
            className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center"
            title="Share"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(trip.tripId)}
            className="px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center justify-center"
            title="Delete"
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
      <div className={`bg-gradient-to-r ${getTypeColor(item.recommendationType)} p-4 text-white`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <span className="text-2xl">{getTypeIcon(item.recommendationType)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {item.title || item.destination}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <svg className="w-3 h-3 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-white/80 text-xs truncate">{item.destination}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
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
            className={`flex-1 bg-gradient-to-r ${getTypeColor(item.recommendationType)} text-white px-3 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
          <button
            onClick={() => onShare(item)}
            className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center"
            title="Share"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center justify-center"
            title="Delete"
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
  const [selectedDestination, setSelectedDestination] = useState(filters.destination || '');
  const [selectedType, setSelectedType] = useState(filters.recommendationType || '');
  
  // Unified trip state
  const [unifiedTrips, setUnifiedTrips] = useState<UnifiedTrip[]>([]);
  const [allUnifiedTrips, setAllUnifiedTrips] = useState<UnifiedTrip[]>([]); // Store all trips for filtering
  const [unifiedTripsLoading, setUnifiedTripsLoading] = useState(false);
  
  // Combined items state
  type CombinedItem = { type: 'individual'; data: RecommendationHistory } | { type: 'unified'; data: UnifiedTrip };
  const [combinedItems, setCombinedItems] = useState<CombinedItem[]>([]);
  
  // Infinite scroll state - accumulate all loaded items
  const [allLoadedHistory, setAllLoadedHistory] = useState<RecommendationHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Trip type visibility state
  const [showIndividual, setShowIndividual] = useState<boolean>(true);
  const [showUnified, setShowUnified] = useState<boolean>(true);
  
  // Count state
  const [totalIndividualCount, setTotalIndividualCount] = useState<number>(0);
  const [totalUnifiedCount, setTotalUnifiedCount] = useState<number>(0);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setHasMore(true);
    // Apply filters immediately
    setFilters({
      search: value || undefined,
      destination: selectedDestination || undefined,
      recommendationType: selectedType || undefined
    });
    
    // Apply filters to unified trips immediately
    const filteredTrips = filterUnifiedTrips(allUnifiedTrips, value, selectedDestination);
    setUnifiedTrips(filteredTrips);
  };

  const handleDestinationChange = (value: string) => {
    setSelectedDestination(value);
    setCurrentPage(1);
    setHasMore(true);
    // Apply filters immediately
    setFilters({
      search: searchTerm || undefined,
      destination: value || undefined,
      recommendationType: selectedType || undefined
    });
    
    // Apply filters to unified trips immediately
    const filteredTrips = filterUnifiedTrips(allUnifiedTrips, searchTerm, value);
    setUnifiedTrips(filteredTrips);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1);
    setHasMore(true);
    // Apply filters immediately
    setFilters({
      search: searchTerm || undefined,
      destination: selectedDestination || undefined,
      recommendationType: value || undefined
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDestination('');
    setSelectedType('');
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
  }, [hasMore, loading, loadingMore, loadMoreHistory, combinedItems]);
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    setAllLoadedHistory([]); // Clear accumulated history when filters change
    setLoadingMore(false);
  }, [searchTerm, selectedDestination, selectedType]);

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
  const filterUnifiedTrips = (trips: UnifiedTrip[], searchTerm: string, destination: string) => {
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
      
      // Destination filter
      if (destination) {
        if (trip.destination.toLowerCase() !== destination.toLowerCase()) {
          return false;
        }
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
      const filteredTrips = filterUnifiedTrips(trips, searchTerm, selectedDestination);
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
  useEffect(() => {
    const combined: CombinedItem[] = [];
    
    // Add individual recommendations
    if (showIndividual) {
      sortedHistory.forEach(item => {
        combined.push({ type: 'individual', data: item });
      });
    }
    
    // Add unified trips
    if (showUnified) {
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
    
    setCombinedItems(combined);
  }, [sortedHistory, sortedUnifiedTrips, showIndividual, showUnified]);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <BackToHomeButton onClick={onBack} />

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/60 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchTermChange(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition-all duration-200"
              />
            </div>
            
            {/* Destination Filter */}
            <div className="sm:w-48">
              <select
                value={selectedDestination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition-all duration-200"
              >
                <option value="">All</option>
                {destinations.map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>
            
            {/* Type Filter */}
            <div className="sm:w-40">
              <select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition-all duration-200"
              >
                <option value="">All</option>
                {recommendationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {/* Clear Button */}
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200 text-sm font-medium border border-slate-200 whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Trip Type Filter Chips */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/60 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Type</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowIndividual(!showIndividual)}
                className={`group relative px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-md ${
                  showIndividual
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full transition-colors ${
                    showIndividual ? 'bg-white' : 'bg-slate-400'
                  }`}></div>
                  <span className="text-sm font-semibold">Individual</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    showIndividual ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {combinedItems.filter(item => item.type === 'individual').length}
                  </span>
                </span>
              </button>
              <button
                onClick={() => setShowUnified(!showUnified)}
                className={`group relative px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-md ${
                  showUnified
                    ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-violet-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full transition-colors ${
                    showUnified ? 'bg-white' : 'bg-slate-400'
                  }`}></div>
                  <span className="text-sm font-semibold">Unified Trips</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    showUnified ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {combinedItems.filter(item => item.type === 'unified').length}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Count Display */}
        {(showIndividual || showUnified) && (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/60 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {showIndividual && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Individual</span>
                  <span className="text-sm font-bold text-blue-600">
                    {loading ? '...' : combinedItems.filter(item => item.type === 'individual').length}
                  </span>
                </div>
              )}
              
              {showUnified && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Unified</span>
                  <span className="text-sm font-bold text-violet-600">
                    {unifiedTripsLoading ? '...' : combinedItems.filter(item => item.type === 'unified').length}
                  </span>
                </div>
              )}
            </div>
            
            {/* Filter Status */}
            {(searchTerm || selectedDestination || selectedType) && (
              <div className="pt-3 border-t border-slate-200 mt-3">
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg">
                      {searchTerm}
                    </span>
                  )}
                  {selectedDestination && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-lg">
                      {selectedDestination}
                    </span>
                  )}
                  {selectedType && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-lg">
                      {selectedType}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Combined Results - Show items sorted by creation date (most recent first) */}
        {!loading && !error && (showIndividual || showUnified) && combinedItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
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