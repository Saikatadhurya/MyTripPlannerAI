import axios from 'axios';
import { authService } from './authService';

const API_URL = '/api/usage';

export interface QuotaInfo {
  weekly_limit: number;
  used_count: number;
  remaining: number;
}

export interface QuotasResponse {
  success: boolean;
  quotas: Record<string, QuotaInfo>;
}

export async function fetchQuotas(): Promise<Record<string, QuotaInfo>> {
  const headers = authService.getAuthHeaders();
  console.log('Fetching quotas with headers:', headers);
  console.log('API URL:', `${API_URL}/quotas`);
  
  try {
    const res = await axios.get(`${API_URL}/quotas`, { headers });
    console.log('Quotas response:', res.data);
    return res.data.quotas as Record<string, QuotaInfo>;
  } catch (error: any) {
    console.error('Error fetching quotas:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
}

export async function incrementUsage(featureId: string): Promise<void> {
  const headers = authService.getAuthHeaders();
  console.log('Incrementing usage for feature:', featureId, 'with headers:', headers);
  
  try {
    const res = await axios.post(`${API_URL}/increment`, { featureId }, { headers });
    console.log('Increment usage response:', res.data);
    
    // Trigger a custom event to notify components to refresh quotas
    window.dispatchEvent(new CustomEvent('quotasUpdated', { detail: { featureId } }));
  } catch (error: any) {
    console.error('Error incrementing usage:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    if (error.response?.status === 429) {
      const message = error.response?.data?.message || 'Weekly limit reached';
      throw new Error(message);
    }
    throw error;
  }
}


