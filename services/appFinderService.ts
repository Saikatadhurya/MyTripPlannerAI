import { GoogleGenAI } from "@google/genai";
import { AppFinderRequestData, AppRecommendations } from '../types';

export const generateAppRecommendations = async (data: AppFinderRequestData): Promise<AppRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { destination, language } = data;

  const prompt = `
    You are a tech-savvy local guide and an expert global travel assistant. Your mission is to provide a traveler with a curated list of the most useful, relevant, and currently available mobile apps for their trip to ${destination}. Your recommendations MUST include popular local alternatives to global apps.

    **CRITICAL INSTRUCTIONS:**
    1.  **Use Google Search:** You MUST use your search capabilities to find currently available applications and their ratings for ${destination}.
    2.  **Local Expertise is Key:** For each category, you must find both the internationally known apps (e.g., Uber) AND their popular local competitors. This is crucial for an authentic travel experience. For example, for Delhi, India, in 'Transport', you MUST include Uber, but also critical local competitors like Ola and the popular bike-taxi app Rapido.
    3.  **Fetch Ratings:** For each app, you MUST find its current rating on both the Apple App Store and Google Play Store. Populate the \`appStoreRating\` and \`playStoreRating\` fields with the rating as a string (e.g., "4.7"). If an app is not on a platform or a rating is not available, omit that specific rating field.
    4.  **Find Links:** Provide direct download links from the official Apple App Store or Google Play Store if available. Otherwise, omit the field.
    5.  **Categorize Accurately:** Place each app in ONE of the specified categories. If a category has no relevant apps after an exhaustive search, return an empty array for it.

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
      return JSON.parse(jsonString);
  } catch (e) {
      console.error("Failed to parse JSON from AI response after cleaning (app recommendations):", e);
      console.error("Cleaned JSON string that failed:", jsonString);
      console.error("Original AI response:", resultText);
      throw new Error("The AI returned an invalid response format. Please try again.");
  }
};