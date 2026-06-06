
import { GoogleGenAI, Type } from "@google/genai";
import { PackingList, PackingListRequestData } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';
import { CookieUtils } from './cookieUtils';
import { sleep, isQuotaApiError, formatQuotaError } from './geminiModel';
import { generateGeminiJson } from './geminiRequest';

export const generatePackingList = async (data: PackingListRequestData, onChunk?: (chunk: string) => void, userApiKey?: string): Promise<{result: PackingList, prompt: string}> => {
  const { apiKey, isUsingDefaultKey } = await CookieUtils.getApiKeyWithSource(userApiKey);
  
  // Ensure API key is properly trimmed
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Invalid API key: key is empty or whitespace only");
  }
  const cleanApiKey = apiKey.trim();

  const ai = new GoogleGenAI({ apiKey: cleanApiKey });

  const { destination, startDate, days, language, coveredDestinations } = data;

  const isMultiStop = coveredDestinations && coveredDestinations.length > 1;
  const destinationsString = isMultiStop ? coveredDestinations.map(d => d.name).join(', ') : destination;

  let multiStopInstructions = '';
  if (isMultiStop) {
    multiStopInstructions = `
    This is a multi-stop trip covering: ${destinationsString}.
    CRITICAL INSTRUCTIONS:
    1.  The packing list must be a consolidated summary suitable for ALL listed destinations.
    2.  The 'approximateTemperature' field is MANDATORY and MUST provide a separate, clearly-labeled temperature forecast for each major destination. For example: "Paris: 15-20°C, Nice: 22-27°C, Lyon: 18-23°C".
    `;
  }

  const prompt = `
    Based on a ${days}-day trip to ${destinationsString} starting around ${startDate}, generate a smart, weather-aware packing list in ${language}.
    Consider the typical climate and weather for that location and time of year.
    Provide practical advice. For clothing, suggest layers if the weather is variable. You MUST provide separate clothing recommendations for male and female travelers, tailored to their specific needs.
    ${multiStopInstructions}
    The response MUST be a single, valid JSON object that strictly follows this structure and types, with all text content in ${language}:
    {
      "maleClothing": string[],
      "femaleClothing": string[],
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

    **CRITICAL CLOTHING SECTION INSTRUCTIONS:**
    1. You MUST provide separate clothing lists for male and female travelers.
    2. The 'maleClothing' array should contain clothing and footwear items specifically tailored for male travelers (e.g., men's shirts, men's pants, men's shoes, socks, etc.). DO NOT include inner garments, underwear, or undergarments in the suggestions.
    3. The 'femaleClothing' array should contain clothing and footwear items specifically tailored for female travelers (e.g., women's tops, women's bottoms, women's shoes, etc.). DO NOT include inner garments, underwear, bras, or undergarments in the suggestions.
    4. Both sections should consider the weather conditions, trip duration, and destination context.
    5. Include appropriate footwear and accessories in each respective section. DO NOT suggest any inner garments or undergarments.

    Important Rules:
    1. The 'approximateTemperature' must be a string representing the estimated temperature range in Celsius (e.g., "25-30°C"). If it's a multi-stop trip, you MUST follow the multi-stop instructions for this field.
    2. The 'adventureClothing' list must contain recommendations for gear and clothing suitable for common adventure activities in ${destination} (like hiking, swimming, skiing, etc.). If no specific adventure activities are obvious, provide general outdoor/activewear suggestions.
    3. The items in each list should be concise and practical.
    4. The 'bagSuggestion' should recommend a type and size of bag (e.g., "A 40L backpack" or "A medium-sized suitcase").
    5. The 'locallyAvailableItems' list should include things the user might not need to pack because they are easy and cheap to buy at the destination.
    6. You MUST use bold markdown (**text**) to highlight key items or advice within the string arrays.
    7. **JSON VALIDATION:** The output MUST be a perfectly valid JSON object. NO unescaped double quotes (") in string values. Use single quotes or escape with \\". Check every string before finishing.
    8. The entire JSON response, including all string values, MUST be in ${language}.
    9. **FINAL INSTRUCTION:** Your entire response MUST be the raw JSON object starting with '{' and ending with '}'. NO markdown wrapping, NO introductory text. Immediately parsable as JSON.
  `;

  let fullText = '';
  try {
      fullText = await generateGeminiJson(ai, prompt);

      if (onChunk) {
        const chunkSize = 120;
        for (let i = 0; i < fullText.length; i += chunkSize) {
          onChunk(fullText.slice(i, i + chunkSize));
          await sleep(0);
        }
      }
      
      const jsonString = extractJson(fullText);
      const parsedJson = JSON.parse(jsonString);

      if (parsedJson.error && parsedJson.error.code) {
          const { code, message } = parsedJson.error;
          throw new Error(`[${code}] ${message}`);
      }
      
      const cleanedJson = cleanCitations(parsedJson);

      const result = {
        ...cleanedJson,
        destination,
        days,
        startDate,
      };

      return { result, prompt };
  } catch (error) {
      console.error("Failed to generate and parse packing list stream:", error);
      console.error("Original AI response text accumulated:", fullText);
      
      if (error instanceof Error) {
        if (error.message.startsWith('[')) {
            // It's already a custom-formatted error, re-throw it.
            throw error;
        }

        const combinedErrorText = (error.message + fullText).toLowerCase();

        if (isQuotaApiError(error) || combinedErrorText.includes("quota") || combinedErrorText.includes("429")) {
            throw new Error(formatQuotaError(isUsingDefaultKey));
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