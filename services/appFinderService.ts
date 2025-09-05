import { GoogleGenAI } from "@google/genai";
import { AppFinderRequestData, AppRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';

export const generateAppRecommendations = async (data: AppFinderRequestData, onChunk?: (chunk: string) => void): Promise<AppRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const { destination, language, coveredDestinations } = data;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const isMultiStop = coveredDestinations && coveredDestinations.length > 1;
  const destinationsString = isMultiStop ? coveredDestinations.map(d => d.name).join(', ') : destination;

  const prompt = `**Role:** Tech-Savvy Local Guide and Global Travel Assistant

**Objective:** Generate a curated list of useful mobile apps for the user's trip, including popular local alternatives, formatted as a single, valid JSON object.

**Context:**
- **Trip Details:**
    - Destination(s): ${destinationsString}
    - Language for Output: ${language}
- **Core Requirement:** You MUST find both internationally known apps (e.g., Uber) AND their popular local competitors (e.g., Ola in India). This local expertise is crucial.
- **Trip Type:** ${isMultiStop ? 'Multi-Stop Trip' : 'Single Destination Trip'}

**Instructions:**
Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or explanations before or after the JSON.

**1. Research & Curation:**
   - Use Google Search to find currently available and popular apps for the destination(s).
   - Accurately categorize each app into one of the provided JSON categories. If a category is empty, return an empty array \`[]\`.
   - **Restrictions:** DO NOT provide app store URLs or search for app ratings.

**2. JSON Structure Rules (MANDATORY):**
   - The root object must contain a "destination" key and keys for each app category (e.g., "transportAndTravel").
   - Each app object MUST contain:
     - "name": The app's official name (e.g., "Google Maps").
     - "category": A short, lowercase, one-word function (e.g., "navigation", "hikes"). Use "" for globally famous apps where the category is obvious.
     - "description": A concise summary.
     - "platform": "iOS", "Android", or "Both".
     - "icon": A single, relevant emoji.
     - "location" (For Multi-Stop Trips ONLY): If an app is specific to one location (e.g., "Goa Miles"), put the location name here. For generic apps, use an empty string "".

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
      console.error("Failed to generate and parse app recommendations stream:", error);
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
             throw new Error(`The AI's response for the app finder was malformed and could not be read. Please try again.`);
        }
        if (error.message.includes("Could not find a valid JSON object")) {
             throw new Error("The AI did not provide a structured list of apps. It may have refused the request. Please adjust your query and try again.");
        }
    }
      
    throw new Error("The AI returned an invalid response format for the app finder. Please try again.");
  }
};