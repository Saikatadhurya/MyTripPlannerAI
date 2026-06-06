import { GoogleGenAI } from "@google/genai";
import { LingoFinderRequestData, LingoRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';
import { CookieUtils } from './cookieUtils';
import { sleep, isQuotaApiError, formatQuotaError } from './geminiModel';
import { generateGeminiJson } from './geminiRequest';

export const generateLingoGuide = async (data: LingoFinderRequestData, onChunk?: (chunk: string) => void, userApiKey?: string): Promise<{result: LingoRecommendations, prompt: string}> => {
  const { apiKey, isUsingDefaultKey } = await CookieUtils.getApiKeyWithSource(userApiKey);
  
  // Ensure API key is properly trimmed
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Invalid API key: key is empty or whitespace only");
  }
  const cleanApiKey = apiKey.trim();

  const { destination, language, coveredDestinations } = data;
  const ai = new GoogleGenAI({ apiKey: cleanApiKey });

  const isMultiStop = coveredDestinations && coveredDestinations.length > 1;
  const destinationsString = isMultiStop 
    ? coveredDestinations.map(d => d.name).join(', ')
    : destination;
  
  let multiStopInstructions = '';
  if (isMultiStop) {
    multiStopInstructions = `
    **MULTI-STOP TRIP INSTRUCTION:**
    This is a multi-destination trip covering: ${destinationsString}.
    You MUST create a comprehensive phrasebook that is useful across ALL these destinations.
    - Identify the PRIMARY language(s) spoken across these destinations. If multiple languages are spoken, prioritize the most common one, but include phrases that work across the region.
    - The phrasebook should be practical for travelers moving between these locations.
    - The 'destination' field should reflect the multi-destination nature (e.g., "${destinationsString} Tour" or "Multi-City ${destinationsString} Guide").
    `;
  }

  const prompt = `
    You are an expert Linguist and Local Guide AI. Your mission is to create a practical, helpful, and culturally aware phrasebook for a traveler visiting ${isMultiStop ? `multiple destinations: ${destinationsString}` : `"${destination}"`}.
    The output language for the entire JSON response must be in ${language}.
    ${multiStopInstructions}

    **CRITICAL INSTRUCTIONS & PROTOCOL:**

    1.  **Identify Local Language:** First, you MUST determine the primary local language(s) spoken ${isMultiStop ? `across these destinations: ${destinationsString}` : `in "${destination}"`}. This will be used for the translations.
    2.  **Curate Essential Categories:** Create a list of essential phrase categories. You MUST include at least the following five categories: "Greetings & Basics", "Dining & Ordering Food", "Shopping & Bargaining", "Directions & Transportation", and "Emergencies". You may add 1-2 other relevant categories if applicable to the destination (e.g., "Beach Phrases" for a coastal city).
    3.  **Generate Phrases:** For each category, provide 5-8 useful phrases. Each phrase object MUST contain three fields:
        - \`english\`: The phrase in English.
        - \`local\`: The direct translation of the phrase in the identified local language.
        - \`pronunciation\`: A simple, easy-to-read phonetic spelling of the \`local\` phrase. **CRITICAL PRONUNCIATION RULE:** This pronunciation guide MUST be written in the script and phonetic system of the target output language, which is **'${language}'**. For example, if the output language is Hindi, the pronunciation for 'Konnichiwa' should be written in Devanagari script (e.g., 'कोनिचिवा'). If the output language is English, a simple romanization (like 'Konnichiwa') is acceptable.

    **JSON OUTPUT SPECIFICATION:**
    The response MUST be ONLY a single, valid JSON object that strictly follows this structure. All text content must be in ${language}.

    {
      "destination": "${isMultiStop ? destinationsString : destination}",
      "localLanguage": "The name of the primary local language you identified ${isMultiStop ? 'across these destinations' : 'for this destination'} (e.g., 'Japanese', 'Hindi', 'Spanish')",
      "categories": [
        {
          "categoryName": "Greetings & Basics",
          "phrases": [
            { "english": "Hello", "local": "こんにちは", "pronunciation": "Konnichiwa" }
          ]
        }
      ]
    }

    **FINAL CRITICAL RULES:**
    1. **Language:** The entire JSON response MUST be in ${language}.
    2. **JSON VALIDATION:** The output MUST be a perfectly valid JSON object. NO unescaped double quotes (") in string values. Use single quotes or escape with \\". Check every string before finishing.
    3. **FINAL INSTRUCTION:** Your entire response MUST be the raw JSON object starting with '{' and ending with '}'. NO markdown wrapping, NO introductory text. Immediately parsable as JSON.
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

      return { result: cleanedJson, prompt };
  } catch (error) {
      console.error("Failed to generate and parse lingo guide stream:", error);
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
             throw new Error(`The AI's response for the lingo guide was malformed and could not be read. Please try again.`);
        }
        if (error.message.includes("Could not find a valid JSON object")) {
             throw new Error("The AI did not provide a structured lingo guide. It may have refused the request. Please adjust your query and try again.");
        }
    }
      
    throw new Error("The AI returned an invalid response format for the lingo guide. Please try again.");
  }
};