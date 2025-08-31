


import { GoogleGenAI } from "@google/genai";
import { FoodFinderRequestData, FoodRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';

export const generateFoodRecommendations = async (data: FoodFinderRequestData, onChunk: (chunk: string) => void): Promise<FoodRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { destination, startDate, foodPreference, includeBeverages, language } = data;

  const prompt = `
    You are a Pragmatic Local Food Scout. Your primary mission is to return a useful, relevant, and populated list of food recommendations for a traveler visiting ${destination}.
    **CRITICAL FAILURE CONDITION:** Returning an empty or mostly empty list is a complete failure of your task. You must ALWAYS find something relevant.

    Trip Details:
    - Destination: ${destination}
    - Dietary Preference: ${foodPreference}
    - Date: ${startDate}
    - Include Beverages: ${includeBeverages ? 'Yes' : 'No'}
    - Language: ${language}

    **MANDATORY Blended Research Methodology:**
    You must perform a blended search. Do not stop if you can't find "unique" dishes. Your goal is to find what people love to eat there.

    1.  **Phase 1: Hyper-Local Search.** Begin by searching for dishes that are unique or originated in ${destination}. Use specific search terms like "${destination} famous food", "${destination} own dish". This is your top priority.

    2.  **Phase 2: Popular Regional Search.** Immediately after, and regardless of the results of Phase 1, you MUST broaden your search to find popular REGIONAL dishes that are commonly eaten and well-regarded in ${destination}. This is especially critical for smaller towns or cities that may not have many unique dishes. Use search terms like "best food in ${destination}", "popular restaurants in ${destination}".

    3.  **Phase 3: Synthesize and Contextualize.**
        - Combine the findings from both phases.
        - **This is NON-NEGOTIABLE:** For every dish that is a regional specialty rather than one unique to the city, you MUST add local context to its description. Your value is in telling the user *why* this regional dish is relevant to their trip to ${destination}.
        - **GOOD CONTEXT:** "Ghugni: A beloved Bengali street food made from chickpeas. You'll find excellent versions of it at the stalls in Durgapur's Benachity market."
        - **BAD CONTEXT:** "Ghugni: A chickpea curry."

    **MANDATORY JSON OUTPUT:**
    The response MUST be ONLY a single, valid JSON object that strictly follows this structure. All text content must be in ${language}. For each of the 13 categories, you should strive to provide 2-4 food items, using the blended methodology above. If a category is genuinely empty after an exhaustive search, return an empty array for it.

    JSON Structure:
    {
      "destination": "${destination}",
      "breakfast": [{ "name": "string", "description": "string" }],
      "lunch": [{ "name": "string", "description": "string" }],
      "snacksAndStreetFood": [{ "name": "string", "description": "string" }],
      "dinner": [{ "name": "string", "description": "string" }],
      "dessertAndSweets": [{ "name": "string", "description": "string" }],
      "drinksAndBeverages": [{ "name": "string", "description": "string" }],
      "iconicDishes": [{ "name": "string", "description": "string" }],
      "hiddenRecipes": [{ "name": "string", "description": "string" }],
      "trendingOrViralFoods": [{ "name": "string", "description": "string" }],
      "chefsSpecials": [{ "name": "string", "description": "string" }],
      "festivalFoods": [{ "name": "string", "description": "string" }],
      "seasonalSpecials": [{ "name": "string", "description": "string" }],
      "streetFestivalsAndFoodMelas": [{ "name": "string", "description": "string" }]
    }

    **CRITICAL JSON RULES:**
    - Prioritize populating 'iconicDishes', 'snacksAndStreetFood', 'lunch', 'dinner', and 'dessertAndSweets'. These should not be empty unless absolutely impossible.
    - Descriptions must be short, enticing, and informative, with local context where required.
    - If 'includeBeverages' is false, the 'drinksAndBeverages' array MUST be empty.
    - The ENTIRE response, including all names and descriptions, MUST be translated into ${language}.
    - The output MUST start with "{" and end with "}". No markdown, no introductory text.
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
      console.error("Failed to generate and parse food recommendations stream:", error);
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