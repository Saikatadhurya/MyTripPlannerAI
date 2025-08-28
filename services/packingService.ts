import { GoogleGenAI, Type } from "@google/genai";
import { PackingList, PackingListRequestData } from '../types';

export const generatePackingList = async (data: PackingListRequestData): Promise<PackingList> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const { destination, startDate, days } = data;

  const prompt = `
    Based on a ${days}-day trip to ${destination} starting around ${startDate}, generate a smart, weather-aware packing list.
    Consider the typical climate and weather for that location and time of year.
    Provide practical advice. For clothing, suggest layers if the weather is variable.
    The response MUST be a single, valid JSON object that strictly follows this structure and types, with each category containing an array of strings:
    {
      "clothingAndFootwear": string[],
      "toiletriesAndPersonalCare": string[],
      "medicinesAndHealth": string[],
      "electronicsAndGear": string[],
      "documentsAndMoney": string[],
      "optionalComfortItems": string[],
      "bagSuggestion": string,
      "locallyAvailableItems": string[]
    }

    Important Rules:
    1. The items in each list should be concise and practical.
    2. The 'bagSuggestion' should recommend a type and size of bag (e.g., "A 40L backpack" or "A medium-sized suitcase").
    3. The 'locallyAvailableItems' list should include things the user might not need to pack because they are easy and cheap to buy at the destination (e.g., "Basic toiletries like shampoo and soap", "Sunscreen").
    4. You MUST use bold markdown (**text**) to highlight key items or advice within the string arrays.
    5. CRITICAL JSON VALIDATION RULE: Ensure the output is a perfectly valid JSON object. Do not use unescaped double quotes inside string values; use single quotes or escaped double quotes (\\").
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      clothingAndFootwear: { type: Type.ARRAY, items: { type: Type.STRING } },
      toiletriesAndPersonalCare: { type: Type.ARRAY, items: { type: Type.STRING } },
      medicinesAndHealth: { type: Type.ARRAY, items: { type: Type.STRING } },
      electronicsAndGear: { type: Type.ARRAY, items: { type: Type.STRING } },
      documentsAndMoney: { type: Type.ARRAY, items: { type: Type.STRING } },
      optionalComfortItems: { type: Type.ARRAY, items: { type: Type.STRING } },
      bagSuggestion: { type: Type.STRING },
      locallyAvailableItems: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["clothingAndFootwear", "toiletriesAndPersonalCare", "medicinesAndHealth", "electronicsAndGear", "documentsAndMoney", "optionalComfortItems", "bagSuggestion", "locallyAvailableItems"],
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
  const packingData = JSON.parse(resultText);

  return {
    ...packingData,
    destination,
    days,
  };
};
