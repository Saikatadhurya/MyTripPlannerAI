// Usage tracking functionality has been removed
// This file is kept for compatibility but is no longer used

export interface QuotaInfo {
  weekly_limit: number;
  used_count: number;
  remaining: number;
}

export interface QuotasResponse {
  success: boolean;
  quotas: Record<string, QuotaInfo>;
}

// Placeholder function - not used
export async function fetchQuotas(): Promise<Record<string, QuotaInfo>> {
  return {};
}

// Placeholder function - not used
export async function incrementUsage(featureId: string): Promise<void> {
  // No-op
}