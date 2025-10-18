import React, { useState, useEffect } from 'react';
import { useHistory } from '../hooks/useHistory';
import { RecommendationHistory, UnifiedTrip } from '../services/historyService';
import BackToHomeButton from './BackToHomeButton';
import { historyService } from '../services/historyService';

interface UnifiedTripItemProps {
  trip: UnifiedTrip;
  onView: (trip: UnifiedTrip) => void;
  onDelete: (tripId: string) => void;
}

const UnifiedTripItem: React.FC<UnifiedTripItemProps> = ({ trip, onView, onDelete }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-violet-50/30 rounded-2xl shadow-lg border border-white/60 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden group">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-2xl">🗺️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {trip.tripName || `${trip.destination} Trip`}
                </h3>
                <p className="text-blue-100 text-sm">{trip.destination}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/30">
              Unified Trip
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-blue-100 text-sm">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDate(trip.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>{trip.language}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{trip.recommendation_count} recommendations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Recommendation types */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Included Features</h4>
          <div className="flex flex-wrap gap-2">
            {trip.recommendation_types.map((type, index) => (
              <span key={index} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${getTypeColor(type)}`}>
                <span className="text-base">{getTypeIcon(type)}</span>
                <span className="capitalize">{type}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onView(trip)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-violet-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group-hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Complete Trip
          </button>
          <button
            onClick={() => onDelete(trip.tripId)}
            className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-all duration-300 border border-red-200 hover:border-red-300 flex items-center justify-center"
            title="Delete Trip"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  onEdit: (item: RecommendationHistory) => void;
  onDelete: (id: string) => void;
  onView: (item: RecommendationHistory) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onEdit, onDelete, onView }) => {
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

  const getTypeName = (type: string) => {
    const names = {
      apps: 'App Recommendations',
      food: 'Food Guide',
      music: 'Music Playlist',
      lingo: 'Lingo Guide',
      packing: 'Packing List',
      itinerary: 'Trip Itinerary',
      unknown: 'Recommendation'
    };
    return names[type as keyof typeof names] || names.unknown;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSummary = (item: RecommendationHistory) => {
    if (item.total_items_count !== undefined) {
      return `${item.total_items_count} items recommended`;
    }
    return 'Recommendation generated';
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50/20 to-violet-50/20 rounded-2xl shadow-lg border border-white/60 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden group">
      {/* Header with gradient background */}
      <div className={`bg-gradient-to-r ${getTypeColor(item.recommendationType)} p-6 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-2xl">{getTypeIcon(item.recommendationType)}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {item.title || getTypeName(item.recommendationType)}
                </h3>
                <p className="text-white/80 text-sm">{item.destination}</p>
              </div>
            </div>
            <span className={`px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/30 ${getTypeAccentColor(item.recommendationType)}`}>
              {item.recommendationType}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDate(item.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>{item.language}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{getSummary(item)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg border border-gray-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onView(item)}
            className={`flex-1 bg-gradient-to-r ${getTypeColor(item.recommendationType)} text-white px-4 py-3 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group-hover:scale-105`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </button>
          <button
            onClick={() => onEdit(item)}
            className="px-4 py-3 bg-green-50 text-green-600 rounded-xl font-semibold hover:bg-green-100 transition-all duration-300 border border-green-200 hover:border-green-300 flex items-center justify-center"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-all duration-300 border border-red-200 hover:border-red-300 flex items-center justify-center"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

interface EditModalProps {
  item: RecommendationHistory | null;
  onClose: () => void;
  onSave: (id: string, data: { title: string; tags: string[]; notes: string }) => void;
}

const EditModal: React.FC<EditModalProps> = ({ item, onClose, onSave }) => {
  const [title, setTitle] = useState(item?.title || '');
  const [tags, setTags] = useState(item?.tags?.join(', ') || '');
  const [notes, setNotes] = useState(item?.notes || '');

  const handleSave = () => {
    if (item) {
      onSave(item.id, {
        title,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        notes
      });
    }
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Recommendation</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a title..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., apps, travel, food"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
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

  const [editingItem, setEditingItem] = useState<RecommendationHistory | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedDestination, setSelectedDestination] = useState(filters.destination || '');
  const [selectedType, setSelectedType] = useState(filters.recommendationType || '');
  
  // Unified trip state
  const [unifiedTrips, setUnifiedTrips] = useState<UnifiedTrip[]>([]);
  const [allUnifiedTrips, setAllUnifiedTrips] = useState<UnifiedTrip[]>([]); // Store all trips for filtering
  const [unifiedTripsLoading, setUnifiedTripsLoading] = useState(false);
  
  // Trip type visibility state
  const [showIndividual, setShowIndividual] = useState<boolean>(true);
  const [showUnified, setShowUnified] = useState<boolean>(true);
  
  // Count state
  const [totalIndividualCount, setTotalIndividualCount] = useState<number>(0);
  const [totalUnifiedCount, setTotalUnifiedCount] = useState<number>(0);

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
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
    setFilters({});
    
    // Clear unified trip filters
    setUnifiedTrips(allUnifiedTrips);
  };

  const handleEdit = (item: RecommendationHistory) => {
    setEditingItem(item);
  };

  const handleSaveEdit = async (id: string, data: { title: string; tags: string[]; notes: string }) => {
    try {
      await updateRecommendation(id, data);
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to update recommendation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recommendation?')) {
      try {
        await deleteRecommendation(id);
      } catch (error) {
        console.error('Failed to delete recommendation:', error);
      }
    }
  };

  const handleView = (item: RecommendationHistory) => {
    // Navigate to the appropriate result page based on recommendation type
    onNavigateToResult(item.recommendationType, item.responseData, item.requestData, true); // true = isHistoryView
  };

  // Count handlers
  const loadTotalCounts = async () => {
    try {
      // Load total individual count (without filters)
      const individualResponse = await historyService.getHistory(1, 1, {});
      setTotalIndividualCount(individualResponse.pagination.total);
      
      // For unified trips, we'll load all trips to get accurate count
      // This is not ideal for performance, but the API doesn't provide total count
      const allUnifiedTrips = await historyService.getUnifiedTrips(1, 1000); // Load up to 1000 trips
      setTotalUnifiedCount(allUnifiedTrips.length);
    } catch (error) {
      console.error('Failed to load total counts:', error);
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
    setUnifiedTripsLoading(true);
    try {
      const trips = await historyService.getUnifiedTrips();
      setAllUnifiedTrips(trips); // Store all trips
      
      // Apply current filters
      const filteredTrips = filterUnifiedTrips(trips, searchTerm, selectedDestination);
      setUnifiedTrips(filteredTrips);
    } catch (error) {
      console.error('Failed to load unified trips:', error);
    } finally {
      setUnifiedTripsLoading(false);
    }
  };

  const handleViewUnifiedTrip = async (trip: UnifiedTrip) => {
    try {
      const fullTrip = await historyService.getUnifiedTrip(trip.tripId);
      // Navigate to unified result view with all recommendations
      onNavigateToResult('unified', fullTrip, fullTrip.questionnaireData, true);
    } catch (error) {
      console.error('Failed to load unified trip:', error);
    }
  };

  const handleDeleteUnifiedTrip = async (tripId: string) => {
    if (window.confirm('Are you sure you want to delete this unified trip? This will delete all associated recommendations.')) {
      try {
        await historyService.deleteUnifiedTrip(tripId);
        setUnifiedTrips(prev => prev.filter(trip => trip.tripId !== tripId));
        setAllUnifiedTrips(prev => prev.filter(trip => trip.tripId !== tripId));
        setTotalUnifiedCount(prev => prev - 1);
      } catch (error) {
        console.error('Failed to delete unified trip:', error);
      }
    }
  };

  // Load unified trips and total counts when component mounts
  useEffect(() => {
    loadUnifiedTrips();
    loadTotalCounts();
  }, []);

  // Update counts when filters change
  useEffect(() => {
    if (pagination) {
      setTotalIndividualCount(pagination.total);
    }
  }, [pagination]);


  const handlePageChange = (page: number) => {
    loadHistory(page);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <BackToHomeButton onClick={onBack} />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">Your History</h1>
          <p className="text-slate-600">Manage and explore your past recommendations</p>
        </div>

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-lg rounded-xl p-4 shadow-md border border-white/50 mb-6">
          <div className="space-y-4">
            {/* Search Bar - Full Width */}
            <div className="w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchTermChange(e.target.value)}
                placeholder="Search recommendations..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            {/* Filters Row - Responsive */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <select
                  value={selectedDestination}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All destinations</option>
                  {destinations.map(dest => (
                    <option key={dest} value={dest}>{dest}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All types</option>
                  {recommendationTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Clear Button Only */}
            <div className="flex justify-end">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Trip Type Filter Chips */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/60 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Filter by Type</span>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowIndividual(!showIndividual)}
                className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  showIndividual
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    showIndividual ? 'bg-white' : 'bg-slate-400'
                  }`}></div>
                  <span className="text-sm font-semibold">Individual</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    showIndividual ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {history.length}
                  </span>
                </span>
              </button>
              <button
                onClick={() => setShowUnified(!showUnified)}
                className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  showUnified
                    ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    showUnified ? 'bg-white' : 'bg-slate-400'
                  }`}></div>
                  <span className="text-sm font-semibold">Unified Trips</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    showUnified ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {unifiedTrips.length}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Count Display */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/60 mb-6">
          <div className="space-y-4">
            {/* Count Items - Stack on Mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              {showIndividual && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex-shrink-0 shadow-sm"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">Individual Recommendations</span>
                    <span className="text-sm font-bold text-blue-600">
                      {loading ? '...' : `${history.length}${pagination ? ` of ${pagination.total}` : ''}`}
                    </span>
                    {(searchTerm || selectedDestination || selectedType) && pagination && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        filtered from {totalIndividualCount}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {showUnified && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full flex-shrink-0 shadow-sm"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">Unified Trips</span>
                    <span className="text-sm font-bold text-violet-600">
                      {unifiedTripsLoading ? '...' : `${unifiedTrips.length}${allUnifiedTrips.length > 0 ? ` of ${allUnifiedTrips.length}` : ''}`}
                    </span>
                    {(searchTerm || selectedDestination) && allUnifiedTrips.length > 0 && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        filtered from {totalUnifiedCount}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Filter Status - Stack on Mobile */}
            {(searchTerm || selectedDestination || selectedType) && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Filters</span>
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium border border-blue-200">
                        🔍 Search: "{searchTerm}"
                      </span>
                    )}
                    {selectedDestination && (
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-full font-medium border border-green-200">
                        📍 Destination: {selectedDestination}
                      </span>
                    )}
                    {selectedType && (
                      <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium border border-purple-200">
                        🏷️ Type: {selectedType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Loading History</h3>
            <p className="text-slate-600">Fetching your recommendations...</p>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-800 px-6 py-4 rounded-2xl mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                <span className="text-red-600">⚠️</span>
              </div>
              <div>
                <h4 className="font-semibold">Error Loading History</h4>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !showIndividual && !showUnified && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">👆</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Select Trip Types to View</h3>
            <p className="text-slate-600 max-w-md mx-auto">Click on the filter chips above to show individual recommendations or unified trips. You can view both types simultaneously!</p>
          </div>
        )}

        {!loading && !error && showIndividual && history.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Individual Recommendations Found</h3>
            <p className="text-slate-600 max-w-md mx-auto">Start generating recommendations to see them here! Try creating an itinerary, packing list, or food guide.</p>
          </div>
        )}

        {!loading && !error && showUnified && unifiedTrips.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-100 to-violet-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🗺️</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Unified Trips Found</h3>
            <p className="text-slate-600 max-w-md mx-auto">Create a comprehensive trip plan to see it here! Unified trips include itinerary, packing, food, apps, music, and language guides all in one.</p>
          </div>
        )}

        {/* Combined Results */}
        {!loading && !error && (showIndividual || showUnified) && (history.length > 0 || unifiedTrips.length > 0) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Individual Recommendations */}
              {showIndividual && history.map(item => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ))}
              
              {/* Unified Trips */}
              {showUnified && unifiedTrips.map(trip => (
                <UnifiedTripItem
                  key={trip.tripId}
                  trip={trip}
                  onView={handleViewUnifiedTrip}
                  onDelete={handleDeleteUnifiedTrip}
                />
              ))}
            </div>

            {/* Pagination - Only show for individual recommendations */}
            {showIndividual && pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 bg-white/60 text-slate-800 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-slate-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 bg-white/60 text-slate-800 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Loading State for Unified Trips */}
        {unifiedTripsLoading && showUnified && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-violet-100 to-violet-200 rounded-2xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Loading Unified Trips</h3>
            <p className="text-slate-600">Fetching your comprehensive trip plans...</p>
          </div>
        )}

        {/* Modals */}
        <EditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      </div>
    </div>
  );
};

export default History;