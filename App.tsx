


import React, { useState, useCallback, useEffect, useRef } from 'react';
import { QuestionnaireData, PackingListRequestData, PackingList, FoodFinderRequestData, FoodRecommendations, AppFinderRequestData, AppRecommendations, MusicFinderRequestData, MusicRecommendations, QuestionnaireData as InitialQuestionnaireData, UnifiedPlan, UnifiedPlanLoadingStatus, Itinerary } from './types';
import { generateItinerary } from './services/geminiService';
import { generatePackingList } from './services/packingService';
import { generateFoodRecommendations } from './services/foodService';
import { generateAppRecommendations } from './services/appFinderService';
import { generateMusicRecommendations } from './services/musicService';


import LandingPage from './components/LandingPage';
import Questionnaire from './components/Questionnaire';
import PackingAssistantForm from './components/PackingAssistantForm';
import PackingListPreview from './components/PackingListPreview';
import FoodFinderForm from './components/FoodFinderForm';
import FoodFinderResult from './components/FoodFinderResult';
import AppFinderForm from './components/AppFinderForm';
import AppFinderResult from './components/AppFinderResult';
import MusicFinderForm from './components/MusicFinderForm';
import MusicFinderResult from './components/MusicFinderResult';
import ScrollToTopButton from './components/ScrollToTopButton';
import ContactUs from './components/ContactUs';
import Header from './components/Header';
import QuickNavButton from './components/QuickNavButton';
import UnifiedResultPreview from './components/UnifiedResultPreview';
import UnifiedPlannerForm from './components/UnifiedPlannerForm';
import ItineraryPreview from './components/ItineraryPreview';


