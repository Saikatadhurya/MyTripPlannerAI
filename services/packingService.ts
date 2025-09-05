

import { GoogleGenAI, Type } from "@google/genai";
import { PackingList, PackingListRequestData } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';

export const generatePackingList = async (data: PackingListRequestData, onChunk?: (chunk: string) => void): Promise<PackingList> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const { destination, startDate, days, language, coveredDestinations } = data;

  const isMultiStop = coveredDestinations && coveredDestinations.length > 1;
  const destinationsString = isMultiStop ? coveredDestinations.map(d => d.name).join(', ') : destination;

  const prompt = `**Role:** Expert Travel Assistant and Smart Packing Specialist

**Objective:** Generate a smart, weather-aware packing list for the user's trip, formatted as a single, valid JSON object.

**Context:**
- **Trip Details:**
    - Destination(s): ${destinationsString}
    - Start Date: ${startDate}
    - Duration: ${days} days
    - Language for Output: ${language}
- **Trip Type:** ${isMultiStop ? 'Multi-Stop Trip' : 'Single Destination Trip'}

**Instructions:**
Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or explanations before or after the JSON.

**1. Weather & Temperature Analysis:**
   - Use search to determine the typical climate and weather for the destination(s) around the specified start date.
   - **approximateTemperature (MANDATORY):**
     - For a single destination, provide the estimated temperature range in Celsius (e.g., "25-30°C").
     - For a multi-stop trip, you MUST provide a separate, clearly-labeled forecast for each major destination (e.g., "Paris: 15-20°C, Nice: 22-27°C").

**2. Content Generation Rules:**
   - **clothingAndFootwear:** Suggest practical items and layers suitable for the predicted weather.
   - **adventureClothing:** Recommend gear for common activities in the area (e.g., hiking, swimming). If none are obvious, suggest general activewear.
   - **bagSuggestion:** Recommend a specific type and size of bag (e.g., "A 40L backpack").
   - **locallyAvailableItems:** List items the user can easily buy at the destination to save packing space.
   - **Bolding:** Use bold markdown (**text**) to highlight key items or advice.

**3. JSON Structure & Validation:**
   - Your response MUST be a single JSON object with the following keys: "clothingAndFootwear", "toiletriesAndPersonalCare", "medicinesAndHealth", "electronicsAndGear", "documentsAndMoney", "optionalComfortItems", "adventureClothing", "bagSuggestion", "locallyAvailableItems", "approximateTemperature".
   - All keys must map to an array of strings, except for "bagSuggestion" and "approximateTemperature" which are single strings.
   - **Language:** All text in the JSON MUST be in ${language}.
   - **JSON Validity (CRITICAL):** Ensure the output is a perfectly valid JSON object. Do not use unescaped double quotes inside strings. Use single quotes or escape them (\\").
`;

  let fullText = '';
  try {
      if (onChunk) {
        const stream = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: prompt,
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

      return {
        ...cleanedJson,
        destination,
        days,
        startDate,
      };
  } catch (error) {
      console.error("Failed to generate and parse packing list stream:", error);
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
             throw new Error(`The AI's response for the packing list was malformed and could not be read. Please try again.`);
        }
        if (error.message.includes("Could not find a valid JSON object")) {
             throw new Error("The AI did not provide a structured packing list. It may have refused the request. Please adjust your query and try again.");
        }
    }
      
    throw new Error("The AI returned an invalid response format for the packing list. Please try again.");
  }
};