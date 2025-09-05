import { GoogleGenAI } from "@google/genai";
import { MusicFinderRequestData, MusicRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';

export const generateMusicRecommendations = async (data: MusicFinderRequestData, onChunk?: (chunk: string) => void): Promise<MusicRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const { destination, language, coveredDestinations } = data;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const isMultiStop = coveredDestinations && coveredDestinations.length > 1;
  const destinationsString = isMultiStop ? coveredDestinations.map(d => d.name).join(', ') : destination;
  
  const prompt = `**Role:** Expert Music Curator and Ethnomusicologist AI

**Objective:** Generate an authentic and popular music guide for the user's trip, formatted as a single, valid JSON object. The guide must be intelligently categorized based on the destination's unique musical landscape.

**Context:**
- **Trip Details:**
    - Destination(s): ${destinationsString}
    - Language for Output: ${language}
- **Core Philosophy:** The goal is to provide an authentic playlist that reflects the local culture. This includes both current hits and timeless classics. Avoid generic or superficial results.

**Instructions:**
Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or explanations before or after the JSON.

**1. Curation Strategy (CRITICAL FIRST STEP):**
   - **Analyze Destination:** First, analyze "${destinationsString}" to determine its musical character.
   - **Choose Strategy:** Based on your analysis, categorize the music by either:
     - **A) Region:** For large, musically diverse countries (e.g., India, USA).
     - **B) Genre:** For countries with a more unified but genre-rich scene (e.g., Japan, Jamaica).

**2. Content Generation Rules:**
   - **Category 1 (MANDATORY):** The first category in the \`musicCategories\` array MUST be "Top Trending Hits".
   - **Categories 2-5:** Create 2-4 additional categories based on your chosen strategy (Region or Genre).
   - **Song Selection:** In EACH category, include a mix of current popular songs and timeless classics.
   - **Song Count (MANDATORY):** Each category's 'music' array MUST contain exactly 6 or 8 songs.
   - **Sorting (MANDATORY):** Within each category, sort the 'music' array by popularity, with the most famous song listed first.
   - **App Links:** Find song availability on major platforms (Spotify, YouTube, Apple Music, etc.). Do not provide URLs.

**3. JSON Structure & Validation:**
   - The root object must have "destination" and "musicCategories" keys.
   - Each object in "musicCategories" must have "genre", "description", and a "music" array.
   - Each object in the "music" array must have "title", "artistOrDescription", and an "appLinks" array.
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