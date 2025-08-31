
import { GoogleGenAI, Type } from "@google/genai";
import { PackingList, PackingListRequestData } from '../types';

export const generatePackingList = async (data: PackingListRequestData, onChunk: (chunk: string) => void): Promise<PackingList> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const { destination, startDate, days, language } = data;

  const prompt = `
    Based on a ${days}-day trip to ${destination} starting around ${startDate}, generate a smart, weather-aware packing list in ${language}.
    Consider the typical climate and weather for that location and time of year.
    Provide practical advice. For clothing, suggest layers if the weather is variable.
    The response MUST be a single, valid JSON object that strictly follows this structure and types, with all text content in ${language}:
    {
      "clothingAndFootwear": string[],
      "toiletriesAndPersonalCare": string[],
      "medicinesAndHealth": string[],
      "electronicsAndGear": string[],
      "documentsAndMoney": string[],
      "optionalComfortItems": string[],
      "adventureClothing": string[],
      "bagSuggestion": string,
      "locallyAvailableItems": string[],
      "approximateTemperature": string
    }

    Important Rules:
    1. The 'approximateTemperature' must be a string representing the estimated temperature range in Celsius (e.g., "25-30°C").
    2. The 'adventureClothing' list must contain recommendations for gear and clothing suitable for common adventure activities in ${destination} (like hiking, swimming, skiing, etc.). If no specific adventure activities are obvious, provide general outdoor/activewear suggestions.
    3. The items in each list should be concise and practical.
    4. The 'bagSuggestion' should recommend a type and size of bag (e.g., "A 40L backpack" or "A medium-sized suitcase").
    5. The 'locallyAvailableItems' list should include things the user might not need to pack because they are easy and cheap to buy at the destination.
    6. You MUST use bold markdown (**text**) to highlight key items or advice within the string arrays.
    7. CRITICAL JSON VALIDATION RULE: Ensure the output is a perfectly valid JSON object. Do not use unescaped double quotes inside string values; use single quotes or escaped double quotes (\\").
    8. The entire JSON response, including all string values, MUST be in ${language}.
  `;

  let fullText = '';
  try {
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: prompt,
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
        throw new Error("Could not find a valid JSON object in the AI response for packing list.");
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
        throw new Error("Could not find a complete JSON object in the AI response for packing list.");
      }
      
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');

      const parsedJson = JSON.parse(jsonString);

      if (parsedJson.error && parsedJson.error.code) {
          const { code, message } = parsedJson.error;
          throw new Error(`[${code}] ${message}`);
      }

      return {
        ...parsedJson,
        destination,
        days,
        startDate,
      };
  } catch (error) {
      console.error("Failed to generate and parse packing list stream:", error);
      console.error("Original AI response text accumulated:", fullText);
      if (error instanceof Error && error.message.startsWith('[')) {
          throw error;
      }
      throw new Error("The AI returned an invalid response format. Please try again.");
  }
};
