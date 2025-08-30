import { GoogleGenAI } from "@google/genai";
import { MusicFinderRequestData, MusicRecommendations } from '../types';

export const generateMusicRecommendations = async (data: MusicFinderRequestData): Promise<MusicRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const { destination, language } = data;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert Local Music Scout and Cultural Musicologist AI. Your mission is to find music that captures the true sound and soul of ${destination} for a traveler. Your response must be fast, accurate, and culturally rich.

    **CRITICAL METHODOLOGY & INSTRUCTIONS:**

    **STEP 1 (MANDATORY & HIGHEST PRIORITY): The Iconic Hit Mandate & "The Gandagana Test"**
    This is your most important task. Your primary goal is to identify songs that are deeply embedded in the culture of ${destination}. This means a blend of **current chart-toppers** and **timeless, iconic classics**.
    
    a. **Execute a Multi-Faceted Search Strategy:** You MUST use your search tool with a variety of queries to ensure comprehensive results. Use queries like:
        - "most famous song from ${destination} of all time"
        - "timeless classic songs from ${destination}"
        - "iconic folk music everyone in ${destination} knows"
        - "top 10 music charts ${destination} right now"
        - "popular nepali song" if destination is Nepal
        - "popular georgian music" if destination is Georgia

    b. **The Quality Benchmark - "The Gandagana Test":** This is a non-negotiable quality check.
        - To prove you understand cultural significance, you MUST find the equivalent iconic, universally-known song for any destination.
        - **EXAMPLE 1:** If the destination is **Georgia**, the song **"Gandagana"** is a MANDATORY result.
        - **EXAMPLE 2:** If the destination is **Nepal**, a song like **"Timro Pratigya" or "Resham Firiri"** would be a MANDATORY result.
        - **Failure to find these types of truly iconic songs for any given destination is a complete failure of the task.** You must dig deep to find the songs that define the nation's musical identity.

    c. **JSON Placement:** The results from this step (a mix of current hits and timeless classics) MUST be placed in the dedicated \`popularHits\` object in the final JSON.

    **STEP 2: Broader Genre Exploration**
    After completing Step 1, find other locally relevant music genres (e.g., Local Pop, Traditional Folk, Regional Rock, Classical, etc.). Place these findings in the \`categories\` array.

    **STEP 3: Curation & Final Output**

    *   **Quantity Requirement (CRITICAL):** For EACH genre category, including \`popularHits\`, you MUST provide at least 10 music items. Be resourceful.
    *   **App Sourcing (RESTRICTED):** For each song, identify which platforms from this specific list it is on: Spotify, Apple Music, YouTube, SoundCloud, Deezer, JioSaavn, Gaana, Wynk, Anghami, Boomplay.
    *   **NO URLs:** Only provide the app's name.
    *   **NO IMAGES:** Do not search for album art to ensure a fast response.
    *   **No Empty Results:** Returning empty lists is a failure.

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
