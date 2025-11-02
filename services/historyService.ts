import axios from 'axios';
import { authService } from './authService';
import { getBackendUrl, isCapacitor } from '../utils/capacitorUtils';

// Determine API URL based on environment
const getApiUrl = () => {
  const backendUrl = getBackendUrl();
  
  // If in Capacitor (mobile app), use full production URL
  if (isCapacitor()) {
    return `${backendUrl}/api/history`;
  }
  
  // Check if we're in production (web deployment)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // In production web, API is on the same domain
    return '/api/history';
  }
  
  // Development fallback
  return backendUrl.endsWith('/api/history') ? backendUrl : `${backendUrl}/api/history`;
};

const API_URL = getApiUrl();

export interface TripContext {
  tripId?: string;
  sharedData: {
    destination: string;
    startDate: string;
    endDate?: string;
    days: number;
    persons: number;
    budget: string;
    language: string;
    currency: string;
    coveredDestinations?: any[];
  };
}

export interface RecommendationHistory {
  id: string;
  recommendationType: 'itinerary' | 'apps' | 'food' | 'music' | 'lingo' | 'packing' | 'unified';
  destination: string;
  language: string;
  requestData: any;
  responseData: any;
  title?: string;
  tags?: string[];
  notes?: string;
  tripContext?: TripContext;
  tripId?: string;
  tripName?: string;
  created_at: string;
  updated_at?: string;
  
  // Summary fields for display (computed from response_data)
  total_items_count?: number;
}

export interface UnifiedTrip {
  tripId: string;
  tripName?: string;
  destination: string;
  language: string;
  created_at: string;
  questionnaireData?: any;
  // UnifiedPlan structure
  itinerary?: any;
  packingList?: any;
  foodRecommendations?: any;
  appRecommendations?: any;
  musicRecommendations?: any;
  lingoRecommendations?: any;
  // For list view
  recommendation_count?: number;
  recommendation_types?: string[];
}

export interface SaveRecommendationRequest {
  recommendationType: 'itinerary' | 'apps' | 'food' | 'music' | 'lingo' | 'packing';
  destination: string;
  language?: string;
  requestData: any;
  responseData: any;
  title?: string;
  tags?: string[];
  notes?: string;
  tripContext?: TripContext;
  tripId?: string;
  tripName?: string;
  prompt?: string;
}

export interface UpdateRecommendationRequest {
  title?: string;
  tags?: string[];
  notes?: string;
}

export interface HistoryFilters {
  search?: string;
  destination?: string;
  tags?: string[];
  recommendationType?: string;
}

export interface HistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HistoryResponse {
  data: RecommendationHistory[];
  pagination: HistoryPagination;
}

class HistoryService {
  // Save recommendation to history
  async saveRecommendation(data: SaveRecommendationRequest): Promise<RecommendationHistory> {
    const headers = authService.getAuthHeaders();
    const response = await axios.post(`${API_URL}/save`, data, { headers });
    return response.data.data;
  }

