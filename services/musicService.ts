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
    2.  **Blended Research:**
        a. First, find music genres and artists native or unique to the region of ${destination}.
        b. Second, find contemporary and popular music that locals in ${destination} listen to, even if it's not unique to the region.
    3.  **App Sourcing (MANDATORY & RESTRICTED):** For each song or playlist, you MUST identify which of the following popular streaming platforms it is available on. To improve speed, you are ONLY allowed to suggest apps from this predefined list. Do not search for other apps.
        - **Allowed Apps:** Spotify, Apple Music, YouTube Music, SoundCloud, Deezer, JioSaavn, Gaana, Wynk, Anghami, Boomplay.
    4.  **DO NOT PROVIDE URLs:** You are strictly forbidden from providing any URLs. Just provide the app's name.
    5.  **Categorization:** Group your findings into the specified genre categories. A description for each genre explaining its local relevance is mandatory.
    6.  **No Empty Results:** Returning empty lists is a failure. If a specific genre has no results, find more general popular music and place it in a suitable category like 'Pop & Rock' or 'Modern Fusion / Indie'.
    7.  **Quantity Requirement (CRITICAL):** For each genre category, you MUST provide a substantial list of at least 10 music items (songs or playlists). A sparse list is not acceptable.

    **JSON OUTPUT SPECIFICATION:**
    The response MUST be ONLY a single, valid JSON object that strictly follows this structure. All text content must be in ${language}.

    {
      "destination": "${destination}",
      "categories": [
        {
          "genre": "string", // E.g., "Folk / Traditional"
          "description": "string", // E.g., "Traditional Rajasthani folk music known for its vibrant storytelling..."
          "music": [
            {
              "title": "string", // E.g., "Kesariya Balam" (Song) or "Sounds of Rajasthan" (Playlist)
              "artistOrDescription": "string", // E.g., "Allah Jilai Bai" or "A playlist of classic Rajasthani folk songs."
              "appLinks": [
                {
                  "appName": "Spotify" | "Apple Music" | "YouTube Music" | "JioSaavn" | "Gaana" | "Wynk" | "Anghami" | "Boomplay" | "Deezer" | "SoundCloud"
                }
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