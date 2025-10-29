import { useCallback } from 'react';
import { historyService, SaveRecommendationRequest } from '../services/historyService';

interface UseSaveRecommendationReturn {
  saveRecommendation: (data: SaveRecommendationRequest) => Promise<void>;
  saveAppRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any, tripId?: string, tripName?: string) => Promise<void>;
  saveLingoRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any, tripId?: string, tripName?: string) => Promise<void>;
  saveMusicRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any, tripId?: string, tripName?: string) => Promise<void>;
  savePackingRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any, tripId?: string, tripName?: string) => Promise<void>;
  saveFoodRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any, tripId?: string, tripName?: string) => Promise<void>;
  saveItineraryRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any, tripId?: string, tripName?: string) => Promise<void>;
  saveUnifiedTripRecommendations: (recommendations: Array<{type: string, requestData: any, responseData: any}>, destination: string, language?: string, tripContext?: any, tripName?: string) => Promise<string>;
}

export const useSaveRecommendation = (): UseSaveRecommendationReturn => {
  const saveRecommendation = useCallback(async (data: SaveRecommendationRequest) => {
    try {
      await historyService.saveRecommendation(data);
    } catch (error) {
      console.error('Failed to save recommendation:', error);
      // Don't throw error to avoid breaking the user experience
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
  ) => {
    const title = historyService.generateDefaultTitle('apps', destination);
    
    await saveRecommendation({
      recommendationType: 'apps',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['apps', 'technology'],
      tripContext,
      tripId,
      tripName
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
  ) => {
    const title = historyService.generateDefaultTitle('lingo', destination);
    
    await saveRecommendation({
      recommendationType: 'lingo',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['lingo', 'language'],
      tripContext,
      tripId,
      tripName
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
  ) => {
    const title = historyService.generateDefaultTitle('music', destination);
    
    await saveRecommendation({
      recommendationType: 'music',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['music', 'entertainment'],
      tripContext,
      tripId,
      tripName
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
  ) => {
    const title = historyService.generateDefaultTitle('packing', destination);
    
    await saveRecommendation({
      recommendationType: 'packing',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['packing', 'travel'],
      tripContext,
      tripId,
      tripName
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
  ) => {
    const title = historyService.generateDefaultTitle('food', destination);
    
    await saveRecommendation({
      recommendationType: 'food',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['food', 'dining'],
      tripContext,
      tripId,
      tripName
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
  ) => {
    const title = historyService.generateDefaultTitle('itinerary', destination);
    
    await saveRecommendation({
      recommendationType: 'itinerary',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['itinerary', 'planning'],
      tripContext,
      tripId,
      tripName
    });
  }, [saveRecommendation]);

  const saveUnifiedTripRecommendations = useCallback(async (
    recommendations: Array<{type: string, requestData: any, responseData: any}>,
    destination: string,
    language: string = 'en',
    tripContext?: any,
    tripName?: string
  ): Promise<string> => {
    // Generate a proper UUID for trip ID
    const tripId = crypto.randomUUID();
    
    // Save each recommendation with the same trip ID
    for (const rec of recommendations) {
      const title = historyService.generateDefaultTitle(rec.type as any, destination);
      const tags = getTagsForType(rec.type);
      
      await saveRecommendation({
        recommendationType: rec.type as any,
        destination,
        language,
        requestData: rec.requestData,
        responseData: rec.responseData,
        title,
        tags,
        tripContext,
        tripId,
        tripName
      });
    }
    
    return tripId;
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