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
  const [activeTab, setActiveTab] = useState<'individual' | 'unified'>('individual');
  
  // Count state
  const [totalIndividualCount, setTotalIndividualCount] = useState<number>(0);
  const [totalUnifiedCount, setTotalUnifiedCount] = useState<number>(0);

  const handleSearch = () => {
    setFilters({
      search: searchTerm || undefined,
      destination: selectedDestination || undefined,
      recommendationType: selectedType || undefined
    });
    
    // Apply filters to unified trips immediately
    const filteredTrips = filterUnifiedTrips(allUnifiedTrips, searchTerm, selectedDestination);
    setUnifiedTrips(filteredTrips);
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

  // Apply filters to unified trips when filter values change
  useEffect(() => {
    if (allUnifiedTrips.length > 0) {
      const filteredTrips = filterUnifiedTrips(allUnifiedTrips, searchTerm, selectedDestination);
      setUnifiedTrips(filteredTrips);
    }
  }, [searchTerm, selectedDestination, allUnifiedTrips]);

  const handlePageChange = (page: number) => {
    loadHistory(page);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <BackToHomeButton onClick={onBack} />
        
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Your History</h1>
          <p className="text-sm text-slate-500">Manage your past recommendations</p>
        </div>

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-lg rounded-xl p-4 shadow-md border border-white/50 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search recommendations..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            <div className="min-w-40">
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All destinations</option>
                {destinations.map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>
            
            <div className="min-w-40">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All types</option>
                {recommendationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Apply
              </button>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/60 backdrop-blur-lg rounded-xl p-4 shadow-md border border-white/50 mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'individual'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Individual Recommendations
            </button>
            <button
              onClick={() => setActiveTab('unified')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'unified'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unified Trips
            </button>
          </div>
        </div>

        {/* Count Display */}
        <div className="bg-white/60 backdrop-blur-lg rounded-xl p-4 shadow-md border border-white/50 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Individual Recommendations:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {loading ? '...' : `${history.length}${pagination ? ` of ${pagination.total}` : ''}`}
                </span>
                {(searchTerm || selectedDestination || selectedType) && pagination && (
                  <span className="text-xs text-slate-500">
                    (filtered from {totalIndividualCount})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Unified Trips:</span>
                <span className="text-sm font-semibold text-violet-600">
                  {unifiedTripsLoading ? '...' : `${unifiedTrips.length}${allUnifiedTrips.length > 0 ? ` of ${allUnifiedTrips.length}` : ''}`}
                </span>
                {(searchTerm || selectedDestination) && allUnifiedTrips.length > 0 && (
                  <span className="text-xs text-slate-500">
                    (filtered from {totalUnifiedCount})
                  </span>
                )}
              </div>
            </div>
            
            {/* Filter Status */}
            {(searchTerm || selectedDestination || selectedType) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Filters applied:</span>
                <div className="flex gap-1">
                  {searchTerm && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {selectedDestination && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Destination: {selectedDestination}
                    </span>
                  )}
                  {selectedType && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      Type: {selectedType}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-slate-600">Loading history...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && activeTab === 'individual' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No recommendations found</h3>
            <p className="text-slate-600">Start generating recommendations to see them here!</p>
          </div>
        )}

        {!loading && !error && unifiedTrips.length === 0 && activeTab === 'unified' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No unified trips found</h3>
            <p className="text-slate-600">Create a unified trip plan to see it here!</p>
          </div>
        )}

        {/* Individual Recommendations */}
        {activeTab === 'individual' && !loading && !error && history.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {history.map(item => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
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

        {/* Unified Trips */}
        {activeTab === 'unified' && !unifiedTripsLoading && unifiedTrips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {unifiedTrips.map(trip => (
              <UnifiedTripItem
                key={trip.tripId}
                trip={trip}
                onView={handleViewUnifiedTrip}
                onDelete={handleDeleteUnifiedTrip}
              />
            ))}
          </div>
        )}

        {unifiedTripsLoading && activeTab === 'unified' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-slate-600">Loading unified trips...</p>
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