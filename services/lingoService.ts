import { GoogleGenAI } from "@google/genai";
import { LingoFinderRequestData, LingoRecommendations } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';
import { CookieUtils } from './cookieUtils';

export const generateLingoGuide = async (data: LingoFinderRequestData, onChunk?: (chunk: string) => void, userApiKey?: string): Promise<{result: LingoRecommendations, prompt: string}> => {
  const { apiKey, isUsingDefaultKey } = await CookieUtils.getApiKeyWithSource(userApiKey);
  
  // Ensure API key is properly trimmed
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Invalid API key: key is empty or whitespace only");
  }
  const cleanApiKey = apiKey.trim();

  const { destination, language } = data;
  const ai = new GoogleGenAI({ apiKey: cleanApiKey });

  const prompt = `
    You are an expert Linguist and Local Guide AI. Your mission is to create a practical, helpful, and culturally aware phrasebook for a traveler visiting "${destination}".
    The output language for the entire JSON response must be in ${language}.

    **CRITICAL INSTRUCTIONS & PROTOCOL:**

    1.  **Identify Local Language:** First, you MUST determine the primary local language spoken in "${destination}". This will be used for the translations.
    2.  **Curate Essential Categories:** Create a list of essential phrase categories. You MUST include at least the following five categories: "Greetings & Basics", "Dining & Ordering Food", "Shopping & Bargaining", "Directions & Transportation", and "Emergencies". You may add 1-2 other relevant categories if applicable to the destination (e.g., "Beach Phrases" for a coastal city).
    3.  **Generate Phrases:** For each category, provide 5-8 useful phrases. Each phrase object MUST contain three fields:
        - \`english\`: The phrase in English.
        - \`local\`: The direct translation of the phrase in the identified local language.
        - \`pronunciation\`: A simple, easy-to-read phonetic spelling of the \`local\` phrase. **CRITICAL PRONUNCIATION RULE:** This pronunciation guide MUST be written in the script and phonetic system of the target output language, which is **'${language}'**. For example, if the output language is Hindi, the pronunciation for 'Konnichiwa' should be written in Devanagari script (e.g., 'कोनिचिवा'). If the output language is English, a simple romanization (like 'Konnichiwa') is acceptable.

    **JSON OUTPUT SPECIFICATION:**
    The response MUST be ONLY a single, valid JSON object that strictly follows this structure. All text content must be in ${language}.

    {
      "destination": "${destination}",
      "localLanguage": "The name of the local language you identified (e.g., 'Japanese', 'Hindi', 'Spanish')",
      "categories": [
        {
          "categoryName": "Greetings & Basics",
          "phrases": [
            { "english": "Hello", "local": "こんにちは", "pronunciation": "Konnichiwa" }
          ]
        }
      ]
    }

    **FINAL CRITICAL RULES:**
    1. **Language:** The entire JSON response MUST be in ${language}.
    2. **JSON VALIDATION:** The output MUST be a perfectly valid JSON object. NO unescaped double quotes (") in string values. Use single quotes or escape with \\". Check every string before finishing.
    3. **FINAL INSTRUCTION:** Your entire response MUST be the raw JSON object starting with '{' and ending with '}'. NO markdown wrapping, NO introductory text. Immediately parsable as JSON.
  `;

  let fullText = '';
  try {
      if (onChunk) {
        const stream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
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
                thinkingConfig: { thinkingBudget: 0 },
                responseMimeType: "application/json",
            }
        });
        fullText = response.text;
      }

      if (!fullText) throw new Error("The AI returned an empty response.");
      
      const jsonString = extractJson(fullText);
      const parsedJson = JSON.parse(jsonString);

      if (parsedJson.error && parsedJson.error.code) {
          const { code, message } = parsedJson.error;
          throw new Error(`[${code}] ${message}`);
      }

      const cleanedJson = cleanCitations(parsedJson);

      return { result: cleanedJson, prompt };
  } catch (error) {
      console.error("Failed to generate and parse lingo guide stream:", error);
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
             throw new Error(`The AI's response for the lingo guide was malformed and could not be read. Please try again.`);
        }
        if (error.message.includes("Could not find a valid JSON object")) {
             throw new Error("The AI did not provide a structured lingo guide. It may have refused the request. Please adjust your query and try again.");
        }
    }
      
    throw new Error("The AI returned an invalid response format for the lingo guide. Please try again.");
  }
};