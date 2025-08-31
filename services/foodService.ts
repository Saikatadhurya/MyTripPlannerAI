
import { GoogleGenAI } from "@google/genai";
import { FoodFinderRequestData, FoodRecommendations } from '../types';

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
      
      let jsonString = fullText;
      const markdownMatch = jsonString.match(/```(json)?([\s\S]*?)```/);
      if (markdownMatch && markdownMatch[2]) {
          jsonString = markdownMatch[2].trim();
      }

      const firstBrace = jsonString.indexOf('{');
      if (firstBrace === -1) {
          throw new Error("Could not find a valid JSON object in the AI response.");
      }

      let braceCount = 0;
      let lastBrace = -1;
      for (let i = firstBrace; i < jsonString.length; i++) {
        if (jsonString[i] === '{') {
          braceCount++;
        } else if (jsonString[i] === '}') {
          braceCount--;
        }
        if (braceCount === 0) {
          lastBrace = i;
          break;
        }
      }

      if (lastBrace === -1) {
          throw new Error("Could not find a complete JSON object in the AI response.");
      }

      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
      
      const parsedJson = JSON.parse(jsonString);

      if (parsedJson.error && parsedJson.error.code) {
          const { code, message } = parsedJson.error;
          throw new Error(`[${code}] ${message}`);
      }

      return parsedJson;
  } catch (error) {
      console.error("Failed to generate and parse food recommendations stream:", error);
      console.error("Original AI response text accumulated:", fullText);
      if (error instanceof Error && error.message.startsWith('[')) {
          throw error;
      }
      throw new Error("The AI returned an invalid response format. Please try again.");
  }
};
