import { GoogleGenAI, Type } from "@google/genai";
import { Budget, Itinerary, Vibe, FoodPreference, BlogReference, TripType, LocationSuggestion } from '../types';
import { extractJson, cleanCitations } from './jsonUtils';
import { CookieUtils } from './cookieUtils';

// Cache for destination suggestions to avoid redundant API calls
const suggestionsCache = new Map<string, LocationSuggestion[]>();

export const getDestinationSuggestions = async (query: string, userApiKey?: string): Promise<LocationSuggestion[]> => {
  const cacheKey = query.trim().toLowerCase();
  if (suggestionsCache.has(cacheKey)) {
    return suggestionsCache.get(cacheKey)!;
  }

  const { apiKey, isUsingDefaultKey } = await CookieUtils.getApiKeyWithSource(userApiKey);
  
  // Ensure API key is properly trimmed and not empty
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Invalid API key: key is empty or whitespace only");
  }
  
  const cleanApiKey = apiKey.trim();

  try {
    const ai = new GoogleGenAI({ apiKey: cleanApiKey });

    const prompt = query.trim()
        ? `You are a master geographer AI. Based on the user input "${query}", provide up to 5 location suggestions.
        CRITICAL HIERARCHY RULE: Rank results: 1. Country, 2. State/Region, 3. City, 4. Village/Locality.
        For example, if input is "Georgia", "Georgia" (Country) MUST be first, then "Georgia, USA".
        Your response MUST be a single, valid JSON array of objects. Each object MUST have "type" (string), "name" (string), and "parentHierarchy" (string).
        DO NOT add any text before or after the JSON array. Start with '[' and end with ']'.`
        : `Suggest 5 popular and diverse travel locations from around the world.
        Your response MUST be a single, valid JSON array of objects. Each object MUST have "type" (string), "name" (string), and "parentHierarchy" (string).
        DO NOT add any text before or after the JSON array. Start with '[' and end with ']'.`;
    
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

  } catch (error: any) {
    console.error("Error fetching destination suggestions from AI:", error);
    
    // Check if it's an API key error - handle various error structures
    const errorMessage = error?.message || '';
    const errorString = JSON.stringify(error || {});
    const nestedError = error?.error;
    const nestedErrorMessage = nestedError?.message || '';
    
    // Check for quota/exhaustion errors when using default key
    const combinedErrorText = (errorMessage + errorString + nestedErrorMessage).toLowerCase();
    const isQuotaError = combinedErrorText.includes("quota") || combinedErrorText.includes("rate limit") || combinedErrorText.includes("429") || combinedErrorText.includes("exceeded");
    
    if (isQuotaError && isUsingDefaultKey) {
      throw new Error('The default API key has reached its quota limit. Please set your own Gemini API key in your profile settings to continue.');
    }
    
    // Check for various API key error patterns
    if (
      errorMessage.includes('API key not valid') ||
      errorMessage.includes('API_KEY_INVALID') ||
      errorMessage.includes('INVALID_ARGUMENT') ||
      errorString.includes('API key not valid') ||
      errorString.includes('API_KEY_INVALID') ||
      nestedErrorMessage.includes('API key not valid') ||
      nestedErrorMessage.includes('API key') ||
      (nestedError?.code === 400 && nestedErrorMessage?.includes('API key')) ||
      (nestedError?.status === 'INVALID_ARGUMENT' && nestedErrorMessage?.includes('API key'))
    ) {
      throw new Error('API key not valid. Please provide a valid Gemini API key in your profile settings.');
    }
    
    // Re-throw if it's already a custom error
    if (error instanceof Error && error.message.includes('Gemini key not set')) {
      throw error;
    }
    
    // For other errors, return empty array to not break the UI
    return [];
  }
};