type View = 'landing' | 'questionnaire' | 'itineraryResult' | 'packingAssistantForm' | 'packingAssistantResult' | 'foodFinderForm' | 'foodFinderResult' | 'appFinderForm' | 'appFinderResult' | 'musicFinderForm' | 'musicFinderResult' | 'contact' | 'unifiedPlannerForm' | 'unifiedResult';

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  
  // State for individual mini-apps
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [foodRecommendations, setFoodRecommendations] = useState<FoodRecommendations | null>(null);
  const [appRecommendations, setAppRecommendations] = useState<AppRecommendations | null>(null);
  const [musicRecommendations, setMusicRecommendations] = useState<MusicRecommendations | null>(null);
  
  // State for the new unified plan
  const [unifiedPlan, setUnifiedPlan] = useState<UnifiedPlan>({ itinerary: null, packingList: null, foodRecommendations: null, appRecommendations: null, musicRecommendations: null });
  const [unifiedPlanLoadingStatus, setUnifiedPlanLoadingStatus] = useState<UnifiedPlanLoadingStatus>({ itinerary: 'pending', packing: 'pending', food: 'pending', apps: 'pending', music: 'pending' });
  const [questionnaireDataForUnifiedPlan, setQuestionnaireDataForUnifiedPlan] = useState<QuestionnaireData | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const [unifiedStreamedText, setUnifiedStreamedText] = useState('');
  const [initialQuestionnaireData, setInitialQuestionnaireData] = useState<InitialQuestionnaireData | null>(null);
  
  const mainContentRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    mainContentRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setError(null);
    setStreamedText('');
    setView(newView);
    scrollToTop();
  }, [scrollToTop]);

  const createInitialData = (destination?: string) => {
    const data: QuestionnaireData = {
        destination: '',
        startPoint: '',
        tripType: 'Standard',
        days: 3,
        budget: 'Midrange',
        vibe: ['Adventure & Thrill'],
        persons: 1,
        foodPreference: 'Non-Veg',
        startDate: new Date().toISOString().split('T')[0],
        includeMedical: false,
        language: 'English (en)',
        currency: 'India (INR) – ₹',
        isRoundTrip: false,
        includeAlcoholicDrinks: false,
    };
    if (destination) {
      data.destination = destination;
    }
    return data;
  }

  const handleStartUnifiedPlanner = useCallback((destination?: string) => {
    setInitialQuestionnaireData(createInitialData(destination));
    handleViewChange('unifiedPlannerForm');
  }, [handleViewChange]);
  
  const handleStartItineraryPlanner = useCallback(() => {
    setInitialQuestionnaireData(createInitialData());
    handleViewChange('questionnaire');
  }, [handleViewChange]);


  const handleBackToHome = useCallback(() => {
    setItinerary(null);
    setPackingList(null);
    setFoodRecommendations(null);
    setAppRecommendations(null);
    setMusicRecommendations(null);
    setInitialQuestionnaireData(null);
    setUnifiedPlan({ itinerary: null, packingList: null, foodRecommendations: null, appRecommendations: null, musicRecommendations: null });
    setQuestionnaireDataForUnifiedPlan(null);
    handleViewChange('landing');
  }, [handleViewChange]);
  
  const handleCancelGeneration = useCallback(() => {
    setIsLoading(false);
    setError("Generation was cancelled.");
    
    const formViews: Partial<Record<View, View>> = {
      'itineraryResult': 'questionnaire',
      'packingAssistantResult': 'packingAssistantForm',
      'foodFinderResult': 'foodFinderForm',
      'appFinderResult': 'appFinderForm',
      'musicFinderResult': 'musicFinderForm',
      'unifiedResult': 'unifiedPlannerForm',
    };
    
    const targetView = formViews[view] || 'landing';
    handleViewChange(targetView as View);

  }, [view, handleViewChange]);

  const handleGenerateItinerary = useCallback(async (data: QuestionnaireData) => {
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    setStreamedText('');
    handleViewChange('itineraryResult');
    try {
        const result = await generateItinerary(
            data.destination, data.startPoint, data.tripType, data.days, data.budget, data.vibe, data.persons, data.foodPreference, data.startDate, data.includeMedical, data.language, data.isRoundTrip, data.currency,
            (chunk) => setStreamedText(prev => prev + chunk)
        );
        setItinerary(result);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
        handleViewChange('questionnaire');
    } finally {
        setIsLoading(false);
    }
  }, [handleViewChange]);
  
  const handleGenerateUnifiedPlan = useCallback(async (data: QuestionnaireData) => {
    setQuestionnaireDataForUnifiedPlan(data);
    setUnifiedPlan({ itinerary: null, packingList: null, foodRecommendations: null, appRecommendations: null, musicRecommendations: null });
    setError(null); // Reset errors at the start
    setUnifiedPlanLoadingStatus({ itinerary: 'pending', packing: 'pending', food: 'pending', apps: 'pending', music: 'pending' });
    handleViewChange('unifiedResult');

    const streamCallback = (chunk: string) => setUnifiedStreamedText(prev => prev + chunk);

    // Helper to run each generation step sequentially and handle errors independently
    const generateStep = async <T,>(
      step: keyof UnifiedPlanLoadingStatus,
      generatorFn: () => Promise<T>,
      onSuccess: (result: T) => void
    ) => {
      setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'loading' }));
      setUnifiedStreamedText('');
      try {
        const result = await generatorFn();
        onSuccess(result);
        setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'done' }));
      } catch (e) {
        const message = e instanceof Error ? e.message : `An unknown error occurred during ${step} generation.`;
        // Append new error messages instead of overwriting
        setError(prevError => prevError ? `${prevError}\n\n${message}` : message);
        setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'error' }));
      }
    };
    
    // Itinerary
    await generateStep('itinerary',
      () => generateItinerary(data.destination, data.startPoint, data.tripType, data.days, data.budget, data.vibe, data.persons, data.foodPreference, data.startDate, data.includeMedical, data.language, data.isRoundTrip, data.currency, streamCallback),
      (result) => setUnifiedPlan(prev => ({ ...prev, itinerary: result }))
    );

    // Packing List
    const packingData: PackingListRequestData = { destination: data.destination, startDate: data.startDate, days: data.days, language: data.language };
    await generateStep('packing',
      () => generatePackingList(packingData, streamCallback),
      (result) => setUnifiedPlan(prev => ({ ...prev, packingList: result }))
    );
    
    // Food Recommendations
    const foodData: FoodFinderRequestData = { destination: data.destination, startDate: data.startDate, foodPreference: data.foodPreference, includeAlcoholicDrinks: data.includeAlcoholicDrinks, language: data.language };
    await generateStep('food',
      () => generateFoodRecommendations(foodData, streamCallback),
      (result) => setUnifiedPlan(prev => ({ ...prev, foodRecommendations: result }))
    );

    // App Recommendations
    const appData: AppFinderRequestData = { destination: data.destination, language: data.language };
    await generateStep('apps',
      () => generateAppRecommendations(appData, streamCallback),
      (result) => setUnifiedPlan(prev => ({ ...prev, appRecommendations: result }))
    );

    // Music Recommendations
    const musicData: MusicFinderRequestData = { destination: data.destination, language: data.language };
    await generateStep('music',
      () => generateMusicRecommendations(musicData, streamCallback),
      (result) => setUnifiedPlan(prev => ({ ...prev, musicRecommendations: result }))
    );
  }, [handleViewChange]);


  const handleGeneratePackingList = useCallback(async (data: PackingListRequestData) => {
    setIsLoading(true);
    setError(null);
    setPackingList(null);
    handleViewChange('packingAssistantResult');
    try {
        const result = await generatePackingList(data, (chunk) => setStreamedText(prev => prev + chunk));
        setPackingList(result);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
        handleViewChange('packingAssistantForm');
    } finally {
        setIsLoading(false);
    }
  }, [handleViewChange]);

  const handleGenerateFoodRecommendations = useCallback(async (data: FoodFinderRequestData) => {
    setIsLoading(true);
    setError(null);
    setFoodRecommendations(null);
    handleViewChange('foodFinderResult');
    try {
        const result = await generateFoodRecommendations(data, (chunk) => setStreamedText(prev => prev + chunk));
        setFoodRecommendations(result);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
        handleViewChange('foodFinderForm');
    } finally {
        setIsLoading(false);
    }
  }, [handleViewChange]);
  
  const handleGenerateAppRecommendations = useCallback(async (data: AppFinderRequestData) => {
    setIsLoading(true);
    setError(null);
    setAppRecommendations(null);
    handleViewChange('appFinderResult');
    try {
        const result = await generateAppRecommendations(data, (chunk) => setStreamedText(prev => prev + chunk));
        setAppRecommendations(result);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
        handleViewChange('appFinderForm');
    } finally {
        setIsLoading(false);
    }
  }, [handleViewChange]);
  
  const handleGenerateMusicRecommendations = useCallback(async (data: MusicFinderRequestData) => {
    setIsLoading(true);
    setError(null);
    setMusicRecommendations(null);
    handleViewChange('musicFinderResult');
    try {
        const result = await generateMusicRecommendations(data, (chunk) => setStreamedText(prev => prev + chunk));
        setMusicRecommendations(result);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
        handleViewChange('musicFinderForm');
    } finally {
        setIsLoading(false);
    }
  }, [handleViewChange]);

  const renderContent = () => {
    if (isLoading) {
      switch (view) {
        case 'itineraryResult':
          return <Questionnaire onSubmit={handleGenerateItinerary} isLoading={true} error={null} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} initialData={initialQuestionnaireData} />;
        case 'packingAssistantResult':
          return <PackingAssistantForm onSubmit={handleGeneratePackingList} isLoading={true} error={null} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} />;
        case 'foodFinderResult':
          return <FoodFinderForm onSubmit={handleGenerateFoodRecommendations} isLoading={true} error={null} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} />;
        case 'appFinderResult':
          return <AppFinderForm onSubmit={handleGenerateAppRecommendations} isLoading={true} error={null} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} />;
        case 'musicFinderResult':
          return <MusicFinderForm onSubmit={handleGenerateMusicRecommendations} isLoading={true} error={null} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} />;
        default:
          return null;
      }
    }

    switch (view) {
      case 'landing':
        return <LandingPage onPlanUnifiedTrip={handleStartUnifiedPlanner} onPlanItinerary={handleStartItineraryPlanner} onStartPacking={() => handleViewChange('packingAssistantForm')} onStartFoodFinder={() => handleViewChange('foodFinderForm')} onStartAppFinder={() => handleViewChange('appFinderForm')} onStartMusicFinder={() => handleViewChange('musicFinderForm')} />;
      case 'unifiedPlannerForm':
        return <UnifiedPlannerForm onSubmit={handleGenerateUnifiedPlan} initialData={initialQuestionnaireData} onBack={handleBackToHome} error={error} />;
      case 'questionnaire':
        return <Questionnaire onSubmit={handleGenerateItinerary} isLoading={false} error={error} initialData={initialQuestionnaireData} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} />;
      case 'itineraryResult':
        if (itinerary) return <ItineraryPreview itinerary={itinerary} onRegenerate={() => handleViewChange('questionnaire')} />;
        break;
      case 'unifiedResult':
        return <UnifiedResultPreview plan={unifiedPlan} loadingStatus={unifiedPlanLoadingStatus} error={error} onPlanNew={handleBackToHome} onRegenerate={() => { if(questionnaireDataForUnifiedPlan) handleGenerateUnifiedPlan(questionnaireDataForUnifiedPlan)}} unifiedStreamedText={unifiedStreamedText} onCancel={handleCancelGeneration} />;
      case 'packingAssistantForm':
        return <PackingAssistantForm onSubmit={handleGeneratePackingList} isLoading={false} error={error} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} />;
      case 'packingAssistantResult':
        if (packingList) return <PackingListPreview packingList={packingList} onRegenerate={() => handleViewChange('packingAssistantForm')} />;
        break;
      case 'foodFinderForm':
        return <FoodFinderForm onSubmit={handleGenerateFoodRecommendations} isLoading={false} error={error} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} />;
      case 'foodFinderResult':
        if (foodRecommendations) return <FoodFinderResult recommendations={foodRecommendations} onRegenerate={() => handleViewChange('foodFinderForm')} />;
        break;
      case 'appFinderForm':
        return <AppFinderForm onSubmit={handleGenerateAppRecommendations} isLoading={false} error={error} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} />;
      case 'appFinderResult':
        if (appRecommendations) return <AppFinderResult recommendations={appRecommendations} onRegenerate={() => handleViewChange('appFinderForm')} />;
        break;
      case 'musicFinderForm':
        return <MusicFinderForm onSubmit={handleGenerateMusicRecommendations} isLoading={false} error={error} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} />;
      case 'musicFinderResult':
        if (musicRecommendations) return <MusicFinderResult recommendations={musicRecommendations} onRegenerate={() => handleViewChange('musicFinderForm')} />;
        break;
      case 'contact':
        return <ContactUs onBack={handleBackToHome} />;
    }
    
    // Fallback for any unhandled case or error state where data is null
    return <LandingPage onPlanUnifiedTrip={handleStartUnifiedPlanner} onPlanItinerary={handleStartItineraryPlanner} onStartPacking={() => handleViewChange('packingAssistantForm')} onStartFoodFinder={() => handleViewChange('foodFinderForm')} onStartAppFinder={() => handleViewChange('appFinderForm')} onStartMusicFinder={() => handleViewChange('musicFinderForm')} />;
  };

  return (
    <>
      {view === 'landing' && <Header />}
      <div ref={mainContentRef} className="min-h-screen">
        <main className={`container mx-auto px-4 sm:px-6 lg:px-8 pb-8 relative ${view === 'landing' ? 'pt-24' : ''}`}>
            {renderContent()}
        </main>
      </div>
      <QuickNavButton
        onGoHome={handleBackToHome}
        onGoToContact={() => handleViewChange('contact')}
        onPlanTrip={handleStartUnifiedPlanner}
        onPlanItinerary={handleStartItineraryPlanner}
        onStartPacking={() => handleViewChange('packingAssistantForm')}
        onStartFoodFinder={() => handleViewChange('foodFinderForm')}
        onStartAppFinder={() => handleViewChange('appFinderForm')}
        onStartMusicFinder={() => handleViewChange('musicFinderForm')}
      />
      <ScrollToTopButton />
    </>
  );
};

export default App;