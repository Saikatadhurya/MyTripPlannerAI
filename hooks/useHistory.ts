import { useState, useEffect, useCallback } from 'react';
import { historyService, RecommendationHistory, HistoryFilters, HistoryPagination, SaveRecommendationRequest } from '../services/historyService';
import { authService } from '../services/authService';

interface UseHistoryReturn {
  history: RecommendationHistory[];
  pagination: HistoryPagination | null;
  loading: boolean;
  error: string | null;
  destinations: string[];
  tags: string[];
  recommendationTypes: string[];
  filters: HistoryFilters;
  setFilters: (filters: HistoryFilters) => void;
  loadHistory: (page?: number) => Promise<void>;
  saveRecommendation: (data: SaveRecommendationRequest) => Promise<void>;
  updateRecommendation: (id: string, data: any) => Promise<void>;
  deleteRecommendation: (id: string) => Promise<void>;
  refreshHistory: () => Promise<void>;
  getRecommendationsByTrip: (tripId: string) => Promise<RecommendationHistory[]>;
}

export const useHistory = (): UseHistoryReturn => {
  const [history, setHistory] = useState<RecommendationHistory[]>([]);
  const [pagination, setPagination] = useState<HistoryPagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [recommendationTypes, setRecommendationTypes] = useState<string[]>([]);
  const [filters, setFilters] = useState<HistoryFilters>({});

  const loadHistory = useCallback(async (page: number = 1) => {
    // Check if user is authenticated before making API call
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await historyService.getHistory(page, 10, filters);
      setHistory(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadFilters = useCallback(async () => {
    // Check if user is authenticated before making API calls
    if (!authService.isAuthenticated()) {
      return;
    }
    
    try {
      const [destinationsData, tagsData, typesData] = await Promise.all([
        historyService.getUserDestinations(),
        historyService.getUserTags(),
        historyService.getRecommendationTypes()
      ]);
      setDestinations(destinationsData);
      setTags(tagsData);
      setRecommendationTypes(typesData);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  }, []);

  const saveRecommendation = useCallback(async (data: SaveRecommendationRequest) => {
    try {
      await historyService.saveRecommendation(data);
      // Refresh history after saving
      await loadHistory(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recommendation');
      throw err;
    }
  }, [loadHistory]);

  const updateRecommendation = useCallback(async (id: string, data: any) => {
    try {
      await historyService.updateRecommendation(id, data);
      // Refresh history after updating
      await loadHistory(pagination?.page || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recommendation');
      throw err;
    }
  }, [loadHistory, pagination?.page]);

  const deleteRecommendation = useCallback(async (id: string) => {
    try {
      await historyService.deleteRecommendation(id);
      // Refresh history after deleting
      await loadHistory(pagination?.page || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recommendation');
      throw err;
    }
  }, [loadHistory, pagination?.page]);

  const refreshHistory = useCallback(async () => {
    await loadHistory(pagination?.page || 1);
  }, [loadHistory, pagination?.page]);

  const getRecommendationsByTrip = useCallback(async (tripId: string): Promise<RecommendationHistory[]> => {
    try {
      return await historyService.getRecommendationsByTrip(tripId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trip recommendations');
      throw err;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadHistory();
    loadFilters();
  }, [loadHistory, loadFilters]);

  // Reload when filters change
  useEffect(() => {
    loadHistory(1);
  }, [filters, loadHistory]);

  return {
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
    saveRecommendation,
    updateRecommendation,
    deleteRecommendation,
    refreshHistory,
    getRecommendationsByTrip
  };
};