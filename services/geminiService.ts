import { GoogleGenAI, Type } from "@google/genai";
import { Budget, Itinerary, Vibe, FoodPreference, BlogReference } from '../types';

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

    const resultText = response.text?.trim();
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

const findReferenceBlogs = async (destination: string): Promise<BlogReference[]> => {
  if (!process.env.API_KEY) {
    console.error("API key is missing.");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // --- Step 1: Find blogs using Google Search ---
    const searchPrompt = `Find up to 5 helpful and popular travel blog posts for planning a trip to ${destination}.`;
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

    const initialBlogs = groundingChunks
      .map(chunk => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
          const url = new URL(chunk.web.uri);
          let source = url.hostname.replace(/^www\./, '');

          // If the source is a Google redirect, don't show it.
          if (source === 'vertexaisearch.cloud.google.com') {
            source = '';
          }
          
          return {
            title: chunk.web.title, // Use the full, original title from the search result.
            url: chunk.web.uri,
            source,
          };
        }
        return null;
      })
      .filter((blog): blog is { title: string; url: string; source: string } => blog !== null)
      .slice(0, 5);

    if (initialBlogs.length === 0) {
      return [];
    }

    // --- Step 2: Generate descriptions for the found blogs ---
    try {
      const blogsForDescriptionPrompt = initialBlogs.map(b => `- Title: "${b.title}"`).join('\n');
      const descriptionPrompt = `For the following list of travel blog post titles about ${destination}, write a concise, one-sentence description for each, highlighting what the reader can expect to find.

${blogsForDescriptionPrompt}

Your response must be a JSON array of objects, where each object has a single "description" key. The order must match the input titles.`;

      const descriptionSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "A concise, one-sentence description of the blog post."
            },
          },
          required: ["description"]
        }
      };

      const descriptionResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: descriptionPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: descriptionSchema,
          thinkingConfig: { thinkingBudget: 0 }, // Low latency for a simple task
        }
      });

      const resultText = descriptionResponse.text?.trim();
      if (!resultText) {
          throw new Error("AI response for blog descriptions was empty.");
      }
      const descriptions = JSON.parse(resultText);
      
      if (!Array.isArray(descriptions) || descriptions.length !== initialBlogs.length) {
        throw new Error("Mismatched or invalid descriptions array from AI.");
      }

      // Combine initial blogs with generated descriptions
      return initialBlogs.map((blog, index) => ({
        ...blog,
        description: descriptions[index]?.description || 'A helpful travel guide for your trip.',
      }));

    } catch (descriptionError) {
      console.error("Could not generate blog descriptions, returning blogs with a generic description.", descriptionError);
      // Fallback: return blogs with a generic description if the second AI call fails
      return initialBlogs.map(blog => ({
        ...blog,
        description: "Click here to explore a detailed guide and plan your trip better.",
      }));
    }
  } catch (error) {
    console.error(`Error fetching reference blogs for "${destination}":`, error);
    return []; // Return empty array on error to not block itinerary generation
  }
};

