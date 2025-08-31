import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Itinerary, QuestionnaireData, PackingListRequestData, PackingList, FoodFinderRequestData, FoodRecommendations, AppFinderRequestData, AppRecommendations, MusicFinderRequestData, MusicRecommendations, QuestionnaireData as InitialQuestionnaireData } from './types';
import { generateItinerary } from './services/geminiService';
import { generatePackingList } from './services/packingService';
import { generateFoodRecommendations } from './services/foodService';
import { generateAppRecommendations } from './services/appFinderService';
import { generateMusicRecommendations } from './services/musicService';


import LandingPage from './components/LandingPage';
import Questionnaire from './components/Questionnaire';
import ItineraryPreview from './components/ItineraryPreview';
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


type View = 'landing' | 'questionnaire' | 'itinerary' | 'packingAssistantForm' | 'packingAssistantResult' | 'foodFinderForm' | 'foodFinderResult' | 'appFinderForm' | 'appFinderResult' | 'musicFinderForm' | 'musicFinderResult' | 'contact';

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [foodRecommendations, setFoodRecommendations] = useState<FoodRecommendations | null>(null);
  const [appRecommendations, setAppRecommendations] = useState<AppRecommendations | null>(null);
  const [musicRecommendations, setMusicRecommendations] = useState<MusicRecommendations | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState('');
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

  const handlePlanTrip = useCallback((destination?: string) => {
    let initialData: InitialQuestionnaireData | null = {
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
    };

    if (destination) {
      initialData.destination = destination;
    } else {
      initialData = null; 
    }
    setInitialQuestionnaireData(initialData);
    handleViewChange('questionnaire');
  }, [handleViewChange]);

  const handleBackToHome = useCallback(() => {
    setItinerary(null);
    setPackingList(null);
    setFoodRecommendations(null);
    setAppRecommendations(null);
    setMusicRecommendations(null);
    setInitialQuestionnaireData(null);
    handleViewChange('landing');
  }, [handleViewChange]);
  
  const handleCancelGeneration = useCallback(() => {
    setIsLoading(false);
    setError("Generation was cancelled.");
    
    const formViews: Partial<Record<View, View>> = {
      'itinerary': 'questionnaire',
      'packingAssistantResult': 'packingAssistantForm',
      'foodFinderResult': 'foodFinderForm',
      'appFinderResult': 'appFinderForm',
      'musicFinderResult': 'musicFinderForm',
    };
    
    const targetView = formViews[view] || 'landing';
    handleViewChange(targetView as View);

  }, [view, handleViewChange]);

  const handleGenerateItinerary = async (data: QuestionnaireData) => {
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    handleViewChange('itinerary');

    try {
      const result = await generateItinerary(
        data.destination, data.startPoint, data.tripType, data.days, data.budget, data.vibe, data.persons, data.foodPreference, data.startDate, data.includeMedical, data.language, data.isRoundTrip, data.currency,
        (chunk) => setStreamedText(prev => prev + chunk)
      );
      setItinerary(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePackingList = async (data: PackingListRequestData) => {
    setIsLoading(true);
    setError(null);
    setPackingList(null);
    handleViewChange('packingAssistantResult');
    try {
        const result = await generatePackingList(data, (chunk) => setStreamedText(prev => prev + chunk));
        setPackingList(result);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateFoodRecommendations = async (data: FoodFinderRequestData) => {
    setIsLoading(true);
    setError(null);
    setFoodRecommendations(null);
    handleViewChange('foodFinderResult');
    try {
        const result = await generateFoodRecommendations(data, (chunk) => setStreamedText(prev => prev + chunk));
        setFoodRecommendations(result);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGenerateAppRecommendations = async (data: AppFinderRequestData) => {
    setIsLoading(true);
    setError(null);
    setAppRecommendations(null);
    handleViewChange('appFinderResult');
    try {
        const result = await generateAppRecommendations(data, (chunk) => setStreamedText(prev => prev + chunk));
        setAppRecommendations(result);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGenerateMusicRecommendations = async (data: MusicFinderRequestData) => {
    setIsLoading(true);
    setError(null);
    setMusicRecommendations(null);
    handleViewChange('musicFinderResult');
    try {
        const result = await generateMusicRecommendations(data, (chunk) => setStreamedText(prev => prev + chunk));
        setMusicRecommendations(result);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
        setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      switch (view) {
        case 'itinerary':
          return <Questionnaire onSubmit={handleGenerateItinerary} isLoading={true} error={null} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} />;
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
        return <LandingPage onPlanTrip={handlePlanTrip} onStartPacking={() => handleViewChange('packingAssistantForm')} onStartFoodFinder={() => handleViewChange('foodFinderForm')} onStartAppFinder={() => handleViewChange('appFinderForm')} onStartMusicFinder={() => handleViewChange('musicFinderForm')} />;
      case 'questionnaire':
        return <Questionnaire onSubmit={handleGenerateItinerary} isLoading={false} error={error} initialData={initialQuestionnaireData} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} />;
      case 'itinerary':
        if (itinerary) return <ItineraryPreview itinerary={itinerary} onRegenerate={() => { setItinerary(null); handleViewChange('questionnaire'); }} />;
        break;
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
    // Fallback for when data isn't ready but loading is false (e.g., after an error)
    if (error) {
        handleViewChange('landing');
    }
    return <LandingPage onPlanTrip={handlePlanTrip} onStartPacking={() => handleViewChange('packingAssistantForm')} onStartFoodFinder={() => handleViewChange('foodFinderForm')} onStartAppFinder={() => handleViewChange('appFinderForm')} onStartMusicFinder={() => handleViewChange('musicFinderForm')} />;
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
        onPlanTrip={handlePlanTrip}
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