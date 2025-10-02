import { useState, useEffect } from 'react';
import { fetchQuotas } from '../services/usageService';
import { User } from '../services/authService';

export interface QuotaInfo {
  weekly_limit: number;
  used_count: number;
  remaining: number;
}

export function useQuotas(user: User | null) {
  const [quotas, setQuotas] = useState<Record<string, QuotaInfo>>({});
  const [quotasLoading, setQuotasLoading] = useState<boolean>(false);

  const refetchQuotas = async () => {
    if (!user) {
      console.log('useQuotas: No user, clearing quotas');
      setQuotas({});
      setQuotasLoading(false);
      return;
    }
    console.log('useQuotas: Fetching quotas for user:', user.email);
    setQuotasLoading(true);
    try {
      const q = await fetchQuotas();
      console.log('useQuotas: Received quotas:', q);
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

  return { quotas, quotasLoading, refetchQuotas };
}
