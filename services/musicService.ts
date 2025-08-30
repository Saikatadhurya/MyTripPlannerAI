import { GoogleGenAI } from "@google/genai";
import { MusicFinderRequestData, MusicRecommendations } from '../types';

export const generateMusicRecommendations = async (data: MusicFinderRequestData): Promise<MusicRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const { destination, language } = data;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a Local Music Scout AI. Your mission is to find and curate a list of local music for a traveler visiting ${destination}, identifying the best platforms to listen on.

    **CRITICAL INSTRUCTIONS & METHODOLOGY:**
    1.  **Use Google Search:** You MUST use your search capabilities to find up-to-date information on genres, artists, and playlists for ${destination}.
    
    2.  **HIGH-PRIORITY TASK - POPULAR HITS:**
        a. Your FIRST task is to perform a targeted search for the **most popular, currently trending, and chart-topping songs** in ${destination}.
        b. These results MUST be placed in a dedicated \`popularHits\` object in the JSON output. This is not optional. The genre for this MUST be "Popular Hits".

    3.  **MAIN TASK - OTHER GENRES:**
        a. After finding popular hits, proceed with your blended research to find other locally relevant music (native genres, contemporary music locals listen to).
        b. These go into the \`categories\` array.
    
    4.  **App Sourcing (MANDATORY & RESTRICTED):** For each song or playlist, you MUST identify which of the following popular streaming platforms it is available on. To improve speed, you are ONLY allowed to suggest apps from this predefined list. Do not search for other apps.
        - **Allowed Apps:** Spotify, Apple Music, YouTube Music, SoundCloud, Deezer, JioSaavn, Gaana, Wynk, Anghami, Boomplay.
    
    5.  **DO NOT PROVIDE URLs:** You are strictly forbidden from providing any URLs. Just provide the app's name.
    6.  **Categorization:** Group your findings into the specified genre categories. A description for each genre explaining its local relevance is mandatory.
    7.  **No Empty Results:** Returning empty lists is a failure. If a specific genre has no results, find more general popular music and place it in a suitable category like 'Pop & Rock' or 'Modern Fusion / Indie'.
    8.  **Quantity Requirement (CRITICAL):** For each genre category (including Popular Hits), you MUST provide a substantial list of at least 10 music items (songs or playlists). A sparse list is not acceptable.

    **JSON OUTPUT SPECIFICATION:**
    The response MUST be ONLY a single, valid JSON object that strictly follows this structure. All text content must be in ${language}.

    {
      "destination": "${destination}",
      "popularHits": {
        "genre": "Popular Hits",
        "description": "The most popular and trending songs currently loved by locals in ${destination}.",
        "music": [
          {
            "title": "string",
            "artistOrDescription": "string",
            "appLinks": [
              { "appName": "Spotify" }
            ]
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
              "appLinks": [
                { "appName": "YouTube Music" }
              ]
            }
          ]
        }
      ]
    }

    **CRITICAL RULES:**
    1.  **Language:** The entire JSON response, including all names and descriptions, MUST be in ${language}.
    2.  **JSON Format:** The output MUST be a perfectly valid JSON object starting with { and ending with }. No markdown, no extra text. Use single quotes or escaped quotes (\\") inside strings to avoid breaking JSON.
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
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
