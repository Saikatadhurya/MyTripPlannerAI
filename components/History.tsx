import React, { useState, useEffect } from 'react';
import { useHistory } from '../hooks/useHistory';
import { RecommendationHistory, UnifiedTrip } from '../services/historyService';
import BackToHomeButton from './BackToHomeButton';
import { historyService } from '../services/historyService';
import Toast from './Toast';

interface UnifiedTripItemProps {
  trip: UnifiedTrip;
  onView: (trip: UnifiedTrip) => void;
  onDelete: (tripId: string) => void;
  onShareTrip: (trip: UnifiedTrip) => void;
}

const UnifiedTripItem: React.FC<UnifiedTripItemProps> = ({ trip, onView, onDelete, onShareTrip }) => {
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
            View & Share Trip
          </button>
          <button
            onClick={() => onShareTrip(trip)}
            className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:border-blue-300 flex items-center justify-center"
            title="Share Trip"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
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
  onShare: (item: RecommendationHistory) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onEdit, onDelete, onView, onShare }) => {
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
            View & Share
          </button>
          <button
            onClick={() => onShare(item)}
            className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:border-blue-300 flex items-center justify-center"
            title="Share"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
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
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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
      // Failed to update recommendation
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recommendation?')) {
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
    try {
      const shareUrl = `${window.location.origin}/share/${item.id}`;
      await navigator.clipboard.writeText(shareUrl);
      
      setToast({ message: 'Shareable link copied to clipboard!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to copy link. Please try again.', type: 'error' });
    }
  };

  const handleShareTrip = async (trip: UnifiedTrip) => {
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

  // Get sorted items
  const sortedHistory = sortByTime(history);
  const sortedUnifiedTrips = sortByTime(unifiedTrips);

  const handlePageChange = (page: number) => {
    loadHistory(page);
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <BackToHomeButton onClick={onBack} />
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl text-white">📚</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Your History
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Discover, manage, and revisit your travel recommendations and trip plans</p>
        </div>

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
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
              />
            </div>
            
            {/* Destination Filter */}
            <div className="sm:w-48">
              <select
                value={selectedDestination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
              >
                <option value="">All destinations</option>
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
              >
                <option value="">All types</option>
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
              <div className="w-6 h-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                <span className="text-slate-600 text-xs">🎯</span>
              </div>
              <span className="text-sm font-semibold text-slate-700">Filter by Type</span>
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
                    {sortedHistory.length}
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
                    {sortedUnifiedTrips.length}
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
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex-shrink-0 shadow-sm"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">Individual Recommendations</span>
                    <span className="text-sm font-bold text-blue-600">
                      {loading ? '...' : `${sortedHistory.length}${pagination ? ` of ${pagination.total}` : ''}`}
                    </span>
                  </div>
                </div>
              )}
              
              {showUnified && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full flex-shrink-0 shadow-sm"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">Unified Trips</span>
                    <span className="text-sm font-bold text-violet-600">
                      {unifiedTripsLoading ? '...' : `${sortedUnifiedTrips.length}${allUnifiedTrips.length > 0 ? ` of ${allUnifiedTrips.length}` : ''}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Filter Status */}
            {(searchTerm || selectedDestination || selectedType) && (
              <div className="pt-4 border-t border-slate-200 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                    <span className="text-amber-600 text-xs">🔍</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Active Filters</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-lg border border-blue-200">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {selectedDestination && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-lg border border-green-200">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Destination: {selectedDestination}
                    </span>
                  )}
                  {selectedType && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-lg border border-purple-200">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Type: {selectedType}
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
            <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 rounded-3xl flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Loading Your History</h3>
            <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">Please wait while we fetch your recommendations and trip plans...</p>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-800 px-8 py-6 rounded-3xl shadow-lg mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Error Loading History</h3>
            </div>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Combined Results - Show first if any content is available */}
        {!loading && !error && (showIndividual || showUnified) && (sortedHistory.length > 0 || sortedUnifiedTrips.length > 0) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
              {/* Individual Recommendations */}
              {showIndividual && sortedHistory.map(item => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onShare={handleShare}
                />
              ))}
              
              {/* Unified Trips */}
              {showUnified && sortedUnifiedTrips.map(trip => (
                <UnifiedTripItem
                  key={trip.tripId}
                  trip={trip}
                  onView={handleViewUnifiedTrip}
                  onDelete={handleDeleteUnifiedTrip}
                  onShareTrip={handleShareTrip}
                />
              ))}
            </div>

            {/* Pagination - Only show for individual recommendations */}
            {showIndividual && pagination && pagination.totalPages > 1 && (
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/60">
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-2xl hover:from-slate-200 hover:to-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
                  >
                    ← Previous
                  </button>
                  <div className="px-6 py-3 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-2xl hover:from-slate-200 hover:to-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty States - Only show when no content is available */}
        {!loading && !error && !showIndividual && !showUnified && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 rounded-3xl flex items-center justify-center shadow-lg">
              <span className="text-4xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Select Trip Types to View</h3>
            <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">Click on the filter chips above to show individual recommendations or unified trips. You can view both types simultaneously!</p>
          </div>
        )}

        {/* Individual Empty State - Only show if individual is selected but no results */}
        {!loading && !error && showIndividual && sortedHistory.length === 0 && !showUnified && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 rounded-3xl flex items-center justify-center shadow-lg">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">No Individual Recommendations Found</h3>
            <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">Start generating recommendations to see them here! Try creating an itinerary, packing list, or food guide.</p>
          </div>
        )}

        {/* Unified Empty State - Only show if unified is selected but no results */}
        {!loading && !error && showUnified && sortedUnifiedTrips.length === 0 && !showIndividual && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-violet-100 via-violet-200 to-violet-300 rounded-3xl flex items-center justify-center shadow-lg">
              <span className="text-4xl">🗺️</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">No Unified Trips Found</h3>
            <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">Create a comprehensive trip plan to see it here! Unified trips include itinerary, packing, food, apps, music, and language guides all in one.</p>
          </div>
        )}

        {/* Both Empty State - Only show if both are selected but no results */}
        {!loading && !error && showIndividual && showUnified && sortedHistory.length === 0 && sortedUnifiedTrips.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 rounded-3xl flex items-center justify-center shadow-lg">
              <span className="text-4xl">📭</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">No Recommendations Found</h3>
            <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">Start creating recommendations to see them here! Try generating an itinerary, packing list, food guide, or create a comprehensive unified trip plan.</p>
          </div>
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