

import { GoogleGenAI } from "@google/genai";
import { AppFinderRequestData, AppRecommendations } from '../types';

export const generateAppRecommendations = async (data: AppFinderRequestData): Promise<AppRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const { destination, language } = data;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a tech-savvy local guide and an expert global travel assistant. Your mission is to provide a traveler with a curated list of the most useful, relevant, and currently available mobile apps for their trip to ${destination}. Your recommendations MUST include popular local alternatives to global apps.

    **CRITICAL INSTRUCTIONS & PROTOCOL:**
    1.  **Use Google Search:** You MUST use your search capabilities to find currently available applications for ${destination}.
    2.  **Local Expertise is Key:** For each category, you must find both internationally known apps (e.g., Uber) AND their popular local competitors. This is crucial. For example, for Delhi, India, in 'Transport', you MUST include Uber, but also critical local competitors like Ola and Rapido.
    3.  **Ultra-Reliable Link Sourcing Protocol (MANDATORY):** For every single app you consider, you MUST follow this strict two-step process to source its store links. This is the most important instruction.
        -   **Step 1: Find the Official Website.** Use Google Search to find the app's OFFICIAL homepage. This is your only trusted source. For example, for 'Bolt', you must find 'bolt.eu'. For 'Zomato', find 'zomato.com'.
        -   **Step 2: Extract Links from the Official Source.** Once on the official website, you must locate the "Download on the App Store" and "Get it on Google Play" links. The URLs you provide in the final JSON **MUST** come directly from this official source. You are forbidden from using URLs found on blogs, news articles, or other secondary sources.
        -   **Step 3: Validate and Discard.**
            -   After extracting the URLs, validate them against the required patterns: \`https://play.google.com/store/apps/details?id=...\` and \`https://apps.apple.com/...\`.
            -   **FAILURE CONDITION:** If you cannot find the official website, or if the official website does not provide direct links to the app stores, you **MUST DISCARD THAT APP** from your results. Do not guess or use unreliable links. It is better to return fewer apps with 100% accurate links than more apps with broken links.
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
      return recommendations;
  } catch (e) {
      console.error("Failed to parse JSON from AI response after cleaning (app recommendations):", e);
      console.error("Cleaned JSON string that failed:", jsonString);
      console.error("Original AI response:", resultText);
      throw new Error("The AI returned an invalid response format. Please try again.");
  }
};
