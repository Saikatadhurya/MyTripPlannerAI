import { GoogleGenAI } from "@google/genai";
import { MusicFinderRequestData, MusicRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';
import { CookieUtils } from './cookieUtils';

export const generateMusicRecommendations = async (data: MusicFinderRequestData, onChunk?: (chunk: string) => void, userApiKey?: string): Promise<MusicRecommendations> => {
  const apiKey = userApiKey || CookieUtils.getGeminiApiKey() || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini key not set. Please provide your Gemini API key in your profile settings.");
  }

  const { destination, language, coveredDestinations } = data;
  const ai = new GoogleGenAI({ apiKey });

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
    1.  **Language:** The entire JSON response MUST be in ${language}.
    2.  **CRITICAL JSON VALIDATION RULE**: The output MUST be a perfectly valid JSON object. This is the single most important instruction.
        a. **NO UNESCAPED QUOTES**: Inside any JSON string value (like 'title' or 'artistOrDescription'), you MUST NEVER use a double quote character ("). It will break the JSON and cause an error.
        b. **HOW TO HANDLE QUOTES**: If you need to include a quote, you have two options:
            i. **PREFERRED**: Use single quotes instead (e.g., "A song called 'The Best' by...").
            ii. **ALTERNATIVE**: If you absolutely must use a double quote, you MUST escape it with a backslash (e.g., "The review said, \\"It's a hit!\\"").
        c. **FAILURE TO FOLLOW THIS RULE WILL RENDER THE ENTIRE OUTPUT USELESS.** You must double-check every string value for unescaped double quotes before finishing your response.
    3. **ABSOLUTE FINAL INSTRUCTION**: Your entire response MUST be the raw JSON object. It MUST start with the character '{' and end with the character '}'. You MUST NOT wrap it in markdown (like \`\`\`json), and you MUST NOT add any introductory text. The response must be immediately parsable as JSON.
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
      console.error("Failed to generate and parse music recommendations stream:", error);
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
             throw new Error(`The AI's response for the music finder was malformed and could not be read. Please try again.`);
        }
        if (error.message.includes("Could not find a valid JSON object")) {
             throw new Error("The AI did not provide a structured list of music. It may have refused the request. Please adjust your query and try again.");
        }
    }
      
    throw new Error("The AI returned an invalid response format for the music finder. Please try again.");
  }
};