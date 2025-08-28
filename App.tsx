import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Itinerary, Vibe, QuestionnaireData, PackingListRequestData, PackingList } from './types';
import { generateItinerary } from './services/geminiService';
import { generatePackingList } from './services/packingService';

import LandingPage from './components/LandingPage';
import Questionnaire from './components/Questionnaire';
import ItineraryPreview from './components/ItineraryPreview';
import PackingAssistantForm from './components/PackingAssistantForm';
import PackingListPreview from './components/PackingListPreview';

type View = 'landing' | 'questionnaire' | 'itinerary' | 'packingAssistantForm' | 'packingAssistantResult';

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<QuestionnaireData | null>(null);
  const isGenerationCancelled = useRef(false);

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
        setError(err instanceof Error ? err.message : 'Failed to generate itinerary. Please try again.');
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
    setIsLoading(true);
    setError(null);
    try {
        const generatedList = await generatePackingList(data);
        setPackingList(generatedList);
        setView('packingAssistantResult');
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate packing list. Please try again.');
        setView('packingAssistantForm');
    } finally {
        setIsLoading(false);
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

  const handleBackToHome = useCallback(() => {
    setView('landing');
    setItinerary(null);
    setPackingList(null);
    setFormData(null);
    setError(null);
  }, []);

  const renderContent = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onPlanTrip={handleStartPlanning} onStartPacking={handleStartPacking} />;
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
        return <PackingAssistantForm onSubmit={handleGeneratePackingList} onBack={handleBackToHome} isLoading={isLoading} error={error} />;
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
      default:
        return <LandingPage onPlanTrip={handleStartPlanning} onStartPacking={handleStartPacking} />;
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
