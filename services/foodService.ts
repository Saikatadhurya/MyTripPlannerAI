
import { GoogleGenAI } from "@google/genai";
import { FoodFinderRequestData, FoodRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';

export const generateFoodRecommendations = async (data: FoodFinderRequestData, onChunk: (chunk: string) => void): Promise<FoodRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { destination, startDate, foodPreference, includeAlcoholicDrinks, language, coveredDestinations } = data;

  const isMultiStop = coveredDestinations && coveredDestinations.length > 1;
  const destinationsString = isMultiStop ? coveredDestinations.map(d => d.name).join(', ') : destination;

  let multiStopInstructions = '';
  if (isMultiStop) {
    multiStopInstructions = `
    This is a multi-stop trip covering: ${destinationsString}. The food recommendations should be a summarized guide covering notable dishes and specialties from across the entire trip route. The "destination" field in the JSON response should be a descriptive name for the trip, like "${destination} region tour".
    `;
  }

  const prompt = `
    You are a Pragmatic Local Food Scout. Your primary mission is to return a useful, relevant, and populated list of food recommendations for a traveler visiting ${destinationsString}.
    **CRITICAL FAILURE CONDITION:** Returning an empty or mostly empty list is a complete failure of your task. You must ALWAYS find something relevant.
    ${multiStopInstructions}

    Trip Details:
    - Destination: ${destinationsString}
    - Dietary Preference: ${foodPreference}
    - Date: ${startDate}
    - Include Alcoholic Drinks: ${includeAlcoholicDrinks ? 'Yes' : 'No'}
    - Language: ${language}

    **MANDATORY Blended Research Methodology:**
    You must perform a blended search. Do not stop if you can't find "unique" dishes. Your goal is to find what people love to eat there.

    1.  **Phase 1: Hyper-Local Search.** Begin by searching for dishes that are unique or originated in each of the destinations: ${destinationsString}. Use specific search terms like "${destination} famous food", "${destination} own dish". This is your top priority.

    2.  **Phase 2: Popular Regional Search.** Immediately after, and regardless of the results of Phase 1, you MUST broaden your search to find popular REGIONAL dishes that are commonly eaten and well-regarded in ${destinationsString}. This is especially critical for smaller towns or cities that may not have many unique dishes. Use search terms like "best food in ${destination}", "popular restaurants in ${destination}".

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
    - The 'drinksAndBeverages' array should always contain **non-alcoholic** options appropriate for the destination. If 'Include Alcoholic Drinks' is 'Yes', you MUST also add recommendations for local alcoholic beverages (e.g., local beers, wines, spirits). If 'No', the array MUST NOT contain any alcoholic drinks.
    - The ENTIRE response, including all names and descriptions, MUST be translated into ${language}.
    - **CRITICAL JSON VALIDATION RULE**: The output MUST be a perfectly valid JSON object. This is the single most important instruction.
        a. **NO UNESCAPED QUOTES**: Inside any JSON string value, you MUST NEVER use a double quote character ("). It will break the JSON and cause an error.
        b. **HOW TO HANDLE QUOTES**: If you need to include a quote inside a description or title, you have two options:
            i. **PREFERRED**: Use single quotes instead (e.g., "A dish called 'Ghoogni Chaat'.").
            ii. **ALTERNATIVE**: If you absolutely must use a double quote, you MUST escape it with a backslash (e.g., "The chef says, \\"It's a must-try!\\"").
        c. **FAILURE TO FOLLOW THIS RULE WILL RENDER THE ENTIRE OUTPUT USELESS.** You must double-check every string value for unescaped double quotes before finishing your response.
    - **ABSOLUTE FINAL INSTRUCTION**: Your entire response MUST be the raw JSON object. It MUST start with the character '{' and end with the character '}'. You MUST NOT wrap it in markdown (like \`\`\`json), and you MUST NOT add any introductory text. The response must be immediately parsable as JSON.
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