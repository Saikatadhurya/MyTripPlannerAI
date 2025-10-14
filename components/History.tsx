import React, { useState } from 'react';
import { useHistory } from '../hooks/useHistory';
import { AppRecommendationHistory } from '../services/historyService';
import BackToHomeButton from './BackToHomeButton';

interface HistoryItemProps {
  item: AppRecommendationHistory;
  onEdit: (item: AppRecommendationHistory) => void;
  onDelete: (id: string) => void;
  onView: (item: AppRecommendationHistory) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onEdit, onDelete, onView }) => {
  const getTypeIcon = (tags: string[] = []) => {
    if (tags.includes('apps')) return '📱';
    if (tags.includes('food')) return '🍽️';
    if (tags.includes('music')) return '🎵';
    if (tags.includes('lingo')) return '🗣️';
    if (tags.includes('packing')) return '🎒';
    if (tags.includes('itinerary')) return '🗺️';
    return '📋';
  };

  const getTypeName = (tags: string[] = []) => {
    if (tags.includes('apps')) return 'App Recommendations';
    if (tags.includes('food')) return 'Food Guide';
    if (tags.includes('music')) return 'Music Playlist';
    if (tags.includes('lingo')) return 'Lingo Guide';
    if (tags.includes('packing')) return 'Packing List';
    if (tags.includes('itinerary')) return 'Trip Itinerary';
    return 'Recommendation';
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

  const getSummary = (item: AppRecommendationHistory) => {
    if (item.transport_apps_count !== undefined) {
      const totalApps = (item.transport_apps_count || 0) + (item.food_apps_count || 0) + 
                       (item.stay_apps_count || 0) + (item.entertainment_apps_count || 0) + 
                       (item.shopping_apps_count || 0) + (item.exploration_apps_count || 0) + 
                       (item.utilities_apps_count || 0) + (item.festivals_apps_count || 0);
      return `${totalApps} apps recommended`;
    }
    return 'Recommendation generated';
  };

  return (
    <div className="bg-white/60 backdrop-blur-lg rounded-xl p-6 shadow-md border border-white/50 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getTypeIcon(item.tags)}</span>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {item.title || getTypeName(item.tags)}
            </h3>
            <p className="text-sm text-slate-600">{item.destination}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(item)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-slate-600 mb-2">{getSummary(item)}</p>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{formatDate(item.created_at)}</span>
        <span className="capitalize">{item.language}</span>
      </div>
    </div>
  );
};

interface EditModalProps {
  item: AppRecommendationHistory | null;
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

interface ViewModalProps {
  item: AppRecommendationHistory | null;
  onClose: () => void;
}

const ViewModal: React.FC<ViewModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Recommendation Details</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Request Data</h4>
            <pre className="bg-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
              {formatJson(item.requestData)}
            </pre>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Response Data</h4>
            <pre className="bg-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
              {formatJson(item.responseData)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

const History: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const {
    history,
    pagination,
    loading,
    error,
    destinations,
    tags,
    filters,
    setFilters,
    loadHistory,
    updateRecommendation,
    deleteRecommendation
  } = useHistory();

  const [editingItem, setEditingItem] = useState<AppRecommendationHistory | null>(null);
  const [viewingItem, setViewingItem] = useState<AppRecommendationHistory | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedDestination, setSelectedDestination] = useState(filters.destination || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);

  const handleSearch = () => {
    setFilters({
      search: searchTerm || undefined,
      destination: selectedDestination || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDestination('');
    setSelectedTags([]);
    setFilters({});
  };

  const handleEdit = (item: AppRecommendationHistory) => {
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

  const handleView = (item: AppRecommendationHistory) => {
    setViewingItem(item);
  };

  const handlePageChange = (page: number) => {
    loadHistory(page);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <BackToHomeButton onBack={onBack} />
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Your History</h1>
          <p className="text-lg text-slate-600">View and manage your past recommendations</p>
        </div>

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-lg rounded-xl p-6 shadow-md border border-white/50 mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, destination, or notes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Destination</label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All destinations</option>
                {destinations.map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
              <select
                multiple
                value={selectedTags}
                onChange={(e) => {
                  const values = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
                  setSelectedTags(values);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Clear Filters
            </button>
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

        {!loading && !error && history.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No recommendations found</h3>
            <p className="text-slate-600">Start generating recommendations to see them here!</p>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
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

        {/* Modals */}
        <EditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
        
        <ViewModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
        />
      </div>
    </div>
  );
};

export default History;
