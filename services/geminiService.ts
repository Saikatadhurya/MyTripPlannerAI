
import { GoogleGenAI, Type } from "@google/genai";
import { Budget, Itinerary, Vibe, FoodPreference } from '../types';

export const getDestinationSuggestions = async (query: string): Promise<string[]> => {
  if (!process.env.API_KEY) {
    console.error("API key is missing.");
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = query.trim()
        ? `Based on the user input "${query}", suggest 5 travel destinations. For each, provide the city, state/province, and country in a single string like "City, State, Country". Provide only a JSON array of these strings.`
        : `Suggest 5 popular and diverse travel destinations from around the world. For each, provide the city, state/province, and country in a single string like "City, State, Country". Provide only a JSON array of these strings.`;

    const responseSchema = {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of 5 travel destination suggestions, including city, state, and country."
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

    if (!Array.isArray(resultJson)) {
      console.error("Invalid response format from AI. Expected an array.");
      return [];
    }
    
    return resultJson.filter(item => typeof item === 'string');

  } catch (error) {
    console.error("Error fetching destination suggestions from AI:", error);
    return [];
  }
};


export const generateItinerary = async (
  destination: string,
  days: number,
  budget: Budget,
  vibe: Vibe,
  persons: number,
  foodPreference: FoodPreference,
  startDate: string
): Promise<Itinerary> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please configure your API_KEY environment variable.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Create a highly detailed ${days}-day travel itinerary for ${persons} person(s) visiting ${destination}. The traveler's budget is "${budget}", their desired travel vibe is "${vibe}", and their food preference is "${foodPreference}". The trip will start on ${startDate}.

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
- A bulleted list of suggested places to stay for that day, considering the day's activities and location.
- An estimated cost for the day **per person** in Indian Rupees (₹).

Finally, provide a budget summary with estimated costs in Indian Rupees (₹) **per person** for the entire trip. Include separate estimates for stay, food, and a total cost **per person**.
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
        }
      },
      required: ["budgetSummary", "historicBackground", "famousCulture", "naturalPlaces", "museums", "specialOrnaments", "recommendedRestaurants", "specialEvents", "plan"]
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

    // FIX: Added 'persons' to the Itinerary object to ensure it's available for components like ItineraryPreview.
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
    };

    return itinerary;
  } catch (error) {
    console.error("Error generating itinerary with AI:", error);
    throw new Error("Failed to generate itinerary. The AI service might be busy or there was an issue with the request. Please try again.");
  }
};
