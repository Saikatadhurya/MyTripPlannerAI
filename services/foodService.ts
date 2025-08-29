import { GoogleGenAI } from "@google/genai";
import { FoodFinderRequestData, FoodRecommendations } from '../types';

export const generateFoodRecommendations = async (data: FoodFinderRequestData): Promise<FoodRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { destination, startDate, foodPreference, includeBeverages, language } = data;

  const prompt = `
    As an expert in global cuisine and local food culture, generate a list of authentic food recommendations for a trip to ${destination} on or around the date ${startDate}. The recommendations must be in the ${language} language.

    Trip Details:
    - Dietary Preference: ${foodPreference}
    - Include Beverages: ${includeBeverages ? 'Yes' : 'No'}
    - Destination: ${destination}
    - Date: ${startDate}

    CRITICAL INSTRUCTION FOR HYPER-LOCAL ACCURACY:
    You MUST use your search capabilities to perform a deep-dive search for dishes that are unique and famous to the specific location of "${destination}". Do not provide generic regional dishes if a more specific local specialty exists. For example, if the user asks for "Beliatore, Bankura", your search should identify "Mecha Sandesh" as a famous local sweet. Your credibility depends on this level of detail and accuracy.

    Your recommendations should also be highly specific and reflect the following:
    1.  **Seasonality**: Suggest dishes that use ingredients at their peak during the specified time of year.
    2.  **Cultural Festivals**: If the date falls near a local festival (e.g., Diwali, Eid, Durga Puja), use your search tool to find special foods associated with it and include them in the 'festivalFoods' category.
    3.  **Weather Patterns**: Suggest foods appropriate for the typical weather of that region during that season (e.g., warm soups for cold weather, refreshing drinks for hot weather).
    4.  **Authenticity**: Focus on truly local and authentic dishes, including famous staples and hidden gems you discover through search.

    MANDATORY JSON OUTPUT:
    The response MUST be ONLY a single, valid JSON object and nothing else. Do not wrap it in markdown or any other text. The JSON object must strictly follow this structure and types. All text content must be in ${language}.

    For each of the 13 categories below, provide an array of 2-4 food items. Each item must be an object with a 'name' and a 'description'. If you cannot find relevant items for a category, you MUST return an empty array for it.

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

    CRITICAL RULES:
    - Each category array MUST contain objects with 'name' and 'description' keys.
    - Descriptions should be short, enticing, and informative (1-2 sentences).
    - If 'includeBeverages' is false, the 'drinksAndBeverages' array MUST be empty.
    - Ensure every string value is correctly escaped for valid JSON. Use single quotes inside strings if necessary, or escape double quotes (\\").
    - The ENTIRE JSON response, including all names and descriptions, must be translated into ${language}.
    - The output MUST start with "{" and end with "}". No other text should precede or follow the JSON object.
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