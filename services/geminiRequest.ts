import { GoogleGenAI } from '@google/genai';
import {
  GEMINI_MODEL,
  GEMINI_MIN_INTERVAL_MS,
  sleep,
  isQuotaApiError,
  isTransientApiError,
} from './geminiModel';

let lastRequestTime = 0;
let requestQueue: Promise<void> = Promise.resolve();

/** Serialize Gemini calls with a minimum interval to avoid bursting past RPM limits */
export const throttleGeminiRequest = (): Promise<void> => {
  requestQueue = requestQueue.then(async () => {
    const now = Date.now();
    const wait = GEMINI_MIN_INTERVAL_MS - (now - lastRequestTime);
    if (wait > 0) {
      await sleep(wait);
    }
    lastRequestTime = Date.now();
  });
  return requestQueue;
};

export interface GeminiJsonOptions {
  useGoogleSearch?: boolean;
}

export const generateGeminiJson = async (
  ai: GoogleGenAI,
  contents: string,
  options: GeminiJsonOptions = {}
): Promise<string> => {
  await throttleGeminiRequest();

  const config: Record<string, unknown> = {
    thinkingConfig: { thinkingBudget: 0 },
    responseMimeType: 'application/json',
  };
  if (options.useGoogleSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const maxTransientRetries = 2;

  for (let retry = 0; retry <= maxTransientRetries; retry++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config,
      });
      const text = response.text?.trim() ?? '';
      if (!text) {
        throw new Error('The AI returned an empty response.');
      }
      return text;
    } catch (error) {
      if (isQuotaApiError(error)) {
        throw error;
      }
      if (isTransientApiError(error) && retry < maxTransientRetries) {
        await sleep(3000 * (retry + 1));
        continue;
      }
      throw error;
    }
  }

  throw new Error('The AI returned an empty response.');
};
