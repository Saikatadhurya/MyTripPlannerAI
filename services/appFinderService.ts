


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
    3.  **DO NOT PROVIDE URLs:** You are strictly forbidden from providing any App Store or Play Store URLs. Your only task is to identify the app's name and platform.
    4.  **DO NOT FETCH RATINGS:** You MUST NOT spend time searching for app ratings. The goal is a fast response.
    5.  **Categorize Accurately:** Place each app in ONE of the specified categories. If a category has no relevant apps after an exhaustive search, return an empty array for it.

    The response MUST be ONLY a single, valid JSON object that strictly follows this structure. All text content must be in ${language}.

    JSON Structure:
    {
      "destination": "${destination}",
      "transportAndTravel": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji" }],
      "stayAndLiving": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji" }],
      "foodAndDining": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji" }],
      "entertainmentAndLeisure": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji" }],
      "shoppingAndEssentials": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji" }],
      "explorationAndTours": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji" }],
      "utilitiesAndSafety": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji" }],
      "festivalsAndSeasonal": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji" }]
    }

    **CRITICAL RULES & EXAMPLE:**
    1.  **App Naming Convention (CRITICAL):** The 'name' field MUST be the proper, official name of the app (e.g., "Google Maps", "AllTrails", "Uber Eats"). It MUST NOT be a generic category. For example, for the app 'AllTrails', the name MUST be "AllTrails", NOT "hikes".
    2.  **Category (CRITICAL):** The 'category' field MUST be a short, one-word, lowercase description of the app's primary function (e.g., "hikes", "navigation", "food delivery"). For apps that are very famous and instantly recognizable by their icon (like Google Maps), you can make this category an empty string "". For others, it is mandatory.
    3.  **Icon:** The 'icon' field MUST be a single, relevant emoji.
    4.  **Language:** The entire JSON response, including all names and descriptions, MUST be in ${language}.
    5.  **Validity:** The output MUST be a perfectly valid JSON object starting with { and ending with }. No markdown or extra text. Use single quotes inside strings to avoid breaking JSON.
    6.  **Example of a good entry:**
        \`{ "name": "AllTrails", "category": "hikes", "description": "A popular app for discovering and navigating trekking trails...", "platform": "Both", "icon": "🌲" }\`
        \`{ "name": "Google Maps", "category": "", "description": "The world's most popular navigation app...", "platform": "Both", "icon": "🗺️" }\`
  `;
  
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
      attempts++;
      let resultText = '';
      try {
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                  tools: [{ googleSearch: {} }],
                  thinkingConfig: { thinkingBudget: 0 },
              }
          });

          resultText = response.text.trim();
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
              throw new Error("Could not find a valid JSON object in the AI response.");
          }

          jsonString = jsonString.substring(firstBrace, lastBrace + 1);
          return JSON.parse(jsonString); // Success
      } catch (error) {
          console.error(`Attempt ${attempts}/${maxAttempts} failed to generate and parse app recommendations:`, error);
          console.error("Original AI response for failed attempt:", resultText);
          if (attempts >= maxAttempts) {
              throw new Error("The AI returned an invalid response format. Please try again.");
          }
          await new Promise(resolve => setTimeout(resolve, 200));
      }
  }

  throw new Error("Failed to generate app recommendations after multiple attempts.");
};