import { GoogleGenAI } from "@google/genai";
import { LingoFinderRequestData, LingoRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';

export const generateLingoGuide = async (data: LingoFinderRequestData, onChunk?: (chunk: string) => void): Promise<LingoRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const { destination, language } = data;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `**Role:** Expert Linguist and Local Guide AI

**Objective:** Create a practical, helpful, and culturally aware phrasebook for the user's trip, formatted as a single, valid JSON object.

**Context:**
- **Trip Details:**
    - Destination: ${destination}
    - Language for Output: ${language} (This is for the JSON itself, not the translations).
- **Core Goal:** Provide essential phrases to help a traveler communicate and navigate.

**Instructions:**
Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or explanations before or after the JSON.

**1. Language Identification:**
   - First, you MUST use search to determine the primary local language spoken in "${destination}". This will be the value for the "localLanguage" key.

**2. Content Generation Rules:**
   - **Categories (MANDATORY):** You MUST include at least these five categories: "Greetings & Basics", "Dining & Ordering Food", "Shopping & Bargaining", "Directions & Transportation", and "Emergencies".
   - **Phrases:** For each category, provide 5-8 useful phrases.
   - **Phrase Object:** Each phrase object MUST contain three string fields:
     - "english": The phrase in English.
     - "local": The direct translation in the identified local language.
     - "pronunciation": A simple, phonetic spelling of the local phrase.

**3. JSON Structure & Validation:**
   - The root object must have "destination", "localLanguage", and "categories" keys.
   - **Category Object (CRITICAL):** Each object inside the "categories" array MUST have two keys: "categoryName" (a string, e.g., "Greetings & Basics") and "phrases" (an array of Phrase Objects).
   - **Language:** The entire JSON response's text values MUST be in ${language}.
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

      if (!fullText) throw new Error("The AI returned an empty response.");
      
      const jsonString = extractJson(fullText);
      const parsedJson = JSON.parse(jsonString);

      if (parsedJson.error && parsedJson.error.code) {
          const { code, message } = parsedJson.error;
          throw new Error(`[${code}] ${message}`);
      }

      const cleanedJson = cleanCitations(parsedJson);

      return cleanedJson;
  } catch (error) {
      console.error("Failed to generate and parse lingo guide stream:", error);
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
             throw new Error(`The AI's response for the lingo guide was malformed and could not be read. Please try again.`);
        }
        if (error.message.includes("Could not find a valid JSON object")) {
             throw new Error("The AI did not provide a structured lingo guide. It may have refused the request. Please adjust your query and try again.");
        }
    }
      
    throw new Error("The AI returned an invalid response format for the lingo guide. Please try again.");
  }
};