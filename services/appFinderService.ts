


import { GoogleGenAI } from "@google/genai";
import { AppFinderRequestData, AppRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';

export const generateAppRecommendations = async (data: AppFinderRequestData, onChunk: (chunk: string) => void): Promise<AppRecommendations> => {
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
  
  let fullText = '';
  try {
      const stream = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
              tools: [{ googleSearch: {} }],
          }
      });

      for await (const chunk of stream) {
          const chunkText = chunk.text;
          fullText += chunkText;
          onChunk(chunkText);
      }

      if (!fullText) {
          throw new Error("The AI returned an empty response.");
      }
      
      const jsonString = extractJson(fullText);
      const parsedJson = JSON.parse(jsonString);
      
      if (parsedJson.error && parsedJson.error.code) {
          const { code, message } = parsedJson.error;
          throw new Error(`[${code}] ${message}`);
      }

      const cleanedJson = cleanCitations(parsedJson);

      return cleanedJson;
  } catch (error) {
      console.error("Failed to generate and parse app recommendations stream:", error);
      console.error("Original AI response text accumulated:", fullText);
      
      if (error instanceof Error && error.message.startsWith('[')) {
          throw error;
      }

      if (fullText.toLowerCase().includes("quota") || fullText.toLowerCase().includes("rate limit")) {
          throw new Error("[429] You have exceeded the request limit. Please check your plan and billing details and try again later.");
      }
      if (fullText.toLowerCase().includes("overloaded") || fullText.toLowerCase().includes("server error")) {
           throw new Error("[503] The AI model is currently busy. Please wait a moment and try again.");
      }
      
      if (error instanceof SyntaxError) {
           throw new Error(`The AI's response was malformed and could not be read. Please try again.`);
      }
      if (error instanceof Error) {
          if (error.message.includes("Could not find a valid JSON object")) {
               throw new Error("The AI did not provide a structured response. It may have refused the request. Please adjust your query and try again.");
          }
      }
      
      throw new Error("The AI returned an invalid response format. Please try again.");
  }
};