export const getReferenceBlogs = async (destination: string, language: string, userApiKey?: string): Promise<BlogReference[]> => {
  const { apiKey, isUsingDefaultKey } = await CookieUtils.getApiKeyWithSource(userApiKey);
  
  // Ensure API key is properly trimmed
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Invalid API key: key is empty or whitespace only");
  }
  const cleanApiKey = apiKey.trim();

  const ai = new GoogleGenAI({ apiKey: cleanApiKey });

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
    
    // Check for quota errors when using default key
    if (error instanceof Error) {
      const errorText = (error.message || '').toLowerCase();
      const isQuotaError = errorText.includes("quota") || errorText.includes("rate limit") || errorText.includes("429") || errorText.includes("exceeded");
      
      if (isQuotaError && isUsingDefaultKey) {
        throw new Error('The default API key has reached its quota limit. Please set your own Gemini API key in your profile settings to continue.');
      }
    }
    
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
  onChunk?: (chunk: string) => void,
  userApiKey?: string
): Promise<{result: Itinerary, prompt: string}> => {

  const { apiKey, isUsingDefaultKey } = await CookieUtils.getApiKeyWithSource(userApiKey);
  
  // Ensure API key is properly trimmed
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Invalid API key: key is empty or whitespace only");
  }
  const cleanApiKey = apiKey.trim();

  const ai = new GoogleGenAI({ apiKey: cleanApiKey });
  
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
              - **A. Itinerary Density & Maximization (CRITICAL):** Your primary goal is to **maximize the number of interesting and feasible places covered** within the given **${days} days**, adhering to the MAXIMALIST & EFFICIENT philosophy outlined above. A longer duration MUST result in a richer, denser itinerary with more stops, not just a slower pace between fewer locations. You MUST intelligently add relevant destinations to create a comprehensive tour circuit that makes full and enjoyable use of the time. Do not leave days with minimal activity; fill them with travel to new locations or exploration.
              - **B. Example:** For a 15-day car trip from "Jaipur" with the main destination as "Jaisalmer", a simple route (Jaipur -> Jodhpur -> Jaisalmer -> Bikaner -> Jaipur) would be **too sparse**. A **correct, enriched itinerary** MUST include other logical and famous stops like **Udaipur, Chittorgarh, Kumbhalgarh, and Ranakpur** to create a full Rajasthan heritage circuit that properly utilizes the 15 days.
              - **C. Route Design:** Based on the above, design a logical, sequential road trip circuit starting and ending at "${startPoint}". The route must maximize sightseeing of famous places based on the vibe: "${vibe.join(', ')}". The farthest point should be near "${destination}".
          - **IF NOT FEASIBLE**: Do NOT fail. You MUST plan a realistic road trip circuit to an alternative region or set of destinations reachable within the timeframe that still fits the user's vibe. The "destination" field in the JSON response MUST be updated to a more descriptive name for this new circuit (e.g., 'Rajasthan Heritage Circuit'). You MUST also add a note in the new 'planNote' field in the root of the JSON response, explaining the change clearly and starting with "NOTE:". For example: "NOTE: A road trip to ${destination} and back in ${days} days isn't feasible. I've created an alternative Coastal Karnataka Temple & Adventure Circuit that fits your timeline and preferences."

      2.  **Distance & Time Accuracy with Traffic (CRITICAL)**: You MUST use your search capabilities to get accurate driving distances (in kilometers) and realistic travel times between all stops in the circuit. **CRITICAL**: You MUST search for current traffic patterns, peak hours, and congestion levels for each route segment. Travel time estimates MUST account for traffic conditions, not just distance. For example, a 200 km drive might take 3 hours in ideal conditions but 4-5 hours with typical traffic. These realistic time estimates MUST be reflected in the daily 'activities' descriptions (e.g., "Drive from Jaipur to Udaipur (**approx. 395 km, 6-7 hours considering traffic**)..."). Additionally, suggest optimal departure times to avoid peak traffic (e.g., "Depart at 6:30 AM to avoid morning rush hour"). Inaccurate distances or ignoring traffic are critical failures.

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
          -   **A. Itinerary Density & Maximization (CRITICAL):** Your primary goal is to **maximize the number of interesting and feasible places covered** within the given **${days} days**, using public transport, adhering to the MAXIMALIST & EFFICIENT philosophy outlined above. A longer duration MUST result in a richer, denser itinerary with more stops, not just more days in the same few cities. You MUST intelligently add relevant destinations to create a comprehensive tour circuit that makes full and enjoyable use of the time. For example, a 15-day trip should cover significantly more cities than a 5-day trip.
          -   **B. Route Design & Transport Details:** Design a logical, sequential tour circuit starting and ending at "${startPoint}". The route must maximize sightseeing of famous places based on the vibe: "${vibe.join(', ')}". The farthest point should be near "${destination}". Unlike a road trip, the travel between cities/stops MUST be planned using the most efficient and budget-appropriate public transport. Provide realistic options like **trains** (mentioning class options), **buses** (mentioning carrier types like Volvo/sleeper), **shared cars**, or **flights** if the distance is significant.

      2.  **Distance & Time Accuracy with Traffic/Transport Delays (CRITICAL)**: You MUST use your search capabilities to get accurate travel distances and realistic travel times for the suggested mode of public transport (train, bus, etc.) between all stops in the circuit. **CRITICAL**: Account for potential delays due to traffic (for buses/road transport), train schedules, and typical public transport delays. For road-based public transport, research traffic patterns and peak hours that might affect bus/car travel times. These realistic time estimates MUST be reflected in the daily 'activities' descriptions and 'transport' suggestions. For example, mention "Travel by bus from City A to City B (**approx. 250 km, 5-6 hours including typical traffic delays**)". Inaccurate details or ignoring traffic/transport delays are critical failures.

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
  
  **GOOGLE SEARCH OPTIMIZATION (CRITICAL FOR SPEED):**
  You have access to Google Search, but use it efficiently and strategically:
  1. **USE GOOGLE SEARCH ONLY FOR:**
     - **ACCOMMODATION SEARCH (MANDATORY):** For each day's 'placesToStay', you MUST search for hotels/hostels/guesthouses in the destination city with current prices. Search format: "budget hotels in [city] for [startDate] prices" or "hostels in [city] budget accommodation prices". Include the actual per-night cost in the accommodation name. Example: "**XYZ Hostel** (from ₹800/night)" or "**ABC Hotel** (from ₹2,500/night per person)". This is CRITICAL - always include pricing.
     - Current entry prices and ticket costs for specific attractions
     - Real-time events, festivals, or special events happening during travel dates (${startDate})
     - Current exchange rates between currencies
     - Recent changes to attraction hours or availability
     - **Traffic patterns, peak hours, and current traffic conditions** for routes between destinations and within cities
     - **Real-time traffic forecasts** for planned travel routes during specific times and dates
  2. **USE YOUR TRAINING DATA FOR:**
     - Famous attractions, landmarks, and historical sites
     - Cultural information, traditions, and local customs
     - Popular restaurants and dining recommendations
     - Natural places, museums, and tourist spots
     - Historical background and general travel information
  3. **SEARCH EFFICIENCY RULES:**
     - Make maximum 3-4 targeted searches per request
     - **MANDATORY: Search for accommodation prices for each destination city** - this is a priority
     - Combine related searches: "Search for current prices and events together"
     - **For vehicle trips (Car/Bike): ALWAYS search for traffic patterns and peak hours for major routes**
     - Prioritize: Search for accommodation prices, attraction prices, events, and traffic conditions first, then use knowledge base for everything else
     - Do NOT search for information already in your training data (attractions, culture, history)
  
  **CORE ITINERARY PHILOSOPHY: MAXIMALIST & EFFICIENT**
  Your core directive is to create a dense and efficient travel plan that maximizes the user's time. Assume the traveler is energetic and wants to see and do as much as possible.
  - **NO WASTED TIME:** Minimize downtime. Days should be packed with activities from morning to evening. Avoid suggesting entire "rest days" or "leisure days" unless the trip is extremely long or the vibe is explicitly 'Relaxation'.
  - **MAXIMIZE SIGHTSEEING:** For any given location, you must include not only the main attractions but also highly-rated secondary attractions, local experiences, and hidden gems.
  - **DAY TRIPS ARE ESSENTIAL:** For trips longer than 3-4 days to a single city, you MUST incorporate relevant and feasible day trips to nearby towns, natural parks, or historical sites to enrich the itinerary. For example, a 7-day trip to Paris should include a day trip to the Palace of Versailles.
  - **TRAVEL DAY EFFICIENCY:** On days that involve travel between cities, the itinerary should still include activities either in the departure city in the morning or in the arrival city in the afternoon/evening. A travel day should not be solely dedicated to transit unless the journey is exceptionally long (over 8 hours).
  
  **TRAFFIC-AWARE PLANNING (APPLIES TO ALL TRIP TYPES):**
  - **Local Transport & City Navigation**: For ALL trip types, when planning activities within cities, account for local traffic patterns. Research typical traffic conditions in ${destination} and adjust activity schedules accordingly. For example, if moving between attractions in a major city during peak hours, add buffer time (15-30 minutes extra) for travel.
  - **Peak Hours Consideration**: Be aware that traffic patterns vary by location. Research and account for local rush hours, weekend traffic patterns, and special events that might cause congestion. Schedule activities to minimize time lost to traffic.
  - **Realistic Time Estimates**: All travel time estimates (whether by car, public transport, or local transport) MUST be realistic and account for typical traffic conditions. A 5 km drive in a busy city might take 20-30 minutes, not 5 minutes.
  - **Strategic Scheduling**: When possible, schedule activities in the same area together to minimize travel time. Group nearby attractions to avoid unnecessary back-and-forth travel that wastes time in traffic.

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
  
  CRITICAL COST BREAKDOWN:
  1. **budgetSummary.total**: Sum of all per-person costs (stay + food + fuel + miscellaneous).
  2. **budgetSummary.miscellaneous**: Per-person budget for ${(tripType === 'Car' || tripType === 'Bike') ? 'tolls, parking, and minor expenses' : 'local transport, tips, and minor expenses'}. Exclude attraction entry fees (those go in daily costs).
  3. **plan.approxCost**: Realistic per-person daily cost for that day's activities and food ONLY. CRITICAL: Calculate dynamically by searching for actual entry fees of attractions listed, then add food estimate. DO NOT average the total budget. Example: Louvre Museum day costs more than a free walking tour day. Exclude fuel and miscellaneous.
  
  ${(tripType === 'Car' || tripType === 'Bike') ? `
  CRITICAL VEHICLE-SPECIFIC INSTRUCTIONS:
  1.  **Vehicle Assumption**: Assume the user has a personal or rented vehicle. All 'transport' suggestions MUST be vehicle-centric (driving routes, times).
  2.  **Accommodation**: Search Google for hotels/hostels/guesthouses with secure and convenient parking for a ${tripType}. Include current prices in the 'placesToStay' field. Format: "**Hotel Name** (from [price]/night, parking available)".
  3.  **Realistic Pacing**: Limit daily driving: **300-400 km for a Car**, **150-250 km for a Bike**.
  4.  **TRAFFIC-AWARE ROUTING (CRITICAL):**
     - **MANDATORY**: You MUST use Google Search to check current traffic patterns, peak hours, and typical congestion levels for ALL planned routes between destinations.
     - **Peak Hours Awareness**: Research and account for rush hours (typically 7-9 AM and 5-7 PM on weekdays) in major cities and on highways. Adjust departure times to avoid peak traffic when possible.
     - **Real-Time Traffic Forecast**: For travel dates around ${startDate}, search for traffic forecasts and historical patterns to predict travel times accurately.
     - **Time Estimates**: ALL travel time estimates MUST include realistic traffic delays. Base times on traffic conditions, not just distance. For example, a 100 km drive might take 2 hours in light traffic but 3-4 hours in heavy traffic.
     - **Route Optimization**: Suggest departure times that minimize traffic exposure. For example, suggest leaving cities early morning (6-7 AM) or late morning (after 10 AM) to avoid rush hours.
     - **Activity Scheduling**: When planning activities within cities, account for local traffic patterns. Avoid scheduling tight time slots during peak hours when moving between attractions.
     - **Mention Traffic in Activities**: In activity descriptions, explicitly mention traffic conditions: "Drive from City A to City B (**approx. 200 km, 3-4 hours considering traffic**)" or "Leave early at 6:30 AM to avoid rush hour traffic".
  5.  **budgetSummary.fuel**: You MUST calculate an estimated total fuel cost for the trip. Use vehicle capacities (Car: max 5 people, Bike: max 2 people) to determine the number of vehicles needed for the group of ${persons} people. Estimate the total fuel cost for ALL vehicles for the ENTIRE trip and provide the final PER-PERSON average in this field.
  6.  **plan.transport.cost**: This field is CRITICAL. It MUST represent the estimated fuel cost for driving **ONE SINGLE VEHICLE** for that specific day's travel leg. The frontend will use this to calculate group costs. If there's no inter-city travel, this should be "0". You are FORBIDDEN from returning any non-numeric text.
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
    "budget": string ("Low Budget", "Midrange", "Luxury"),
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

  IMPORTANT RULES:
  1. All strings must be in ${language}. 'plan' array must have exactly ${days} elements. 'coveredDestinations' is mandatory (populate for multi-location trips, single destination for single city).
  2. **ACTIVITY TIMINGS (TRAFFIC-AWARE):** Prefix each activity with time: "**09:00 AM - 11:00 AM:** Visit..." or "**01:00 PM:** Lunch...". Be realistic accounting for travel time, duration, AND traffic conditions. For vehicle trips (Car/Bike), account for peak traffic hours when scheduling activities. For example, if moving between attractions in a city during rush hour (7-9 AM or 5-7 PM), add extra buffer time. For inter-city travel, suggest departure times that avoid peak hours. Always include realistic travel time estimates that reflect traffic: "**06:30 AM:** Depart from Hotel (early departure to avoid rush hour traffic)" or "**10:00 AM - 12:00 PM:** Visit Museum (allowing 30 min for city traffic)".
  3. **COST FORMATTING:** All cost fields (budgetSummary.*, approxCost, transport.cost) = strings with ONLY numbers (e.g., "1500", "250.50"). No currency symbols. All per-person costs in "${currency}".
  4. **BOLDING:** Use **text** to highlight attractions, restaurants, hotels, timings, cultural items, travel advice.
  5. **NO TECHNICAL JARGON:** User-facing text must be friendly and natural. NEVER mention JSON field names like 'budgetSummary.total' or 'approxCost' in user text. Use natural language instead.
  6. **MEDICAL:** If includeMedical=true, list at least one hospital/pharmacy per day in 'medicalFacilities'.
  7. **TRANSPORT:** Standard trips: tailor to budget. Car/Bike: follow vehicle instructions above.
  8. **ACCOMMODATION WITH COSTS (CRITICAL):** For each day's 'placesToStay' field, you MUST:
     - Search Google for current hotel/hostel/guesthouse prices in that destination for the travel dates
     - Include 2-3 accommodation options per day
     - Format each option as: "**Hotel/Hostel Name** (from [price]/night per person)" or "**Hotel Name** (from [price]/night for double room)"
     - Prices must be in ${currency} (convert if needed)
     - For Low Budget: Search for hostels, guesthouses, budget lodges (from lowest prices)
     - For Midrange: Search for 3-star hotels, comfortable guesthouses (mid-range prices)
     - For Luxury: Search for 4-5 star hotels, resorts (premium prices)
     - Example: "**Backpacker Hostel** (from ₹500/night per person)" or "**Grand Hotel** (from ₹3,500/night for double room)"
  9. **DESTINATION DETAILS:** For historicBackground, famousCulture, naturalPlaces, museums, specialOrnaments, recommendedRestaurants: 1-3 concise points (5-10 words each). Restaurants can be names only.
  10. **SPECIAL EVENTS:** Find events happening ONLY during ${startDate} for ${days} days. 1-2 sentences. If none: "No major special events scheduled, but enjoy ongoing local experiences."
  11. **CURRENCY CONVERSION:** Determine local currency of "${destination}". If different from "${currency}", add 'currencyConversion' object with format "1 [DEST_CURRENCY] = [VALUE] [USER_CURRENCY]" (e.g., "1 USD = 83 INR"). If same, omit this field.
  12. **JSON VALIDATION:** NO unescaped double quotes (") in string values. Use single quotes or escape: \\". Check every string before responding.
  13. **FINAL:** Response MUST be raw JSON starting with '{' and ending with '}'. No markdown wrapping, no intro text. Immediately parsable.
  14. 'referenceBlogs' must be an empty array [].
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
                    thinkingConfig: { thinkingBudget: 0 },
                    // Note: responseMimeType may not be fully supported in streaming mode
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

        const result = {
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

        return { result, prompt };
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
                if (isUsingDefaultKey) {
                    throw new Error("[429] The default API key has reached its quota limit. Please set your own Gemini API key in your profile settings to continue.");
                }
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