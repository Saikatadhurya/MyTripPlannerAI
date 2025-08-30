
import { GoogleGenAI } from "@google/genai";
import { MusicFinderRequestData, MusicRecommendations } from '../types';

export const generateMusicRecommendations = async (data: MusicFinderRequestData, onChunk: (chunk: string) => void): Promise<MusicRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const { destination, language } = data;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert Music Curator and Ethnomusicologist AI. Your mission is to provide a traveler with an authentic, popular, and well-organized music guide for "${destination}". Your output must be intelligent and adapt to the destination's unique musical landscape.

    **CRITICAL CURATION PROTOCOL:**

    **Step 1: Analyze & Strategize (Your Core Logic)**
    - First, you MUST analyze "${destination}" to determine its musical character.
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
    2.  **JSON Format & Validation (CRITICAL):**
        a. The output MUST be a perfectly valid JSON object. No markdown, no extra text.
        b. **NO UNESCAPED QUOTES**: Inside any JSON string value (like 'title' or 'artistOrDescription'), you MUST NEVER use a double quote character ("). It will break the JSON.
        c. **HOW TO HANDLE QUOTES**: If you need to include a quote, use single quotes instead (e.g., "A song called 'The Best' by..."). If you must use a double quote, you MUST escape it with a backslash (e.g., "The review said, \\\\"It's a hit!\\\\").
        d. Failure to produce valid JSON will result in a failed request.
    `;

  let fullText = '';
  try {
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

      if (!fullText) {
          throw new Error("AI response was empty or invalid.");
      }
      
      let jsonString = fullText;
      const markdownMatch = jsonString.match(/```(json)?([\s\S]*?)```/);
      if (markdownMatch && markdownMatch[2]) {
          jsonString = markdownMatch[2].trim();
      }

      const firstBrace = jsonString.indexOf('{');
      if (firstBrace === -1) {
          throw new Error("Could not find a valid JSON object in the AI response.");
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
          throw new Error("Could not find a complete JSON object in the AI response.");
      }

      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      
      // Sanitize by removing trailing commas
      jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
      
      return JSON.parse(jsonString);
  } catch (error) {
      console.error("Failed to generate and parse music recommendations stream:", error);
      console.error("Original AI response text accumulated:", fullText);
      throw new Error("The AI returned an invalid response format. Please try again.");
  }
};