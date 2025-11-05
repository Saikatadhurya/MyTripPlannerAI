import { GoogleGenAI } from "@google/genai";
import { AppFinderRequestData, AppRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';
import { CookieUtils } from './cookieUtils';

export const generateAppRecommendations = async (data: AppFinderRequestData, onChunk?: (chunk: string) => void, userApiKey?: string): Promise<{result: AppRecommendations, prompt: string}> => {
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
    This is a multi-stop trip covering: ${destinationsString}.
    **CRITICAL MULTI-STOP INSTRUCTIONS:**
    1.  Your recommendations MUST be relevant for the entire region, but you MUST prioritize finding popular **local apps for EACH destination**. For example, if the trip includes "Goa", you MUST search for apps popular specifically in Goa.
    2.  **MANDATORY 'location' field:** For each app you recommend that is specific to one of the locations, you MUST populate the 'location' field in the JSON with that city's name (e.g., "Goa"). For generic, widely-used apps like Google Maps or Booking.com, this field should be an empty string "".
    `;
  }

  const prompt = `
    You are a tech-savvy local guide and an expert global travel assistant. Your mission is to provide a traveler with a curated list of the most useful, relevant, and currently available mobile apps for their trip to ${destinationsString}, written in ${language}. Your recommendations MUST include popular local alternatives to global apps.
    ${multiStopInstructions}

    **CRITICAL INSTRUCTIONS & PROTOCOL:**
    1.  **Use Google Search:** You MUST use your search capabilities to find currently available applications for ${destinationsString}.
    2.  **Local Expertise is Key:** For each category, you must find both internationally known apps (e.g., Uber) AND their popular local competitors. This is crucial. For example, for Delhi, India, in 'Transport', you MUST include Uber, but also critical local competitors like Ola and Rapido.
    3.  **DO NOT PROVIDE URLs:** You are strictly forbidden from providing any App Store or Play Store URLs. Your only task is to identify the app's name and platform.
    4.  **DO NOT FETCH RATINGS:** You MUST NOT spend time searching for app ratings. The goal is a fast response.
    5.  **Categorize Accurately:** Place each app in ONE of the specified categories. If a category has no relevant apps after an exhaustive search, return an empty array for it.

    The response MUST be ONLY a single, valid JSON object that strictly follows this structure. All text content must be in ${language}.

    JSON Structure:
    {
      "destination": "${destination}",
      "transportAndTravel": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "stayAndLiving": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "foodAndDining": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "entertainmentAndLeisure": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "shoppingAndEssentials": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "explorationAndTours": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "utilitiesAndSafety": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }],
      "festivalsAndSeasonal": [{ "name": "string", "category": "string", "description": "string", "platform": "iOS" | "Android" | "Both", "icon": "emoji", "location"?: "string" }]
    }

    **CRITICAL RULES & EXAMPLE:**
    1.  **App Naming Convention (CRITICAL):** The 'name' field MUST be the proper, official name of the app (e.g., "Google Maps", "AllTrails", "Uber Eats"). It MUST NOT be a generic category. For example, for the app 'AllTrails', the name MUST be "AllTrails", NOT "hikes".
    2.  **Category (CRITICAL):** The 'category' field MUST be a short, one-word, lowercase description of the app's primary function (e.g., "hikes", "navigation", "food delivery"). For apps that are very famous and instantly recognizable by their icon (like Google Maps), you can make this category an empty string "". For others, it is mandatory.
    3.  **Icon:** The 'icon' field MUST be a single, relevant emoji.
    4.  **Language:** The entire JSON response, including all names and descriptions, MUST be in ${language}.
    5. **JSON VALIDATION:** The output MUST be a perfectly valid JSON object. NO unescaped double quotes (") in string values. Use single quotes or escape with \\". Check every string before finishing.
    6. **Example of a good entry:**
        \`{ "name": "AllTrails", "category": "hikes", "description": "A popular app for discovering and navigating trekking trails...", "platform": "Both", "icon": "🌲", "location": "" }\`
        \`{ "name": "Goa Miles", "category": "taxi", "description": "A taxi booking app specific to Goa...", "platform": "Both", "icon": "🚕", "location": "Goa" }\`
    7. **FINAL INSTRUCTION:** Your entire response MUST be the raw JSON object starting with '{' and ending with '}'. NO markdown wrapping, NO introductory text. Immediately parsable as JSON.
  `;
  
  let fullText = '';
  try {
      if (onChunk) {
        const stream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 0 },
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
                thinkingConfig: { thinkingBudget: 0 },
                responseMimeType: "application/json",
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

      return { result: cleanedJson, prompt };
  } catch (error) {
      console.error("Failed to generate and parse app recommendations stream:", error);
      console.error("Original AI response text accumulated:", fullText);
      
      if (error instanceof Error) {
        if (error.message.startsWith('[')) {
            // It's already a custom-formatted error, re-throw it.
            throw error;
        }

        const combinedErrorText = (error.message + fullText).toLowerCase();

        if (combinedErrorText.includes("quota") || combinedErrorText.includes("rate limit") || combinedErrorText.includes("429")) {
            if (isUsingDefaultKey) {
                throw new Error("[429] The default API key has reached its quota limit. Please set your own Gemini API key in your profile settings to continue.");
            }
            throw new Error("[429] You have exceeded the request limit. Please check your plan and billing details and try again later.");
        }
        if (combinedErrorText.includes("overloaded") || combinedErrorText.includes("server error") || combinedErrorText.includes("503")) {
             throw new Error("[503] The AI model is currently busy. Please wait a moment and try again.");
        }
        
        if (error instanceof SyntaxError) {
             throw new Error(`The AI's response for the app finder was malformed and could not be read. Please try again.`);
        }
        if (error.message.includes("Could not find a valid JSON object")) {
             throw new Error("The AI did not provide a structured list of apps. It may have refused the request. Please adjust your query and try again.");
        }
    }
      
    throw new Error("The AI returned an invalid response format for the app finder. Please try again.");
  }
};