export const generateItinerary = async (
  destination: string,
  days: number,
  budget: Budget,
  vibe: Vibe[],
  persons: number,
  foodPreference: FoodPreference,
  startDate: string,
  includeMedical: boolean,
  includeTransport: boolean,
): Promise<Itinerary> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please configure your API_KEY environment variable.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // --- Step 1: Generate the core itinerary ---
    const vibeText = vibe.length > 1 ? `Their desired travel vibes are "${vibe.join(', ')}"` : `Their desired travel vibe is "${vibe[0]}"`;

    let medicalPrompt = '';
    if (includeMedical) {
      medicalPrompt = `
- A bulleted list of suggested medical facilities (hospitals, pharmacies) near the planned locations. If no specific suggestions are available, return an empty list.`;
    }

    let transportPrompt = '';
    if (includeTransport) {
      transportPrompt = `
- A 'transport' object containing a 'suggestions' list and a 'cost' string. The suggestions should be a bulleted list of transport options appropriate for a "${budget}" budget. For 'Budget', focus on public transport. For 'Midrange', a mix of private cars/taxis and public transport. For 'Luxury', suggest private luxury cars. The 'cost' should be the estimated transport cost for the day in Indian Rupees (₹).`;
    }

    const itineraryPrompt = `Create a highly detailed ${days}-day travel itinerary for ${persons} person(s) visiting ${destination}. The traveler's budget is "${budget}". ${vibeText}, and their food preference is "${foodPreference}". The trip will start on ${startDate}.

For all text content, use markdown to **bold** important keywords, places, and titles for emphasis.

Provide the following general information for ${destination}:
- A brief historic background.
- At least 5 bullet points on the famous culture.
- At least 5 bullet points on special natural places to explore.
- At least 5 bullet points on museums to visit.
- At least 5-6 options for recommended restaurants.
- A few bullet points on special ornaments or souvenirs to look for, if any.
- Based on the start date of ${startDate}, a bulleted list of any special events, festivals, or local holidays happening in or near ${destination} during the ${days}-day trip. If there are no events, return an empty list.

For each of the ${days} days, provide:
- A catchy title.
- A bulleted list of suggested activities.
- A bulleted list of ${foodPreference} food recommendations (specific dishes or restaurants).
- A bulleted list of suggested places to stay for that day, considering the day's activities and location. If there are no specific suggestions, return an empty list.
- An estimated cost for the day **per person** in Indian Rupees (₹).${transportPrompt}${medicalPrompt}

Finally, provide a budget summary with estimated costs in Indian Rupees (₹) **per person** for the entire trip. Include separate estimates for stay, food, and a total cost **per person**.

Ensure all lists are provided as bullet points.`;

    // Dynamically build the schema for the day plan
    const planProperties: any = {
      day: { type: Type.INTEGER, description: "Day number." },
      title: { type: Type.STRING, description: "Catchy title for the day." },
      activities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bulleted list of suggested activities for the day." },
      food: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bulleted list of food recommendations for the day." },
      placesToStay: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Suggested places to stay for the day." },
      approxCost: { type: Type.STRING, description: "Estimated cost for the day per person." }
    };

    if (includeTransport) {
      planProperties.transport = {
        type: Type.OBJECT,
        description: "Transport suggestions for the day.",
        properties: {
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of transport suggestions." },
          cost: { type: Type.STRING, description: "Estimated cost for transport for the day." }
        },
        required: ["suggestions", "cost"]
      };
    }
    
    if (includeMedical) {
      planProperties.medicalFacilities = {
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "List of nearby medical facilities for the day." 
      };
    }
    
    const itinerarySchema = {
      type: Type.OBJECT,
      properties: {
        budgetSummary: {
          type: Type.OBJECT,
          description: "The estimated budget summary for the trip.",
          properties: {
            stay: { type: Type.STRING, description: "Estimated cost for stay." },
            food: { type: Type.STRING, description: "Estimated cost for food." },
            total: { type: Type.STRING, description: "Total estimated cost." }
          },
          required: ["stay", "food", "total"]
        },
        historicBackground: { type: Type.STRING, description: "Brief historic background of the destination." },
        famousCulture: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bulleted list of famous cultural aspects." },
        naturalPlaces: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bulleted list of natural places to explore." },
        museums: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bulleted list of museums." },
        specialOrnaments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bulleted list of special ornaments or souvenirs." },
        recommendedRestaurants: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 5-6 recommended restaurants." },
        specialEvents: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bulleted list of special events happening during the trip." },
        plan: {
          type: Type.ARRAY,
          description: "The day-by-day itinerary.",
          items: {
            type: Type.OBJECT,
            properties: planProperties,
            required: ["day", "title", "activities", "food", "placesToStay", "approxCost"]
          }
        },
      },
      required: ["budgetSummary", "historicBackground", "famousCulture", "naturalPlaces", "museums", "specialOrnaments", "recommendedRestaurants", "specialEvents", "plan"]
    };

    const itineraryResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: itineraryPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: itinerarySchema,
      }
    });

    const resultText = itineraryResponse.text?.trim();
    if (!resultText) {
        console.error("AI response for itinerary was empty or invalid:", itineraryResponse);
        throw new Error("The AI returned an empty response. This could be due to a safety filter or an issue with the request. Please try modifying your request.");
    }
    const itineraryDetails = JSON.parse(resultText);

    // --- Step 2: Find reference blogs sequentially to avoid rate limiting ---
    const referenceBlogs = await findReferenceBlogs(destination);

    // --- Step 3: Combine results and return ---
    return {
      ...itineraryDetails,
      destination,
      days,
      persons,
      budget,
      vibe,
      foodPreference,
      startDate,
      referenceBlogs,
    };

  } catch (error) {
    console.error("Error generating itinerary with AI:", error);
    let errorMessage = "An unexpected error occurred while generating the itinerary. Please try again later.";
    if (error instanceof Error) {
        if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429')) {
            errorMessage = "We're experiencing high demand. Please wait a moment and try generating your trip again.";
        } else {
            errorMessage = `Failed to generate itinerary: ${error.message}`;
        }
    }
    throw new Error(errorMessage);
  }
};