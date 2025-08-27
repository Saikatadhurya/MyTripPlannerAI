
import { GoogleGenAI, Type } from "@google/genai";
import { Budget, Itinerary, Vibe, FoodPreference } from '../types';

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

    const resultText = response.text.trim();
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


export const generateItinerary = async (
  destination: string,
  days: number,
  budget: Budget,
  vibe: Vibe[],
  persons: number,
  foodPreference: FoodPreference,
  startDate: string
): Promise<Itinerary> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please configure your API_KEY environment variable.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const vibeText = vibe.length > 1 ? `Their desired travel vibes are "${vibe.join(', ')}"` : `Their desired travel vibe is "${vibe[0]}"`;

    const prompt = `Create a highly detailed ${days}-day travel itinerary for ${persons} person(s) visiting ${destination}. The traveler's budget is "${budget}". ${vibeText}, and their food preference is "${foodPreference}". The trip will start on ${startDate}.

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
- An estimated cost for the day **per person** in Indian Rupees (₹).

Finally, provide a budget summary with estimated costs in Indian Rupees (₹) **per person** for the entire trip. Include separate estimates for stay, food, and a total cost **per person**.

Additionally, provide a list of up to 5 highly relevant and helpful reference blog posts for planning a trip to ${destination}. For each blog post, provide a catchy, descriptive title and its full URL.

Ensure all lists are provided as bullet points.`;

    const responseSchema = {
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
            properties: {
              day: { type: Type.INTEGER, description: "Day number." },
              title: { type: Type.STRING, description: "Catchy title for the day." },
              activities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bulleted list of suggested activities for the day." },
              food: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bulleted list of food recommendations for the day." },
              placesToStay: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Suggested places to stay for the day." },
              approxCost: { type: Type.STRING, description: "Estimated cost for the day per person." }
            },
            required: ["day", "title", "activities", "food", "placesToStay", "approxCost"]
          }
        },
        referenceBlogs: {
            type: Type.ARRAY,
            description: "A list of up to 5 reference blog posts.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of the blog post." },
                    url: { type: Type.STRING, description: "The URL of the blog post." }
                },
                required: ["title", "url"]
            }
        }
      },
      required: ["budgetSummary", "historicBackground", "famousCulture", "naturalPlaces", "museums", "specialOrnaments", "recommendedRestaurants", "specialEvents", "plan", "referenceBlogs"]
    };
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const resultText = response.text.trim();
    const resultJson = JSON.parse(resultText);

    // Basic validation
    if (!resultJson.plan || !Array.isArray(resultJson.plan) || !resultJson.budgetSummary) {
      throw new Error("Invalid response format from AI.");
    }

    const itinerary: Itinerary = {
      destination,
      days,
      persons,
      budget,
      vibe,
      foodPreference,
      startDate,
      budgetSummary: resultJson.budgetSummary,
      historicBackground: resultJson.historicBackground,
      famousCulture: resultJson.famousCulture || [],
      naturalPlaces: resultJson.naturalPlaces || [],
      museums: resultJson.museums || [],
      specialOrnaments: resultJson.specialOrnaments || [],
      recommendedRestaurants: resultJson.recommendedRestaurants || [],
      specialEvents: resultJson.specialEvents || [],
      plan: resultJson.plan,
      referenceBlogs: resultJson.referenceBlogs || [],
    };

    return itinerary;
  } catch (error) {
    console.error("Error generating itinerary with AI:", error);
    throw new Error("Failed to generate itinerary. The AI service might be busy or there was an issue with the request. Please try again.");
  }
};