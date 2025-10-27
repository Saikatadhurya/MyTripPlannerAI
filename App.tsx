import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import { QuestionnaireData, PackingListRequestData, PackingList, FoodFinderRequestData, FoodRecommendations, AppFinderRequestData, AppRecommendations, MusicFinderRequestData, MusicRecommendations, LingoFinderRequestData, LingoRecommendations, QuestionnaireData as InitialQuestionnaireData, UnifiedPlan, UnifiedPlanLoadingStatus, Itinerary } from './types';
import { generateItinerary } from './services/geminiService';
import { generatePackingList } from './services/packingService';
import { generateFoodRecommendations } from './services/foodService';
import { generateAppRecommendations } from './services/appFinderService';
import { generateMusicRecommendations } from './services/musicService';
import { generateLingoGuide } from './services/lingoService';

import { authService, User } from './services/authService';
import profileService from './services/profileService';
import { setGlobalLogoutHandler } from './services/axiosInterceptor';

import LoadingIndicator from './components/LoadingIndicator';
import Header from './components/Header';
import ScrollToTopButton from './components/ScrollToTopButton';
import QuickNavButton from './components/QuickNavButton';
import AppRouter from './components/AppRouter';
import BottomNavBar from './components/BottomNavBar';
import UnifiedResultPreview from './components/UnifiedResultPreview';
import Footer from './components/Footer';



type View = 'landing' | 'questionnaire' | 'itineraryResult' | 'packingAssistantForm' | 'packingAssistantResult' | 'foodFinderForm' | 'foodFinderResult' | 'appFinderForm' | 'appFinderResult' | 'musicFinderForm' | 'musicFinderResult' | 'lingoFinderForm' | 'lingoFinderResult' | 'contact' | 'unifiedPlannerForm' | 'unifiedResult' | 'editProfile' | 'history';

// --- Loading State Constants ---
const itineraryStages = [
    { key: '"budgetSummary":', text: 'Calculating Budget Overview' },
    { key: '"coveredDestinations":', text: 'Researching About the Destinations' },
    { key: '"plan":', text: 'Constructing the Daily Itinerary' },
    { key: '"referenceBlogs":', text: 'Finalizing and Polishing' },
];
const itineraryFunFacts = [
    { icon: '🗺️', text: 'Plotting scenic routes...' },
    { icon: '💎', text: 'Finding hidden gems...' },
    { icon: '🗓️', text: 'Scheduling daily activities...' },
    { icon: '🏨', text: 'Scouting the best stays...' },
    { icon: '🍜', text: 'Locating top-rated eats...' },
];
const packingStages = [
    { key: '"clothingAndFootwear":', text: 'Selecting outfits & footwear' },
    { key: '"documentsAndMoney":', text: 'Securing documents & money' },
    { key: '"bagSuggestion":', text: 'Recommending the perfect bag' },
];
const packingFunFacts = [
    { icon: '🌤️', text: 'Checking the weather forecast...' },
    { icon: '👕', text: 'Choosing the perfect outfits...' },
    { icon: '🔌', text: 'Remembering all the chargers...' },
    { icon: '🪥', text: 'Making sure you don\'t forget your toothbrush...' },
    { icon: '✈️', text: 'Optimizing for carry-on...' },
];
const foodStages = [
    { key: '"breakfast":', text: 'Discovering breakfast options' },
    { key: '"iconicDishes":', text: 'Identifying iconic local dishes' },
    { key: '"streetFestivalsAndFoodMelas":', text: 'Finalizing recommendations' },
];
const foodFunFacts = [
    { icon: '🧑‍🍳', text: 'Consulting with local chefs...' },
    { icon: '🌶️', text: 'Searching for the spiciest dishes...' },
    { icon: '🗺️', text: 'Mapping out a food tour...' },
    { icon: '🤫', text: 'Discovering secret family recipes...' },
    { icon: '✨', text: 'Finding the most authentic flavors...' },
];
const appStages = [
    { key: '"transportAndTravel":', text: 'Finding transport & travel apps' },
    { key: '"explorationAndTours":', text: 'Locating exploration apps' },
    { key: '}]}', text: 'Finalizing' },
];
const appFunFacts = [
    { icon: '📲', text: 'Scanning the local app stores...' },
    { icon: '🧭', text: 'Finding the best navigation tools...' },
    { icon: '🚕', text: 'Locating top ride-sharing apps...' },
    { icon: '💬', text: 'Searching for translation apps...' },
    { icon: '💳', text: 'Checking for local payment apps...' },
];
const musicStages = [
    { key: '"musicCategories":', text: 'Analyzing local music scene' },
    { key: '"genre":"Top Trending Hits"', text: 'Finding top trending hits' },
    { key: '}]}', text: 'Finalizing' }
];
const musicFunFacts = [
    { icon: '🎧', text: 'Tuning into local radio...' },
    { icon: '🎶', text: 'Discovering the local anthems...' },
    { icon: '🎸', text: 'Finding iconic folk songs...' },
    { icon: '🎤', text: 'Checking the top of the charts...' },
    { icon: '💿', text: 'Building the perfect travel playlist...' },
];
const lingoStages = [
    { key: '"localLanguage":', text: 'Identifying the local language' },
    { key: '"categoryName":"Dining', text: 'Translating dining phrases' },
    { key: '"categoryName":"Emergencies"', text: 'Preparing emergency phrases' },
];
const lingoFunFacts = [
    { icon: '🌍', text: 'Learning local greetings...' },
    { icon: '💬', text: 'Translating essential phrases...' },
    { icon: '🗣️', text: 'Perfecting pronunciations...' },
    { icon: '✍️', text: 'Building your custom phrasebook...' },
];


