import { GoogleGenAI } from "@google/genai";
import { FoodFinderRequestData, FoodRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';

export const generateFoodRecommendations = async (data: FoodFinderRequestData, onChunk?: (chunk: string) => void): Promise<FoodRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { destination, startDate, foodPreference, includeAlcoholicDrinks, language, coveredDestinations } = data;

  const isMultiStop = coveredDestinations && coveredDestinations.length > 1;
  const destinationsString = isMultiStop ? coveredDestinations.map(d => d.name).join(', ') : destination;

  const prompt = `**Role:** Pragmatic Local Food Scout and Culinary Expert

**Objective:** Generate a comprehensive list of local and popular food recommendations for the user's trip, formatted as a single, valid JSON object.

**Context:**
- **Core Philosophy:** Your goal is to return a useful, relevant, and populated list. An empty list is a failure. You must find what people genuinely love to eat there.
- **Trip Details:**
    - Destination(s): ${destinationsString}
    - Dietary Preference: ${foodPreference}
    - Date: ${startDate}
    - Include Alcoholic Drinks: ${includeAlcoholicDrinks ? 'Yes' : 'No'}
    - Language for Output: ${language}
- **Trip Type:** ${isMultiStop ? 'Multi-Stop Trip' : 'Single Destination Trip'}

**Instructions:**
Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or explanations before or after the JSON.

**1. Research Methodology (MANDATORY):**
   - **Step A (Hyper-Local):** First, search for dishes that are unique to or originated in each destination.
   - **Step B (Popular Regional):** Immediately after, broaden your search to find popular REGIONAL dishes commonly eaten in the area. This is critical for smaller towns.
   - **Step C (Synthesize):** For every regional dish, you MUST add context in its description explaining why it's relevant to the specific location (e.g., "A beloved Bengali street food... you'll find excellent versions at Durgapur's Benachity market.").

**2. JSON Structure Rules (MANDATORY):**
   - The root object must contain a "destination" key and keys for each food category (e.g., "breakfast", "lunch", etc.).
   - **Location Grouping (CRITICAL):**
     - For **Multi-Stop Trips**, each category's value MUST be an array of objects, grouped by location. Example: \`"breakfast": [{ "location": "Bangalore", "items": [...] }, { "location": "Goa", "items": [...] }]\`
     - For **Single Destination Trips**, each category's value MUST be an array containing a SINGLE object. Example: \`"breakfast": [{ "location": "${destination}", "items": [...] }]\`
   - **Content Prioritization:** Prioritize populating 'iconicDishes', 'snacksAndStreetFood', 'lunch', 'dinner', and 'dessertAndSweets'.
   - **Drinks:** If 'includeAlcoholicDrinks' is 'Yes', you MUST include local alcoholic options. Otherwise, provide only non-alcoholic drinks.

**3. Final Formatting & Validation:**
   - **Language:** All text in the JSON MUST be in ${language}.
   - **JSON Validity (CRITICAL):** Ensure the output is a perfectly valid JSON object. Do not use unescaped double quotes inside strings. Use single quotes or escape them (\\").
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