import { GoogleGenAI } from "@google/genai";
import { MusicFinderRequestData, MusicRecommendations } from '../types';

export const generateMusicRecommendations = async (data: MusicFinderRequestData): Promise<MusicRecommendations> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const { destination, language } = data;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a world-class Ethnomusicologist AI. Your primary mission is to recognize and represent the deep musical diversity of the destination: "${destination}". You must provide a traveler with culturally rich, regionally accurate, and popular music.

    **MANDATORY TWO-PHASE PROTOCOL:**

    **PHASE 1: NATIONWIDE TRENDING HITS (NON-NEGOTIABLE)**
    -   Your first and most critical task is to find the songs that are currently charting and trending across the *entire* nation of "${destination}".
    -   These songs MUST be placed in the \`trendingHits\` object. This section is for the hottest, most current chart-toppers and viral hits.

    **PHASE 2: REGIONAL DEEP-DIVE & ANTI-BIAS MANDATE**
    -   After finding nationwide hits, you MUST perform a regional deep-dive. You MUST analyze if the destination is a large, culturally diverse country and create separate regional categories.

    -   **INDIA-SPECIFIC INSTRUCTIONS (MANDATORY & CRITICAL):** If the destination is **India**, you MUST give EQUAL weight and effort to all regions. You are strictly forbidden from letting Bollywood/Hindi music dominate or bleed into other regional categories.
        -   Create a category for **North Indian Music**: Find current **Bollywood** hits (e.g., from artists like Arijit Singh), iconic classics, and popular **Punjabi** tracks (e.g., from artists like Diljit Dosanjh).
        -   Create a category for **South Indian Music**: Find *authentic* chart-toppers from the **Tamil** (e.g., Anirudh Ravichander), **Telugu** (e.g., S. Thaman), **Malayalam** (e.g., Hesham Abdul Wahab), and **Kannada** (e.g., Vijay Prakash) industries.
        -   Create a category for **East Indian Music**: Find beloved **Bengali** songs (both modern and classic Rabindra Sangeet) and popular **Assamese** or **Odia** music.
        -   Create a category for **West Indian Music**: Find popular **Marathi** (e.g., Ajay-Atul) and **Gujarati** (e.g., Sachin-Jigar) songs that are cultural staples.
        -   Place these regional findings into the \`regionalHighlights\` array.

    -   **FOR OTHER DIVERSE COUNTRIES (e.g., USA, China, Brazil):** Use your knowledge to identify 2-4 primary musical regions and create categories for them in the \`regionalHighlights\` array (e.g., for the USA: 'Hip-Hop & R&B (East/West/South)', 'Country (Nashville)', 'Indie & Rock (PNW)').

    -   **FOR SMALLER/HOMOGENEOUS COUNTRIES:** If the destination is smaller with a more unified music scene, create genre-based categories (e.g., 'Pop', 'Folk', 'Classical') within the \`regionalHighlights\` array.

    **GENERAL CURATION RULES:**
    -   **Sorting by Popularity (CRITICAL):** Within EACH category (\`trendingHits\` and every category in \`regionalHighlights\`), you MUST order the songs from most popular to least popular. The most famous, highest-viewed song MUST be listed first.
    -   **Content:** For each region, find a mix of **Current Hits** and **Iconic Classics**. Apply **"The Gandagana Test"**—find the songs that are absolute, non-negotiable cultural anthems for that specific region.
    -   **Quantity:** Provide at least 5-10 music items per category.
    -   **Sourcing:** Identify availability on this specific list of apps: Spotify, Apple Music, YouTube, SoundCloud, Deezer, JioSaavn, Gaana, Wynk, Anghami, Boomplay.
    -   **RESTRICTIONS:** NO URLs. NO album art. NO empty results.

    **JSON OUTPUT SPECIFICATION:**
    The response MUST be ONLY a single, valid JSON object. All text content must be in ${language}.

    {
      "destination": "${destination}",
      "trendingHits": {
        "genre": "Top Trending Hits",
        "description": "The most popular songs currently trending across ${destination}.",
        "music": [
          {
            "title": "string",
            "artistOrDescription": "string",
            "appLinks": [ { "appName": "Spotify" } ]
          }
        ]
      },
      "regionalHighlights": [
        {
          "genre": "North Indian Music",
          "description": "A mix of Bollywood chartbusters, timeless classics, and vibrant Punjabi hits that define North India.",
          "music": [
             { "title": "string", "artistOrDescription": "string", "appLinks": [ { "appName": "YouTube" } ] }
          ]
        }
      ]
    }

    **FINAL CRITICAL RULES:**
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