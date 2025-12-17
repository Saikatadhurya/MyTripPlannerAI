import { GoogleGenAI, Type } from "@google/genai";
import { Budget, Itinerary, Vibe, FoodPreference, TripType, LocationSuggestion } from '../types';
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
    const nestedErrorCode = nestedError?.code;
    const nestedErrorStatus = nestedError?.status;
    
    // Extract error code from nested structure (ApiError format)
    const errorCode = nestedErrorCode || error?.code || (nestedErrorStatus === 'RESOURCE_EXHAUSTED' ? 429 : null);
    
    // Check for quota/exhaustion errors - check both default key and user's own key
    const combinedErrorText = (errorMessage + errorString + nestedErrorMessage).toLowerCase();
    const isQuotaError = errorCode === 429 || 
                        nestedErrorStatus === 'RESOURCE_EXHAUSTED' ||
                        combinedErrorText.includes("quota") || 
                        combinedErrorText.includes("rate limit") || 
                        combinedErrorText.includes("429") || 
                        combinedErrorText.includes("exceeded") ||
                        combinedErrorText.includes("resource_exhausted");
    
    if (isQuotaError) {
      if (isUsingDefaultKey) {
        throw new Error('The default API key has reached its quota limit. Please set your own Gemini API key in your profile settings to continue.');
      } else {
        // User's own API key has quota exceeded
        throw new Error('Your Gemini API key has reached its quota limit. Please set a new Gemini API key in your profile settings to continue.');
      }
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
  userApiKey?: string,
  stops?: string[]
): Promise<{result: Itinerary, prompt: string}> => {

  const { apiKey, isUsingDefaultKey } = await CookieUtils.getApiKeyWithSource(userApiKey);
  
  // Ensure API key is properly trimmed
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Invalid API key: key is empty or whitespace only");
  }
  const cleanApiKey = apiKey.trim();

  const ai = new GoogleGenAI({ apiKey: cleanApiKey });
  
  // Build list of all destinations including stops
  // For Standard trips, include startPoint as a destination to visit if it's not a Car/Bike trip AND not a round trip
  // For Standard round trips, the starting location should NOT be visited - only used as departure/return point
  const shouldIncludeStartPoint = tripType === 'Standard' && startPoint && startPoint.trim().length > 0 && !isRoundTrip;
  
  // For Standard trips with multiple stops AND round trip: destination should be both start and end point
  // For Standard trips with multiple stops but NOT round trip: destination is only the end point
  const isStandardMultiStopRoundTrip = tripType === 'Standard' && stops && stops.length > 0 && isRoundTrip;
  const isStandardMultiStopOneWay = tripType === 'Standard' && stops && stops.length > 0 && !isRoundTrip;
  
  let allDestinations: string[] = [];
  if (stops && stops.length > 0) {
    if (isStandardMultiStopRoundTrip) {
      // For Standard round trips with stops: destination → stops → destination (circular)
      allDestinations = [destination, ...stops, destination].filter(d => d && d.trim().length > 0);
    } else if (isStandardMultiStopOneWay && startPoint && startPoint.trim().length > 0) {
      // For Standard one-way trips with stops and startPoint: startPoint → stops → destination
      allDestinations = [startPoint, ...stops, destination].filter(d => d && d.trim().length > 0);
    } else if (isStandardMultiStopOneWay) {
      // For Standard one-way trips with stops but no startPoint: stops → destination (destination is end point only)
      allDestinations = [...stops, destination].filter(d => d && d.trim().length > 0);
    } else if (isRoundTrip) {
      // For round trips (Car/Bike): stops → destination (farthest point)
      allDestinations = [...stops, destination].filter(d => d && d.trim().length > 0);
    } else {
      // For other cases: destination → stops
      allDestinations = [destination, ...stops].filter(d => d && d.trim().length > 0);
    }
  } else {
    allDestinations = [destination];
  }
  
  // Add startPoint as a destination for Standard trips (not Car/Bike, not round trip) when there are no stops
  // This ensures the source destination is also planned if it's a Standard trip without stops
  // For Standard round trips, startPoint is NOT added as it's only a departure/return point, not a destination to visit
  // StartPoint should be at the beginning of the route
  if (shouldIncludeStartPoint && !allDestinations.includes(startPoint) && (!stops || stops.length === 0)) {
    allDestinations = [startPoint, ...allDestinations];
  }
  
  const destinationsString = allDestinations.join(', ');
  const isMultiStop = allDestinations.length > 1;
  
  // Determine if user only provided source and destination (no stops)
  // For round trips, roundTripInstructions already handle intermediate destinations comprehensively
  // So we only need this for non-round trips
  const hasOnlySourceAndDestination = startPoint && startPoint.trim().length > 0 && 
    destination && destination.trim().length > 0 && 
    (!stops || stops.length === 0) &&
    startPoint.toLowerCase().trim() !== destination.toLowerCase().trim() &&
    !isRoundTrip;
  
  // Determine if this should be a circular trip
  // Circular trip: round trip is true AND destination is the farthest point (last in the route)
  const isCircularTrip = isRoundTrip && isMultiStop && destination && 
    allDestinations[allDestinations.length - 1] === destination;
  
  let intermediateDestinationsInstructions = '';
  if (hasOnlySourceAndDestination) {
    const dailyLimit = tripType === 'Car' ? 'MAXIMUM 350 km/day (5-6 hours driving max)' : tripType === 'Bike' ? '150-250 km/day' : 'varies by transport';
    const transportMode = tripType === 'Car' ? 'driving' : tripType === 'Bike' ? 'riding' : 'public transport';
    
    intermediateDestinationsInstructions = `
    CRITICAL INSTRUCTION - AUTOMATIC INTERMEDIATE DESTINATIONS:
    The user has only specified a starting point "${startPoint}" and destination "${destination}" without any intermediate stops.
    You MUST automatically discover and include logical intermediate destinations along the route if it's feasible within the ${days}-day timeframe.
    
    1. **Route Analysis & Intermediate Discovery (MANDATORY)**:
       - Use Google Search to find the distance and travel time between "${startPoint}" and "${destination}" using ${transportMode}.
       - Identify famous cities, towns, attractions, or points of interest that lie along or near the logical route between these two points.
       - Consider the user's vibe/interests: "${vibe.join(', ')}" when selecting intermediate destinations.
       - For ${tripType === 'Standard' ? 'public transport' : tripType === 'Car' ? 'car' : 'bike'} trips, consider realistic travel times and connections.
       - Daily travel limits (STRICT - DO NOT EXCEED): ${dailyLimit}
    
    2. **Feasibility Assessment**:
       - If the direct journey from "${startPoint}" to "${destination}" is short (e.g., < 200 km for ${tripType === 'Car' ? 'car' : tripType === 'Bike' ? 'bike' : 'public transport'}), you may not need intermediate stops, but still consider nearby attractions or day trips.
       - If the journey is long, you MUST break it down with intermediate destinations that:
         * Are logically positioned along the route
         * Can be reached within the daily travel limits
         * Offer interesting attractions matching the vibe: "${vibe.join(', ')}"
         * Allow proper exploration time at each location
         * Fit within the ${days}-day timeframe
    
    3. **Implementation**:
       - The 'coveredDestinations' array MUST include ALL destinations: ${shouldIncludeStartPoint ? `"${startPoint}", ` : ''}intermediate destinations (if any), and "${destination}".
       - If intermediate destinations are added, the route should be: ${shouldIncludeStartPoint ? `"${startPoint}"` : 'Start'} → [Intermediate Destinations] → "${destination}"${isRoundTrip ? ` → Return to "${startPoint}"` : ''}.
       - Each intermediate destination should have at least half a day or a full day allocated for exploration, depending on its significance.
       - The daily 'plan' MUST reflect travel to and exploration of these intermediate destinations.
       - Search for specific attractions, restaurants, and accommodations in each intermediate destination.
    
    4. **Examples**:
       - For a 7-day trip from "Mumbai" to "Goa" by car: Include stops like "Pune", "Kolhapur", or "Ratnagiri" if they fit the route and vibe.
       - For a 10-day trip from "Delhi" to "Manali" by car: Include stops like "Chandigarh", "Shimla", or "Kullu" along the route.
       - For a 5-day trip from "Paris" to "Nice" by Standard transport: Include stops like "Lyon" or "Marseille" if feasible.
    
    5. **Output Requirements**:
       - List all intermediate destinations in the 'coveredDestinations' array in the order they will be visited.
       - Provide detailed information (history, culture, attractions) for each intermediate destination.
       - Ensure the itinerary makes efficient use of all ${days} days, with activities planned for each day.
    `;
  }
  
  let multiStopInstructions = '';
  if (isMultiStop) {
    const standardMultiStopRoundTripInstructions = isStandardMultiStopRoundTrip ? `
    6.  **STANDARD MULTI-STOP ROUND TRIP ROUTING (CRITICAL)**: This is a Standard round trip with multiple stops. The main destination "${destination}" MUST be both the STARTING and ENDING point of the journey:
        - The route MUST start from "${destination}"
        - Visit all intermediate stops (${stops?.join(', ') || ''}) in logical order
        - Return to "${destination}" at the end
        - The 'coveredDestinations' array should reflect this circular path: "${destination}" → [stops] → "${destination}"
        - The first day should include activities in "${destination}" (starting point)
        - The final days MUST include the return journey back to "${destination}" and activities there (ending point)
        - This creates a circular route where "${destination}" serves as both the departure and return point.
    ` : '';
    
    const standardMultiStopOneWayInstructions = isStandardMultiStopOneWay ? `
    6.  **STANDARD MULTI-STOP ONE-WAY ROUTING (CRITICAL)**: This is a Standard one-way trip with multiple stops. The route flows from start to destination:
        ${startPoint && startPoint.trim().length > 0 ? `- The route MUST start from "${startPoint}"` : `- The route MUST start from the first stop`}
        - Visit all intermediate stops (${stops?.join(', ') || ''}) in logical order
        - End at "${destination}" (this is the final destination, NOT the starting point)
        - The 'coveredDestinations' array should reflect this one-way path: ${startPoint && startPoint.trim().length > 0 ? `"${startPoint}" → ` : ''}[stops] → "${destination}"
        ${startPoint && startPoint.trim().length > 0 ? `- The first day should include activities in "${startPoint}" (starting point)` : `- The first day should start with activities at the first stop`}
        - The final days MUST include activities in "${destination}" (ending point)
        - This is a one-way journey ending at "${destination}", NOT a circular route.
    ` : '';
    
    const circularInstructions = isCircularTrip && !isStandardMultiStopRoundTrip && !isStandardMultiStopOneWay ? `
    6.  **CIRCULAR TRIP ROUTING**: This is a circular/round trip where the main destination "${destination}" is the farthest point. The route MUST be planned as a circular circuit:
        - Start from ${shouldIncludeStartPoint ? `"${startPoint}"` : 'the first stop'}
        - Visit all intermediate stops in logical order
        - Reach "${destination}" as the farthest point
        - Return via a different route or the same route back to ${shouldIncludeStartPoint ? `"${startPoint}"` : 'the starting point'}
        - The final days MUST include the return journey, completing the circular route.
        - The 'coveredDestinations' array should reflect this circular path, with the destination being the farthest point before returning.
    ` : '';
    
    multiStopInstructions = `
    CRITICAL MULTI-STOP INSTRUCTION:
    The user has specified multiple destinations for this trip: ${destinationsString}
    ${shouldIncludeStartPoint && !isStandardMultiStopRoundTrip && !isStandardMultiStopOneWay ? `Note: The starting point "${startPoint}" is included as a destination to visit (Standard trip).` : ''}
    ${isStandardMultiStopRoundTrip ? `Note: For this Standard round trip with multiple stops, "${destination}" is both the starting and ending point.` : ''}
    ${isStandardMultiStopOneWay ? `Note: For this Standard one-way trip with multiple stops, the route flows from ${startPoint && startPoint.trim().length > 0 ? `"${startPoint}"` : 'the first stop'} to "${destination}" (end point only).` : ''}
    1.  The 'coveredDestinations' array MUST be populated with detailed information for EACH destination listed, in the order they should be visited.
    2.  The 'destination' field in the JSON response should be a descriptive name for this multi-destination trip (e.g., '${destinationsString} Tour' or 'Multi-City ${destinationsString} Adventure').
    3.  The daily 'plan' MUST logically reflect travel between these destinations, ensuring each destination is properly explored.
    4.  You MUST create a logical route that efficiently connects all destinations, minimizing backtracking and travel time.
    5.  For each destination in the 'coveredDestinations' array, provide comprehensive information (history, culture, natural places, museums, etc.).
    ${standardMultiStopRoundTripInstructions}
    ${standardMultiStopOneWayInstructions}
    ${circularInstructions}
    `;
  }
  
  const regionalTripInstructions = `
  REGIONAL TRAVEL INSTRUCTION:
  If the destination "${destination}" appears to be a large region (e.g., a country, state, province, or a well-known tourist circuit), you MUST create a logical tour itinerary that covers multiple key cities or locations within that region. In this case:
  1.  The 'coveredDestinations' array MUST be populated with detailed information for each of these key locations visited.
  2.  The 'destination' field in the JSON response should be updated to a more descriptive name for this circuit (e.g., 'Rajasthan Heritage Tour').
  3.  The daily 'plan' should logically reflect travel between these locations.
  `;

  let roundTripInstructions = '';
  if ((tripType === 'Car' || tripType === 'Bike') && isRoundTrip && startPoint) {
      const dailyLimit = tripType === 'Car' ? 'MAXIMUM 350 km/day (5-6 hours driving max - STRICT LIMIT)' : '150-250 km/day';
      roundTripInstructions = `
      CRITICAL INSTRUCTION - DETAILED ROAD TRIP CIRCUIT:
      This is a multi-stop road trip circuit request. The user wants to travel from "${startPoint}", cover a series of interesting locations, and return to "${startPoint}" within ${days} days. The main destination of interest is "${destination}".

      1.  **Feasibility & Route Planning (MANDATORY TWO-STEP PROCESS)**: 
          **STEP 1 - CALCULATE MINIMUM DAYS FIRST**: Before deciding feasibility, you MUST:
             a. Use Google Search to get the ACTUAL distance (in km) from "${startPoint}" to "${destination}" and back (round trip distance)
             b. Calculate the minimum days required using this EXACT formula:
                - Total round trip distance ÷ daily limit (${tripType === 'Car' ? '350 km/day MAXIMUM (5-6 hours driving max - STRICT LIMIT)' : '200 km/day average'}) = minimum travel days
                - Add 1-2 days for sightseeing at the destination
                - Add 1 day buffer for rest/traffic = FINAL MINIMUM DAYS
                - Example: Gurgaon to Mumbai = ~1400 km round trip ÷ 350 km/day = 4 travel days + 2 sightseeing days + 1 buffer = 7 days minimum
             c. LOCK this calculated minimum (e.g., if you calculate 7 days, it's ALWAYS 7 days for this route)
          
          **STEP 2 - COMPARE TO USER'S DAYS**: Now compare:
             - If calculated minimum days <= ${days} (user's selected days): Trip IS FEASIBLE → proceed to plan
             - If calculated minimum days > ${days} (user's selected days): Trip is NOT FEASIBLE → provide alternative
          
          - **IF FEASIBLE** (calculated minimum <= ${days}):
              - **A. Itinerary Density & Maximization (CRITICAL):** Your primary goal is to **maximize the number of interesting and feasible places covered** within the given **${days} days**, adhering to the MAXIMALIST & EFFICIENT philosophy outlined above. A longer duration MUST result in a richer, denser itinerary with more stops, not just a slower pace between fewer locations. You MUST intelligently add relevant destinations to create a comprehensive tour circuit that makes full and enjoyable use of the time. Do not leave days with minimal activity; fill them with travel to new locations or exploration.
              - **B. Example:** For a 15-day car trip from "Jaipur" with the main destination as "Jaisalmer", a simple route (Jaipur -> Jodhpur -> Jaisalmer -> Bikaner -> Jaipur) would be **too sparse**. A **correct, enriched itinerary** MUST include other logical and famous stops like **Udaipur, Chittorgarh, Kumbhalgarh, and Ranakpur** to create a full Rajasthan heritage circuit that properly utilizes the 15 days.
              - **C. Route Design:** Based on the above, design a logical, sequential road trip circuit starting and ending at "${startPoint}". The route must maximize sightseeing of famous places based on the vibe: "${vibe.join(', ')}". The farthest point should be near "${destination}".
          - **IF NOT FEASIBLE** (calculated minimum > ${days}): Do NOT fail. You MUST plan a realistic road trip circuit to an alternative region or set of destinations reachable within the timeframe that still fits the user's vibe. The "destination" field in the JSON response MUST be updated to a more descriptive name for this new circuit (e.g., 'Rajasthan Heritage Circuit'). You MUST also add a note in the new 'planNote' field in the root of the JSON response, explaining the change clearly and starting with "NOTE:". 
             **CRITICAL**: Use the SAME minimum days you calculated in STEP 1 above. Do NOT recalculate or change it. The minimum days you calculated is FIXED. Explicitly mention this calculated minimum in the planNote. For example: "NOTE: A road trip to ${destination} and back in ${days} days isn't feasible. Based on the actual distance (approximately [X] km round trip) and travel time, this trip requires approximately [Y] days to complete comfortably (calculated: [X] km ÷ ${tripType === 'Car' ? '350' : '200'} km/day MAXIMUM + 2 sightseeing days + 1 buffer day = [Y] days). I've created an alternative Coastal Karnataka Temple & Adventure Circuit that fits your ${days}-day timeline and preferences."

      2.  **Distance & Time Accuracy with Traffic (CRITICAL)**: You MUST use your search capabilities to get accurate driving distances (in kilometers) and realistic travel times between all stops in the circuit. **CRITICAL**: You MUST search for current traffic patterns, peak hours, and congestion levels for each route segment. Travel time estimates MUST account for traffic conditions, not just distance. For example, a 200 km drive might take 3 hours in ideal conditions but 4-5 hours with typical traffic. 
       
       **🚫 ABSOLUTE LIMIT ENFORCEMENT - CRITICAL VALIDATION:**
       - **FOR CAR TRIPS: NO SINGLE DAY CAN EXCEED 350 KM OF DRIVING. THIS IS ABSOLUTE.**
       - **VALIDATION REQUIRED**: For EACH day in the plan, you MUST:
         1. Calculate the total driving distance for that day
         2. Verify it is ≤ 350 km
         3. If it exceeds 350 km, you MUST split it into multiple days with intermediate stops
       - **INVALID EXAMPLES (DO NOT DO THIS):**
         - "Drive from Jaipur to Udaipur (**approx. 395 km, 6-7 hours**)" ❌ (395 km EXCEEDS 350 km limit - MUST SPLIT)
         - "Drive from Delhi to Mumbai (**approx. 600 km, 10 hours**)" ❌ (600 km EXCEEDS 350 km limit - MUST SPLIT INTO 2+ DAYS)
       - **CORRECT APPROACH**: If a route is 395 km, you MUST break it into 2 days:
         - Day X: "Drive from Jaipur to [Intermediate City] (**approx. 200 km, 3-4 hours**)" ✅
         - Day X+1: "Drive from [Intermediate City] to Udaipur (**approx. 195 km, 3-4 hours**)" ✅
       - These realistic time estimates MUST be reflected in the daily 'activities' descriptions
       - Additionally, suggest optimal departure times to avoid peak traffic (e.g., "Depart at 6:30 AM to avoid morning rush hour")
       - **CRITICAL**: Inaccurate distances, ignoring traffic, or exceeding daily limits are ABSOLUTE FAILURES that make the entire response invalid

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
      CRITICAL INSTRUCTION - STANDARD ROUND TRIP TOUR (PUBLIC TRANSPORT):
      This is a Standard round trip tour request. The user wants to travel from "${startPoint}", cover a series of interesting locations via public transport, and return to "${startPoint}" within ${days} days. The main destination of interest is "${destination}".

      **🚫 CRITICAL - STARTING LOCATION NOT VISITED:**
      - The starting location "${startPoint}" is ONLY a departure and return point. DO NOT include it as a destination to visit or explore.
      - DO NOT add "${startPoint}" to the 'coveredDestinations' array.
      - DO NOT plan activities or sightseeing in "${startPoint}" - it is only used for departure and return.
      - The first day should start with travel FROM "${startPoint}" to the first destination.
      - The final day should end with return travel TO "${startPoint}" (arrival only, no activities there).

      1.  **Route & Transport Planning**:
          -   **A. Itinerary Density & Maximization (CRITICAL):** Your primary goal is to **maximize the number of interesting and feasible places covered** within the given **${days} days**, using public transport, adhering to the MAXIMALIST & EFFICIENT philosophy outlined above. A longer duration MUST result in a richer, denser itinerary with more stops, not just more days in the same few cities. You MUST intelligently add relevant destinations to create a comprehensive tour circuit that makes full and enjoyable use of the time. For example, a 15-day trip should cover significantly more cities than a 5-day trip.
          -   **B. Route Design & Transport Details:** Design a logical, sequential tour circuit starting FROM "${startPoint}" and ending back at "${startPoint}". The route must maximize sightseeing of famous places based on the vibe: "${vibe.join(', ')}". The farthest point should be near "${destination}". Unlike a road trip, the travel between cities/stops MUST be planned using the most efficient and budget-appropriate public transport. Provide realistic options like **trains** (mentioning class options), **buses** (mentioning carrier types like Volvo/sleeper), **shared cars**, or **flights** if the distance is significant.

      2.  **Distance & Time Accuracy with Traffic/Transport Delays (CRITICAL)**: You MUST use your search capabilities to get accurate travel distances and realistic travel times for the suggested mode of public transport (train, bus, etc.) between all stops in the circuit. **CRITICAL**: Account for potential delays due to traffic (for buses/road transport), train schedules, and typical public transport delays. For road-based public transport, research traffic patterns and peak hours that might affect bus/car travel times. These realistic time estimates MUST be reflected in the daily 'activities' descriptions and 'transport' suggestions. For example, mention "Travel by bus from City A to City B (**approx. 250 km, 5-6 hours including typical traffic delays**)". Inaccurate details or ignoring traffic/transport delays are critical failures.

      3.  **Structured Output - This is MANDATORY**:
          -   **coveredDestinations**: This array MUST list each major city/stop of the tour circuit *in the order they are visited*. **DO NOT include "${startPoint}" in this array** - it is only a departure/return point, not a destination to visit. For each stop, provide the detailed information (history, culture, etc.).
          -   **plan**: The daily plan MUST correspond directly to the tour circuit.
              -   Day 1 should start with: "Travel from "${startPoint}" to [First Destination] via [transport mode]" - do NOT include activities in "${startPoint}".
              -   Each day's **title** should clearly state the travel segment, for example: 'Day 3: Travel from Agra to Jaipur via Train & Local Sightseeing'.
              -   The **activities** for a travel day should include the journey itself (mentioning approximate duration and mode of transport) and then activities upon arrival at the new destination.
              -   The final day of the plan MUST cover the return journey back to "${startPoint}" (arrival only, no activities or sightseeing in "${startPoint}").

      4.  **Local Transport**: For days spent exploring a destination (not traveling between cities), you should suggest local transport options (e.g., metro, ride-sharing, auto-rickshaws, taxis) that are appropriate for the user's budget.
      `;
    }
  
  const prompt = `Create a detailed travel itinerary in ${language}. The user wants to plan a ${days}-day trip${isMultiStop ? ` covering multiple destinations: ${destinationsString}` : ` to ${destination}`} with a ${budget} budget.
  
  **GOOGLE SEARCH OPTIMIZATION (CRITICAL FOR SPEED):**
  You have access to Google Search, but use it efficiently and strategically:
  1. **USE GOOGLE SEARCH ONLY FOR:**
     - **ACCOMMODATION SEARCH (MANDATORY):** For each day's 'placesToStay', you MUST search for REAL, SPECIFIC hotels/hostels/guesthouses in the destination city with current prices. Search format: "budget hotels in [city] for [startDate] prices" or "hostels in [city] budget accommodation prices". 
       **CRITICAL REQUIREMENTS:**
       - You MUST provide ACTUAL, REAL hotel/hostel names that exist and can be found on Google Search
       - DO NOT use generic names like "Budget Hotel", "Local Guesthouse", "City Hotel", "Downtown Inn" - these are TOO VAGUE
       - Use SPECIFIC, SEARCHABLE names like "**Taj Mahal Hotel**", "**OYO Rooms**", "**Zostel Hostel**", "**Hilton Garden Inn**"
       - Include the actual per-night cost in the format: "**Real Hotel Name** (from ₹800/night)" or "**Actual Hostel Name** (from ₹2,500/night per person)"
       - If you cannot find a specific name, search more thoroughly - vague names are NOT acceptable
       - Example of CORRECT format: "**Taj Palace Hotel** (from ₹3,500/night)" or "**Zostel Mumbai** (from ₹600/night)"
       - Example of INCORRECT format: "Budget hotel" or "Local accommodation" or "City center hotel"
     - **RESTAURANT SEARCH (MANDATORY):** For each day's 'food' field, you MUST search Google for REAL, SPECIFIC restaurants, cafes, and eateries in the destination city. Search format: "best restaurants in [city] for [foodPreference] budget" or "popular restaurants [city] [vibe]". 
       **CRITICAL REQUIREMENTS:**
       - You MUST provide ACTUAL, REAL restaurant names that exist and can be found on Google Search
       - DO NOT use generic names like "Local Restaurant", "Street Food Stall", "Cafe", "Restaurant" - these are TOO VAGUE
       - Use SPECIFIC, SEARCHABLE names like "**McDonald's**", "**Cafe Coffee Day**", "**Saravana Bhavan**", "**Karim's Restaurant**", "**Leopold Cafe**"
       - Format: "**Real Restaurant Name** - [description]" or "**Actual Restaurant Name** ([specialty/cuisine])"
       - If you cannot find a specific name, search more thoroughly - vague names are NOT acceptable
       - Example of CORRECT format: "**Saravana Bhavan** - Authentic South Indian vegetarian cuisine" or "**Karim's** (Mughlai specialties)"
       - Example of INCORRECT format: "Local restaurant" or "Street food" or "Cafe near hotel"
     - Current entry prices and ticket costs for specific attractions
     - Real-time events, festivals, or special events happening during travel dates (${startDate})
     - Current exchange rates between currencies
     - Recent changes to attraction hours or availability
     - **Traffic patterns, peak hours, and current traffic conditions** for routes between destinations and within cities
     - **Real-time traffic forecasts** for planned travel routes during specific times and dates
     - **WEATHER FORECAST (MANDATORY):** For each day in the itinerary, you MUST search for expected weather conditions for that specific date and location. Search format: "weather forecast [city] [date]" or "weather [city] [startDate] forecast". Provide temperature range, conditions (sunny, rainy, cloudy, etc.), and any relevant details (wind, humidity) in the 'expectedWeather' field for each day.
     - **AIR QUALITY INDEX (AQI) (MANDATORY):** For each day in the itinerary, you MUST search for expected AQI for that specific date and location. Search format: "air quality index [city] [date]" or "AQI [city] [startDate]". **CRITICAL**: The 'expectedAQI' field MUST ALWAYS start with a numeric range (e.g., "45-65", "100-150"). Format: "45-65 (Good to Moderate)" or "100-150 (Moderate to Unhealthy for Sensitive Groups)". NEVER provide only text like "Good to Moderate" without the numeric range. The numeric range is MANDATORY and must come first, followed by the category in parentheses.
  2. **USE YOUR TRAINING DATA FOR:**
     - Famous attractions, landmarks, and historical sites
     - Cultural information, traditions, and local customs
     - General food culture and cuisine information
     - Natural places, museums, and tourist spots
     - Historical background and general travel information
  3. **SEARCH EFFICIENCY RULES:**
     - Make maximum 6-7 targeted searches per request (increased to accommodate weather and AQI)
     - **MANDATORY: Search for accommodation prices AND restaurants for each destination city** - these are priorities
     - **MANDATORY: Search for weather forecast AND AQI for each day** - these are critical for user planning
     - Combine related searches when possible: "Search for accommodation and restaurants together" or "Search for weather and AQI for [city] [date]"
     - **For vehicle trips (Car/Bike): ALWAYS search for traffic patterns and peak hours for major routes**
     - Prioritize: Search for accommodation prices, restaurant names, weather forecasts, AQI, attraction prices, events, and traffic conditions first, then use knowledge base for everything else
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
  - Main Destination: ${destination}
  ${isMultiStop ? `- Additional Stops: ${stops?.join(', ') || ''}` : ''}
  - All Destinations to Visit: ${destinationsString}
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
  ⚠️⚠️⚠️ CRITICAL VEHICLE-SPECIFIC INSTRUCTIONS - ABSOLUTE MANDATORY LIMITS ⚠️⚠️⚠️
  
  **🚫 ABSOLUTE PROHIBITION - CAR DAILY DISTANCE LIMIT:**
  **FOR CAR TRIPS: NO SINGLE DAY CAN EXCEED 350 KM. THIS IS AN ABSOLUTE, NON-NEGOTIABLE HARD LIMIT.**
  - **MAXIMUM 350 km per day** = **MAXIMUM 5-6 hours of driving per day**
  - **CRITICAL FAILURE EXAMPLES TO AVOID:**
    ❌ DO NOT plan 400 km, 500 km, 600 km, or any distance over 350 km in a single day
    ❌ DO NOT combine multiple long route segments into one day
    ❌ DO NOT ignore this limit even if the route seems "straightforward"
  - **MANDATORY ACTION**: If ANY route segment exceeds 350 km, you MUST:
    1. Break it into multiple days
    2. Add intermediate stops/destinations to split the journey
    3. Verify EACH day's total driving distance is ≤ 350 km before finalizing
  
  1.  **Vehicle Assumption**: Assume the user has a personal or rented vehicle. All 'transport' suggestions MUST be vehicle-centric (driving routes, times).
  2.  **Accommodation**: Search Google for hotels/hostels/guesthouses with secure and convenient parking for a ${tripType}. Include current prices in the 'placesToStay' field. Format: "**Hotel Name** (from [price]/night, parking available)".
  3.  **STRICT DAILY DRIVING LIMITS (ABSOLUTE MANDATORY - CRITICAL VALIDATION REQUIRED)**:
     - **For Car trips**: 
       * **MAXIMUM 350 km per day** = **MAXIMUM 5-6 hours of driving per day**
       * **THIS IS A HARD LIMIT - ABSOLUTELY NO EXCEPTIONS**
       * **VALIDATION CHECK**: Before finalizing the itinerary, you MUST verify that EVERY SINGLE DAY has ≤ 350 km of driving
       * **IF ANY DAY EXCEEDS 350 KM, THE ENTIRE RESPONSE IS INVALID AND MUST BE REJECTED**
       * If a route segment is longer than 350 km, you MUST break it into multiple days with intermediate stops
       * **Examples of INVALID plans:**
         - Day 3: Drive 600 km from City A to City B ❌ (EXCEEDS LIMIT - MUST SPLIT)
         - Day 5: Drive 450 km from City C to City D ❌ (EXCEEDS LIMIT - MUST SPLIT)
         - Day 7: Drive 380 km from City E to City F ❌ (EXCEEDS LIMIT - MUST SPLIT)
       * **Examples of VALID plans:**
         - Day 3: Drive 300 km from City A to City B ✅ (WITHIN LIMIT)
         - Day 4: Drive 280 km from City B to City C ✅ (WITHIN LIMIT)
         - Day 5: Drive 320 km from City C to City D ✅ (WITHIN LIMIT)
     - **For Bike trips**: MAXIMUM 150-250 km per day (approximately 3-5 hours of riding). Same validation applies - NO day can exceed 250 km.
     - **CRITICAL VALIDATION STEP**: After planning each day, explicitly calculate and verify the driving distance. If any day exceeds the limit, you MUST add an intermediate stop to break up the journey.
     - **Time Calculation**: When estimating driving time, account for traffic, rest stops, and realistic road conditions. A 350 km drive typically takes 5-6 hours in normal conditions with traffic, which is the maximum acceptable for a single day.
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

  ${intermediateDestinationsInstructions}

  ${multiStopInstructions}

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
        "food": string[], // MUST contain REAL restaurant names in format: "**Restaurant Name** - description" (NO generic names like "Local restaurant")
        "placesToStay": string[], // MUST contain REAL hotel/hostel names in format: "**Hotel Name** (from price/night)" (NO generic names like "Budget hotel")
        "approxCost": string,
        "medicalFacilities"?: string[],
        "transport"?: { "suggestions": string[], "cost": string },
        "expectedWeather"?: string, // Expected weather conditions for this day (e.g., "25-30°C, Sunny")
        "expectedAQI"?: string // Expected Air Quality Index range for this day - MUST start with numeric range: "45-65 (Good to Moderate)" or "100-150 (Moderate)". NEVER provide only category text without numbers.
      }
    ],
    "referenceBlogs": []
  }

  IMPORTANT RULES:
  1. All strings must be in ${language}. 'plan' array must have exactly ${days} elements. 'coveredDestinations' is mandatory (populate for multi-location trips, single destination for single city).
  2. **🚫 CRITICAL VALIDATION - DAILY DRIVING DISTANCE LIMIT (FOR CAR TRIPS):**
     - **BEFORE FINALIZING THE RESPONSE, YOU MUST VALIDATE:**
       * Calculate the driving distance for EACH day in the 'plan' array
       * Verify that NO SINGLE DAY exceeds 350 km of driving
       * If ANY day exceeds 350 km, the response is INVALID and you MUST:
         - Split that day's travel into multiple days
         - Add intermediate stops/destinations
         - Recalculate all distances
         - Verify again that all days are ≤ 350 km
     - **THIS IS A MANDATORY VALIDATION STEP - DO NOT SKIP IT**
     - **EXAMPLES OF INVALID RESPONSES:**
       * Any day with "Drive... (**approx. 400 km**)" or more ❌
       * Any day with "Drive... (**approx. 500 km**)" or more ❌
       * Any day with "Drive... (**approx. 600 km**)" or more ❌
     - **ONLY RESPONSES WHERE ALL DAYS HAVE ≤ 350 KM ARE VALID**
  3. **ACTIVITY TIMINGS (TRAFFIC-AWARE):** Prefix each activity with time: "**09:00 AM - 11:00 AM:** Visit..." or "**01:00 PM:** Lunch...". Be realistic accounting for travel time, duration, AND traffic conditions. For vehicle trips (Car/Bike), account for peak traffic hours when scheduling activities. For example, if moving between attractions in a city during rush hour (7-9 AM or 5-7 PM), add extra buffer time. For inter-city travel, suggest departure times that avoid peak hours. Always include realistic travel time estimates that reflect traffic: "**06:30 AM:** Depart from Hotel (early departure to avoid rush hour traffic)" or "**10:00 AM - 12:00 PM:** Visit Museum (allowing 30 min for city traffic)". **CRITICAL**: When mentioning driving distances in activities, ensure they never exceed 350 km per day.
  4. **COST FORMATTING:** All cost fields (budgetSummary.*, approxCost, transport.cost) = strings with ONLY numbers (e.g., "1500", "250.50"). No currency symbols. All per-person costs in "${currency}".
  5. **BOLDING:** Use **text** to highlight attractions, restaurants, hotels, timings, cultural items, travel advice.
  6. **NO TECHNICAL JARGON:** User-facing text must be friendly and natural. NEVER mention JSON field names like 'budgetSummary.total' or 'approxCost' in user text. Use natural language instead.
  7. **MEDICAL:** If includeMedical=true, list at least one hospital/pharmacy per day in 'medicalFacilities'.
  8. **TRANSPORT:** Standard trips: tailor to budget. Car/Bike: follow vehicle instructions above.
  9. **ACCOMMODATION WITH COSTS (CRITICAL):** For each day's 'placesToStay' field, you MUST:
     - Search Google for current hotel/hostel/guesthouse prices in that destination for the travel dates
     - Include 2-3 accommodation options per day
     - **CRITICAL - VARIETY REQUIREMENT:** If the user is staying in the same location/city for multiple consecutive days, you MUST provide DIFFERENT accommodation options for EACH day. Do NOT repeat the same hotels across days. This gives users maximum variety and options to choose from. For example, if staying 3 days in Paris, Day 1 might suggest hotels in the Latin Quarter, Day 2 in Montmartre, Day 3 in Le Marais - all different properties.
     - Format each option as: "**Hotel/Hostel Name** (from [price]/night per person)" or "**Hotel Name** (from [price]/night for double room)"
     - Prices must be in ${currency} (convert if needed)
     - For Low Budget: Search for hostels, guesthouses, budget lodges (from lowest prices)
     - For Midrange: Search for 3-star hotels, comfortable guesthouses (mid-range prices)
     - For Luxury: Search for 4-5 star hotels, resorts (premium prices)
     - Example: "**Backpacker Hostel** (from ₹500/night per person)" or "**Grand Hotel** (from ₹3,500/night for double room)"
  9. **FOOD & RESTAURANT RECOMMENDATIONS (CRITICAL):** For each day's 'food' field, you MUST:
     - Search Google for specific restaurants, cafes, and eateries in that destination city
     - Include actual restaurant names (not just generic descriptions like "local food" or "street food")
     - Format each recommendation as: "**Restaurant Name** - [description/specialty]" or "**Restaurant Name** ([cuisine type])" or "**Restaurant Name** - [recommended dish]"
     - Include 2-4 restaurant/food recommendations per day covering different meals (breakfast, lunch, dinner, snacks)
     - For Low Budget: Search for street food stalls, local cafes, budget restaurants
     - For Midrange: Search for popular mid-range restaurants, cafes, local favorites
     - For Luxury: Search for fine dining restaurants, upscale cafes, premium eateries
     - Always respect the food preference: ${foodPreference}
     - Example: "**Joe's Pizza** - Authentic Italian pizza" or "**Spice Garden** (North Indian cuisine) - Try their butter chicken" or "**Local Market Street Food** - Famous for chaat"
  10. **DESTINATION DETAILS:** For historicBackground, famousCulture, naturalPlaces, museums, specialOrnaments, recommendedRestaurants: 1-3 concise points (5-10 words each). Restaurants can be names only.
  11. **WEATHER & AIR QUALITY (MANDATORY FOR EACH DAY):** For EACH day in the 'plan' array, you MUST:
     - Search for expected weather conditions for that specific date and location (city where activities are planned)
     - Search for expected AQI for that specific date and location
     - Calculate the date for each day: Day 1 = ${startDate}, Day 2 = ${startDate} + 1 day, etc.
     - For multi-stop trips, use the location where activities are planned that day
     - Format 'expectedWeather': "25-30°C, Sunny" or "18-22°C, Partly cloudy" (keep concise, no extra details)
     - Format 'expectedAQI': **MUST ALWAYS start with numeric range** - "45-65 (Good to Moderate)" or "100-150 (Moderate)" or "150-200 (Unhealthy for Sensitive Groups)". **CRITICAL**: The numeric range (e.g., "45-65") is MANDATORY and must always be included. NEVER provide only category text like "Good to Moderate" without the numeric range. Format: [numeric-range] (category). Keep concise - NO explanatory text.
     - These fields help users plan their activities and pack accordingly
  12. **SPECIAL EVENTS:** Find events happening ONLY during ${startDate} for ${days} days. 1-2 sentences. If none: "No major special events scheduled, but enjoy ongoing local experiences."
  13. **CURRENCY CONVERSION:** Determine local currency of "${destination}". If different from "${currency}", add 'currencyConversion' object with format "1 [DEST_CURRENCY] = [VALUE] [USER_CURRENCY]" (e.g., "1 USD = 83 INR"). If same, omit this field.
  14. **FEASIBILITY CHECK PROCESS (CRITICAL - MANDATORY TWO-STEP PROCESS FOR ALL TRIP TYPES):** 
     **STEP 1 - CALCULATE MINIMUM DAYS FIRST (ALWAYS DO THIS FIRST)**: Before deciding if a trip is feasible, you MUST:
       - Use Google Search to get the ACTUAL distance (in km) between the start point and destination. If it's a round trip, calculate the total round trip distance.
       - Calculate the minimum days using this EXACT formula (do this ONCE and LOCK the result):
         * Total distance ÷ daily travel limit = minimum travel days
           - Daily limits (STRICT MAXIMUM - DO NOT EXCEED): ${tripType === 'Car' ? 'MAXIMUM 350 km/day (5-6 hours driving max - use 350 km as the strict limit for calculation)' : tripType === 'Bike' ? '150-250 km/day (use 200 km as average for calculation)' : 'realistic public transport schedules - estimate based on actual travel time'}
         * Add 1-2 days for sightseeing at the destination
         * Add 1 day buffer for rest/traffic = FINAL MINIMUM DAYS
         * Example: Gurgaon to Mumbai = ~700 km one way, ~1400 km round trip. With 350 km/day limit: 1400 ÷ 350 = 4 travel days + 2 sightseeing days + 1 buffer = 7 days minimum. This calculation is FIXED.
       - LOCK this calculated minimum - it does NOT change based on user input.
     
     **STEP 2 - COMPARE TO USER'S DAYS**: Now compare the calculated minimum to the user's selected ${days}:
       - If calculated minimum <= ${days}: Trip IS FEASIBLE → proceed with planning
       - If calculated minimum > ${days}: Trip is NOT FEASIBLE → provide alternative and mention required days
     
     **ABSOLUTE RULE**: The minimum days you calculate in STEP 1 is FIXED for this route. It MUST be THE SAME regardless of whether the user selected 5 days, 7 days, or 10 days. For example, if Gurgaon to Mumbai requires 7 days, you MUST ALWAYS say 7 days, never 8-10 days or 9-11 days. The required days are based on the ROUTE distance and travel limits, NOT the USER INPUT.
     
     **WHEN NOT FEASIBLE**: If the trip is not feasible (calculated minimum > ${days}), include in the 'planNote' field: "NOTE: This trip is not feasible in ${days} days. Based on the actual distance (approximately [X] km round trip) and travel time, this trip requires approximately [Y] days to complete comfortably (calculated: [X] km ÷ [daily limit] km/day + 2 sightseeing days + 1 buffer day = [Y] days). [Then provide alternative solution]"
  15. **JSON VALIDATION:** NO unescaped double quotes (") in string values. Use single quotes or escape: \\". Check every string before responding.
  16. **FINAL:** Response MUST be raw JSON starting with '{' and ending with '}'. No markdown wrapping, no intro text. Immediately parsable.
  17. 'referenceBlogs' must be an empty array [].
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