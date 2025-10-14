import { useCallback } from 'react';
import { historyService, SaveAppRecommendationRequest } from '../services/historyService';

interface UseSaveRecommendationReturn {
  saveRecommendation: (data: SaveAppRecommendationRequest) => Promise<void>;
  saveAppRecommendation: (requestData: any, responseData: any, destination: string, language?: string) => Promise<void>;
  saveLingoRecommendation: (requestData: any, responseData: any, destination: string, language?: string) => Promise<void>;
  saveMusicRecommendation: (requestData: any, responseData: any, destination: string, language?: string) => Promise<void>;
  savePackingRecommendation: (requestData: any, responseData: any, destination: string, language?: string) => Promise<void>;
  saveFoodRecommendation: (requestData: any, responseData: any, destination: string, language?: string) => Promise<void>;
  saveItineraryRecommendation: (requestData: any, responseData: any, destination: string, language?: string) => Promise<void>;
}

export const useSaveRecommendation = (): UseSaveRecommendationReturn => {
  const saveRecommendation = useCallback(async (data: SaveAppRecommendationRequest) => {
    try {
      await historyService.saveAppRecommendation(data);
    } catch (error) {
      console.error('Failed to save recommendation:', error);
      // Don't throw error to avoid breaking the user experience
    }
  }, []);

  const saveAppRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en'
  ) => {
    const type = historyService.getRecommendationType(responseData);
    const title = historyService.generateDefaultTitle(type, destination);
    
    await saveRecommendation({
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: [type]
    });
  }, [saveRecommendation]);

  const saveLingoRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en'
  ) => {
    const title = historyService.generateDefaultTitle('lingo', destination);
    
    await saveRecommendation({
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['lingo', 'language']
    });
  }, [saveRecommendation]);

  const saveMusicRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en'
  ) => {
    const title = historyService.generateDefaultTitle('music', destination);
    
    await saveRecommendation({
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['music', 'entertainment']
    });
  }, [saveRecommendation]);

  const savePackingRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en'
  ) => {
    const title = historyService.generateDefaultTitle('packing', destination);
    
    await saveRecommendation({
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['packing', 'travel']
    });
  }, [saveRecommendation]);

  const saveFoodRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en'
  ) => {
    const title = historyService.generateDefaultTitle('food', destination);
    
    await saveRecommendation({
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['food', 'dining']
    });
  }, [saveRecommendation]);

  const saveItineraryRecommendation = useCallback(async (
    requestData: any,
    responseData: any,
    destination: string,
    language: string = 'en'
  ) => {
    const title = historyService.generateDefaultTitle('itinerary', destination);
    
    await saveRecommendation({
      destination,
      language,
      requestData,
      responseData,
      title,
      tags: ['itinerary', 'planning']
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
