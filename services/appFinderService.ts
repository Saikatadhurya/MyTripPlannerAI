import { GoogleGenAI } from "@google/genai";
import { AppFinderRequestData, AppRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';
import { CookieUtils } from './cookieUtils';
import { sleep, isQuotaApiError, isTransientApiError, formatQuotaError } from './geminiModel';
import { generateGeminiJson } from './geminiRequest';

export const generateAppRecommendations = async (data: AppFinderRequestData, onChunk?: (chunk: string) => void, userApiKey?: string): Promise<{result: AppRecommendations, prompt: string}> => {
  const { apiKey, isUsingDefaultKey } = await CookieUtils.getApiKeyWithSource(userApiKey);
  
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Invalid API key: key is empty or whitespace only");
  }
  const cleanApiKey = apiKey.trim();

  const { destination, language, coveredDestinations } = data;
  const ai = new GoogleGenAI({ apiKey: cleanApiKey });
  
  const isMultiStop = coveredDestinations && coveredDestinations.length > 1;
  const destinationsString = isMultiStop ? coveredDestinations.map(d => d.name).join(', ') : destination;

  let multiStopInstructions = '';
  if (isMultiStop) {
    multiStopInstructions = `
    This is a multi-stop trip covering: ${destinationsString}.
    **CRITICAL MULTI-STOP INSTRUCTIONS:**
    1.  Your recommendations MUST be relevant for the entire region, but you MUST prioritize finding popular **local apps for EACH destination**.
    2.  **MANDATORY 'location' field:** For each app specific to one location, populate 'location' with that city's name. For global apps like Google Maps, use "".
    `;
  }

  const buildPrompt = (reinforceJson: boolean) => `
    You are a tech-savvy local guide. Provide a curated list of useful mobile apps for a trip to ${destinationsString}, written in ${language}. Include global apps AND popular local alternatives.
    ${multiStopInstructions}

    **INSTRUCTIONS:**
    1. Use your knowledge of well-known travel apps for ${destinationsString}.
    2. For transport, include both Uber AND local competitors (e.g. Ola, Grab, Bolt).
    3. DO NOT provide App Store URLs or ratings.
    4. Recommend 2-3 apps per category maximum.
    5. If a category has no relevant apps, return an empty array.

    JSON Structure:
    {
      "destination": "${destination}",
      "transportAndTravel": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "stayAndLiving": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "foodAndDining": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "entertainmentAndLeisure": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "shoppingAndEssentials": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "explorationAndTours": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "utilitiesAndSafety": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "festivalsAndSeasonal": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }]
    }

    Rules: 'name' = official app name. 'category' = one lowercase word. 'icon' = single emoji. All text in ${language}.
    ${reinforceJson ? 'CRITICAL: Output ONLY raw JSON starting with { and ending with }. No markdown.' : ''}
  `;

  const prompt = buildPrompt(false);
  
  let fullText = '';
  try {
      const streamToUi = async (text: string) => {
        if (!onChunk) return;
        const chunkSize = 120;
        for (let i = 0; i < text.length; i += chunkSize) {
          onChunk(text.slice(i, i + chunkSize));
          await sleep(0);
        }
      };

      const parseAppsJson = (text: string) => {
        if (!text.includes('{')) {
          throw new Error("Could not find a valid JSON object in the AI response.");
        }
        const jsonString = extractJson(text);
        const parsedJson = JSON.parse(jsonString);

        if (parsedJson.error && parsedJson.error.code) {
          const { code, message } = parsedJson.error;
          throw new Error(`[${code}] ${message}`);
        }

        return cleanCitations(parsedJson);
      };

      let cleanedJson: ReturnType<typeof cleanCitations> | null = null;
      let lastAttemptError: unknown = null;

      for (const reinforceJson of [false, true]) {
        try {
          fullText = await generateGeminiJson(ai, buildPrompt(reinforceJson));
          cleanedJson = parseAppsJson(fullText);
          await streamToUi(fullText);
          break;
        } catch (attemptError) {
          lastAttemptError = attemptError;
          if (isQuotaApiError(attemptError)) throw attemptError;
        }
      }

      if (!cleanedJson) {
        if (lastAttemptError && isTransientApiError(lastAttemptError)) {
          throw new Error("[503] The AI model is currently busy. Please wait a moment and try again.");
        }
        throw lastAttemptError ?? new Error("The AI returned an empty response.");
      }

      return { result: cleanedJson, prompt };
  } catch (error) {
      console.error("Failed to generate and parse app recommendations:", error);
      console.error("Original AI response text accumulated:", fullText);
      
      if (error instanceof Error) {
        if (error.message.startsWith('[')) {
            throw error;
        }

        const combinedErrorText = (error.message + fullText).toLowerCase();

        if (isQuotaApiError(error) || combinedErrorText.includes("quota") || combinedErrorText.includes("429")) {
            throw new Error(formatQuotaError(isUsingDefaultKey));
        }
        if (combinedErrorText.includes("overloaded") || combinedErrorText.includes("503")) {
             throw new Error("[503] The AI model is currently busy. Please wait a moment and try again.");
        }
        
        if (error instanceof SyntaxError) {
             throw new Error(`The AI's response for the app finder was malformed and could not be read. Please try again.`);
        }
        if (error.message.includes("Could not find a valid JSON object")) {
             throw new Error("The AI did not provide a structured list of apps. It may have refused the request. Please adjust your query and try again.");
        }
    }
      
    throw new Error("The AI returned an invalid response format for the app finder. Please try again.");
  }
};
