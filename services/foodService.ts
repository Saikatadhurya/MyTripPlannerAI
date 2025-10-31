
import { GoogleGenAI } from "@google/genai";
import { FoodFinderRequestData, FoodRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';
import { CookieUtils } from './cookieUtils';

export const generateFoodRecommendations = async (data: FoodFinderRequestData, onChunk?: (chunk: string) => void, userApiKey?: string): Promise<{result: FoodRecommendations, prompt: string}> => {
  const apiKey = userApiKey || CookieUtils.getGeminiApiKey() || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini key not set. Please provide your Gemini API key in your profile settings.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const { destination, startDate, foodPreference, includeAlcoholicDrinks, language, coveredDestinations } = data;

  const isMultiStop = coveredDestinations && coveredDestinations.length > 1;
  const destinationsString = isMultiStop ? coveredDestinations.map(d => d.name).join(', ') : destination;

  let multiStopInstructions = '';
  if (isMultiStop) {
    multiStopInstructions = `
    This is a multi-stop trip covering: ${destinationsString}.
    CRITICAL STRUCTURE REQUIREMENT: For each food category (breakfast, lunch, etc.), you MUST group the food items by location.
    The JSON for each category should be an array of objects, where each object has a "location" key (e.g., "Goa") and an "items" key which is an array of the food recommendations for that location.
    
    Example for 'breakfast' category:
    "breakfast": [
      {
        "location": "Bangalore",
        "items": [ { "name": "Idli-Vada", "description": "Classic South Indian breakfast..." } ]
      },
      {
        "location": "Goa",
        "items": [ { "name": "Patal Bhaji", "description": "A spicy Goan curry..." } ]
      }
    ]

    The "destination" field in the root of the JSON response should be a descriptive name for the trip, like "${destination} region tour".
    `;
  } else {
    multiStopInstructions = `
    This is a single-destination trip to ${destination}.
    CRITICAL STRUCTURE REQUIREMENT: For each food category (breakfast, lunch, etc.), your response MUST be an array containing a SINGLE object.
    This object must have a "location" key set to "${destination}" and an "items" key which is an array of the food recommendations.
    
    Example for 'breakfast' category:
    "breakfast": [
      {
        "location": "${destination}",
        "items": [ { "name": "...", "description": "..." }, { "name": "...", "description": "..." } ]
      }
    ]
    `;
  }

  const prompt = `
    You are a Pragmatic Local Food Scout. Your mission is to return a useful, relevant, and populated list of food recommendations for a traveler visiting ${destinationsString}, written in ${language}.
    **CRITICAL FAILURE CONDITION:** Returning an empty or mostly empty list is a complete failure of your task. You must ALWAYS find something relevant.
    ${multiStopInstructions}

    Trip Details:
    - Dietary Preference: ${foodPreference}
    - Date: ${startDate}
    - Include Alcoholic Drinks: ${includeAlcoholicDrinks ? 'Yes' : 'No'}
    - Language: ${language}

    **MANDATORY Research Methodology:**
    1.  **Hyper-Local Search:** First, find dishes unique or originated in each destination: ${destinationsString}.
    2.  **Popular Regional Search:** Then, broaden your search to find popular REGIONAL dishes commonly eaten in ${destinationsString}. This is critical for smaller towns.
    3.  **Synthesize:** Combine findings. For regional dishes, add brief local context to the description (e.g., "Ghugni: A beloved Bengali street food, popular at Durgapur's markets.").

    **MANDATORY JSON OUTPUT:**
    The response MUST be ONLY a single, valid JSON object that strictly follows this structure. All text content must be in ${language}. For each of the 12 categories, provide 1-3 unique food items per location.

    JSON Structure:
    {
      "destination": "string",
      "breakfast": [{ "location": "string", "items": [{ "name": "string", "description": "string" }] }],
      "lunch": [{ "location": "string", "items": [{ "name": "string", "description": "string" }] }],
      "snacksAndStreetFood": [{ "location": "string", "items": [{ "name": "string", "description": "string" }] }],
      "dinner": [{ "location": "string", "items": [{ "name": "string", "description": "string" }] }],
      "dessertAndSweets": [{ "location": "string", "items": [{ "name": "string", "description": "string" }] }],
      "drinksAndBeverages": [{ "location": "string", "items": [{ "name": "string", "description": "string" }] }],
      "iconicDishes": [{ "location": "string", "items": [{ "name": "string", "description": "string" }] }],
      "hiddenRecipes": [{ "location": "string", "items": [{ "name": "string", "description": "string" }] }],
      "trendingOrViralFoods": [{ "location": "string", "items": [{ "name": "string", "description": "string" }] }],
      "chefsSpecials": [{ "location": "string", "items": [{ "name": "string", "description": "string" }] }],
      "seasonalSpecials": [{ "location": "string", "items": [{ "name": "string", "description": "string" }] }],
      "festivalAndStreetFoods": [{ "location": "string", "items": [{ "name": "string", "description": "string" }] }]
    }

    **CRITICAL JSON RULES:**
    - **UNIQUENESS (MANDATORY):** A specific dish (e.g., "Masala Dosa") MUST appear only ONCE across ALL categories. Do not repeat dishes.
    - **CONCISENESS (MANDATORY):** Descriptions MUST be extremely concise, using 5-10 words maximum.
    - Prioritize populating 'iconicDishes', 'snacksAndStreetFood', 'lunch', and 'dinner'.
    - The 'drinksAndBeverages' array should always contain **non-alcoholic** options. If 'Include Alcoholic Drinks' is 'Yes', you MUST also add local alcoholic beverages. If 'No', the array MUST NOT contain any alcoholic drinks.
    - The ENTIRE response MUST be translated into ${language}.
    - **CRITICAL JSON VALIDATION RULE**: The output MUST be a perfectly valid JSON object.
        a. **NO UNESCAPED QUOTES**: Inside any JSON string value, you MUST NEVER use a double quote character ("). Use single quotes or escape them (\\").
        b. **FAILURE TO FOLLOW THIS RULE WILL RENDER THE ENTIRE OUTPUT USELESS.**
    - **ABSOLUTE FINAL INSTRUCTION**: Your entire response MUST be the raw JSON object. It MUST start with '{' and end with '}'. You MUST NOT wrap it in markdown or add any introductory text.
  `;
  
  let fullText = '';
  try {
      if (onChunk) {
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
      } else {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        fullText = response.text;
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

      return { result: cleanedJson, prompt };
  } catch (error) {
      console.error("Failed to generate and parse food recommendations stream:", error);
      console.error("Original AI response text accumulated:", fullText);

      if (error instanceof Error) {
        if (error.message.startsWith('[')) {
            // It's already a custom-formatted error, re-throw it.
            throw error;
        }

        const combinedErrorText = (error.message + fullText).toLowerCase();

        if (combinedErrorText.includes("quota") || combinedErrorText.includes("rate limit") || combinedErrorText.includes("429")) {
            throw new Error("[429] You have exceeded the request limit. Please check your plan and billing details and try again later.");
        }
        if (combinedErrorText.includes("overloaded") || combinedErrorText.includes("server error") || combinedErrorText.includes("503")) {
             throw new Error("[503] The AI model is currently busy. Please wait a moment and try again.");
        }
        
        if (error instanceof SyntaxError) {
             throw new Error(`The AI's response for the food guide was malformed and could not be read. Please try again.`);
        }
        if (error.message.includes("Could not find a valid JSON object")) {
             throw new Error("The AI did not provide a structured food guide. It may have refused the request. Please adjust your query and try again.");
        }
    }
      
    throw new Error("The AI returned an invalid response format for the food guide. Please try again.");
  }
};