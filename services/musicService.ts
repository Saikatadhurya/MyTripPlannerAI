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

    **CRITICAL DIVERSITY & REGIONAL BREAKDOWN MANDATE:**
    This is your most important instruction. You MUST analyze if the destination is a large, culturally diverse country.

    1.  **INDIA-SPECIFIC INSTRUCTIONS (MANDATORY):** If the destination is **India**, you MUST create separate regional categories for **North Indian**, **South Indian**, **East Indian**, and **West Indian** music.
        - **North:** Find a mix of current **Bollywood** hits, iconic classics, and popular **Punjabi** tracks.
        - **South:** Find popular and classic songs from **Tamil (Kollywood)**, **Telugu (Tollywood)**, **Malayalam**, and **Kannada** cinema and music scenes.
        - **East:** Find beloved **Bengali** songs (both modern and Rabindra Sangeet), and popular **Assamese** or **Odia** music.
        - **West:** Find popular **Marathi** and **Gujarati** songs that are cultural staples.
        - Place these regional findings into the \`regionalHighlights\` array.

    2.  **FOR OTHER DIVERSE COUNTRIES (e.g., USA, China, Brazil):** Use your knowledge to identify 2-4 primary musical regions and create categories for them in the \`regionalHighlights\` array (e.g., for the USA: 'Hip-Hop & R&B (East Coast/West Coast/Southern)', 'Country (Nashville)', 'Indie & Rock (Pacific Northwest)').

    3.  **FOR SMALLER/HOMOGENEOUS COUNTRIES:** If the destination is smaller with a more unified music scene, you can create genre-based categories (e.g., 'Pop', 'Folk', 'Classical') within the \`regionalHighlights\` array. The 'genre' field for the category should reflect the genre name.

    **SEARCH & CURATION PROTOCOL:**

    -   **Nationwide Trending Hits (Optional but Recommended):** First, try to find songs that are trending across the entire nation. Place these in the optional \`trendingHits\` object.
    -   **Regional Deep Dive (Mandatory):** For each region you identified (like North India, South India, etc.), find a mix of:
        -   **Current Hits:** What's popular in that region right now?
        -   **Iconic Classics:** What timeless songs define that region's culture? This is where you apply **"The Gandagana Test"**—find the songs that are absolute, non-negotiable cultural anthems for that specific region.
    -   **Sorting by Popularity (CRITICAL):** Within EACH category, you MUST order the songs from most popular to least popular. Use metrics like YouTube views and streaming numbers. The most famous song MUST be listed first.
    -   **Quantity:** Provide at least 5-10 music items per category.
    -   **Sourcing:** Identify availability on this specific list of apps: Spotify, Apple Music, YouTube, SoundCloud, Deezer, JioSaavn, Gaana, Wynk, Anghami, Boomplay.
    -   **RESTRICTIONS:** NO URLs. NO album art. NO empty results.

    **JSON OUTPUT SPECIFICATION:**
    The response MUST be ONLY a single, valid JSON object. All text content must be in ${language}.

    {
      "destination": "${destination}",
      "trendingHits": { // Optional, for nationwide trends
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
      "regionalHighlights": [ // This is the main array for regional music
        {
          "genre": "North Indian Music", // Example for India
          "description": "A mix of Bollywood chartbusters, timeless classics, and vibrant Punjabi hits that define North India.",
          "music": [
             { "title": "string", "artistOrDescription": "string", "appLinks": [ { "appName": "YouTube" } ] }
          ]
        },
        {
          "genre": "South Indian Music", // Example for India
          "description": "Iconic and trending songs from the powerful film and music industries of Tamil, Telugu, Malayalam, and Kannada.",
          "music": [
            { "title": "string", "artistOrDescription": "string", "appLinks": [ { "appName": "Spotify" } ] }
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