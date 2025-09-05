import { GoogleGenAI, Type } from "@google/genai";
import { Budget, Itinerary, Vibe, FoodPreference, BlogReference, TripType, LocationSuggestion } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';

// Cache for destination suggestions to avoid redundant API calls
const suggestionsCache = new Map<string, LocationSuggestion[]>();

export const getDestinationSuggestions = async (query: string): Promise<LocationSuggestion[]> => {
  const cacheKey = query.trim().toLowerCase();
  if (suggestionsCache.has(cacheKey)) {
    return suggestionsCache.get(cacheKey)!;
  }

  if (!process.env.API_KEY) {
    console.error("API key is missing.");
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = query.trim()
      ? `**Role:** Master Geographer AI

**Objective:** Provide a concise list of up to 5 geographic location suggestions based on the user's query, formatted as a valid JSON array.

**Context:**
- The user is searching for a travel destination.
- User's Query: "${query}"
- A critical hierarchy must be followed for ambiguous queries. For example, if the query is "Georgia", the country "Georgia" must be ranked higher than the US state "Georgia".

**Instructions:**
1.  Analyze the user's query: "${query}".
2.  Generate up to 5 relevant location suggestions.
3.  **Hierarchy Rule (CRITICAL):** Rank results strictly in this order of precedence: Country > State/Region > City > Village/Locality.
4.  **Output Format (MANDATORY):**
    - The entire response MUST be a single, valid JSON array.
    - Each object in the array MUST contain three keys:
        - "type": A string (e.g., "Country", "State", "City").
        - "name": A string with the location's name.
        - "parentHierarchy": A string showing the location's context (e.g., "USA", "California, USA").
    - The response MUST start with '[' and end with ']'.
    - DO NOT include any text, markdown, or explanations outside the JSON array.`
      : `**Role:** Master Geographer AI

**Objective:** Provide a list of 5 popular and diverse travel locations from around the world, formatted as a valid JSON array.

**Context:** The user has not provided a search query and is looking for general inspiration.

**Instructions:**
1.  Suggest 5 well-known and varied travel destinations.
2.  **Output Format (MANDATORY):**
    - The entire response MUST be a single, valid JSON array.
    - Each object in the array MUST contain three keys:
        - "type": A string (e.g., "Country", "State", "City").
        - "name": A string with the location's name.
        - "parentHierarchy": A string showing the location's context (e.g., "India", "Paris, France").
    - The response MUST start with '[' and end with ']'.
    - DO NOT include any text, markdown, or explanations outside the JSON array.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    const resultText = response.text.trim();
    if (!resultText) {
        console.error("AI response for suggestions was empty or invalid:", response);
        return [];
    }
    
    const jsonString = extractJson(resultText);
    const resultJson = JSON.parse(jsonString);

    if (!Array.isArray(resultJson)) {
      console.error("Invalid response format from AI. Expected an array.");
      return [];
    }
    
    const suggestions: LocationSuggestion[] = resultJson.filter(item => 
      typeof item === 'object' &&
      item !== null &&
      'type' in item &&
      'name' in item &&
      'parentHierarchy' in item
    );
    suggestionsCache.set(cacheKey, suggestions);
    return suggestions;

  } catch (error) {
    console.error("Error fetching destination suggestions from AI:", error);
    return [];
  }
};

export const getReferenceBlogs = async (destination: string, language: string): Promise<BlogReference[]> => {
  if (!process.env.API_KEY) {
    console.error("API key is missing.");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // --- Find blogs using Google Search ---
    const searchPrompt = `Find up to 5 helpful and popular travel blog posts for planning a trip to ${destination}. Prioritize blogs written in ${language}.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (!Array.isArray(groundingChunks) || groundingChunks.length === 0) {
      return [];
    }

    const blogs = groundingChunks
      .map(chunk => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
          const url = new URL(chunk.web.uri);
          let source = url.hostname.replace(/^www\./, '');

          // If the source is a Google redirect, don't show it.
          if (source === 'vertexaisearch.cloud.google.com') {
            source = '';
          }
          
          return {
            title: chunk.web.title,
            url: chunk.web.uri,
            source,
            description: `A helpful travel guide for your trip planning. Read more about ${destination}.`
          };
        }
        return null;
      })
      .filter((blog): blog is BlogReference => blog !== null)
      .slice(0, 5);

    return blogs;

  } catch (error) {
    console.error("Error finding reference blogs:", error);
    return [];
  }
};


