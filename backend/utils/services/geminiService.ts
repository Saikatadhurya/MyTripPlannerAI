
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
        ? `You are a master geographer AI. Based on the user input "${query}", provide up to 5 location suggestions.
        CRITICAL HIERARCHY RULE: You MUST rank the results in this strict order of importance:
        1. Country
        2. State / Region
        3. City
        4. Village / Locality
        For example, if the user types "Georgia", the country "Georgia" MUST be the first result, followed by "Georgia, USA".
        Provide only a JSON array of objects.`
        : `Suggest 5 popular and diverse travel locations from around the world, including a mix of cities, states/provinces, and countries. Provide only a JSON array of objects.`;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: "The type of location, e.g., 'Country', 'State', 'City'." },
                name: { type: Type.STRING, description: "The name of the location." },
                parentHierarchy: { type: Type.STRING, description: "The parent region, e.g., 'USA' or 'France'. Empty for countries." },
            },
            required: ["type", "name", "parentHierarchy"]
        },
        description: "A hierarchically sorted list of up to 5 location suggestions."
    };
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    const resultText = response.text.trim();
    if (!resultText) {
        console.error("AI response for suggestions was empty or invalid:", response);
        return [];
    }
    const resultJson = JSON.parse(resultText);

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
    const searchResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;

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
  
  const regionalTripInstructions = `
  REGIONAL TRAVEL INSTRUCTION:
  If the destination "${destination}" appears to be a large region (e.g., a country, state, province, or a well-known tourist circuit), you MUST create a logical tour itinerary that covers multiple key cities or locations within that region. In this case:
  1.  The 'coveredDestinations' array MUST be populated with detailed information for each of these key locations visited.
  2.  The 'destination' field in the JSON response should be updated to a more descriptive name for this circuit (e.g., 'Rajasthan Heritage Tour').
  3.  The daily 'plan' should logically reflect travel between these locations.
  `;

  let roundTripInstructions = '';
  if ((tripType === 'Car' || tripType === 'Bike') && isRoundTrip && startPoint) {
      const dailyLimit = tripType === 'Car' ? '300-400 km/day' : '150-250 km/day';
      roundTripInstructions = `
      CRITICAL INSTRUCTION - DETAILED ROAD TRIP CIRCUIT:
      This is a multi-stop road trip circuit request. The user wants to travel from "${startPoint}", cover a series of interesting locations, and return to "${startPoint}" within ${days} days. The main destination of interest is "${destination}".

      1.  **Feasibility & Route Planning**: First, you MUST estimate if a meaningful road trip circuit that includes or goes towards "${destination}" is possible within ${days} days, using a ${tripType} with a daily driving limit of ${dailyLimit}.
          - **IF FEASIBLE**:
              - **A. Itinerary Density & Maximization (CRITICAL):** Your primary goal is to **maximize the number of interesting and feasible places covered** within the given **${days} days**. A longer duration MUST result in a richer, denser itinerary with more stops, not just a slower pace between fewer locations. You MUST intelligently add relevant destinations to create a comprehensive tour circuit that makes full and enjoyable use of the time. Do not leave days with minimal activity; fill them with travel to new locations or exploration.
              - **B. Example:** For a 15-day car trip from "Jaipur" with the main destination as "Jaisalmer", a simple route (Jaipur -> Jodhpur -> Jaisalmer -> Bikaner -> Jaipur) would be **too sparse**. A **correct, enriched itinerary** MUST include other logical and famous stops like **Udaipur, Chittorgarh, Kumbhalgarh, and Ranakpur** to create a full Rajasthan heritage circuit that properly utilizes the 15 days.
              - **C. Route Design:** Based on the above, design a logical, sequential road trip circuit starting and ending at "${startPoint}". The route must maximize sightseeing of famous places based on the vibe: "${vibe.join(', ')}". The farthest point should be near "${destination}".
          - **IF NOT FEASIBLE**: Do NOT fail. You MUST plan a realistic road trip circuit to an alternative region or set of destinations reachable within the timeframe that still fits the user's vibe. The "destination" field in the JSON response MUST be updated to a more descriptive name for this new circuit (e.g., 'Rajasthan Heritage Circuit'). You MUST also add a note in the new 'planNote' field in the root of the JSON response, explaining the change clearly and starting with "NOTE:". For example: "NOTE: A road trip to ${destination} and back in ${days} days isn't feasible. I've created an alternative Coastal Karnataka Temple & Adventure Circuit that fits your timeline and preferences."

      2.  **Distance & Time Accuracy (CRITICAL)**: You MUST use your search capabilities to get accurate driving distances (in kilometers) and realistic travel times between all stops in the circuit. These MUST be reflected in the daily 'activities' descriptions (e.g., "Drive from Jaipur to Udaipur (**approx. 395 km, 6-7 hours**)..."). Inaccurate distances are a critical failure.

      3.  **Structured Output - This is MANDATORY**:
          - **coveredDestinations**: This array must list each major city/stop of the road trip circuit *in the order they are visited*. For each stop, provide the detailed information (history, culture, etc.).
          - **plan**: The daily plan MUST correspond directly to the road trip circuit.
              - Each day's **title** should clearly state the travel segment, for example: 'Day 3: Travel from Chittorgarh to Udaipur & Local Sightseeing'.
              - The **activities** for a travel day should include the drive itself (mentioning the accurate, searched duration/distance) and then activities upon arrival at the new destination.
              - The final days of the plan must cover the return journey back to "${startPoint}".

      4.  **Example of a good road trip circuit plan**: A 10-day car trip from Jaipur to Jaisalmer could be structured like this:
          - **coveredDestinations**: [ {"name": "Jaipur"}, {"name": "Chittorgarh"}, {"name": "Udaipur"}, {"name": "Jodhpur"}, {"name": "Jaisalmer"}, {"name": "Bikaner"} ]
          - **plan**:
              - Day 1: Arrive in Jaipur
              - Day 2: Jaipur Sightseeing
              - Day 3: Title: 'Jaipur to Chittorgarh Fort', Activities: 'Drive to Chittorgarh (**approx. 305 km, 5-6 hours**)...'
              - Day 4: Title: 'Chittorgarh to Udaipur', Activities: 'Drive to Udaipur (**approx. 115 km, 2-3 hours**)...'
              - ... and so on, with the final day's plan including the drive from the last stop (e.g., Bikaner) back to the start (Jaipur).

      This level of detail in linking the daily plan to a sequential, multi-stop route is essential.
      `;
  } else if (tripType === 'Standard' && isRoundTrip && startPoint) {
      roundTripInstructions = `
      CRITICAL INSTRUCTION - STANDARD MULTI-STOP TOUR (PUBLIC TRANSPORT):
      This is a multi-stop round trip tour request. The user wants to travel from "${startPoint}", cover a series of interesting locations via public transport, and return to "${startPoint}" within ${days} days. The main destination of interest is "${destination}".

      1.  **Route & Transport Planning**:
          -   **A. Itinerary Density & Maximization (CRITICAL):** Your primary goal is to **maximize the number of interesting and feasible places covered** within the given **${days} days**, using public transport. A longer duration MUST result in a richer, denser itinerary with more stops, not just more days in the same few cities. You MUST intelligently add relevant destinations to create a comprehensive tour circuit that makes full and enjoyable use of the time. For example, a 15-day trip should cover significantly more cities than a 5-day trip.
          -   **B. Route Design & Transport Details:** Design a logical, sequential tour circuit starting and ending at "${startPoint}". The route must maximize sightseeing of famous places based on the vibe: "${vibe.join(', ')}". The farthest point should be near "${destination}". Unlike a road trip, the travel between cities/stops MUST be planned using the most efficient and budget-appropriate public transport. Provide realistic options like **trains** (mentioning class options), **buses** (mentioning carrier types like Volvo/sleeper), **shared cars**, or **flights** if the distance is significant.

      2.  **Distance & Time Accuracy (CRITICAL)**: You MUST use your search capabilities to get accurate travel distances and realistic travel times for the suggested mode of public transport (train, bus, etc.) between all stops in the circuit. These MUST be reflected in the daily 'activities' descriptions and 'transport' suggestions. Inaccurate details are a critical failure.

      3.  **Structured Output - This is MANDATORY**:
          -   **coveredDestinations**: This array MUST list each major city/stop of the tour circuit *in the order they are visited*. For each stop, provide the detailed information (history, culture, etc.).
          -   **plan**: The daily plan MUST correspond directly to the tour circuit.
              -   Each day's **title** should clearly state the travel segment, for example: 'Day 3: Travel from Agra to Jaipur via Train & Local Sightseeing'.
              -   The **activities** for a travel day should include the journey itself (mentioning approximate duration and mode of transport) and then activities upon arrival at the new destination.
              -   The final days of the plan MUST cover the return journey, possibly via intermediate stops, back to "${startPoint}".

      4.  **Local Transport**: For days spent exploring a destination (not traveling between cities), you should suggest local transport options (e.g., metro, ride-sharing, auto-rickshaws, taxis) that are appropriate for the user's budget.
      `;
    }
  
  const prompt = `Create a detailed travel itinerary in ${language}. The user wants to plan a ${days}-day trip to ${destination} with a ${budget} budget.
  
  Trip Details:
  - Destination: ${destination}
  - Starting Point: ${startPoint || 'Not specified'}
  - Trip Type: ${tripType}
  - Is Round Trip: ${isRoundTrip ? 'Yes' : 'No'}
  - Duration: ${days} days
  - Number of People: ${persons}
  - Vibe/Interests: ${vibe.join(', ')}
  - Budget: ${budget}
  - Food Preference: ${foodPreference}
  - Start Date: ${startDate}
  - Include Medical Facilities: ${includeMedical ? 'Yes' : 'No'}
  - Output Language: ${language}
  - Desired Currency for Costs: ${currency}
  
  CRITICAL COST BREAKDOWN INSTRUCTIONS (MANDATORY):
  1.  **budgetSummary.total**: This MUST be the sum of all other per-person costs in the budgetSummary (stay, food, and any fuel or miscellaneous costs).
  2.  **budgetSummary.miscellaneous**:
      - **For 'Car' and 'Bike' trips**: You MUST estimate a per-person budget for **tolls, parking, and minor unforeseen expenses**. This should be roughly 10-15% of the combined stay, food, and fuel costs.
      - **For 'Standard' trips**: You MUST estimate a per-person budget for **local transport, activity entry fees, tips, and minor unforeseen expenses**. This should be roughly 10-15% of the combined stay and food costs.
  3.  **plan.approxCost**: This field now represents the per-person daily cost for activities and food ONLY. It MUST EXCLUDE any inter-city travel fuel costs or miscellaneous budget items.

  ${(tripType === 'Car' || tripType === 'Bike') ? `
  CRITICAL VEHICLE-SPECIFIC INSTRUCTIONS:
  1.  **Vehicle Assumption**: Assume the user has a personal or rented vehicle. All 'transport' suggestions MUST be vehicle-centric (driving routes, times).
  2.  **Accommodation**: Prioritize hotels with secure and convenient parking for a ${tripType}.
  3.  **Realistic Pacing**: Limit daily driving: **300-400 km for a Car**, **150-250 km for a Bike**.
  4.  **budgetSummary.fuel**: You MUST calculate an estimated total fuel cost for the trip. Use vehicle capacities (Car: max 5 people, Bike: max 2 people) to determine the number of vehicles needed for the group of ${persons} people. Estimate the total fuel cost for ALL vehicles for the ENTIRE trip and provide the final PER-PERSON average in this field.
  5.  **plan.transport.cost**: This field is CRITICAL. It MUST represent the estimated fuel cost for driving **ONE SINGLE VEHICLE** for that specific day's travel leg. The frontend will use this to calculate group costs. If there's no inter-city travel, this should be "0". You are FORBIDDEN from returning any non-numeric text.
  ` : ''}

  ${regionalTripInstructions}

  ${roundTripInstructions}

  Based on all these details, generate a comprehensive itinerary. The response must be a single JSON object that strictly follows this structure and types:
  {
    "destination": string,
    "startPoint": string,
    "tripType": string ("Standard", "Bike", "Car"),
    "isRoundTrip": boolean,
    "days": number,
    "persons": number,
    "budget": string ("Budget", "Midrange", "Luxury"),
    "vibe": string[],
    "foodPreference": string ("Veg", "Non-Veg", "Vegan"),
    "startDate": string (format: "YYYY-MM-DD"),
    "language": string,
    "currency": string,
    "planNote"?: string,
    "currencyConversion"?: { "fromCurrency": string, "toCurrency": string, "rateText": string },
    "budgetSummary": { "stay": string, "food": string, "fuel"?: string, "miscellaneous"?: string, "total": string },
    "coveredDestinations": [
      {
        "name": string,
        "historicBackground": string[],
        "famousCulture": string[],
        "naturalPlaces": string[],
        "museums": string[],
        "specialOrnaments": string[],
        "recommendedRestaurants": string[],
        "specialEvents": "A descriptive paragraph about events happening ONLY during the travel dates. If none, provide a fallback message.",
      }
    ],
    "plan": [
      {
        "day": number,
        "title": string,
        "activities": string[],
        "food": string[],
        "placesToStay": string[],
        "approxCost": string,
        "medicalFacilities"?: string[],
        "transport"?: { "suggestions": string[], "cost": string }
      }
    ],
    "referenceBlogs": []
  }

  Important Rules:
  1.  All string values in the JSON must be in ${language}.
  2.  The 'plan' array must have exactly ${days} elements.
  3.  The 'coveredDestinations' array is mandatory and must be populated if the trip covers multiple locations (e.g., a round trip or a regional tour). For a trip to a single city, it should contain details for just that destination.
  4.  **COST FORMATTING (MANDATORY)**: All cost fields ('stay', 'food', 'fuel', 'miscellaneous', 'total' in 'budgetSummary'; 'approxCost' in 'plan'; 'cost' in 'transport') MUST be a string containing ONLY numbers (e.g., "1500", "250.50"). Do NOT include currency symbols, currency codes, or any text. All costs must be per person (unless specified otherwise in instructions) and calculated in the user's chosen currency: "${currency}".
  5.  **MANDATORY BOLDING**: You MUST use bold markdown (**text**) to highlight key information. This includes, but is not limited to: names of specific attractions, restaurants, hotels, important timings, unique cultural items, and critical travel advice. This is crucial for readability.
  6.  If 'includeMedical' is true, the 'medicalFacilities' array for each day must list at least one nearby hospital or pharmacy.
  7.  The 'referenceBlogs' field should be an empty array. It will be populated later.
  8.  For 'Standard' trip types, 'transport' suggestions should be tailored to the selected budget. For 'Car' or 'Bike' trips, you MUST follow the critical vehicle instructions provided above.
  9.  For 'historicBackground', 'famousCulture', 'naturalPlaces', 'museums', and 'specialOrnaments', provide a list of 3-5 key bullet points. Each point must be a descriptive string. Do not provide a single paragraph.
  10. For 'specialEvents', find specific events, festivals, or notable occurrences happening ONLY during the travel dates (starting ${startDate} for ${days} days). If no specific major events are found, you MUST return a helpful message like 'No major special events were found for your travel dates, but you can enjoy ongoing local experiences.'
  11. **Currency Conversion (CRITICAL)**:
      a. First, determine the primary local currency of the destination "${destination}".
      b. Compare the local currency with the user's chosen currency: "${currency}".
      c. If they are different, you MUST populate the 'currencyConversion' object in the JSON response. Provide a simple, clear text representation of the approximate exchange rate in the 'rateText' field, showing the value of 1 unit of the destination's local currency in terms of the user's chosen currency (e.g., '1 INR ≈ 0.012 USD'). The 'fromCurrency' MUST be the user's chosen currency code (e.g., 'USD'), and 'toCurrency' MUST be the destination's local currency code (e.g., 'INR').
      d. If the user's chosen currency is the same as the local currency, the 'currencyConversion' field MUST be omitted from the JSON response.
  12. **CRITICAL JSON VALIDATION RULE**: Your entire response depends on this. The output MUST be a single, perfectly valid JSON object.
      a. **NO UNESCAPED QUOTES**: Inside any JSON string value, you MUST NEVER use a double quote character ("). It will break the JSON parsing.
      b. **HOW TO HANDLE QUOTES**: To include a quote inside a string, you MUST use single quotes (e.g., "Visit the 'Eiffel Tower' at night.") or escape the double quote with a backslash (e.g., "The guide said, \\"Welcome to Paris!\\"").
      c. **FAILURE IS NOT AN OPTION**: You MUST double-check every string for unescaped quotes. Failure to follow this rule will make the entire response useless.
  13. **ABSOLUTE FINAL INSTRUCTION**: Your entire response MUST be the raw JSON object. It MUST start with the character '{' and end with the character '}'. You MUST NOT wrap it in markdown (like \`\`\`json), and you MUST NOT add any introductory text like "Here is your itinerary:". The response should be immediately parsable as JSON.
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