const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for individual mini-apps
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [foodRecommendations, setFoodRecommendations] = useState<FoodRecommendations | null>(null);
  const [appRecommendations, setAppRecommendations] = useState<AppRecommendations | null>(null);
  const [musicRecommendations, setMusicRecommendations] = useState<MusicRecommendations | null>(null);
  const [lingoRecommendations, setLingoRecommendations] = useState<LingoRecommendations | null>(null);
  const [isHistoryView, setIsHistoryView] = useState(false);
  
  // State for the new unified plan
  const [unifiedPlan, setUnifiedPlan] = useState<UnifiedPlan>({ itinerary: null, packingList: null, foodRecommendations: null, appRecommendations: null, musicRecommendations: null, lingoRecommendations: null });
  const [unifiedPlanLoadingStatus, setUnifiedPlanLoadingStatus] = useState<UnifiedPlanLoadingStatus>({ itinerary: 'pending', packing: 'pending', food: 'pending', apps: 'pending', music: 'pending', lingo: 'pending' });
  const [questionnaireDataForUnifiedPlan, setQuestionnaireDataForUnifiedPlan] = useState<QuestionnaireData | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unifiedStepErrors, setUnifiedStepErrors] = useState<Partial<Record<keyof UnifiedPlanLoadingStatus, string>>>({});
  const [streamedText, setStreamedText] = useState('');
  const [itineraryStreamedText, setItineraryStreamedText] = useState('');
  const [itineraryAttemptCount, setItineraryAttemptCount] = useState(0);
  const [miniAppAttemptCount, setMiniAppAttemptCount] = useState(0);

  // State to hold form data for persistence on cancellation
  const [initialQuestionnaireData, setInitialQuestionnaireData] = useState<InitialQuestionnaireData | null>(null);
  const [packingRequestData, setPackingRequestData] = useState<PackingListRequestData | null>(null);
  const [foodRequestData, setFoodRequestData] = useState<FoodFinderRequestData | null>(null);
  const [appRequestData, setAppRequestData] = useState<AppFinderRequestData | null>(null);
  const [musicRequestData, setMusicRequestData] = useState<MusicFinderRequestData | null>(null);
  const [lingoRequestData, setLingoRequestData] = useState<LingoFinderRequestData | null>(null);
  
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // New state for modal visibility

  // Global logout handler for auto logout
  useEffect(() => {
    const handleGlobalLogout = () => {
      console.log('Global logout triggered');
      setUser(null);
      setIsAuthModalOpen(false);
      navigate('/');
      // Clear any ongoing processes
      setIsLoading(false);
      setError(null);
    };

    setGlobalLogoutHandler(handleGlobalLogout);

    return () => {
      setGlobalLogoutHandler(() => {});
    };
  }, [navigate]);

  // --- Unified Planner Pipeline State ---
  const cancellationFlags = useRef<Partial<Record<keyof UnifiedPlanLoadingStatus, boolean>>>({});
  const simplePlanCancellationFlag = useRef(false);

  const formViews: View[] = [
    'questionnaire',
    'packingAssistantForm',
    'foodFinderForm',
    'appFinderForm',
    'musicFinderForm',
    'lingoFinderForm',
    'unifiedPlannerForm',
  ];
  const isFormView = formViews.includes(location.pathname as View);

  // Initialize authentication state
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (currentUser) {
      // Use the user data from localStorage (which includes gemini_api_key if it was previously saved)
      setUser(currentUser);
    } else {
      setUser(null);
    }
  }, []);

  // Authentication handlers
  const handleLogin = async (email: string, password: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const response = await authService.login({ email, password });
      
      // Wait a bit to ensure the token is properly set in authService
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Check if we already have complete user data in localStorage
      const existingUser = authService.getCurrentUser();
      if (existingUser && existingUser.gemini_api_key !== undefined) {
        // We already have complete user data, use it
        setUser(existingUser);
      } else {
        // Fetch complete user profile including Gemini API key
        const profileResponse = await profileService.getProfile();
        if (profileResponse.success && profileResponse.data?.user) {
          const completeUser = {
            ...response.user,
            ...profileResponse.data.user
          };
          setUser(completeUser);
          localStorage.setItem('planora_user', JSON.stringify(completeUser));
        } else {
          setUser(response.user);
          localStorage.setItem('planora_user', JSON.stringify(response.user));
        }
      }
      
      setIsAuthModalOpen(false);
      navigate('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setAuthError(errorMessage);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignup = async (full_name: string, email: string, password: string, confirmPassword: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const response = await authService.signup({ full_name, email, password, confirmPassword });
      
      // Wait a bit to ensure the token is properly set in authService
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // For new users, always fetch complete profile to get initial data
      const profileResponse = await profileService.getProfile();
      if (profileResponse.success && profileResponse.data?.user) {
        const completeUser = {
          ...response.user,
          ...profileResponse.data.user
        };
        setUser(completeUser);
        localStorage.setItem('planora_user', JSON.stringify(completeUser));
      } else {
        setUser(response.user);
        localStorage.setItem('planora_user', JSON.stringify(response.user));
      }
      
      setIsAuthModalOpen(false);
      navigate('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      setAuthError(errorMessage);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setAuthError(null);
    navigate('/'); // Redirect to landing page on logout
  };

  const scrollToTop = useCallback(() => {
    mainContentRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setError(null);
    setStreamedText('');
    // Navigate to appropriate route based on view
    switch (newView) {
      case 'landing':
        navigate('/');
        break;
      case 'questionnaire':
        navigate('/itinerary');
        break;
      case 'unifiedPlannerForm':
        navigate('/plan');
        break;
      case 'packingAssistantForm':
        navigate('/packing');
        break;
      case 'foodFinderForm':
        navigate('/food');
        break;
      case 'appFinderForm':
        navigate('/apps');
        break;
      case 'musicFinderForm':
        navigate('/music');
        break;
      case 'lingoFinderForm':
        navigate('/lingo');
        break;
      case 'contact':
        navigate('/contact');
        break;
      case 'editProfile':
        navigate('/profile');
        break;
      case 'history':
        navigate('/history');
        break;
      default:
        navigate('/');
    }
    scrollToTop();
  }, [navigate, scrollToTop]);

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const user = urlParams.get('user');
    const error = urlParams.get('error');

    if (token && user) {
      try {
        const userData = JSON.parse(decodeURIComponent(user));
        console.log('App: Processing Google OAuth callback for:', userData.email);
        
        // Store the token and user data
        localStorage.setItem('planora_token', token);
        localStorage.setItem('planora_user', JSON.stringify(userData));
        
        // Update the app state
        setUser(userData);
        setAuthError(null);
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to landing page
        navigate('/');
      } catch (error) {
        console.error('Error parsing user data from Google OAuth:', error);
        setAuthError('Failed to process Google authentication');
      }
    } else if (error) {
      setAuthError(decodeURIComponent(error));
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate, user]);

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

  const handleStartUnifiedPlanner = useCallback((destination?: string | React.MouseEvent) => {
      // Check if the argument is a string. If it's a mouse event or undefined, treat it as no destination.
      const dest = typeof destination === 'string' ? destination : undefined;
      setInitialQuestionnaireData(createInitialData(dest));
      navigate('/plan');
    }, [navigate, user]);
  
  const handleStartItineraryPlanner = useCallback(() => {
    setInitialQuestionnaireData(createInitialData());
    navigate('/itinerary');
  }, [navigate, user]);

  const handleStartPackingAssistant = useCallback(() => {
    setPackingRequestData(null);
    navigate('/packing');
  }, [navigate, user]);

  const handleStartFoodFinder = useCallback(() => {
    setFoodRequestData(null);
    navigate('/food');
  }, [navigate, user]);

  const handleStartAppFinder = useCallback(() => {
    setAppRequestData(null);
    navigate('/apps');
  }, [navigate, user]);

  const handleStartMusicFinder = useCallback(() => {
    setMusicRequestData(null);
    navigate('/music');
  }, [navigate, user]);

  const handleStartLingoFinder = useCallback(() => {
    setLingoRequestData(null);
    navigate('/lingo');
  }, [navigate, user]);

  const handleBackToHome = useCallback(() => {
    setItinerary(null);
    setPackingList(null);
    setFoodRecommendations(null);
    setAppRecommendations(null);
    setMusicRecommendations(null);
    setLingoRecommendations(null);
    setInitialQuestionnaireData(null);
    setPackingRequestData(null);
    setFoodRequestData(null);
    setAppRequestData(null);
    setMusicRequestData(null);
    setLingoRequestData(null);
    setUnifiedPlan({ itinerary: null, packingList: null, foodRecommendations: null, appRecommendations: null, musicRecommendations: null, lingoRecommendations: null });
    setQuestionnaireDataForUnifiedPlan(null);
    setIsHistoryView(false); // Reset history view flag
    navigate('/');
  }, [navigate, user]);

  const handleNavigateToResult = useCallback((type: string, responseData: any, requestData: any, isHistoryView: boolean = false) => {
    setIsHistoryView(isHistoryView);
    
    // Set the appropriate data and navigate to the result view
    switch (type) {
      case 'lingo':
        setLingoRecommendations(responseData);
        setLingoRequestData(requestData || { destination: responseData?.destination || 'Unknown', language: 'English (en)' });
        navigate('/results/lingo');
        break;
      case 'apps':
        setAppRecommendations(responseData);
        setAppRequestData(requestData || { destination: responseData?.destination || 'Unknown', language: 'English (en)' });
        navigate('/results/apps');
        break;
      case 'food':
        setFoodRecommendations(responseData);
        setFoodRequestData(requestData || { destination: responseData?.destination || 'Unknown', startDate: new Date().toISOString().split('T')[0], foodPreference: 'Non-Veg', includeAlcoholicDrinks: false, language: 'English (en)' });
        navigate('/results/food');
        break;
      case 'music':
        setMusicRecommendations(responseData);
        setMusicRequestData(requestData || { destination: responseData?.destination || 'Unknown', language: 'English (en)' });
        navigate('/results/music');
        break;
      case 'packing':
        setPackingList(responseData);
        setPackingRequestData(requestData || { destination: responseData?.destination || 'Unknown', startDate: new Date().toISOString().split('T')[0], days: 3, language: 'English (en)' });
        navigate('/results/packing');
        break;
      case 'itinerary':
        setItinerary(responseData);
        setInitialQuestionnaireData(requestData || { destination: responseData?.destination || 'Unknown', startPoint: '', tripType: 'Standard', days: 3, budget: 'Midrange', vibe: ['Adventure & Thrill'], persons: 1, foodPreference: 'Non-Veg', startDate: new Date().toISOString().split('T')[0], includeMedical: false, language: 'English (en)', currency: 'India (INR) – ₹', isRoundTrip: false, includeAlcoholicDrinks: false });
        navigate('/results/itinerary');
        break;
      case 'unified':
        // Handle unified trip navigation
        setUnifiedPlan(responseData);
        setQuestionnaireDataForUnifiedPlan(requestData || { destination: responseData?.destination || 'Unknown', startPoint: '', tripType: 'Standard', days: 3, budget: 'Midrange', vibe: ['Adventure & Thrill'], persons: 1, foodPreference: 'Non-Veg', startDate: new Date().toISOString().split('T')[0], includeMedical: false, language: 'English (en)', currency: 'India (INR) – ₹', isRoundTrip: false, includeAlcoholicDrinks: false });
        // Set loading status to 'done' for all components since we're loading from history
        setUnifiedPlanLoadingStatus({
          itinerary: responseData.itinerary ? 'done' : 'pending',
          packing: responseData.packingList ? 'done' : 'pending',
          food: responseData.foodRecommendations ? 'done' : 'pending',
          apps: responseData.appRecommendations ? 'done' : 'pending',
          music: responseData.musicRecommendations ? 'done' : 'pending',
          lingo: responseData.lingoRecommendations ? 'done' : 'pending'
        });
        navigate('/results/unified');
        break;
      default:
        console.warn('Unknown recommendation type:', type);
    }
  }, [navigate]);

  const handleEditProfile = useCallback(() => {
    navigate('/profile');
  }, [navigate, user]);

  const handleProfileUpdate = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    // Update localStorage with new user data
    localStorage.setItem('planora_user', JSON.stringify(updatedUser));
    // Update authService current user
    authService.updateCurrentUser(updatedUser);
  }, []);
  
  const handleCancelGeneration = useCallback(() => {
    setIsLoading(false);
    setError("Generation was cancelled.");
    
    // For unified plan, handle cancellation via its own logic
    if (location.pathname === '/results/unified') {
        Object.keys(cancellationFlags.current).forEach(key => {
            cancellationFlags.current[key as keyof UnifiedPlanLoadingStatus] = true;
        });
        navigate('/plan');
        return;
    }

    if (location.pathname.includes('/results/')) {
        simplePlanCancellationFlag.current = true;
    }

    const formViews: Partial<Record<string, string>> = {
      '/results/itinerary': '/itinerary',
      '/results/packing': '/packing',
      '/results/food': '/food',
      '/results/apps': '/apps',
      '/results/music': '/music',
      '/results/lingo': '/lingo',
    };
    
    const targetRoute = formViews[location.pathname] || '/';
    navigate(targetRoute);

  }, [location.pathname, navigate]);

  const handleGenerateItinerary = useCallback(async (data: QuestionnaireData) => {

    console.log('handleGenerateItinerary called with data:', data);
    setInitialQuestionnaireData(data);
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    navigate('/results/itinerary');
    
    simplePlanCancellationFlag.current = false;
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        setItineraryAttemptCount(attempt);
        setStreamedText(''); // Reset for each attempt

        if (simplePlanCancellationFlag.current) break;

        try {
            const result = await generateItinerary(
                data.destination, data.startPoint, data.tripType, data.days, data.budget, data.vibe, data.persons, data.foodPreference, data.startDate, data.includeMedical, data.language, data.isRoundTrip, data.currency,
                (chunk) => {
                    if (simplePlanCancellationFlag.current) throw new Error("Cancelled");
                    setStreamedText(prev => prev + chunk);
                },
                user?.gemini_api_key
            );
            
            if (simplePlanCancellationFlag.current) break;

            setItinerary(result);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            setItineraryAttemptCount(0);
            setIsLoading(false);
            return; 

        } catch (e) {
            lastError = e instanceof Error ? e : new Error('An unknown error occurred');
            console.error(`Attempt ${attempt} for itinerary failed:`, lastError);
            
            if (lastError.message === "Cancelled") break;
            if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    
    if (!simplePlanCancellationFlag.current && lastError) {
        setError(lastError.message);
        navigate('/itinerary');
    }
    
    setIsLoading(false);
    setItineraryAttemptCount(0);
  }, [navigate, user]);
  
    // Helper to run each non-streaming generation step with retry/cancellation
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
            lingo: 'lingoRecommendations',
        };
        return map[step];
    };

    // Effect for the first step of the pipeline: Itinerary Generation (Streaming)
    useEffect(() => {
        const runItineraryStep = async () => {
            if (location.pathname !== '/results/unified' || !questionnaireDataForUnifiedPlan) return;
            if (unifiedPlanLoadingStatus.itinerary !== 'pending') return;

            const data = questionnaireDataForUnifiedPlan;
            cancellationFlags.current.itinerary = false;
            setUnifiedStepErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.itinerary;
                return newErrors;
            });
            
            setUnifiedPlanLoadingStatus(prev => ({ ...prev, itinerary: 'loading' }));
            
            const maxRetries = 3;
            let lastError: Error | null = null;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                setItineraryAttemptCount(attempt);
                setItineraryStreamedText(''); // Reset for each attempt

                if (cancellationFlags.current.itinerary) {
                    setUnifiedPlanLoadingStatus(prev => ({ ...prev, itinerary: 'cancelled' }));
                    return;
                }
                
                try {
                    const result = await generateItinerary(
                        data.destination, data.startPoint, data.tripType, data.days, data.budget, data.vibe, data.persons, data.foodPreference, data.startDate, data.includeMedical, data.language, data.isRoundTrip, data.currency,
                        (chunk) => {
                            if (cancellationFlags.current.itinerary) {
                                throw new Error("Cancelled");
                            }
                            setItineraryStreamedText(prev => prev + chunk);
                        },
                        user?.gemini_api_key
                    );
                    
                    if (cancellationFlags.current.itinerary) {
                        setUnifiedPlanLoadingStatus(prev => ({ ...prev, itinerary: 'cancelled' }));
                        return;
                    }

                    setUnifiedPlan(prev => ({ ...prev, itinerary: result }));
                    
                    setUnifiedPlanLoadingStatus(prev => ({ ...prev, itinerary: 'done' }));
                    setItineraryAttemptCount(0);
                    return; // Success, exit loop
                } catch(e) {
                    console.error(`Attempt ${attempt} for itinerary failed:`, e);
                    lastError = e instanceof Error ? e : new Error('An unknown error occurred');
                    if ((e as Error).message === "Cancelled") {
                        setUnifiedPlanLoadingStatus(prev => ({ ...prev, itinerary: 'cancelled' }));
                        setItineraryAttemptCount(0);
                        return;
                    }

                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1500)); // wait before retrying
                    }
                }
            }

            // If loop finishes, it means all retries failed.
            const message = lastError ? `After ${maxRetries} attempts, itinerary generation failed. Error: ${lastError.message}` : `An unknown error occurred after ${maxRetries} attempts during itinerary generation.`;
            setUnifiedStepErrors(prev => ({ ...prev, itinerary: message }));
            setUnifiedPlanLoadingStatus(prev => ({ ...prev, itinerary: 'error' }));
            setItineraryAttemptCount(0);
        };
        runItineraryStep();
    }, [location.pathname, questionnaireDataForUnifiedPlan, unifiedPlanLoadingStatus.itinerary]);

    const handleGeneratePackingList = useCallback(async (data: PackingListRequestData, isUnified = false): Promise<PackingList | null> => {

      if (!isUnified) {
        setPackingRequestData(data);
        setIsLoading(true);
        setError(null);
        setPackingList(null);
        navigate('/results/packing');
      }
  
      simplePlanCancellationFlag.current = false;
      const maxRetries = 3;
      let lastError: Error | null = null;
  
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
          if (!isUnified) setMiniAppAttemptCount(attempt);
          if (!isUnified) setStreamedText('');
  
          if (simplePlanCancellationFlag.current) break;
  
          try {
              const result = await generatePackingList(data, (chunk) => {
                  if (simplePlanCancellationFlag.current) throw new Error("Cancelled");
                  if (!isUnified) setStreamedText(prev => prev + chunk);
              }, user?.gemini_api_key);
              
              if (simplePlanCancellationFlag.current) break;
  
              if (!isUnified) {
                setPackingList(result);
              }
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (!isUnified) {
                setMiniAppAttemptCount(0);
                setIsLoading(false);
              }
              return result;
  
          } catch (e) {
              lastError = e instanceof Error ? e : new Error('An unknown error occurred');
              console.error(`Attempt ${attempt} for packing list failed:`, lastError);
              
              if (lastError.message === "Cancelled") break;
              if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1500));
          }
      }
      
      if (!simplePlanCancellationFlag.current && lastError) {
          if (!isUnified) {
            setError(lastError.message);
            navigate('/packing');
          } else {
            throw lastError;
          }
      }
      
      if (!isUnified) {
        setIsLoading(false);
        setMiniAppAttemptCount(0);
      }
      return null;
  }, [navigate, user]);
  
    const handleGenerateFoodRecommendations = useCallback(async (data: FoodFinderRequestData, isUnified = false): Promise<FoodRecommendations | null> => {

      if (!isUnified) {
        setFoodRequestData(data);
        setIsLoading(true);
        setError(null);
        setFoodRecommendations(null);
        navigate('/results/food');
      }
      
      simplePlanCancellationFlag.current = false;
      const maxRetries = 3;
      let lastError: Error | null = null;
  
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
          if (!isUnified) setMiniAppAttemptCount(attempt);
          if (!isUnified) setStreamedText('');
  
          if (simplePlanCancellationFlag.current) break;
  
          try {
              const result = await generateFoodRecommendations(data, (chunk) => {
                  if (simplePlanCancellationFlag.current) throw new Error("Cancelled");
                  if (!isUnified) setStreamedText(prev => prev + chunk)
              }, user?.gemini_api_key);
              
              if (simplePlanCancellationFlag.current) break;
  
              if (!isUnified) {
                setFoodRecommendations(result);
              }
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (!isUnified) {
                setMiniAppAttemptCount(0);
                setIsLoading(false);
              }
              return result;
  
          } catch (e) {
              lastError = e instanceof Error ? e : new Error('An unknown error occurred');
              console.error(`Attempt ${attempt} for food recommendations failed:`, lastError);
              
              if (lastError.message === "Cancelled") break;
              if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1500));
          }
      }
      
      if (!simplePlanCancellationFlag.current && lastError) {
        if (!isUnified) {
          setError(lastError.message);
          navigate('/food');
        } else {
          throw lastError;
        }
      }
      
      if (!isUnified) {
        setIsLoading(false);
        setMiniAppAttemptCount(0);
      }
      return null;
  }, [navigate, user]);
    
    const handleGenerateAppRecommendations = useCallback(async (data: AppFinderRequestData, isUnified = false): Promise<AppRecommendations | null> => {

      if (!isUnified) {
        setAppRequestData(data);
        setIsLoading(true);
        setError(null);
        setAppRecommendations(null);
        navigate('/results/apps');
      }
      
      simplePlanCancellationFlag.current = false;
      const maxRetries = 3;
      let lastError: Error | null = null;
  
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
          if (!isUnified) setMiniAppAttemptCount(attempt);
          if (!isUnified) setStreamedText('');
  
          if (simplePlanCancellationFlag.current) break;
  
          try {
              const result = await generateAppRecommendations(data, (chunk) => {
                  if (simplePlanCancellationFlag.current) throw new Error("Cancelled");
                  if (!isUnified) setStreamedText(prev => prev + chunk)
              }, user?.gemini_api_key);
              
              if (simplePlanCancellationFlag.current) break;
  
              if (!isUnified) {
                setAppRecommendations(result);
              }
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (!isUnified) {
                setMiniAppAttemptCount(0);
                setIsLoading(false);
              }
              return result;
  
          } catch (e) {
              lastError = e instanceof Error ? e : new Error('An unknown error occurred');
              console.error(`Attempt ${attempt} for app recommendations failed:`, lastError);
              
              if (lastError.message === "Cancelled") break;
              if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1500));
          }
      }
      
      if (!simplePlanCancellationFlag.current && lastError) {
        if (!isUnified) {
          setError(lastError.message);
          navigate('/apps');
        } else {
          throw lastError;
        }
      }
      
      if (!isUnified) {
        setIsLoading(false);
        setMiniAppAttemptCount(0);
      }
      return null;
  }, [navigate, user]);
    
    const handleGenerateMusicRecommendations = useCallback(async (data: MusicFinderRequestData, isUnified = false): Promise<MusicRecommendations | null> => {

      if (!isUnified) {
        setMusicRequestData(data);
        setIsLoading(true);
        setError(null);
        setMusicRecommendations(null);
        navigate('/results/music');
      }
      
      simplePlanCancellationFlag.current = false;
      const maxRetries = 3;
      let lastError: Error | null = null;
  
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
          if (!isUnified) setMiniAppAttemptCount(attempt);
          if (!isUnified) setStreamedText('');
  
          if (simplePlanCancellationFlag.current) break;
  
          try {
              const result = await generateMusicRecommendations(data, (chunk) => {
                  if (simplePlanCancellationFlag.current) throw new Error("Cancelled");
                  if (!isUnified) setStreamedText(prev => prev + chunk)
              }, user?.gemini_api_key);
              
              if (simplePlanCancellationFlag.current) break;
  
              if (!isUnified) {
                setMusicRecommendations(result);
              }
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (!isUnified) {
                setMiniAppAttemptCount(0);
                setIsLoading(false);
              }
              return result;
  
          } catch (e) {
              lastError = e instanceof Error ? e : new Error('An unknown error occurred');
              console.error(`Attempt ${attempt} for music recommendations failed:`, lastError);
              
              if (lastError.message === "Cancelled") break;
              if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1500));
          }
      }
      
      if (!simplePlanCancellationFlag.current && lastError) {
        if (!isUnified) {
          setError(lastError.message);
          navigate('/music');
        } else {
          throw lastError;
        }
      }
      
      if (!isUnified) {
        setIsLoading(false);
        setMiniAppAttemptCount(0);
      }
      return null;
  }, [navigate, user]);
    
    const handleGenerateLingoGuide = useCallback(async (data: LingoFinderRequestData, isUnified = false): Promise<LingoRecommendations | null> => {

      if (!isUnified) {
        setLingoRequestData(data);
        setIsLoading(true);
        setError(null);
        setLingoRecommendations(null);
        navigate('/results/lingo');
      }
      
      simplePlanCancellationFlag.current = false;
      const maxRetries = 3;
      let lastError: Error | null = null;
  
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
          if (!isUnified) setMiniAppAttemptCount(attempt);
          if (!isUnified) setStreamedText('');
  
          if (simplePlanCancellationFlag.current) break;
  
          try {
              const result = await generateLingoGuide(data, (chunk) => {
                  if (simplePlanCancellationFlag.current) throw new Error("Cancelled");
                  if (!isUnified) setStreamedText(prev => prev + chunk)
              }, user?.gemini_api_key);
              
              if (simplePlanCancellationFlag.current) break;
  
              if (!isUnified) {
                setLingoRecommendations(result);
              }
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (!isUnified) {
                setMiniAppAttemptCount(0);
                setIsLoading(false);
              }
              return result;
  
          } catch (e) {
              lastError = e instanceof Error ? e : new Error('An unknown error occurred');
              console.error(`Attempt ${attempt} for lingo guide failed:`, lastError);
              
              if (lastError.message === "Cancelled") break;
              if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1500));
          }
      }
      
      if (!simplePlanCancellationFlag.current && lastError) {
        if (!isUnified) {
          setError(lastError.message);
          navigate('/lingo');
        } else {
          throw lastError;
        }
      }
      
      if (!isUnified) {
        setIsLoading(false);
        setMiniAppAttemptCount(0);
      }
      return null;
  }, [navigate, user]);

    // Effect for parallel generation of other steps, dependent on itinerary completion
    useEffect(() => {
        const runParallelSteps = async () => {
            const data = questionnaireDataForUnifiedPlan!;
            const currentItinerary = unifiedPlan.itinerary!;
            const isMultiStop = currentItinerary && currentItinerary.coveredDestinations.length > 1;

            const stepGenerators: Partial<Record<keyof Omit<UnifiedPlanLoadingStatus, 'itinerary'>, { generator: () => Promise<any>, onSuccess: (result: any) => void }>> = {
                packing: {
                    generator: () => {
                        const packingData: PackingListRequestData = { destination: data.destination, startDate: data.startDate, days: data.days, language: data.language, coveredDestinations: isMultiStop ? currentItinerary!.coveredDestinations : undefined };
                        return handleGeneratePackingList(packingData, true);
                    },
                    onSuccess: (result) => { if (result) setUnifiedPlan(prev => ({ ...prev, packingList: result })); },
                },
                food: {
                    generator: () => {
                        const foodData: FoodFinderRequestData = { destination: data.destination, startDate: data.startDate, foodPreference: data.foodPreference, includeAlcoholicDrinks: data.includeAlcoholicDrinks, language: data.language, coveredDestinations: isMultiStop ? currentItinerary!.coveredDestinations : undefined };
                        return handleGenerateFoodRecommendations(foodData, true);
                    },
                    onSuccess: (result) => { if (result) setUnifiedPlan(prev => ({ ...prev, foodRecommendations: result })); },
                },
                apps: {
                    generator: () => {
                        const appData: AppFinderRequestData = { destination: data.destination, language: data.language, coveredDestinations: isMultiStop ? currentItinerary!.coveredDestinations : undefined };
                        return handleGenerateAppRecommendations(appData, true);
                    },
                    onSuccess: (result) => { if (result) setUnifiedPlan(prev => ({ ...prev, appRecommendations: result })); },
                },
                music: {
                    generator: () => {
                        const musicData: MusicFinderRequestData = { destination: data.destination, language: data.language, coveredDestinations: isMultiStop ? currentItinerary!.coveredDestinations : undefined };
                        return handleGenerateMusicRecommendations(musicData, true);
                    },
                    onSuccess: (result) => { if (result) setUnifiedPlan(prev => ({ ...prev, musicRecommendations: result })); },
                },
                lingo: {
                    generator: () => {
                       const lingoData: LingoFinderRequestData = { destination: data.destination, language: data.language };
                       return handleGenerateLingoGuide(lingoData, true);
                    },
                    onSuccess: (result) => { if (result) setUnifiedPlan(prev => ({ ...prev, lingoRecommendations: result })); },
                },
            };

            const parallelSteps: (keyof Omit<UnifiedPlanLoadingStatus, 'itinerary'>)[] = ['packing', 'food', 'apps', 'music', 'lingo'];
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

        if (location.pathname === '/results/unified' && unifiedPlan.itinerary && unifiedPlanLoadingStatus.itinerary === 'done') {
            runParallelSteps();
        }
    }, [location.pathname, unifiedPlan.itinerary, unifiedPlanLoadingStatus.itinerary, questionnaireDataForUnifiedPlan, generateStep, handleGeneratePackingList, handleGenerateFoodRecommendations, handleGenerateAppRecommendations, handleGenerateMusicRecommendations, handleGenerateLingoGuide]);


  const handleGenerateUnifiedPlan = useCallback(async (data: QuestionnaireData) => {

    setInitialQuestionnaireData(data);
    setQuestionnaireDataForUnifiedPlan(data);
    setUnifiedPlan({ itinerary: null, packingList: null, foodRecommendations: null, appRecommendations: null, musicRecommendations: null, lingoRecommendations: null });
    setError(null);
    setItineraryStreamedText('');
    setItineraryAttemptCount(0);
    setUnifiedStepErrors({});
    cancellationFlags.current = {};
    navigate('/results/unified');
    // This state change will trigger the pipeline `useEffect`
    setUnifiedPlanLoadingStatus({ itinerary: 'pending', packing: 'pending', food: 'pending', apps: 'pending', music: 'pending', lingo: 'pending' });
  }, [navigate, user]);

  const handleRegenerateUnifiedPlanStep = useCallback((step: keyof UnifiedPlanLoadingStatus) => {
    if (!questionnaireDataForUnifiedPlan) return;
    
    // Clear old data for the step being regenerated
    const planKey = stepToPlanKey(step);
    setUnifiedPlan(prev => ({ ...prev, [planKey]: null }));

    // If itinerary is regenerated, all dependent steps must be regenerated too.
    if (step === 'itinerary') {
        setUnifiedPlan({
            itinerary: null,
            packingList: null,
            foodRecommendations: null,
            appRecommendations: null,
            musicRecommendations: null,
            lingoRecommendations: null,
        });
        setUnifiedPlanLoadingStatus({
            itinerary: 'pending',
            packing: 'pending',
            food: 'pending',
            apps: 'pending',
            music: 'pending',
            lingo: 'pending',
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

  // Get current view from location
  const getCurrentView = (): View => {
    switch (location.pathname) {
      case '/':
        return 'landing';
      case '/plan':
        return 'unifiedPlannerForm';
      case '/itinerary':
        return 'questionnaire';
      case '/packing':
        return 'packingAssistantForm';
      case '/food':
        return 'foodFinderForm';
      case '/apps':
        return 'appFinderForm';
      case '/music':
        return 'musicFinderForm';
      case '/lingo':
        return 'lingoFinderForm';
      case '/contact':
        return 'contact';
      case '/profile':
        return 'editProfile';
      case '/history':
        return 'history';
      case '/results/itinerary':
        return 'itineraryResult';
      case '/results/packing':
        return 'packingAssistantResult';
      case '/results/food':
        return 'foodFinderResult';
      case '/results/apps':
        return 'appFinderResult';
      case '/results/music':
        return 'musicFinderResult';
      case '/results/lingo':
        return 'lingoFinderResult';
      case '/results/unified':
        return 'unifiedResult';
      default:
        return 'landing';
    }
  };

  const currentView = getCurrentView();

  const renderContent = () => {
    if (isLoading) {
      let loadingProps;
      switch (currentView) {
        case 'itineraryResult':
          loadingProps = { 
            title: "Crafting Your Itinerary...", 
            stages: itineraryStages, 
            funFacts: itineraryFunFacts, 
            accentColor: 'violet' as const,
            attemptCount: itineraryAttemptCount,
            maxAttempts: 3,
            showTimer: true,
          };
          break;
        case 'packingAssistantResult':
          loadingProps = { title: "Building Your Packing List...", stages: packingStages, funFacts: packingFunFacts, accentColor: 'violet' as const, attemptCount: miniAppAttemptCount, maxAttempts: 3 };
          break;
        case 'foodFinderResult':
          loadingProps = { title: "Cooking Up Recommendations...", stages: foodStages, funFacts: foodFunFacts, accentColor: 'amber' as const, attemptCount: miniAppAttemptCount, maxAttempts: 3 };
          break;
        case 'appFinderResult':
          loadingProps = { title: "Scanning for Local Apps...", stages: appStages, funFacts: appFunFacts, accentColor: 'teal' as const, attemptCount: miniAppAttemptCount, maxAttempts: 3 };
          break;
        case 'musicFinderResult':
          loadingProps = { title: "Curating Your Playlist...", stages: musicStages, funFacts: musicFunFacts, accentColor: 'fuchsia' as const, attemptCount: miniAppAttemptCount, maxAttempts: 3 };
          break;
        case 'lingoFinderResult':
          loadingProps = { title: "Translating Local Phrases...", stages: lingoStages, funFacts: lingoFunFacts, accentColor: 'sky' as const, attemptCount: miniAppAttemptCount, maxAttempts: 3 };
          break;
      }
      
      if (loadingProps) {
        return <LoadingIndicator streamedText={streamedText} onCancel={handleCancelGeneration} {...loadingProps} />;
      }
    }

    if (currentView === 'unifiedResult') {
        if (unifiedPlanLoadingStatus.itinerary === 'pending' || unifiedPlanLoadingStatus.itinerary === 'loading') {
            return (
                <LoadingIndicator
                    streamedText={itineraryStreamedText}
                    stages={itineraryStages}
                    onCancel={handleCancelGeneration}
                    title="Crafting Your Adventure..."
                    accentColor="violet"
                    funFacts={itineraryFunFacts}
                    attemptCount={itineraryAttemptCount}
                    maxAttempts={3}
                    showTimer={true}
                />
            );
        }
        // If itinerary is done, error, or cancelled, show the result page.
        // The result page itself will handle loading states for other tabs.
        return <UnifiedResultPreview 
            plan={unifiedPlan} 
            loadingStatus={unifiedPlanLoadingStatus} 
            stepErrors={unifiedStepErrors} 
            onPlanNew={handleBackToHome} 
            onRegenerate={() => handleRegenerateUnifiedPlanStep('itinerary')} 
            onRegenerateStep={handleRegenerateUnifiedPlanStep} 
            onCancel={handleCancelGeneration} 
            onCancelStep={handleCancelUnifiedPlanStep} 
            onTabChangeScrollToTop={scrollToTop} 
            itineraryStreamedText={itineraryStreamedText} 
            questionnaireData={questionnaireDataForUnifiedPlan}
            isHistoryView={isHistoryView}
        />;
    }

    // For other views, use the router
    return <AppRouter
      user={user}
      onLogin={handleLogin}
      onSignup={handleSignup}
      onLogout={handleLogout}
      onEditProfile={handleEditProfile}
      isLoading={isAuthLoading}
      authError={authError}
      isAuthModalOpen={isAuthModalOpen}
      onOpenAuthModal={() => setIsAuthModalOpen(true)}
      onCloseAuthModal={() => setIsAuthModalOpen(false)}
      onPlanUnifiedTrip={handleStartUnifiedPlanner}
      onPlanItinerary={handleStartItineraryPlanner}
      onStartPacking={handleStartPackingAssistant}
      onStartFoodFinder={handleStartFoodFinder}
      onStartAppFinder={handleStartAppFinder}
      onStartMusicFinder={handleStartMusicFinder}
      onStartLingoFinder={handleStartLingoFinder}
      onBackToHome={handleBackToHome}
      onViewHistory={() => navigate('/history')}
      onNavigateToResult={handleNavigateToResult}
      onProfileUpdate={handleProfileUpdate}
      onGenerateItinerary={handleGenerateItinerary}
      onGeneratePackingList={handleGeneratePackingList}
      onGenerateFoodRecommendations={handleGenerateFoodRecommendations}
      onGenerateAppRecommendations={handleGenerateAppRecommendations}
      onGenerateMusicRecommendations={handleGenerateMusicRecommendations}
      onGenerateLingoGuide={handleGenerateLingoGuide}
      onGenerateUnifiedPlan={handleGenerateUnifiedPlan}
      initialQuestionnaireData={initialQuestionnaireData}
      packingRequestData={packingRequestData}
      foodRequestData={foodRequestData}
      appRequestData={appRequestData}
      musicRequestData={musicRequestData}
      lingoRequestData={lingoRequestData}
      isFormLoading={isLoading}
      formError={error}
      streamedText={streamedText}
      itinerary={itinerary}
      packingList={packingList}
      foodRecommendations={foodRecommendations}
      appRecommendations={appRecommendations}
      musicRecommendations={musicRecommendations}
      lingoRecommendations={lingoRecommendations}
      unifiedPlan={unifiedPlan}
      unifiedPlanLoadingStatus={unifiedPlanLoadingStatus}
      unifiedStepErrors={unifiedStepErrors}
      questionnaireDataForUnifiedPlan={questionnaireDataForUnifiedPlan}
      itineraryStreamedText={itineraryStreamedText}
      isHistoryView={isHistoryView}
    />;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
  <Header user={user} onLogout={handleLogout} onEditProfile={handleEditProfile} onLogin={handleLogin} onSignup={handleSignup} isLoading={isAuthLoading} error={authError} isAuthModalOpen={isAuthModalOpen} onOpenAuthModal={() => setIsAuthModalOpen(true)} onCloseAuthModal={() => setIsAuthModalOpen(false)} onViewTokenUsage={() => navigate('/token-usage')} onGoToContact={() => navigate('/contact')} />
  {/* Spacer to offset the fixed header so content isn't hidden behind it */}
  <div className="h-20 md:h-24" />
  <div ref={mainContentRef} className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-0">
        {renderContent()}
        <Footer />
      </div>
      <BottomNavBar
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        user={user}
      />
      
      {/* Quick Navigation Button (Menu Toggler) - Desktop only */}
      <QuickNavButton
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />
      
      {/* Scroll to Top Button */}
      <ScrollToTopButton scrollContainerRef={mainContentRef} />
      {/* Auth modal is handled by Header via the AuthModal component */}
      <div className="hidden">
        {/* Debugging information */}
            <pre>{JSON.stringify({ currentView, user, itinerary, packingList, foodRecommendations, appRecommendations, musicRecommendations, lingoRecommendations, unifiedPlan, unifiedPlanLoadingStatus, error }, null, 2)}</pre>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;