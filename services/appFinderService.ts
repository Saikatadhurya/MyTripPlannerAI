import { GoogleGenAI } from "@google/genai";
import { AppFinderRequestData, AppRecommendations } from '../types';

// Helper function to get/set from sessionStorage for improved caching.
const getFromSessionCache = (key: string): AppRecommendations | null => {
    try {
        const cachedData = sessionStorage.getItem(key);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
    } catch (error) {
        console.error("Failed to read from session cache:", error);
        // If reading fails, clear the corrupted item to prevent future errors.
        sessionStorage.removeItem(key);
    }
    return null;
};

const setInSessionCache = (key: string, data: AppRecommendations): void => {
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error("Failed to write to session cache:", error);
    }
};

export const generateAppRecommendations = async (data: AppFinderRequestData): Promise<AppRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const { destination, language } = data;
  const cacheKey = `app-recs-${destination.trim().toLowerCase()}-${language}`;

  const cachedResult = getFromSessionCache(cacheKey);
  if (cachedResult) {
    console.log(`[Cache HIT] for ${destination}`);
    return cachedResult;
  }
  console.log(`[Cache MISS] for ${destination}. Fetching from AI...`);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a tech-savvy local guide and an expert global travel assistant. Your mission is to provide a traveler with a curated list of the most useful, relevant, and currently available mobile apps for their trip to ${destination}. Your recommendations MUST include popular local alternatives to global apps.

    **CRITICAL INSTRUCTIONS:**
    1.  **Use Google Search:** You MUST use your search capabilities to find currently available applications and their ratings for ${destination}.
    2.  **Local Expertise is Key:** For each category, you must find both the internationally known apps (e.g., Uber) AND their popular local competitors. This is crucial for an authentic travel experience. For example, for Delhi, India, in 'Transport', you MUST include Uber, but also critical local competitors like Ola and the popular bike-taxi app Rapido.
    3.  **Fetch Ratings:** For each app, you MUST find its current rating on both the Apple App Store and Google Play Store. Populate the \`appStoreRating\` and \`playStoreRating\` fields with the rating as a string (e.g., "4.7"). If an app is not on a platform or a rating is not available, omit that specific rating field.
    4.  **Find Links:** Provide direct download links from the official Apple App Store or Google Play Store if available. Otherwise, omit the field.
    5.  **Categorize Accurately:** Place each app in ONE of the specified categories. If a category has no relevant apps after an exhaustive search, return an empty array for it.
    6.  **Stability over Completeness:** It is more important to return a valid, stable JSON response than to fill every single optional field. If you cannot find a specific rating or URL, omit that field but still return the rest of the app's information.

    The response MUST be ONLY a single, valid JSON object that strictly follows this structure. All text content must be in ${language}.

    JSON Structure:
    {
      "destination": "${destination}",
      "transportAndTravel": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl"?: "string", "playStoreUrl"?: "string", "icon": "emoji", "appStoreRating"?: "string", "playStoreRating"?: "string" }],
      "stayAndLiving": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl"?: "string", "playStoreUrl"?: "string", "icon": "emoji", "appStoreRating"?: "string", "playStoreRating"?: "string" }],
      "foodAndDining": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl"?: "string", "playStoreUrl"?: "string", "icon": "emoji", "appStoreRating"?: "string", "playStoreRating"?: "string" }],
      "entertainmentAndLeisure": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl"?: "string", "playStoreUrl"?: "string", "icon": "emoji", "appStoreRating"?: "string", "playStoreRating"?: "string" }],
      "shoppingAndEssentials": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl"?: "string", "playStoreUrl"?: "string", "icon": "emoji", "appStoreRating"?: "string", "playStoreRating"?: "string" }],
      "explorationAndTours": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl"?: "string", "playStoreUrl"?: "string", "icon": "emoji", "appStoreRating"?: "string", "playStoreRating"?: "string" }],
      "utilitiesAndSafety": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl"?: "string", "playStoreUrl"?: "string", "icon": "emoji", "appStoreRating"?: "string", "playStoreRating"?: "string" }],
      "festivalsAndSeasonal": [{ "name": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "appStoreUrl"?: "string", "playStoreUrl"?: "string", "icon": "emoji", "appStoreRating"?: "string", "playStoreRating"?: "string" }]
    }

    **CRITICAL RULES & EXAMPLE:**
    1.  **Icon:** The 'icon' field MUST be a single, relevant emoji.
    2.  **Language:** The entire JSON response, including all names and descriptions, MUST be in ${language}.
    3.  **Validity:** The output MUST be a perfectly valid JSON object starting with { and ending with }. No markdown or extra text. Use single quotes inside strings to avoid breaking JSON.
    4.  **Example of a good entry:** For a transport app in Delhi, a good entry would be:
        \`{ "name": "Rapido", "description": "India's largest bike taxi platform, offering quick and affordable rides, especially for solo commuters navigating traffic.", "platform": "Both", "appStoreUrl": "https://apps.apple.com/in/app/rapido-bike-taxi-auto/id1198464606", "playStoreUrl": "https://play.google.com/store/apps/details?id=com.rapido.passenger", "icon": "🏍️", "appStoreRating": "4.8", "playStoreRating": "4.5" }\`
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
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
      setInSessionCache(cacheKey, recommendations);
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