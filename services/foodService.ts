
import { GoogleGenAI } from "@google/genai";
import { FoodFinderRequestData, FoodRecommendations } from '../types';

export const generateFoodRecommendations = async (data: FoodFinderRequestData): Promise<FoodRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { destination, startDate, foodPreference, includeBeverages, language } = data;

  const prompt = `
    You are a world-renowned Culinary Anthropologist. Your specialty is identifying and documenting hyper-local food traditions that are unique to a specific town or city, often unknown to outsiders. Your reputation is built on your obsessive attention to detail and your refusal to accept generic, regional answers.

    Your mission is to generate a list of hyper-local, authentic food recommendations for a trip to ${destination} on or around the date ${startDate}. The recommendations MUST be in the ${language} language.

    Trip Details:
    - Dietary Preference: ${foodPreference}
    - Include Beverages: ${includeBeverages ? 'Yes' : 'No'}
    - Destination: ${destination}
    - Date: ${startDate}

    **CORE METHODOLOGY - A Multi-Phase Intellectual Framework (MANDATORY):**

    **Phase 1: Broad Intelligence Gathering.**
    - Use your search tool with basic queries like "[destination] famous dishes", "[destination] local cuisine". This is only a starting point to gather initial candidates.

    **Phase 2: The Authenticity Gauntlet (CRITICAL).**
    This is the most important step. For every candidate dish from Phase 1, you MUST subject it to a rigorous verification process to prove it is truly hyper-local.
    - **Cross-Verification Querying**: For each dish, perform secondary searches like "origin of [dish name]", "is [dish name] common outside of [destination]", "other cities famous for [dish name]".
    - **The Uniqueness Test**: A dish only passes this test if your research confirms it is *overwhelmingly* associated with the specific city of "${destination}". If it's a state-wide or country-wide specialty, it is an **IMMEDIATE DISQUALIFICATION**. Your goal is to find what defines the specific town or city.
    - **The Local's Test (Self-Critique)**: Before finalizing a dish, you must ask yourself this question: "If I showed this list to someone who has lived in '${destination}' their whole life, would they be impressed by my deep local knowledge, or would they find it generic?" Your entire response must be designed to pass this "Local's Test". If a dish feels too broad, discard it and dig deeper.

    **Phase 3: Deep Dive for Hidden Gems.**
    Go beyond the obvious to find what tourists miss.
    - **Primary Source Analysis**: Search for "[destination] food blogs", "[destination] food forums", "reddit what to eat in [destination]". Analyze discussions by locals.
    - **Socio-Cultural Context**: Investigate seasonal specialties (what's in season in "${destination}" around ${startDate}), dishes tied to local festivals, and unique recipes passed down through generations. Use these findings for the 'seasonalSpecials' and 'festivalFoods' categories.

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
