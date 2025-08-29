
import { GoogleGenAI } from "@google/genai";
import { FoodFinderRequestData, FoodRecommendations } from '../types';

export const generateFoodRecommendations = async (data: FoodFinderRequestData): Promise<FoodRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { destination, startDate, foodPreference, includeBeverages, language } = data;

  const prompt = `
    You are a pragmatic Culinary Anthropologist. Your goal is to create a useful and satisfying list of food recommendations for a user traveling to ${destination}.
    Returning an empty or mostly empty list is a complete failure. You must adapt your research strategy based on the information available for the location.

    Trip Details:
    - Destination: ${destination}
    - Dietary Preference: ${foodPreference}
    - Date: ${startDate}
    - Include Beverages: ${includeBeverages ? 'Yes' : 'No'}
    - Language: ${language}

    **CORE DIRECTIVE: Two-Tier Research Strategy (MANDATORY)**

    **Tier 1: Hyper-Local Focus.**
    - Your first priority is to execute a deep search for dishes, recipes, or food items that are *truly unique* to ${destination}.
    - Use search queries like "[destination] special food", "[destination] own dish", "what to eat in [destination] that you can't find elsewhere".
    - This is the ideal outcome, and you should dedicate significant effort here first.

    **Tier 2: Intelligent Fallback - Local Favorites.**
    - **ACTIVATION CRITERIA**: You MUST activate this protocol if your Tier 1 search yields fewer than 5-7 total dishes across all categories. This is critical for less-documented towns.
    - **BROADENED SCOPE**: Shift your focus from 'unique' to 'popular and beloved'. Search for famous regional dishes (e.g., famous Bengali cuisine if the city is in West Bengal) that are known to be exceptionally popular or made particularly well in ${destination}.
    - **SEARCH QUERIES**: Use queries like "best restaurants in [destination]", "what do locals eat in [destination]", "[destination] food blogs".
    - **MANDATORY CONTEXTUALIZATION**: When you include a regional dish under this Tier 2 protocol, you MUST provide context in its description. This is non-negotiable.
        - **Good Example**: "Shorshe Ilish: A quintessential Bengali mustard fish curry, which the local restaurants in Durgapur are particularly famous for."
        - **Bad Example**: "Shorshe Ilish: A fish curry."
    - This protocol ensures the user always receives a valuable list, even if the location lacks a widely documented unique cuisine.

    **MANDATORY JSON OUTPUT:**
    The response MUST be ONLY a single, valid JSON object that strictly follows this structure. All text content must be in ${language}. For each of the 13 categories, provide 2-4 food items. If a category is empty after your exhaustive two-tier search, you MUST return an empty array for it.

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
    - Focus your efforts on populating 'iconicDishes', 'snacksAndStreetFood', 'lunch', and 'dessertAndSweets' first.
    - Descriptions must be short, enticing, and informative.
    - If 'includeBeverages' is false, the 'drinksAndBeverages' array MUST be empty.
    - The ENTIRE response, including all names and descriptions, MUST be translated into ${language}.
    - The output MUST start with "{" and end with "}". No markdown, no introductory text.
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