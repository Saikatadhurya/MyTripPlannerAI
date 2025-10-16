import { useCallback } from 'react';
import { historyService, SaveRecommendationRequest } from '../services/historyService';

interface UseSaveRecommendationReturn {
  saveRecommendation: (data: SaveRecommendationRequest) => Promise<void>;
  saveAppRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any) => Promise<void>;
  saveLingoRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any) => Promise<void>;
  saveMusicRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any) => Promise<void>;
  savePackingRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any) => Promise<void>;
  saveFoodRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any) => Promise<void>;
  saveItineraryRecommendation: (requestData: any, responseData: any, destination: string, language?: string, tripContext?: any) => Promise<void>;
}

export const useSaveRecommendation = (): UseSaveRecommendationReturn => {
  const saveRecommendation = useCallback(async (data: SaveRecommendationRequest) => {
    try {
      console.log('Attempting to save recommendation:', data);
      await historyService.saveRecommendation(data);
      console.log('Successfully saved recommendation');
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
    tripContext?: any
  ) => {
    console.log('saveAppRecommendation called with:', { requestData, responseData, destination, language, tripContext });
    const title = historyService.generateDefaultTitle('apps', destination);
    
    await saveRecommendation({
      recommendationType: 'apps',
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['apps', 'technology'],
      tripContext
    });
  }, [saveRecommendation]);

  const saveLingoRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en',
    tripContext?: any
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
      tripContext
    });
  }, [saveRecommendation]);

  const saveMusicRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en',
    tripContext?: any
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
      tripContext
    });
  }, [saveRecommendation]);

  const savePackingRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en',
    tripContext?: any
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
      tripContext
    });
  }, [saveRecommendation]);

  const saveFoodRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en',
    tripContext?: any
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
      tripContext
    });
  }, [saveRecommendation]);

  const saveItineraryRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en',
    tripContext?: any
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
      tripContext
    });
  }, [saveRecommendation]);

  return {
    saveRecommendation,
    saveAppRecommendation,
    saveLingoRecommendation,
    saveMusicRecommendation,
    savePackingRecommendation,
    saveFoodRecommendation,
    saveItineraryRecommendation
  };
};