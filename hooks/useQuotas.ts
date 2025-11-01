import { useState, useEffect } from 'react';
import { fetchQuotas } from '../services/usageService';
import { User } from '../services/authService';
import { authService } from '../services/authService';

export interface QuotaInfo {
  weekly_limit: number;
  used_count: number;
  remaining: number;
}

export function useQuotas(user: User | null) {
  const [quotas, setQuotas] = useState<Record<string, QuotaInfo>>({});
  const [quotasLoading, setQuotasLoading] = useState<boolean>(false);

  const refetchQuotas = async (retryCount = 0) => {
    if (!user) {
      setQuotas({});
      setQuotasLoading(false);
      return;
    }

    // Check if we have a valid token before attempting to fetch
    const token = authService.getToken();
    if (!token) {
      if (retryCount < 20) { // Retry up to 20 times (2 seconds total)
        setTimeout(() => refetchQuotas(retryCount + 1), 100);
      } else {
        console.error('useQuotas: Token not available after retries, giving up');
        setQuotasLoading(false);
      }
      return;
    }

    setQuotasLoading(true);
    try {
      const q = await fetchQuotas();
      setQuotas(q);
    } catch (err) {
      console.error('useQuotas: Failed to fetch quotas', err);
      // Set empty quotas on error to prevent indefinite loading
      setQuotas({});
    } finally {
      setQuotasLoading(false);
    }
  };

  useEffect(() => {
    refetchQuotas();
  }, [user]);

  // Listen for quota updates and refresh automatically
  useEffect(() => {
    const handleQuotasUpdated = () => {
      refetchQuotas();
    };

    window.addEventListener('quotasUpdated', handleQuotasUpdated);
    return () => window.removeEventListener('quotasUpdated', handleQuotasUpdated);
  }, []);

  return { quotas, quotasLoading, refetchQuotas };
}
