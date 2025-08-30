import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Itinerary, Vibe, QuestionnaireData, PackingListRequestData, PackingList, FoodFinderRequestData, FoodRecommendations, AppFinderRequestData, AppRecommendations } from './types';
import { generateItinerary } from './services/geminiService';
import { generatePackingList } from './services/packingService';
import { generateFoodRecommendations } from './services/foodService';
import { generateAppRecommendations, prefetchAppRecommendationsForPopularDestinations } from './services/appFinderService';


import LandingPage from './components/LandingPage';
import Questionnaire from './components/Questionnaire';
import ItineraryPreview from './components/ItineraryPreview';
import PackingAssistantForm from './components/PackingAssistantForm';
import PackingListPreview from './components/PackingListPreview';
import FoodFinderForm from './components/FoodFinderForm';
import FoodFinderResult from './components/FoodFinderResult';
import AppFinderForm from './components/AppFinderForm';
import AppFinderResult from './components/AppFinderResult';


type View = 'landing' | 'questionnaire' | 'itinerary' | 'packingAssistantForm' | 'packingAssistantResult' | 'foodFinderForm' | 'foodFinderResult' | 'appFinderForm' | 'appFinderResult';

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [foodRecommendations, setFoodRecommendations] = useState<FoodRecommendations | null>(null);
  const [appRecommendations, setAppRecommendations] = useState<AppRecommendations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<QuestionnaireData | null>(null);
  const isGenerationCancelled = useRef(false);

  useEffect(() => {
    // Intelligently pre-fetch app recommendations for popular destinations
    // when the app loads, improving perceived speed for common user journeys.
    prefetchAppRecommendationsForPopularDestinations();
  }, []); // Empty dependency array ensures it runs only on initial mount.

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const handleStartPlanning = useCallback((destination?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const defaultVibes: Vibe[] = ['Adventure & Thrill'];
    setFormData(destination ? { destination, startPoint: '', tripType: 'Standard', days: 3, budget: 'Midrange', vibe: defaultVibes, persons: 1, foodPreference: 'Non-Veg', startDate: today, includeMedical: false, language: 'English (en)', currency: 'India (INR) – ₹', isRoundTrip: false } : null);
    setView('questionnaire');
  }, []);
  
  const handleStartPacking = useCallback(() => {
    setView('packingAssistantForm');
  }, []);

  const handleStartFoodFinder = useCallback(() => {
    setView('foodFinderForm');
  }, []);

  const handleStartAppFinder = useCallback(() => {
    setView('appFinderForm');
  }, []);

  const handleGenerateItinerary = useCallback(async (data: QuestionnaireData) => {
    isGenerationCancelled.current = false;
    setIsLoading(true);
    setError(null);
    setFormData(data);
    try {
      const generatedItinerary = await generateItinerary(data.destination, data.startPoint, data.tripType, data.days, data.budget, data.vibe, data.persons, data.foodPreference, data.startDate, data.includeMedical, data.language, data.isRoundTrip, data.currency);
      if (!isGenerationCancelled.current) {
        setItinerary(generatedItinerary);
        setView('itinerary');
      }
    } catch (err) {
      if (!isGenerationCancelled.current) {
        let errorMessage = 'Failed to generate itinerary. Please try again.';
        if (err instanceof Error) {
            if (err.message.includes('503') || err.message.toLowerCase().includes('overloaded')) {
                errorMessage = 'The AI model is currently busy handling many requests. Please wait a moment and try again.';
            } else {
                errorMessage = err.message;
            }
        }
        setError(errorMessage);
        setView('questionnaire'); // Stay on questionnaire to show the error
      }
    } finally {
      // Only set loading to false if it wasn't already set by the cancel handler
      if (!isGenerationCancelled.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleGeneratePackingList = useCallback(async (data: PackingListRequestData) => {
    isGenerationCancelled.current = false;
    setIsLoading(true);
    setError(null);
    try {
        const generatedList = await generatePackingList(data);
        if (!isGenerationCancelled.current) {
            setPackingList(generatedList);
            setView('packingAssistantResult');
        }
    } catch (err) {
      if (!isGenerationCancelled.current) {
        let errorMessage = 'Failed to generate packing list. Please try again.';
        if (err instanceof Error) {
            if (err.message.includes('503') || err.message.toLowerCase().includes('overloaded')) {
                errorMessage = 'The AI model is currently busy handling many requests. Please wait a moment and try again.';
            } else {
                errorMessage = err.message;
            }
        }
        setError(errorMessage);
        setView('packingAssistantForm');
      }
    } finally {
        if (!isGenerationCancelled.current) {
            setIsLoading(false);
        }
    }
  }, []);

  const handleGenerateFoodRecommendations = useCallback(async (data: FoodFinderRequestData) => {
    isGenerationCancelled.current = false;
    setIsLoading(true);
    setError(null);
    try {
      const recommendations = await generateFoodRecommendations(data);
      if (!isGenerationCancelled.current) {
        setFoodRecommendations(recommendations);
        setView('foodFinderResult');
      }
    } catch (err) {
      if (!isGenerationCancelled.current) {
        let errorMessage = 'Failed to generate food recommendations. Please try again.';
        if (err instanceof Error) {
            if (err.message.includes('503') || err.message.toLowerCase().includes('overloaded')) {
                errorMessage = 'The AI model is currently busy handling many requests. Please wait a moment and try again.';
            } else {
                errorMessage = err.message;
            }
        }
        setError(errorMessage);
        setView('foodFinderForm');
      }
    } finally {
      if (!isGenerationCancelled.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleGenerateAppRecommendations = useCallback(async (data: AppFinderRequestData) => {
    isGenerationCancelled.current = false;
    setIsLoading(true);
    setError(null);
    try {
      const recommendations = await generateAppRecommendations(data);
      if (!isGenerationCancelled.current) {
        setAppRecommendations(recommendations);
        setView('appFinderResult');
      }
    } catch (err) {
      if (!isGenerationCancelled.current) {
        let errorMessage = 'Failed to generate app recommendations. Please try again.';
        if (err instanceof Error) {
            if (err.message.includes('503') || err.message.toLowerCase().includes('overloaded')) {
                errorMessage = 'The AI model is currently busy handling many requests. Please wait a moment and try again.';
            } else {
                errorMessage = err.message;
            }
        }
        setError(errorMessage);
        setView('appFinderForm');
      }
    } finally {
      if (!isGenerationCancelled.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleCancelGeneration = useCallback(() => {
    isGenerationCancelled.current = true;
    setIsLoading(false);
  }, []);

  const handleBackToQuestionnaire = useCallback(() => {
    setView('questionnaire');
  }, []);
  
  const handleBackToPackingForm = useCallback(() => {
    setPackingList(null);
    setView('packingAssistantForm');
  }, []);

  const handleBackToFoodForm = useCallback(() => {
    setFoodRecommendations(null);
    setView('foodFinderForm');
  }, []);

  const handleBackToAppForm = useCallback(() => {
    setAppRecommendations(null);
    setView('appFinderForm');
  }, []);

  const handleBackToHome = useCallback(() => {
    setView('landing');
    setItinerary(null);
    setPackingList(null);
    setFoodRecommendations(null);
    setAppRecommendations(null);
    setFormData(null);
    setError(null);
  }, []);

  const renderContent = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onPlanTrip={handleStartPlanning} onStartPacking={handleStartPacking} onStartFoodFinder={handleStartFoodFinder} onStartAppFinder={handleStartAppFinder} />;
      case 'questionnaire':
        return (
          <Questionnaire
            onSubmit={handleGenerateItinerary}
            isLoading={isLoading}
            error={error}
            initialData={formData}
            onBack={handleBackToHome}
            onCancel={handleCancelGeneration}
          />
        );
      case 'itinerary':
        return itinerary ? (
          <ItineraryPreview itinerary={itinerary} onRegenerate={handleBackToQuestionnaire} />
        ) : (
          <div className="text-center p-8">
            <p>Something went wrong. Itinerary data is missing.</p>
            <button
              onClick={handleBackToQuestionnaire}
              className="mt-4 px-6 py-2 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      case 'packingAssistantForm':
        return <PackingAssistantForm onSubmit={handleGeneratePackingList} onBack={handleBackToHome} isLoading={isLoading} error={error} onCancel={handleCancelGeneration} />;
      case 'packingAssistantResult':
        return packingList ? (
          <PackingListPreview packingList={packingList} onRegenerate={handleBackToPackingForm} />
        ) : (
          <div className="text-center p-8">
            <p>Something went wrong. Packing list data is missing.</p>
            <button
              onClick={handleBackToPackingForm}
              className="mt-4 px-6 py-2 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      case 'foodFinderForm':
        return <FoodFinderForm onSubmit={handleGenerateFoodRecommendations} onBack={handleBackToHome} isLoading={isLoading} error={error} onCancel={handleCancelGeneration} />;
      case 'foodFinderResult':
        return foodRecommendations ? (
          <FoodFinderResult recommendations={foodRecommendations} onRegenerate={handleBackToFoodForm} />
        ) : (
           <div className="text-center p-8">
            <p>Something went wrong. Food recommendations are missing.</p>
            <button
              onClick={handleBackToFoodForm}
              className="mt-4 px-6 py-2 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      case 'appFinderForm':
        return <AppFinderForm onSubmit={handleGenerateAppRecommendations} onBack={handleBackToHome} isLoading={isLoading} error={error} onCancel={handleCancelGeneration} />;
      case 'appFinderResult':
        return appRecommendations ? (
          <AppFinderResult recommendations={appRecommendations} onRegenerate={handleBackToAppForm} />
        ) : (
           <div className="text-center p-8">
            <p>Something went wrong. App recommendations are missing.</p>
            <button
              onClick={handleBackToAppForm}
              className="mt-4 px-6 py-2 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      default:
        return <LandingPage onPlanTrip={handleStartPlanning} onStartPacking={handleStartPacking} onStartFoodFinder={handleStartFoodFinder} onStartAppFinder={handleStartAppFinder} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
