export const GEMINI_MODEL = 'gemini-flash-latest';

/** Minimum gap between Gemini API calls (free tier ~15 RPM) */
export const GEMINI_MIN_INTERVAL_MS = 6000;

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const errorText = (error: unknown): string => {
  const err = error as { message?: string; status?: string; code?: number };
  return `${err?.message ?? ''} ${err?.status ?? ''} ${err?.code ?? ''}`.toLowerCase();
};

export const isQuotaApiError = (error: unknown): boolean => {
  const text = errorText(error);
  return (
    text.includes('429') ||
    text.includes('quota') ||
    text.includes('rate limit') ||
    text.includes('resource_exhausted') ||
    text.includes('exceeded')
  );
};

/** Only 503 / overload — safe to retry after a pause */
export const isTransientApiError = (error: unknown): boolean => {
  const text = errorText(error);
  return (
    text.includes('503') ||
    text.includes('unavailable') ||
    text.includes('overloaded') ||
    text.includes('high demand')
  );
};

export const formatQuotaError = (isUsingDefaultKey: boolean): string => {
  if (isUsingDefaultKey) {
    return '[429] The default API key has reached its quota limit. Please set your own Gemini API key in your profile settings to continue.';
  }
  return '[429] Gemini rate limit reached (free tier: ~15 requests/minute). Wait 60 seconds and try again. Create your API key in a new Google Cloud project at https://aistudio.google.com/api-keys for a fresh quota pool.';
};
