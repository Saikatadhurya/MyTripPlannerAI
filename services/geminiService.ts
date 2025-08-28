
import { GoogleGenAI, Type } from "@google/genai";
import { Budget, Itinerary, Vibe, FoodPreference, BlogReference, TripType } from '../types';

// Cache for destination suggestions to avoid redundant API calls
const suggestionsCache = new Map<string, string[]>();

export const getDestinationSuggestions = async (query: string): Promise<string[]> => {
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
        ? `Based on the user input "${query}", suggest 5 travel locations. The locations can be cities, states, provinces, or entire countries. If the user's input "${query}" is a valid location itself, it must be included in the list, preferably as the first result. The other suggestions should be closely related popular destinations. For each location, provide its name in the most appropriate format: for cities, use "City, State, Country"; for states/provinces, use "State, Country"; for countries, just use the country's name. Provide only a JSON array of these strings.`
        : `Suggest 5 popular and diverse travel locations from around the world, including a mix of cities, states/provinces, and countries. For each location, provide its name in the most appropriate format: for cities, use "City, State, Country"; for states/provinces, use "State, Country"; for countries, just use the country's name. Provide only a JSON array of these strings.`;

    const responseSchema = {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of 5 travel location suggestions, which can be cities, states, or countries."
    };
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        // Optimize for low-latency by disabling thinking
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    // FIX: According to Gemini API guidelines, `response.text` is a non-nullable string.
    // Optional chaining is not necessary.
    const resultText = response.text.trim();
    if (!resultText) {
        console.error("AI response for suggestions was empty or invalid:", response);
        return []; // Fail gracefully for suggestions
    }
    const resultJson = JSON.parse(resultText);

    if (!Array.isArray(resultJson)) {
      console.error("Invalid response format from AI. Expected an array.");
      return [];
    }
    
    const suggestions = resultJson.filter(item => typeof item === 'string');
    suggestionsCache.set(cacheKey, suggestions); // Cache the successful result
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
  currency: string
): Promise<Itinerary> => {

  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let roundTripInstructions = '';
  if ((tripType === 'Car' || tripType === 'Bike') && isRoundTrip && startPoint) {
      const dailyLimit = tripType === 'Car' ? '300-400 km/day' : '150-250 km/day';
      roundTripInstructions = `
      CRITICAL INSTRUCTION - DETAILED ROAD TRIP CIRCUIT:
      This is a multi-stop road trip circuit request. The user wants to travel from "${startPoint}", cover a series of interesting locations, and return to "${startPoint}" within ${days} days. The main destination of interest is "${destination}".

      1.  **Feasibility & Route Planning**: First, you MUST estimate if a meaningful road trip circuit that includes or goes towards "${destination}" is possible within ${days} days, using a ${tripType} with a daily driving limit of ${dailyLimit}.
          - **IF FEASIBLE**: Design a logical, sequential road trip circuit starting and ending at "${startPoint}". The route must maximize sightseeing of famous places based on the vibe: "${vibe.join(', ')}". The farthest point should be near "${destination}".
          - **IF NOT FEASIBLE**: Do NOT fail. You MUST plan a realistic road trip circuit to an alternative region or set of destinations reachable within the timeframe that still fits the user's vibe. The "destination" field in the JSON response MUST be updated to a more descriptive name for this new circuit (e.g., 'Rajasthan Heritage Circuit'). You MUST also add a bolded note in the "historicBackground" of the *first* covered destination explaining the change. For example: **NOTE: A road trip to ${destination} and back in ${days} days isn't feasible. I've created an alternative Rajasthan Heritage Circuit that fits your timeline and preferences.**

      2.  **Structured Output - This is MANDATORY**:
          - **coveredDestinations**: This array must list each major city/stop of the road trip circuit *in the order they are visited*. For each stop, provide the detailed information (history, culture, etc.).
          - **plan**: The daily plan MUST correspond directly to the road trip circuit.
              - Each day's **title** should clearly state the travel segment, for example: 'Day 3: Travel from Chittorgarh to Udaipur & Local Sightseeing'.
              - The **activities** for a travel day should include the drive itself (mentioning the approximate duration/distance) and then activities upon arrival at the new destination.
              - The final days of the plan must cover the return journey back to "${startPoint}".

      3.  **Example of a good road trip circuit plan**: A 10-day car trip from Jaipur to Jaisalmer could be structured like this:
          - **coveredDestinations**: [ {name: "Jaipur"}, {name: "Chittorgarh"}, {name: "Udaipur"}, {name: "Jodhpur"}, {name: "Jaisalmer"}, {name: "Bikaner"} ]
          - **plan**:
              - Day 1: Arrive in Jaipur
              - Day 2: Jaipur Sightseeing
              - Day 3: Title: 'Jaipur to Chittorgarh Fort', Activities: 'Drive to Chittorgarh (approx 5-6 hours)...'
              - Day 4: Title: 'Chittorgarh to Udaipur', Activities: 'Drive to Udaipur (approx 2-3 hours)...'
              - ... and so on, with the final day's plan including the drive from the last stop (e.g., Bikaner) back to the start (Jaipur).

      This level of detail in linking the daily plan to a sequential, multi-stop route is essential.
      `;
  } else if (tripType === 'Standard' && isRoundTrip && startPoint) {
      roundTripInstructions = `
      CRITICAL INSTRUCTION - STANDARD MULTI-STOP TOUR (PUBLIC TRANSPORT):
      This is a multi-stop round trip tour request. The user wants to travel from "${startPoint}", cover a series of interesting locations via public transport, and return to "${startPoint}" within ${days} days. The main destination of interest is "${destination}".

      1.  **Route & Transport Planning**: Design a logical, sequential tour circuit starting and ending at "${startPoint}". The route must maximize sightseeing of famous places based on the vibe: "${vibe.join(', ')}". The farthest point should be near "${destination}". Unlike a road trip, the travel between cities/stops MUST be planned using the most efficient and budget-appropriate public transport.
          -   Provide realistic options like **trains** (mentioning class options), **buses** (mentioning carrier types like Volvo/sleeper), **shared cars**, or **flights** if the distance is significant.
          -   Include practical details like approximate travel times, booking websites or companies, and estimated costs in the 'transport' object for those travel days.

      2.  **Structured Output - This is MANDATORY**:
          -   **coveredDestinations**: This array MUST list each major city/stop of the tour circuit *in the order they are visited*. For each stop, provide the detailed information (history, culture, etc.).
          -   **plan**: The daily plan MUST correspond directly to the tour circuit.
              -   Each day's **title** should clearly state the travel segment, for example: 'Day 3: Travel from Agra to Jaipur via Train & Local Sightseeing'.
              -   The **activities** for a travel day should include the journey itself (mentioning approximate duration and mode of transport) and then activities upon arrival at the new destination.
              -   The final days of the plan MUST cover the return journey, possibly via intermediate stops, back to "${startPoint}".

      3.  **Local Transport**: For days spent exploring a destination (not traveling between cities), you should suggest local transport options (e.g., metro, ride-sharing, auto-rickshaws, taxis) that are appropriate for the user's budget.
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
  
  ${(tripType === 'Car' || tripType === 'Bike') ? `
  CRITICAL VEHICLE INSTRUCTIONS: Since the trip type is '${tripType}', you MUST assume the user has a personal or rented vehicle for the entire duration.
  1.  **Transport Suggestions**: ALL 'transport' suggestions in the daily plan MUST be vehicle-centric. Provide details on recommended driving routes, estimated driving times, and practical parking information (availability, cost) near attractions. AVOID suggesting taxis, ride-sharing, or public transport.
  2.  **Accommodation**: ALL 'placesToStay' suggestions should prioritize hotels or lodgings that offer secure and convenient parking for a ${tripType}. Mention this feature in the suggestion (e.g., 'Hotel ABC with on-site parking').
  3.  **Realistic Daily Driving**: You MUST pace the itinerary according to realistic daily driving limits. For a **Car**, limit driving to **300-400 km per day**. For a **Bike**, limit driving to **150-250 km per day**. If a travel leg between major stops is longer than this, it must be broken down into multiple days with an appropriate overnight stop.
  ` : ''}

  ${roundTripInstructions}

  Based on all these details, generate a comprehensive itinerary. The response must be a single JSON object that strictly follows this structure and types:
  {
    destination: string,
    startPoint: string,
    tripType: string ("Standard", "Bike", "Car"),
    isRoundTrip: boolean,
    days: number,
    persons: number,
    budget: string ("Budget", "Midrange", "Luxury"),
    vibe: string[],
    foodPreference: string ("Veg", "Non-Veg", "Vegan"),
    startDate: string (format: "YYYY-MM-DD"),
    language: string,
    currency: string,
    currencyConversion?: { fromCurrency: string, toCurrency: string, rateText: string },
    budgetSummary: { stay: string, food: string, total: string },
    coveredDestinations: [
      {
        name: string,
        historicBackground: string[],
        famousCulture: string[],
        naturalPlaces: string[],
        museums: string[],
        specialOrnaments: string[],
        recommendedRestaurants: string[],
        specialEvents: "A descriptive paragraph about events happening ONLY during the travel dates. If none, provide a fallback message.",
      }
    ],
    plan: [
      {
        day: number,
        title: string,
        activities: string[],
        food: string[],
        placesToStay: string[],
        approxCost: string,
        medicalFacilities?: string[],
        transport?: { suggestions: string[], cost: string }
      }
    ],
    referenceBlogs: []
  }

  Important Rules:
  1.  All string values in the JSON must be in ${language}.
  2.  The 'plan' array must have exactly ${days} elements.
  3.  For round trips, the 'coveredDestinations' array is mandatory and must contain detailed information for each significant place visited. For standard one-way trips, it should contain details for just the main destination.
  4.  All costs in 'budgetSummary', 'approxCost', and 'transport.cost' must be per person and specified in the user's chosen currency: "${currency}". The amounts must be realistic for the destination's local economy but presented in the chosen currency.
  5.  **MANDATORY BOLDING**: You MUST use bold markdown (**text**) to highlight key information. This includes, but is not limited to: names of specific attractions, restaurants, hotels, important timings, unique cultural items, and critical travel advice. This is crucial for readability.
  6.  If 'includeMedical' is true, the 'medicalFacilities' array for each day must list at least one nearby hospital or pharmacy.
  7.  The 'referenceBlogs' field should be an empty array. It will be populated later.
  8.  For 'Standard' trip types, 'transport' suggestions should be tailored to the selected budget (e.g., public transport for 'Budget', taxis for 'Midrange'). For 'Car' or 'Bike' trips, you MUST follow the critical vehicle instructions provided above.
  9.  For 'historicBackground', 'famousCulture', 'naturalPlaces', 'museums', and 'specialOrnaments', provide a list of 3-5 key bullet points. Each point must be a descriptive string. Do not provide a single paragraph.
  10. For 'specialEvents', find specific events, festivals, or notable occurrences happening ONLY during the travel dates (starting ${startDate} for ${days} days). If no specific major events are found, you MUST return a helpful message like 'No major special events were found for your travel dates, but you can enjoy ongoing local experiences.'
  11. **Currency Conversion (CRITICAL)**:
      a. First, determine the primary local currency of the destination "${destination}".
      b. Compare the local currency with the user's chosen currency: "${currency}".
      c. If they are different, you MUST populate the 'currencyConversion' object in the JSON response. Provide a simple, clear text representation of the approximate exchange rate in the 'rateText' field, showing the value of 1 unit of the destination's local currency in terms of the user's chosen currency (e.g., '1 INR ≈ 0.012 USD'). The 'fromCurrency' MUST be the user's chosen currency code (e.g., 'USD'), and 'toCurrency' MUST be the destination's local currency code (e.g., 'INR').
      d. If the user's chosen currency is the same as the local currency, the 'currencyConversion' field MUST be omitted from the JSON response.
  12. **CRITICAL JSON VALIDATION RULE**: The output MUST be a perfectly valid JSON object. This is the single most important instruction.
      a. **NO UNESCAPED QUOTES**: Inside any JSON string value, you MUST NEVER use a double quote character ("). It will break the JSON and cause an error.
      b. **HOW TO HANDLE QUOTES**: If you need to include a quote inside a description or title, you have two options:
          i. **PREFERRED**: Use single quotes instead (e.g., "Visit the 'Eiffel Tower' at night.").
          ii. **ALTERNATIVE**: If you absolutely must use a double quote, you MUST escape it with a backslash (e.g., "The guide said, \\"Welcome to Paris!\\"").
      c. **FAILURE TO FOLLOW THIS RULE WILL RENDER THE ENTIRE OUTPUT USELESS.** You must double-check every string value for unescaped double quotes before finishing your response.
  `;
  
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        destination: { type: Type.STRING },
        startPoint: { type: Type.STRING },
        tripType: { type: Type.STRING },
        isRoundTrip: { type: Type.BOOLEAN },
        days: { type: Type.INTEGER },
        persons: { type: Type.INTEGER },
        budget: { type: Type.STRING },
        vibe: { type: Type.ARRAY, items: { type: Type.STRING } },
        foodPreference: { type: Type.STRING },
        startDate: { type: Type.STRING },
        language: { type: Type.STRING },
        currency: { type: Type.STRING },
        currencyConversion: {
          type: Type.OBJECT,
          properties: {
            fromCurrency: { type: Type.STRING },
            toCurrency: { type: Type.STRING },
            rateText: { type: Type.STRING },
          },
          required: ["fromCurrency", "toCurrency", "rateText"],
        },
        budgetSummary: {
          type: Type.OBJECT,
          properties: {
            stay: { type: Type.STRING },
            food: { type: Type.STRING },
            total: { type: Type.STRING },
          },
          required: ["stay", "food", "total"],
        },
        coveredDestinations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    historicBackground: { type: Type.ARRAY, items: { type: Type.STRING } },
                    famousCulture: { type: Type.ARRAY, items: { type: Type.STRING } },
                    naturalPlaces: { type: Type.ARRAY, items: { type: Type.STRING } },
                    museums: { type: Type.ARRAY, items: { type: Type.STRING } },
                    specialOrnaments: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recommendedRestaurants: { type: Type.ARRAY, items: { type: Type.STRING } },
                    specialEvents: { type: Type.STRING },
                },
                required: ["name", "historicBackground", "famousCulture", "naturalPlaces", "museums", "specialOrnaments", "recommendedRestaurants", "specialEvents"]
            }
        },
        plan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER },
              title: { type: Type.STRING },
              activities: { type: Type.ARRAY, items: { type: Type.STRING } },
              food: { type: Type.ARRAY, items: { type: Type.STRING } },
              placesToStay: { type: Type.ARRAY, items: { type: Type.STRING } },
              approxCost: { type: Type.STRING },
              medicalFacilities: { type: Type.ARRAY, items: { type: Type.STRING } },
              transport: {
                type: Type.OBJECT,
                properties: {
                  suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  cost: { type: Type.STRING },
                },
                required: ["suggestions", "cost"],
              },
            },
            required: ["day", "title", "activities", "food", "placesToStay", "approxCost"],
          },
        },
        referenceBlogs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              url: { type: Type.STRING },
              description: { type: Type.STRING },
              source: { type: Type.STRING },
            },
            required: ["title", "url", "description", "source"],
          }
        },
      },
       required: ["destination", "startPoint", "tripType", "isRoundTrip", "days", "persons", "budget", "vibe", "foodPreference", "startDate", "language", "currency", "budgetSummary", "coveredDestinations", "plan", "referenceBlogs"],
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
        throw new Error("AI response was empty or invalid.");
    }
    
    let jsonString = resultText;
    
    // The model can sometimes wrap the JSON in markdown or add extra text.
    // This block cleans the string before parsing.
    const markdownMatch = jsonString.match(/```(json)?([\s\S]*?)```/);
    if (markdownMatch && markdownMatch[2]) {
        jsonString = markdownMatch[2].trim();
    }

    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      console.error("Could not find a valid JSON object in the AI response.");
      console.error("Original response:", resultText);
      throw new Error("The AI returned an invalid response format. Please try generating the itinerary again.");
    }

    jsonString = jsonString.substring(firstBrace, lastBrace + 1);

    let itineraryData;
    try {
        itineraryData = JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON from AI response after cleaning:", e);
        console.error("Cleaned JSON string that failed:", jsonString);
        console.error("Original AI response:", resultText);
        throw new Error("The AI returned an invalid response format. Please try generating the itinerary again.");
    }

    // Ensure the response has all the fields from the initial request
    return {
        ...itineraryData,
        startPoint, // Ensure startPoint is passed through
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
};
