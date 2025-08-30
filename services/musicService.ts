import { GoogleGenAI } from "@google/genai";
import { MusicFinderRequestData, MusicRecommendations } from '../types';

export const generateMusicRecommendations = async (data: MusicFinderRequestData): Promise<MusicRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const { destination, language } = data;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert Local Music Scout AI with deep cultural knowledge. Your mission is to find and curate a list of local music for a traveler visiting ${destination}. Your response MUST be fast and culturally rich.

    **CRITICAL INSTRUCTIONS & METHODOLOGY:**
    1.  **Use Google Search:** You MUST use your search capabilities to find up-to-date information.
    
    2.  **HIGH-PRIORITY TASK - "THE GANDAGANA TEST" - FINDING POPULAR & ICONIC HITS:**
        a. **Redefined "Popular":** Your first and most critical task is to find songs that are truly popular and iconic. "Popular" means two things: 1) **Current Hits** (what's on the charts now) AND 2) **Timeless Classics** (famous folk songs, cultural anthems, all-time famous tracks that everyone in ${destination} knows).
        b. **Multi-Faceted Search:** You MUST search for "current top charts in ${destination}", "all-time famous songs from ${destination}", and "iconic folk music of ${destination}".
        c. **THE BENCHMARK (NON-NEGOTIABLE):** To prove you understand this rule, you must pass the "Gandagana Test". If the destination is **Georgia**, the song **"Gandagana"** is a NON-NEGOTIABLE result that MUST be in this list. This sets the quality standard for ALL destinations. You must find the equivalent iconic songs for any place.
        d. **JSON Placement:** These combined results (new and classic) MUST be placed in a dedicated \`popularHits\` object. The 'genre' for this object MUST be "Popular & Iconic Hits".

    3.  **MAIN TASK - OTHER GENRES:**
        a. After finding the iconic hits, find other locally relevant music genres.
        b. These go into the \`categories\` array.
    
    4.  **DO NOT SEARCH FOR IMAGES:** You are strictly forbidden from searching for album art or any images for speed.
    5.  **App Sourcing (RESTRICTED):** For each song, identify which platforms from this list it is on: Spotify, Apple Music, YouTube, SoundCloud, Deezer, JioSaavn, Gaana, Wynk, Anghami, Boomplay.
    6.  **DO NOT PROVIDE URLs:** Only provide the app's name.
    7.  **Quantity Requirement (CRITICAL):** For each genre category (including Popular & Iconic Hits), you MUST provide at least 10 music items.
    8.  **No Empty Results:** Returning empty lists is a failure. Be resourceful.

    **JSON OUTPUT SPECIFICATION:**
    The response MUST be ONLY a single, valid JSON object. All text content must be in ${language}.

    {
      "destination": "${destination}",
      "popularHits": {
        "genre": "Popular & Iconic Hits",
        "description": "A mix of the most popular, currently trending songs and the timeless, iconic classics that define the sound of ${destination}.",
        "music": [
          {
            "title": "string",
            "artistOrDescription": "string",
            "appLinks": [ { "appName": "Spotify" } ]
          }
        ]
      },
      "categories": [
        {
          "genre": "string",
          "description": "string",
          "music": [
            {
              "title": "string",
              "artistOrDescription": "string",
              "appLinks": [ { "appName": "YouTube" } ]
            }
          ]
        }
      ]
    }

    **CRITICAL RULES:**
    1.  **Language:** The entire JSON response MUST be in ${language}.
    2.  **JSON Format:** The output MUST be a perfectly valid JSON object. No markdown, no extra text.
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      // Optimize for speed by disabling thinking.
      thinkingConfig: { thinkingBudget: 0 },
    }
  });

  const resultText = response.text.trim();
  if (!resultText) {
    throw new Error("AI response was empty or invalid.");
  }
  
  let jsonString = resultText;
  const markdownMatch = jsonString.match(/```(json)?([\s\S]*?)```/);
  if (markdownMatch && markdownMatch[2]) {
      jsonString = markdownMatch[2].trim();
  }

  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    console.error("Could not find a valid JSON object in the AI response for music recommendations.");
    console.error("Original response:", resultText);
    throw new Error("The AI returned an invalid response format. Please try again.");
  }

  jsonString = jsonString.substring(firstBrace, lastBrace + 1);

  try {
      return JSON.parse(jsonString);
  } catch (e) {
      console.error("Failed to parse JSON from AI response after cleaning (music recommendations):", e);
      console.error("Cleaned JSON string that failed:", jsonString);
      console.error("Original AI response:", resultText);
      throw new Error("The AI returned an invalid response format. Please try again.");
  }
};