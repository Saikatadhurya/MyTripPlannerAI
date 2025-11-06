import { useCallback } from 'react';
import { historyService, SaveRecommendationRequest } from '../services/historyService';

interface UseSaveRecommendationReturn {
  saveRecommendation: (data: SaveRecommendationRequest) => Promise<string | null>;
  saveAppRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any, tripId?: string, tripName?: string) => Promise<string | null>;
  saveLingoRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any, tripId?: string, tripName?: string) => Promise<string | null>;
  saveMusicRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any, tripId?: string, tripName?: string) => Promise<string | null>;
  savePackingRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any, tripId?: string, tripName?: string) => Promise<string | null>;
  saveFoodRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any, tripId?: string, tripName?: string) => Promise<string | null>;
  saveItineraryRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any, tripId?: string, tripName?: string) => Promise<string | null>;
  saveUnifiedTripRecommendations: (recommendations: Array<{type: string, requestData: any, responseData: any}>, destination: string, language?: string, tripContext?: any, tripName?: string) => Promise<{ tripId: string; successfulTypes: string[] }>;
}

export const useSaveRecommendation = (): UseSaveRecommendationReturn => {
  const saveRecommendation = useCallback(async (data: SaveRecommendationRequest): Promise<string | null> => {
    try {
      const result = await historyService.saveRecommendation(data);
      return result?.id || null;
    } catch (error) {
      console.error('Failed to save recommendation:', error);
      // Don't throw error to avoid breaking the user experience
      return null;
    }
  }, []);

  const saveAppRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en',
    tripContext?: any,
    tripId?: string,
    tripName?: string
  ): Promise<string | null> => {
    const title = historyService.generateDefaultTitle('apps', destination);
    // Extract prompt from responseData if it was attached
    const prompt = (responseData as any)?.__prompt;
    
    return await saveRecommendation({
      recommendationType: 'apps',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['apps', 'technology'],
      tripContext,
      tripId,
      tripName,
      prompt
    });
  }, [saveRecommendation]);

  const saveLingoRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en',
    tripContext?: any,
    tripId?: string,
    tripName?: string
  ): Promise<string | null> => {
    const title = historyService.generateDefaultTitle('lingo', destination);
    // Extract prompt from responseData if it was attached
    const prompt = (responseData as any)?.__prompt;
    
    return await saveRecommendation({
      recommendationType: 'lingo',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['lingo', 'language'],
      tripContext,
      tripId,
      tripName,
      prompt
    });
  }, [saveRecommendation]);

  const saveMusicRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en',
    tripContext?: any,
    tripId?: string,
    tripName?: string
  ): Promise<string | null> => {
    const title = historyService.generateDefaultTitle('music', destination);
    // Extract prompt from responseData if it was attached
    const prompt = (responseData as any)?.__prompt;
    
    return await saveRecommendation({
      recommendationType: 'music',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['music', 'entertainment'],
      tripContext,
      tripId,
      tripName,
      prompt
    });
  }, [saveRecommendation]);

  const savePackingRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en',
    tripContext?: any,
    tripId?: string,
    tripName?: string
  ): Promise<string | null> => {
    const title = historyService.generateDefaultTitle('packing', destination);
    // Extract prompt from responseData if it was attached
    const prompt = (responseData as any)?.__prompt;
    
    return await saveRecommendation({
      recommendationType: 'packing',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['packing', 'travel'],
      tripContext,
      tripId,
      tripName,
      prompt
    });
  }, [saveRecommendation]);

  const saveFoodRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en',
    tripContext?: any,
    tripId?: string,
    tripName?: string
  ): Promise<string | null> => {
    const title = historyService.generateDefaultTitle('food', destination);
    // Extract prompt from responseData if it was attached
    const prompt = (responseData as any)?.__prompt;
    
    return await saveRecommendation({
      recommendationType: 'food',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['food', 'dining'],
      tripContext,
      tripId,
      tripName,
      prompt
    });
  }, [saveRecommendation]);

  const saveItineraryRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en',
    tripContext?: any,
    tripId?: string,
    tripName?: string
  ): Promise<string | null> => {
    const title = historyService.generateDefaultTitle('itinerary', destination);
    // Extract prompt from responseData if it was attached
    const prompt = (responseData as any)?.__prompt;
    
    return await saveRecommendation({
      recommendationType: 'itinerary',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['itinerary', 'planning'],
      tripContext,
      tripId,
      tripName,
      prompt
    });
  }, [saveRecommendation]);

  const saveUnifiedTripRecommendations = useCallback(async (
    recommendations: Array<{type: string, requestData: any, responseData: any}>,
    destination: string,
    language: string = 'en',
    tripContext?: any,
    tripName?: string
  ): Promise<{ tripId: string; successfulTypes: string[] }> => {
    // Generate a proper UUID for trip ID
    const tripId = crypto.randomUUID();
    
    // Save each recommendation with the same trip ID
    // Handle errors per item so one failure doesn't stop others
    const savePromises = recommendations.map(async (rec) => {
      try {
        const title = historyService.generateDefaultTitle(rec.type as any, destination);
        const tags = getTagsForType(rec.type);
        // Extract prompt from responseData if it was attached
        const prompt = (rec.responseData as any)?.__prompt;
        
        const result = await saveRecommendation({
          recommendationType: rec.type as any,
          destination,
          language,
          requestData: rec.requestData,
          responseData: rec.responseData,
          title,
          tags,
          tripContext,
          tripId,
          tripName,
          prompt
        });
        
        return { type: rec.type, success: !!result, id: result };
      } catch (error) {
        console.error(`Failed to save ${rec.type} recommendation:`, error);
        return { type: rec.type, success: false, id: null, error };
      }
    });
    
    // Wait for all saves to complete (or fail)
    const results = await Promise.all(savePromises);
    
    // Log any failures
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      console.error(`Failed to save ${failures.length} out of ${recommendations.length} recommendations:`, failures);
    }
    
    // Return tripId and list of successfully saved types
    const successfulTypes = results.filter(r => r.success).map(r => r.type);
    
    return { tripId, successfulTypes };
  }, [saveRecommendation]);

  const getTagsForType = (type: string): string[] => {
    const tagMap: {[key: string]: string[]} = {
      'apps': ['apps', 'technology'],
      'food': ['food', 'dining'],
      'music': ['music', 'entertainment'],
      'lingo': ['lingo', 'language'],
      'packing': ['packing', 'travel'],
      'itinerary': ['itinerary', 'planning']
    };
    return tagMap[type] || ['recommendation'];
  };

  return {
    saveRecommendation,
    saveAppRecommendation,
    saveLingoRecommendation,
    saveMusicRecommendation,
    savePackingRecommendation,
    saveFoodRecommendation,
    saveItineraryRecommendation,
    saveUnifiedTripRecommendations
  };
};