
import { GoogleGenAI } from "@google/genai";
import { FoodFinderRequestData, FoodRecommendations } from '../types';

export const generateFoodRecommendations = async (data: FoodFinderRequestData): Promise<FoodRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { destination, startDate, foodPreference, includeBeverages, language } = data;

  const prompt = `
    You are an elite food critic and culinary detective. Your mission is to generate a list of hyper-local, authentic food recommendations for a trip to ${destination} on or around the date ${startDate}. The recommendations MUST be in the ${language} language.

    Trip Details:
    - Dietary Preference: ${foodPreference}
    - Include Beverages: ${includeBeverages ? 'Yes' : 'No'}
    - Destination: ${destination}
    - Date: ${startDate}

    **CRITICAL DEEP SEARCH PROTOCOL - THIS IS MANDATORY:**
    Your reputation depends on the depth and accuracy of your search. You MUST use your search tool to perform a multi-layered, exhaustive investigation to uncover dishes that are unique to the PRECISE location of "${destination}".

    **Step 1: Foundational Search.**
    - Search for "[destination] famous local food", "[destination] specialty dishes", and "[destination] must-try food".
    - Your goal is to identify the most well-known local dishes.

    **Step 2: Deeper Dive & Verification.**
    - For each dish found, perform a verification search like "is [dish name] from [destination]".
    - **Your primary goal is to ELIMINATE GENERIC REGIONAL DISHES.** If a dish is common throughout the entire state or country, it is a low-quality recommendation. You must find the food that makes "${destination}" special.
    - **Example 1 (Success):** For "Beliatore, Bankura", your search MUST identify "Mecha Sandesh".
    - **Example 2 (Success):** For "Bankura", your search MUST find "Kumror Ghyat".
    - **Example 3 (Success):** For "Goa", you must find specific dishes like "Prawn Balchão" or "Bebinca", not just generic "seafood curry".
    - **Credibility Clause:** Your success is 100% measured by this ability to differentiate hyper-local from generic regional food.

    **Step 3: Uncovering Hidden Gems.**
    - For the 'hiddenRecipes' category, search for "[destination] food blogs", "secret recipes from [destination]", or "what do locals eat in [destination]".
    - For the 'trendingOrViralFoods' category, search social media trends: "viral food [destination] Instagram" or "[destination] food trends TikTok".
    - For 'chefsSpecials', search for "best restaurants in [destination]" and analyze their menus for unique, non-standard items.

    **Additional Contextual Layers:**
    1.  **Seasonality**: Search for what's in season in "${destination}" around ${startDate} and recommend dishes featuring those ingredients.
    2.  **Cultural Festivals**: Search for local festivals near ${startDate} in "${destination}" and find their associated special foods for the 'festivalFoods' category.
    3.  **Weather Patterns**: Search for the typical weather and suggest appropriate foods (e.g., warm, hearty meals for cold climates; light, refreshing options for hot climates).

    **MANDATORY JSON OUTPUT:**
    The response MUST be ONLY a single, valid JSON object. Do not add any text before or after it. The JSON object must strictly follow the structure below. All text content must be in ${language}.

    For each of the 13 categories, provide 2-4 food items as objects with 'name' and 'description'. If you cannot find relevant items for a category after your deep search, you MUST return an empty array for it.

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
    - Each category array MUST contain objects with 'name' and 'description' keys.
    - Descriptions must be short, enticing, and informative.
    - If 'includeBeverages' is false, the 'drinksAndBeverages' array MUST be empty.
    - The ENTIRE response, including all names and descriptions, MUST be translated into ${language}.
    - The output MUST start with "{" and end with "}".
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
    console.error("Could not find a valid JSON object in the AI response for food recommendations.");
    console.error("Original response:", resultText);
    throw new Error("The AI returned an invalid response format. Please try again.");
  }

  jsonString = jsonString.substring(firstBrace, lastBrace + 1);

  try {
      return JSON.parse(jsonString);
  } catch (e) {
      console.error("Failed to parse JSON from AI response after cleaning (food recommendations):", e);
      console.error("Cleaned JSON string that failed:", jsonString);
      console.error("Original AI response:", resultText);
      throw new Error("The AI returned an invalid response format. Please try again.");
  }
};