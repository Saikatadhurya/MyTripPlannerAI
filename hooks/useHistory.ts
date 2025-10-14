import { useState, useEffect, useCallback } from 'react';
import { historyService, AppRecommendationHistory, HistoryFilters, HistoryPagination } from '../services/historyService';

interface UseHistoryReturn {
  history: AppRecommendationHistory[];
  pagination: HistoryPagination | null;
  loading: boolean;
  error: string | null;
  destinations: string[];
  tags: string[];
  filters: HistoryFilters;
  setFilters: (filters: HistoryFilters) => void;
  loadHistory: (page?: number) => Promise<void>;
  saveRecommendation: (data: any) => Promise<void>;
  updateRecommendation: (id: string, data: any) => Promise<void>;
  deleteRecommendation: (id: string) => Promise<void>;
  refreshHistory: () => Promise<void>;
}

export const useHistory = (): UseHistoryReturn => {
  const [history, setHistory] = useState<AppRecommendationHistory[]>([]);
  const [pagination, setPagination] = useState<HistoryPagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<HistoryFilters>({});

  const loadHistory = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await historyService.getAppHistory(page, 10, filters);
      setHistory(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadFilters = useCallback(async () => {
    try {
      const [destinationsData, tagsData] = await Promise.all([
        historyService.getUserDestinations(),
        historyService.getUserTags()
      ]);
      setDestinations(destinationsData);
      setTags(tagsData);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  }, []);

  const saveRecommendation = useCallback(async (data: any) => {
    try {
      await historyService.saveAppRecommendation(data);
      // Refresh history after saving
      await loadHistory(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recommendation');
      throw err;
    }
  }, [loadHistory]);

  const updateRecommendation = useCallback(async (id: string, data: any) => {
    try {
      await historyService.updateAppRecommendation(id, data);
      // Refresh history after updating
      await loadHistory(pagination?.page || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recommendation');
      throw err;
    }
  }, [loadHistory, pagination?.page]);

  const deleteRecommendation = useCallback(async (id: string) => {
    try {
      await historyService.deleteAppRecommendation(id);
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
    filters,
    setFilters,
    loadHistory,
    saveRecommendation,
    updateRecommendation,
    deleteRecommendation,
    refreshHistory
  };
};
