
import { GoogleGenAI } from "@google/genai";
import { AppFinderRequestData, AppRecommendations } from '../types';

// Cache configuration
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to get/set from localStorage with an expiration time.
const getFromLocalStorage = (key: string): AppRecommendations | null => {
    try {
        const cachedItem = localStorage.getItem(key);
        if (cachedItem) {
            const { timestamp, data } = JSON.parse(cachedItem);
            // Check if cache is expired
            if (Date.now() - timestamp < CACHE_EXPIRATION_MS) {
                return data;
            } else {
                // Cache expired, remove it.
                localStorage.removeItem(key);
            }
        }
    } catch (error) {
        console.error("Failed to read from local storage:", error);
        // If reading fails, clear the corrupted item to prevent future errors.
        localStorage.removeItem(key);
    }
    return null;
};

const setInLocalStorage = (key: string, data: AppRecommendations): void => {
    try {
        const item = {
            timestamp: Date.now(),
            data: data,
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
        console.error("Failed to write to local storage:", error);
    }
};

export const generateAppRecommendations = async (data: AppFinderRequestData): Promise<AppRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const { destination, language } = data;
  const cacheKey = `app-recs-${destination.trim().toLowerCase()}-${language}`;

  const cachedResult = getFromLocalStorage(cacheKey);
  if (cachedResult) {
    console.log(`[Cache HIT] for ${destination}`);
    return cachedResult;
  }
  console.log(`[Cache MISS] for ${destination}. Fetching from AI...`);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a tech-savvy local guide and an expert global travel assistant. Your mission is to provide a traveler with a curated list of the most useful, relevant, and currently available mobile apps for their trip to ${destination}. Your recommendations MUST include popular local alternatives to global apps.

    **CRITICAL INSTRUCTIONS:**
    1.  **Use Google Search:** You MUST use your search capabilities to find currently available applications for ${destination}.
    2.  **Local Expertise is Key:** For each category, you must find both internationally known apps (e.g., Uber) AND their popular local competitors. This is crucial. For example, for Delhi, India, in 'Transport', you MUST include Uber, but also critical local competitors like Ola and Rapido.
    3.  **Find Store Links (CRITICAL & MANDATORY):** For every single app you recommend, you MUST find and include the direct download URLs for both the Apple App Store (\`appStoreUrl\`) and the Google Play Store (\`playStoreUrl\`). This is not optional.
        - If an app is available on both platforms, both \`appStoreUrl\` and \`playStoreUrl\` fields MUST be populated with valid URLs.
        - If an app is exclusive to one platform (e.g., 'iOS'), provide the link for that platform and set the other URL field to \`null\`.
        - If you absolutely cannot find the store links for an app, DO NOT INCLUDE THAT APP IN YOUR RESPONSE. It is better to return fewer apps with correct links than more apps without them.
    4.  **DO NOT FETCH RATINGS:** You MUST NOT spend time searching for app ratings. The goal is a fast response.
    5.  **Categorize Accurately:** Place each app in ONE of the specified categories. If a category has no relevant apps after an exhaustive search, return an empty array for it.

    The response MUST be ONLY a single, valid JSON object that strictly follows this structure. All text content must be in ${language}.

    JSON Structure:
    {
      "destination": "${destination}",
      "transportAndTravel": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl": "string | null", "playStoreUrl": "string | null", "icon": "emoji" }],
      "stayAndLiving": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl": "string | null", "playStoreUrl": "string | null", "icon": "emoji" }],
      "foodAndDining": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl": "string | null", "playStoreUrl": "string | null", "icon": "emoji" }],
      "entertainmentAndLeisure": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl": "string | null", "playStoreUrl": "string | null", "icon": "emoji" }],
      "shoppingAndEssentials": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl": "string | null", "playStoreUrl": "string | null", "icon": "emoji" }],
      "explorationAndTours": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl": "string | null", "playStoreUrl": "string | null", "icon": "emoji" }],
      "utilitiesAndSafety": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl": "string | null", "playStoreUrl": "string | null", "icon": "emoji" }],
      "festivalsAndSeasonal": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl": "string | null", "playStoreUrl": "string | null", "icon": "emoji" }]
    }

    **CRITICAL RULES & EXAMPLE:**
    1.  **Icon:** The 'icon' field MUST be a single, relevant emoji.
    2.  **Language:** The entire JSON response, including all names and descriptions, MUST be in ${language}.
    3.  **Validity:** The output MUST be a perfectly valid JSON object starting with { and ending with }. No markdown or extra text. Use single quotes inside strings to avoid breaking JSON.
    4.  **Example of a good entry:**
        \`{ "name": "Rapido", "description": "India's largest bike taxi platform, offering quick and affordable rides, especially for solo commuters navigating traffic.", "platform": "Both", "appStoreUrl": "https://apps.apple.com/in/app/rapido-bike-taxi-auto/id1198464606", "playStoreUrl": "https://play.google.com/store/apps/details?id=com.rapido.passenger", "icon": "🏍️" }\`
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      // Optimize for speed by disabling thinking.
      thinkingConfig: { thinkingBudget: 0 },
    }
  });

  const resultText = response.text.trim();
  if (!resultText) {
    throw new Error("AI response was empty or invalid.");
  }
  
  let jsonString = resultText;
    
  const markdownMatch = jsonString.match(/```(json)?([\s\S]*?)```/);
  if (markdownMatch && markdownMatch[2]) {
      jsonString = markdownMatch[2].trim();
  }

  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    console.error("Could not find a valid JSON object in the AI response for app recommendations.");
    console.error("Original response:", resultText);
    throw new Error("The AI returned an invalid response format. Please try again.");
  }

  jsonString = jsonString.substring(firstBrace, lastBrace + 1);

  try {
      const recommendations = JSON.parse(jsonString);
      // Cache the successful result before returning
      setInLocalStorage(cacheKey, recommendations);
      return recommendations;
  } catch (e) {
      console.error("Failed to parse JSON from AI response after cleaning (app recommendations):", e);
      console.error("Cleaned JSON string that failed:", jsonString);
      console.error("Original AI response:", resultText);
      throw new Error("The AI returned an invalid response format. Please try again.");
  }
};

export const prefetchAppRecommendationsForPopularDestinations = async (): Promise<void> => {
    console.log("Starting to pre-fetch app recommendations for popular destinations...");
    try {
        const response = await fetch('/data/destinations.json');
        if (!response.ok) {
            console.error("Failed to fetch popular destinations for pre-fetching.");
            return;
        }
        const popularDestinations: { name: string }[] = await response.json();
        
        // Use a common default language for pre-fetching.
        const defaultLanguage = 'English (en)';

        const prefetchPromises = popularDestinations.map(dest => {
            const requestData: AppFinderRequestData = {
                destination: dest.name,
                language: defaultLanguage,
            };
            // The generate function already handles caching, so it won't re-fetch if already present.
            return generateAppRecommendations(requestData).catch(error => {
                console.warn(`Failed to pre-fetch app recommendations for ${dest.name}:`, error.message);
                return null;
            });
        });

        await Promise.allSettled(prefetchPromises);
        console.log("Pre-fetching of app recommendations completed.");

    } catch (error) {
        console.error("An error occurred during the pre-fetching process:", error);
    }
};