export const generateItinerary = async (
  destination: string,
  startPoint: string,
  tripType: TripType,
  days: number,
  budget: Budget,
  vibe: Vibe[],
  persons: number,
  foodPreference: FoodPreference,
  startDate: string,
  includeMedical: boolean,
  language: string,
  isRoundTrip: boolean | undefined,
  currency: string,
  onChunk?: (chunk: string) => void
): Promise<Itinerary> => {

  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `**Role:** World-Class AI Travel Agent and Itinerary Planner

**Objective:** Generate a comprehensive, detailed, and practical travel itinerary based on the user's specifications, formatted as a single, valid JSON object.

**Context:**
- **Core Philosophy:** The user is an energetic traveler who wants a "Maximalist & Efficient" plan. This means maximizing sightseeing, minimizing downtime, and including day trips. Avoid lazy or empty "rest days".
- **Trip Details:**
    - Destination: ${destination}
    - Starting Point: ${startPoint || 'Not specified'}
    - Trip Type: ${tripType}
    - Round Trip: ${isRoundTrip ? 'Yes' : 'No'}
    - Duration: ${days} days
    - Travelers: ${persons}
    - Vibe/Interests: ${vibe.join(', ')}
    - Budget Level: ${budget}
    - Food Preference: ${foodPreference}
    - Start Date: ${startDate}
    - Currency for Costs: ${currency}
    - Language for Output: ${language}

**Instructions:**
Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or explanations before or after the JSON.

**1. Route & Destination Analysis (CRITICAL FIRST STEP):**
   - **Regional/Multi-Stop Logic:** If "${destination}" is a large region (country, state), you MUST create a tour circuit covering multiple key locations. The main 'destination' field in the JSON should be updated to a descriptive name (e.g., "Rajasthan Heritage Tour").
   - **Road Trip Circuit Logic (${tripType} - Round Trip):** If this is a road trip, you MUST design a feasible, sequential circuit starting and ending at "${startPoint}".
     - **Feasibility Check:** Use search to verify the route is possible in ${days} days, respecting daily driving limits (Car: 300-400 km, Bike: 150-250 km).
     - **Route Enrichment (MANDATORY):** Maximize the number of interesting stops. A 15-day trip MUST cover more places than a 5-day trip. For example, a 15-day Jaipur-Jaisalmer trip must include other stops like Udaipur, Chittorgarh, etc.
     - **Alternative Route:** If the requested trip is not feasible, you MUST create a realistic alternative circuit that fits the user's vibe and timeframe. You MUST explain this change in the 'planNote' field, starting with "NOTE:".
   - **Accuracy:** Use search to get accurate driving distances and times. These MUST be included in the 'activities' descriptions (e.g., "**approx. 395 km, 6-7 hours**").

**2. JSON Structure and Content Rules:**
   - **coveredDestinations:** This array is MANDATORY. For multi-stop trips, it must list each major stop in order. For single-city trips, it will contain one entry. For each destination, provide detailed bullet points for history, culture, nature, museums, restaurants, and souvenirs.
   - **specialEvents:** Find events happening ONLY during the travel dates. If none, provide a helpful fallback message.
   - **plan:** The array MUST have exactly ${days} elements. The daily 'title' must be descriptive (e.g., "Day 3: Travel to Udaipur & Lake Pichola").
   - **activities:** Each activity MUST be prefixed with a realistic time or time range (e.g., "**09:00 AM - 11:00 AM:**").
   - **planNote:** Use this optional field ONLY if you had to create an alternative route or have another critical note for the user.
   - **Full JSON Schema:**
    {
      "destination": "string", "startPoint": "string", "tripType": "string", "isRoundTrip": "boolean", "days": "number", "persons": "number", "budget": "string", "vibe": "string[]", "foodPreference": "string", "startDate": "string", "language": "string", "currency": "string", "planNote": "string?", "currencyConversion": "object?", "budgetSummary": "object", "coveredDestinations": "object[]", "plan": "object[]", "referenceBlogs": "[]"
    }

**3. Cost Calculation Rules (MANDATORY):**
   - **Currency:** All costs MUST be in "${currency}".
   - **Formatting:** All cost fields MUST be a string containing ONLY numbers (e.g., "1500", "250.50"). NO currency symbols or text.
   - **budgetSummary.total:** MUST be the per-person sum of 'stay', 'food', 'fuel' (if applicable), and 'miscellaneous'.
   - **budgetSummary.fuel (Road Trips Only):** Calculate the total fuel cost for all vehicles needed for ${persons} people, then provide the per-person average.
   - **plan.approxCost (Daily Cost):** This is CRITICAL. It must be the per-person cost for THAT DAY'S activities and food ONLY. Use search to find real entry fees for attractions and add a reasonable food estimate. DO NOT average the total budget. A museum day will cost more than a free walking tour day.
   - **plan.transport.cost (Road Trips Only):** This is the fuel cost for ONE vehicle for that day's travel leg. "0" if no inter-city travel.

**4. Final Formatting & Validation Rules:**
   - **Language:** All user-facing text MUST be in ${language}.
   - **Bolding:** Use bold markdown (**text**) to highlight key names, places, and advice.
   - **NO JARGON:** NEVER mention JSON field names (like 'approxCost' or 'budgetSummary') in user-facing text. Explain concepts naturally.
   - **JSON Validity (CRITICAL):** Your output MUST be a perfectly valid JSON object. Ensure no unescaped double quotes exist within string values. Use single quotes or escape them (\\").
   - **Medical Facilities:** If requested, include nearby hospitals/pharmacies in the daily 'medicalFacilities' array.
   - **referenceBlogs:** This field must be an empty array \`[]\`. It is populated by a separate process.
   - **currencyConversion:** If the destination's local currency is different from "${currency}", populate this object with the rate. Otherwise, omit it.
`;
  
    let fullText = '';
    try {
        // Use streaming only if onChunk is provided, otherwise use a direct request for speed.
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

        return {
            ...cleanedJson,
            startPoint,
            tripType,
            isRoundTrip: isRoundTrip ?? false,
            persons,
            budget,
            vibe,
            foodPreference,
            startDate,
            language,
            currency,
        };
    } catch (error) {
        console.error("Failed to generate and parse itinerary stream:", error);
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
                 throw new Error(`The AI's response for the itinerary was malformed and could not be read. This can happen occasionally. Please try regenerating the plan.`);
            }
            if (error.message.includes("Could not find a valid JSON object")) {
                 throw new Error("The AI did not provide a structured itinerary. It may have refused the request. Please adjust your query and try again.");
            }
        }
        
        throw new Error("The AI returned an invalid response format for the itinerary. Please try again.");
    }
};