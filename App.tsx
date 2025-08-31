
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
  const [unifiedStepErrors, setUnifiedStepErrors] = useState<Partial<Record<keyof UnifiedPlanLoadingStatus, string>>>({});
  const [streamedText, setStreamedText] = useState('');
  const [initialQuestionnaireData, setInitialQuestionnaireData] = useState<InitialQuestionnaireData | null>(null);
  
  const mainContentRef = useRef<HTMLDivElement>(null);

  // --- Unified Planner Pipeline State ---
  const cancellationFlags = useRef<Partial<Record<keyof UnifiedPlanLoadingStatus, boolean>>>({});


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
    
    // For unified plan, handle cancellation via its own logic
    if (view === 'unifiedResult') {
        Object.keys(cancellationFlags.current).forEach(key => {
            cancellationFlags.current[key as keyof UnifiedPlanLoadingStatus] = true;
        });
        handleViewChange('unifiedPlannerForm');
        return;
    }

    const formViews: Partial<Record<View, View>> = {
      'itineraryResult': 'questionnaire',
      'packingAssistantResult': 'packingAssistantForm',
      'foodFinderResult': 'foodFinderForm',
      'appFinderResult': 'appFinderForm',
      'musicFinderResult': 'musicFinderForm',
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
  
    // Helper to run each generation step with a retry and cancellation mechanism
    const generateStep = useCallback(async <T,>(
      step: keyof UnifiedPlanLoadingStatus,
      generatorFn: () => Promise<T>,
      onSuccess: (result: T) => void,
      maxRetries = 3
    ): Promise<boolean> => {
      setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'loading' }));
      cancellationFlags.current[step] = false; // Reset flag for this specific run
      let lastError: Error | null = null;
  
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (cancellationFlags.current[step]) {
            setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'cancelled' }));
            return false;
        }

        try {
          const result = await generatorFn();
          if (cancellationFlags.current[step]) {
            setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'cancelled' }));
            return false;
          }
          onSuccess(result);
          setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'done' }));
          return true; // Success
        } catch (e) {
          console.error(`Attempt ${attempt} for ${step} failed:`, e);
          lastError = e instanceof Error ? e : new Error('An unknown error occurred');
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000)); 
          }
        }
      }
  
      const message = lastError ? `After ${maxRetries} attempts, generation failed. Error: ${lastError.message}` : `An unknown error occurred after ${maxRetries} attempts during ${step} generation.`;
      setUnifiedStepErrors(prev => ({ ...prev, [step]: message }));
      setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'error' }));
      return false; // Failure
    }, []);

    const stepToPlanKey = (step: keyof UnifiedPlanLoadingStatus): keyof UnifiedPlan => {
        const map: Record<keyof UnifiedPlanLoadingStatus, keyof UnifiedPlan> = {
            itinerary: 'itinerary',
            packing: 'packingList',
            food: 'foodRecommendations',
            apps: 'appRecommendations',
            music: 'musicRecommendations',
        };
        return map[step];
    };

    // Effect for the first step of the pipeline: Itinerary Generation
    useEffect(() => {
        const runItineraryStep = async () => {
            if (view !== 'unifiedResult' || !questionnaireDataForUnifiedPlan) return;
            if (unifiedPlanLoadingStatus.itinerary !== 'pending') return;

            const data = questionnaireDataForUnifiedPlan;
            cancellationFlags.current.itinerary = false;
            setUnifiedStepErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.itinerary;
                return newErrors;
            });
            
            await generateStep('itinerary',
              () => generateItinerary(data.destination, data.startPoint, data.tripType, data.days, data.budget, data.vibe, data.persons, data.foodPreference, data.startDate, data.includeMedical, data.language, data.isRoundTrip, data.currency),
              (result) => setUnifiedPlan(prev => ({ ...prev, itinerary: result }))
            );
        };
        runItineraryStep();
    }, [view, questionnaireDataForUnifiedPlan, unifiedPlanLoadingStatus.itinerary, generateStep]);

    // Effect for parallel generation of other steps, dependent on itinerary completion
    useEffect(() => {
        const runParallelSteps = async () => {
            const data = questionnaireDataForUnifiedPlan!;
            const currentItinerary = unifiedPlan.itinerary!;
            const isMultiStop = data.isRoundTrip && currentItinerary && currentItinerary.coveredDestinations.length > 1;

            const stepGenerators: Partial<Record<keyof Omit<UnifiedPlanLoadingStatus, 'itinerary'>, { generator: () => Promise<any>, onSuccess: (result: any) => void }>> = {
                packing: {
                    generator: () => {
                        const packingData: PackingListRequestData = { destination: data.destination, startDate: data.startDate, days: data.days, language: data.language, coveredDestinations: isMultiStop ? currentItinerary!.coveredDestinations : undefined };
                        return generatePackingList(packingData);
                    },
                    onSuccess: (result) => setUnifiedPlan(prev => ({ ...prev, packingList: result })),
                },
                food: {
                     generator: () => {
                        const foodData: FoodFinderRequestData = { destination: data.destination, startDate: data.startDate, foodPreference: data.foodPreference, includeAlcoholicDrinks: data.includeAlcoholicDrinks, language: data.language, coveredDestinations: isMultiStop ? currentItinerary!.coveredDestinations : undefined };
                        return generateFoodRecommendations(foodData);
                    },
                    onSuccess: (result) => setUnifiedPlan(prev => ({ ...prev, foodRecommendations: result })),
                },
                apps: {
                     generator: () => {
                        const appData: AppFinderRequestData = { destination: data.destination, language: data.language, coveredDestinations: isMultiStop ? currentItinerary!.coveredDestinations : undefined };
                        return generateAppRecommendations(appData);
                    },
                    onSuccess: (result) => setUnifiedPlan(prev => ({ ...prev, appRecommendations: result })),
                },
                music: {
                     generator: () => {
                        const musicData: MusicFinderRequestData = { destination: data.destination, language: data.language, coveredDestinations: isMultiStop ? currentItinerary!.coveredDestinations : undefined };
                        return generateMusicRecommendations(musicData);
                    },
                    onSuccess: (result) => setUnifiedPlan(prev => ({ ...prev, musicRecommendations: result })),
                },
            };

            const parallelSteps: (keyof Omit<UnifiedPlanLoadingStatus, 'itinerary'>)[] = ['packing', 'food', 'apps', 'music'];
            const stepsToRun = parallelSteps.filter(step => unifiedPlanLoadingStatus[step] === 'pending');

            if (stepsToRun.length > 0) {
                const generationPromises = stepsToRun.map(step => {
                    cancellationFlags.current[step] = false;
                    const { generator, onSuccess } = stepGenerators[step]!;
                    return generateStep(step, generator, onSuccess);
                });
                await Promise.all(generationPromises);
            }
        };

        if (view === 'unifiedResult' && unifiedPlan.itinerary && unifiedPlanLoadingStatus.itinerary === 'done') {
            runParallelSteps();
        }
    }, [view, unifiedPlan.itinerary, unifiedPlanLoadingStatus.itinerary, questionnaireDataForUnifiedPlan, generateStep]);


  const handleGenerateUnifiedPlan = useCallback(async (data: QuestionnaireData) => {
    setQuestionnaireDataForUnifiedPlan(data);
    setUnifiedPlan({ itinerary: null, packingList: null, foodRecommendations: null, appRecommendations: null, musicRecommendations: null });
    setError(null);
    setUnifiedStepErrors({});
    cancellationFlags.current = {};
    handleViewChange('unifiedResult');
    // This state change will trigger the pipeline `useEffect`
    setUnifiedPlanLoadingStatus({ itinerary: 'pending', packing: 'pending', food: 'pending', apps: 'pending', music: 'pending' });
  }, [handleViewChange]);

  const handleRegenerateUnifiedPlanStep = useCallback((step: keyof UnifiedPlanLoadingStatus) => {
    if (!questionnaireDataForUnifiedPlan) return;
    
    // Clear old data for the step being regenerated
    const planKey = stepToPlanKey(step);
    setUnifiedPlan(prev => ({ ...prev, [planKey]: null }));

    // If itinerary is regenerated, all dependent steps must be regenerated too.
    if (step === 'itinerary') {
        setUnifiedPlan(prev => ({
            ...prev,
            itinerary: null,
            packingList: null,
            foodRecommendations: null,
            appRecommendations: null,
            musicRecommendations: null,
        }));
        setUnifiedPlanLoadingStatus({
            itinerary: 'pending',
            packing: 'pending',
            food: 'pending',
            apps: 'pending',
            music: 'pending',
        });
        setUnifiedStepErrors({});
    } else {
        // Just regenerate the single step
        setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'pending' }));
        setUnifiedStepErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[step];
            return newErrors;
        });
    }
  }, [questionnaireDataForUnifiedPlan]);

  const handleCancelUnifiedPlanStep = useCallback((step: keyof UnifiedPlanLoadingStatus) => {
      cancellationFlags.current[step] = true;
  }, []);


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
        return <UnifiedResultPreview plan={unifiedPlan} loadingStatus={unifiedPlanLoadingStatus} stepErrors={unifiedStepErrors} onPlanNew={handleBackToHome} onRegenerate={() => { if(questionnaireDataForUnifiedPlan) handleGenerateUnifiedPlan(questionnaireDataForUnifiedPlan)}} onRegenerateStep={handleRegenerateUnifiedPlanStep} onCancel={handleCancelGeneration} onCancelStep={handleCancelUnifiedPlanStep} onTabChangeScrollToTop={scrollToTop} />;
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