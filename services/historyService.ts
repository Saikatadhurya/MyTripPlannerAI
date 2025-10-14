import axios from 'axios';
import { authService } from './authService';

const API_URL = '/api/history';

export interface AppRecommendationHistory {
  id: string;
  destination: string;
  language: string;
  requestData: any;
  responseData: any;
  title?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  // Summary counts for display
  transport_apps_count?: number;
  food_apps_count?: number;
  stay_apps_count?: number;
  entertainment_apps_count?: number;
  shopping_apps_count?: number;
  exploration_apps_count?: number;
  utilities_apps_count?: number;
  festivals_apps_count?: number;
}

export interface SaveAppRecommendationRequest {
  destination: string;
  language?: string;
  requestData: any;
  responseData: any;
  title?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateAppRecommendationRequest {
  title?: string;
  tags?: string[];
  notes?: string;
}

export interface HistoryFilters {
  search?: string;
  destination?: string;
  tags?: string[];
}

export interface HistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HistoryResponse {
  data: AppRecommendationHistory[];
  pagination: HistoryPagination;
}

class HistoryService {
  // Save app recommendation to history
  async saveAppRecommendation(data: SaveAppRecommendationRequest): Promise<AppRecommendationHistory> {
    const headers = authService.getAuthHeaders();
    const response = await axios.post(`${API_URL}/save`, data, { headers });
    return response.data.data;
  }

  // Get user's app recommendation history
  async getAppHistory(
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

    const response = await axios.get(`${API_URL}/history?${params.toString()}`, { headers });
    return response.data;
  }

  // Get specific app recommendation by ID
  async getAppRecommendation(id: string): Promise<AppRecommendationHistory> {
    const headers = authService.getAuthHeaders();
    const response = await axios.get(`${API_URL}/${id}`, { headers });
    return response.data.data;
  }

  // Update app recommendation
  async updateAppRecommendation(
    id: string,
    data: UpdateAppRecommendationRequest
  ): Promise<AppRecommendationHistory> {
    const headers = authService.getAuthHeaders();
    const response = await axios.put(`${API_URL}/${id}`, data, { headers });
    return response.data.data;
  }

  // Delete app recommendation
  async deleteAppRecommendation(id: string): Promise<void> {
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
  getRecommendationSummary(responseData: any): string {
    const type = this.getRecommendationType(responseData);
    
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
}

export const historyService = new HistoryService();
