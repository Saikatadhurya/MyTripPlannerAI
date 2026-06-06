import { GoogleGenAI } from "@google/genai";
import { extractJson, cleanCitations } from './jsonUtils';
import { CookieUtils } from './cookieUtils';
import { GEMINI_MODEL } from './geminiModel';
import { Vibe, Budget, TripType } from '../types';

export interface WeekendPackage {
  id: string;
  destination: string;
  title: string;
  description: string;
  days: number;
  highlights: string[];
  estimatedBudget: string;
  bestFor: string[];
  distance: string;
  travelTime: string;
  imageUrl?: string;
}

export interface WeekendExplorerRequest {
  location: string;
  travelers: number;
  vibes: Vibe[];
  budget: Budget;
  tripType: TripType;
  isRoundTrip: boolean;
  startPoint?: string;
  language: string;
  currency: string;
  startDate: string;
}

export const searchWeekendPackages = async (
  request: WeekendExplorerRequest,
  userApiKey?: string
): Promise<WeekendPackage[]> => {
  const { apiKey, isUsingDefaultKey } = await CookieUtils.getApiKeyWithSource(userApiKey);
  
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Invalid API key: key is empty or whitespace only");
  }
  
  const cleanApiKey = apiKey.trim();
  const ai = new GoogleGenAI({ apiKey: cleanApiKey });

  const vibeText = request.vibes.join(', ');
  const startDateObj = new Date(request.startDate);
  const dayOfWeek = startDateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const tripTypeText = `Trip Type: ${request.tripType} (Round Trip - will return to starting point)`;
  
  const prompt = `You are an expert travel planner specializing in weekend getaways. Search for nearby outdoor weekend getaway destinations and packages from "${request.location}" (starting point) that can be covered in 3-4 days (including Saturday and Sunday).

**User Requirements:**
- Starting Point: ${request.location}
- ${tripTypeText}
- Number of Travelers: ${request.travelers}
- Preferred Vibes: ${vibeText}
- Budget Preference: ${request.budget}
- Start Date: ${request.startDate} (${dayOfWeek})
- Language: ${request.language}
- Currency: ${request.currency}

**Search Criteria:**
1. Find 6 or 9 weekend getaway destinations/packages (minimum 6, multiple of 3) that are:
   - Within reasonable driving distance (max 6-8 hours) from ${request.location} (starting point)
   - Suitable for 3-4 day trips (including Saturday and Sunday)
   - Outdoor-focused destinations (hill stations, beaches, nature reserves, adventure spots, etc.)
   - Perfect for weekend escapes

2. For each package, provide:
   - Destination name
   - Attractive title
   - Brief description (2-3 sentences)
   - Number of days (3-4 days)
   - Top 3-5 highlights/attractions
   - Estimated budget range in ${request.currency}
   - Best suited for (based on vibes: ${vibeText})
   - Approximate distance from ${request.location} (starting point)
   - Approximate travel time

3. Prioritize destinations that match the vibes: ${vibeText}
4. Consider the budget preference: ${request.budget} - ensure estimated budgets align with this preference
5. The destination should be different from the starting point (${request.location}) - suggest places to visit/explore for a weekend getaway.

**Response Format:**
Return a JSON array of packages. Each package must have:
{
  "id": "unique-id",
  "destination": "destination name",
  "title": "attractive package title",
  "description": "brief description",
  "days": 3-4,
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "estimatedBudget": "budget range in ${request.currency}",
  "bestFor": ["vibe1", "vibe2"],
  "distance": "approximate distance",
  "travelTime": "approximate travel time"
}

**CRITICAL RULES:**
- Return ONLY valid JSON array starting with '[' and ending with ']'
- NO markdown, NO code blocks, NO explanatory text
- Return a minimum of 6 packages, and a multiple of 3 (6 or 9 packages)
- All packages must be feasible for weekend trips (3-4 days)
- Use Google Search to find real, current information about weekend packages and destinations
- Ensure all destinations are outdoor gateways suitable for weekend trips
- Budget should be realistic and in ${request.currency}
- Distance and travel time should be accurate
- All destinations should be different from the starting point (${request.location})

Search for current weekend packages and popular weekend destinations near ${request.location} (starting point).`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    const fullText = response.text;
    
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

    // Ensure it's an array
    if (!Array.isArray(cleanedJson)) {
      throw new Error("Invalid response format: expected an array");
    }

    // Add unique IDs if missing and validate structure
    const packages: WeekendPackage[] = cleanedJson.map((pkg: any, index: number) => {
      // Ensure days is between 3-4, default to 3 if invalid
      let days = pkg.days || 3;
      if (days < 3) days = 3;
      if (days > 4) days = 4;
      
      return {
        id: pkg.id || `package-${index + 1}`,
        destination: pkg.destination || 'Unknown',
        title: pkg.title || pkg.destination || 'Weekend Package',
        description: pkg.description || '',
        days: days,
        highlights: Array.isArray(pkg.highlights) ? pkg.highlights : [],
        estimatedBudget: pkg.estimatedBudget || 'Not specified',
        bestFor: Array.isArray(pkg.bestFor) ? pkg.bestFor : [],
        distance: pkg.distance || 'Not specified',
        travelTime: pkg.travelTime || 'Not specified',
        imageUrl: pkg.imageUrl,
      };
    });

    // Ensure minimum 6 and multiple of 3 results (6 or 9 packages)
    // This ensures the grid layout looks balanced (3 columns)
    if (packages.length >= 6) {
      // If we have 6 or more, reduce to nearest multiple of 3 that is >= 6
      while (packages.length > 6 && packages.length % 3 !== 0) {
        packages.pop();
      }
      // Cap at 9 for optimal display
      if (packages.length > 9) {
        packages.splice(9);
      }
    } else {
      // If we have less than 6, ensure it's still a multiple of 3
      // (Ideally AI should return at least 6, but handle edge cases)
      while (packages.length > 0 && packages.length % 3 !== 0) {
        packages.pop();
      }
    }

    return packages;

  } catch (error: any) {
    console.error("Error searching for weekend packages:", error);
    
    const errorMessage = error?.message || '';
    const errorString = JSON.stringify(error || {});
    const nestedError = error?.error;
    const nestedErrorMessage = nestedError?.message || '';
    const nestedErrorCode = nestedError?.code;
    const nestedErrorStatus = nestedError?.status;
    
    const errorCode = nestedErrorCode || error?.code || (nestedErrorStatus === 'RESOURCE_EXHAUSTED' ? 429 : null);
    
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
        throw new Error('Your Gemini API key has reached its quota limit. Please set a new Gemini API key in your profile settings to continue.');
      }
    }
    
    throw error;
  }
};