  // Get user's recommendation history
  async getHistory(
    page: number = 1,
    limit: number = 10,
    filters: HistoryFilters = {}
  ): Promise<HistoryResponse> {
    const headers = authService.getAuthHeaders();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters.search) params.append('search', filters.search);
    if (filters.destination) params.append('destination', filters.destination);
    if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));
    if (filters.recommendationType) params.append('recommendationType', filters.recommendationType);

    const response = await axios.get(`${API_URL}/history?${params.toString()}`, { headers });
    return response.data;
  }

  // Get specific recommendation by ID
  async getRecommendation(id: string): Promise<RecommendationHistory> {
    const headers = authService.getAuthHeaders();
    const response = await axios.get(`${API_URL}/${id}`, { headers });
    return response.data.data;
  }

  // Get specific recommendation by ID (alias for consistency)
  async getRecommendationById(id: string): Promise<RecommendationHistory> {
    return this.getRecommendation(id);
  }

  // Get specific recommendation by ID (public - for sharing)
  async getPublicRecommendationById(id: string): Promise<RecommendationHistory> {
    const response = await axios.get(`${API_URL}/share/${id}`);
    return response.data.data;
  }

  // Get unified trip by ID (public - for sharing)
  async getPublicUnifiedTripById(tripId: string): Promise<UnifiedTrip> {
    const response = await axios.get(`${API_URL}/share/unified-trips/${tripId}`);
    return response.data.data;
  }

  // Update recommendation
  async updateRecommendation(
    id: string,
    data: UpdateRecommendationRequest
  ): Promise<RecommendationHistory> {
    const headers = authService.getAuthHeaders();
    const response = await axios.put(`${API_URL}/${id}`, data, { headers });
    return response.data.data;
  }

  // Delete recommendation
  async deleteRecommendation(id: string): Promise<void> {
    const headers = authService.getAuthHeaders();
    await axios.delete(`${API_URL}/${id}`, { headers });
  }

  // Get user's destinations for filter dropdown
  async getUserDestinations(): Promise<string[]> {
    const headers = authService.getAuthHeaders();
    const response = await axios.get(`${API_URL}/filters/destinations`, { headers });
    return response.data.data;
  }

  // Get user's tags for filter dropdown
  async getUserTags(): Promise<string[]> {
    const headers = authService.getAuthHeaders();
    const response = await axios.get(`${API_URL}/filters/tags`, { headers });
    return response.data.data;
  }

  // Get recommendation types for filter dropdown
  async getRecommendationTypes(): Promise<string[]> {
    const headers = authService.getAuthHeaders();
    const response = await axios.get(`${API_URL}/filters/types`, { headers });
    return response.data.data;
  }

  // Get recommendations by trip context
  async getRecommendationsByTrip(tripId: string): Promise<RecommendationHistory[]> {
    const headers = authService.getAuthHeaders();
    const response = await axios.get(`${API_URL}/trip/${tripId}`, { headers });
    return response.data.data;
  }

  // Helper method to determine the type of recommendation based on response data
  getRecommendationType(responseData: any): string {
    if (responseData.categories) return 'lingo';
    if (responseData.musicCategories) return 'music';
    if (responseData.clothingAndFootwear) return 'packing';
    if (responseData.iconicDishes) return 'food';
    if (responseData.transportAndTravel) return 'apps';
    if (responseData.plan) return 'itinerary';
    return 'unknown';
  }

  // Helper method to get a default title based on recommendation type and destination
  generateDefaultTitle(type: string, destination: string): string {
    const typeNames = {
      lingo: 'Lingo Guide',
      music: 'Music Playlist',
      packing: 'Packing List',
      food: 'Food Guide',
      apps: 'App Recommendations',
      itinerary: 'Trip Itinerary',
      unknown: 'Recommendation'
    };

    const typeName = typeNames[type as keyof typeof typeNames] || typeNames.unknown;
    const date = new Date().toLocaleDateString();
    return `${typeName} for ${destination} - ${date}`;
  }

  // Helper method to extract summary from response data
  getRecommendationSummary(responseData: any, type: string): string {
    switch (type) {
      case 'apps':
        const totalApps = Object.values(responseData).reduce((total: number, category: any) => {
          return total + (Array.isArray(category) ? category.length : 0);
        }, 0);
        return `${totalApps} apps recommended across ${Object.keys(responseData).length} categories`;
      
      case 'food':
        const totalFoodItems = Object.values(responseData).reduce((total: number, category: any) => {
          return total + (Array.isArray(category) ? category.length : 0);
        }, 0);
        return `${totalFoodItems} food items across ${Object.keys(responseData).length} categories`;
      
      case 'music':
        const totalSongs = responseData.musicCategories?.reduce((total: number, category: any) => {
          return total + (category.music ? category.music.length : 0);
        }, 0) || 0;
        return `${totalSongs} songs across ${responseData.musicCategories?.length || 0} genres`;
      
      case 'lingo':
        const totalPhrases = responseData.categories?.reduce((total: number, category: any) => {
          return total + (category.phrases ? category.phrases.length : 0);
        }, 0) || 0;
        return `${totalPhrases} phrases across ${responseData.categories?.length || 0} categories`;
      
      case 'packing':
        const totalItems = Object.values(responseData).reduce((total: number, category: any) => {
          return total + (Array.isArray(category) ? category.length : 0);
        }, 0);
        return `${totalItems} items across ${Object.keys(responseData).length} categories`;
      
      case 'itinerary':
        const days = responseData.days || 'N/A';
        const destinations = responseData.coveredDestinations?.length || 0;
        return `${days}-day itinerary covering ${destinations} destinations`;
      
      default:
        return 'Recommendation generated';
    }
  }

  // Helper method to get icon for recommendation type
  getRecommendationIcon(type: string): string {
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
  }

  // Helper method to get display name for recommendation type
  getRecommendationTypeName(type: string): string {
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
  }

  // Unified Trip Methods
  async getUnifiedTrips(page: number = 1, limit: number = 10): Promise<UnifiedTrip[]> {
    const headers = authService.getAuthHeaders();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${API_URL}/unified-trips?${params}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch unified trips: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async getUnifiedTrip(tripId: string): Promise<UnifiedTrip> {
    const headers = authService.getAuthHeaders();
    const response = await fetch(`${API_URL}/unified-trips/${tripId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch unified trip: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async deleteUnifiedTrip(tripId: string): Promise<void> {
    const headers = authService.getAuthHeaders();
    const response = await fetch(`${API_URL}/unified-trips/${tripId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete unified trip: ${response.statusText}`);
    }
  }

  // Get token usage statistics
  async getTokenUsageStats(): Promise<any> {
    const headers = authService.getAuthHeaders();
    const response = await axios.get(`${API_URL}/token-usage`, { headers });
    return response.data.data;
  }
}

export const historyService = new HistoryService();