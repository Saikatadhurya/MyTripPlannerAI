


import { GoogleGenAI, Type } from "@google/genai";
import { PackingList, PackingListRequestData } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';

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
    7. **CRITICAL JSON VALIDATION RULE**: The output MUST be a perfectly valid JSON object. This is the single most important instruction.
        a. **NO UNESCAPED QUOTES**: Inside any JSON string value, you MUST NEVER use a double quote character ("). It will break the JSON and cause an error.
        b. **HOW TO HANDLE QUOTES**: If you need to include a quote inside a description, you have two options:
            i. **PREFERRED**: Use single quotes instead (e.g., "Don't forget your 'just-in-case' sweater.").
            ii. **ALTERNATIVE**: If you absolutely must use a double quote, you MUST escape it with a backslash (e.g., "A bag that is described as \\"water-resistant\\" is ideal.").
        c. **FAILURE TO FOLLOW THIS RULE WILL RENDER THE ENTIRE OUTPUT USELESS.** You must double-check every string value for unescaped double quotes before finishing your response.
    8. The entire JSON response, including all string values, MUST be in ${language}.
    9. **ABSOLUTE FINAL INSTRUCTION**: Your entire response MUST be the raw JSON object. It MUST start with the character '{' and end with the character '}'. You MUST NOT wrap it in markdown (like \`\`\`json), and you MUST NOT add any introductory text. The response must be immediately parsable as JSON.
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
      
      if (error instanceof Error && error.message.startsWith('[')) {
          throw error;
      }

      if (fullText.toLowerCase().includes("quota") || fullText.toLowerCase().includes("rate limit")) {
          throw new Error("[429] You have exceeded the request limit. Please check your plan and billing details and try again later.");
      }
      if (fullText.toLowerCase().includes("overloaded") || fullText.toLowerCase().includes("server error")) {
           throw new Error("[503] The AI model is currently busy. Please wait a moment and try again.");
      }
      
      if (error instanceof SyntaxError) {
           throw new Error(`The AI's response for the packing list was malformed and could not be read. Please try again.`);
      }
      if (error instanceof Error) {
          if (error.message.includes("Could not find a valid JSON object")) {
               throw new Error("The AI did not provide a structured packing list. It may have refused the request. Please adjust your query and try again.");
          }
      }
      
      throw new Error("The AI returned an invalid response format for the packing list. Please try again.");
  }
};