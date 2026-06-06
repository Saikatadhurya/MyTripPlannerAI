import { GoogleGenAI } from "@google/genai";
import { MusicFinderRequestData, MusicRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';
import { CookieUtils } from './cookieUtils';
import { sleep, isQuotaApiError, formatQuotaError } from './geminiModel';
import { generateGeminiJson } from './geminiRequest';

export const generateMusicRecommendations = async (data: MusicFinderRequestData, onChunk?: (chunk: string) => void, userApiKey?: string): Promise<{result: MusicRecommendations, prompt: string}> => {
  const { apiKey, isUsingDefaultKey } = await CookieUtils.getApiKeyWithSource(userApiKey);
  
  // Ensure API key is properly trimmed
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Invalid API key: key is empty or whitespace only");
  }
  const cleanApiKey = apiKey.trim();

  const { destination, language, coveredDestinations } = data;
  const ai = new GoogleGenAI({ apiKey: cleanApiKey });

  const isMultiStop = coveredDestinations && coveredDestinations.length > 1;
  const destinationsString = isMultiStop ? coveredDestinations.map(d => d.name).join(', ') : destination;
  
  let multiStopInstructions = '';
  if (isMultiStop) {
    multiStopInstructions = `
    This is a multi-stop trip covering: ${destinationsString}. Your music guide should reflect the diverse musical landscape of all the locations covered in the itinerary. The categories should represent the different regions or a blend of genres from the entire route.
    `;
  }

  const prompt = `
    You are an expert Music Curator and Ethnomusicologist AI. Your mission is to provide a traveler with an authentic, popular, and well-organized music guide for "${destinationsString}", written in ${language}. Your output must be intelligent and adapt to the destination's unique musical landscape.
    ${multiStopInstructions}

    **CRITICAL CURATION PROTOCOL:**

    **Step 1: Analyze & Strategize (Your Core Logic)**
    - First, you MUST analyze "${destinationsString}" to determine its musical character.
    - Based on your analysis, CHOOSE the best categorization strategy:
      - **A) REGIONAL Strategy:** For large, musically diverse countries (e.g., India, USA, China, Brazil), your main categories should be distinct musical regions.
      - **B) GENRE-BASED Strategy:** For countries with a more unified but genre-rich music scene (e.g., Japan, Jamaica, South Korea, Ireland), your main categories should be the most prominent genres (e.g., J-Pop, Reggae, K-Pop, Traditional Folk).
    - This decision will define the structure of the 'musicCategories' array.

    **Step 2: Curate the Categories & Songs**
    - You MUST create a JSON object with a single top-level key: "musicCategories", which is an array of objects.
    - **Category 1 (MANDATORY):** The FIRST object in the 'musicCategories' array MUST always be for "Top Trending Hits". Its 'description' should state that these are current, nationwide chart-toppers.
    - **Categories 2-5:** Create 2-4 additional category objects based on the strategy you chose in Step 1 (either regions or genres).
      - For each category, write a concise, insightful 'description'.
      - For EACH category, you MUST find a mix of **currently popular songs** AND **timeless, iconic classics**.
      - **QUALITY CHECK - "The Gandagana Test":** Ensure you find the kind of culturally iconic songs that locals cherish (like "Gandagana" for Georgia). Avoid generic or superficial results.
      - **ANTI-BIAS RULE:** Give all significant regions/genres a fair representation. Do not let one mainstream style (like Bollywood in India or Pop in the USA) overshadow other important local music scenes.

    **Step 3: Sort and Format**
    - **POPULARITY SORT (CRITICAL):** Within EACH category, the 'music' array MUST be sorted by popularity. The most famous, highest-viewed song must be listed first.
    - **App Links:** Find availability on: Spotify, Apple Music, YouTube, SoundCloud, Deezer, JioSaavn, Gaana, Wynk, Anghami, Boomplay.
    - **SONG COUNT (CRITICAL):** For each category, you MUST provide an even number of songs. The list must contain a minimum of 6 songs and a maximum of 8 songs. This means each 'music' array should have **exactly 6 or 8 items**.
    - **RESTRICTIONS:** NO URLs. NO album art.

    **JSON OUTPUT SPECIFICATION:**
    The response MUST be ONLY a single, valid JSON object. All text content must be in ${language}.

    {
      "destination": "${destination}",
      "musicCategories": [
        {
          "genre": "Top Trending Hits",
          "description": "The most popular songs currently trending across ${destination}.",
          "music": [
            { "title": "string", "artistOrDescription": "string", "appLinks": [ { "appName": "Spotify" } ] }
          ]
        },
        {
          "genre": "Example Regional or Genre Category",
          "description": "An insightful description of this category.",
          "music": [
             { "title": "string", "artistOrDescription": "string", "appLinks": [ { "appName": "YouTube" } ] }
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
      console.error("Failed to generate and parse music recommendations stream:", error);
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
             throw new Error(`The AI's response for the music finder was malformed and could not be read. Please try again.`);
        }
        if (error.message.includes("Could not find a valid JSON object")) {
             throw new Error("The AI did not provide a structured list of music. It may have refused the request. Please adjust your query and try again.");
        }
    }
      
    throw new Error("The AI returned an invalid response format for the music finder. Please try again.");
  }
};