import React, { useState, useCallback, useEffect, useRef } from 'react';
import { QuestionnaireData, PackingListRequestData, PackingList, FoodFinderRequestData, FoodRecommendations, AppFinderRequestData, AppRecommendations, MusicFinderRequestData, MusicRecommendations, LingoFinderRequestData, LingoRecommendations, QuestionnaireData as InitialQuestionnaireData, UnifiedPlan, UnifiedPlanLoadingStatus, Itinerary } from './types';
import { generateItinerary } from './services/geminiService';
import { generatePackingList } from './services/packingService';
import { generateFoodRecommendations } from './services/foodService';
import { generateAppRecommendations } from './services/appFinderService';
import { generateMusicRecommendations } from './services/musicService';
import { generateLingoGuide } from './services/lingoService';

import { authService, User } from './services/authService';

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
import LingoFinderForm from './components/LingoFinderForm';
import LingoFinderResult from './components/LingoFinderResult';
import ScrollToTopButton from './components/ScrollToTopButton';
import ContactUs from './components/ContactUs';
import Navigation from './components/Navigation';
import UnifiedResultPreview from './components/UnifiedResultPreview';
// FIX: Corrected import to reflect named export from the correct file.
import UnifiedPlannerForm from './components/UnifiedPlannerForm';
import ItineraryPreview from './components/ItineraryPreview';
import LoadingIndicator from './components/LoadingIndicator';
import Header from './components/Header';
import EditProfile from './components/EditProfile';
import QuickNavButton from './components/QuickNavButton';

// --- Bottom Nav Bar Component ---
interface BottomNavBarProps {
  onGoHome: () => void;
  onPlanTrip: () => void;
  onStartPacking: () => void;
  onStartFoodFinder: () => void;
  onStartAppFinder: () => void;
  onStartMusicFinder: () => void;
  onGoToContact: () => void;
  onOpenAuthModal: () => void;
  activeView: string;
  user: User | null;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  locked?: boolean;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  tooltip?: string;
}> = ({ icon, label, onClick, isActive, locked, tooltip }) => (
  <button
    onClick={onClick}
    title={tooltip || label}
    className={`flex flex-1 flex-col items-center justify-center pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-violet-600' : (locked ? 'text-gray-500' : 'text-slate-500 hover:text-violet-600')}`}
  >
    {icon}
    <span className="text-xs font-semibold mt-1 text-center">{label}</span>
  </button>
);

const MoreMenu: React.FC<{
    onStartAppFinder: () => void;
    onStartMusicFinder: () => void;
    onGoToContact: () => void;
    onClose: () => void;
    onOpenAuthModal: () => void;
    user: User | null;
}> = ({ onStartAppFinder, onStartMusicFinder, onGoToContact, onClose, onOpenAuthModal, user }) => {
    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    const lockedAction = user ? undefined : onOpenAuthModal;

    return (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white/95 backdrop-blur-xl border border-slate-200/70 rounded-xl shadow-lg p-2 flex flex-col z-40">
            <button onClick={() => handleAction(user ? onStartAppFinder : onOpenAuthModal)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">{user ? '📱' : '🔒'}</span>
                <span>App Finder</span>
                {!user && <span className="ml-auto text-xs text-gray-400">Sign in</span>}
            </button>
            <button onClick={() => handleAction(user ? onStartMusicFinder : onOpenAuthModal)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">{user ? '🎶' : '🔒'}</span>
                <span>Music Finder</span>
                {!user && <span className="ml-auto text-xs text-gray-400">Sign in</span>}
            </button>
            <hr className="border-slate-200/80 mx-2 my-1" />
            <button onClick={() => handleAction(onGoToContact)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">✉️</span>
                <span>Contact Us</span>
            </button>
        </div>
    );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onGoHome,
  onPlanTrip,
  onStartPacking,
  onStartFoodFinder,
  onStartAppFinder,
  onStartMusicFinder,
  onGoToContact,
  onOpenAuthModal,
  activeView,
  user,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  
  const iconClass = "h-6 w-6";
  const lockedIcon = <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4 4 0 00-4 4v2a2 2 0 00-2 2v5a2 2 0 002 2h8a2 2 0 002-2v-5a2 2 0 00-2-2V5a4 4 0 00-4-4zm-2 6V5a2 2 0 114 0v2H8zm-3 5v2h8v-2H5z" clipRule="evenodd" /></svg>;

  const handleAction = useCallback((action: () => void, isLocked: boolean) => {
    if (isLocked) {
      onOpenAuthModal();
    } else {
      action();
    }
    setIsMoreMenuOpen(false); // Close menu on any action
  }, [onOpenAuthModal]);

  const navItems = [
    { ids: ['landing'], label: 'Home', icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>, action: onGoHome, locked: false },
    { ids: ['unifiedPlannerForm', 'questionnaire'], label: 'Plan Trip', icon: user ? <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 13.5l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 18l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 21.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 18l1.035-.259a3.375 3.375 0 002.456-2.456L18 13.5z" /></svg> : lockedIcon, action: onPlanTrip, locked: !user, tooltip: user ? undefined : 'Sign in to unlock' },
    { ids: ['packingAssistantForm'], label: 'Packing', icon: user ? <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a3 3 0 00-3 3v1H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-2V5a3 3 0 00-3-3zm-1 4a1 1 0 10-2 0v1h2V6z" clipRule="evenodd" /></svg> : lockedIcon, action: onStartPacking, locked: !user, tooltip: user ? undefined : 'Sign in to unlock' },
    { ids: ['foodFinderForm'], label: 'Food', icon: user ? <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1.088A7 7 0 004.53 10.756.5.5 0 005 11h10a.5.5 0 00.47-.244A7 7 0 0011 4.088V3z" /><path fillRule="evenodd" d="M15 13a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h10z" clipRule="evenodd" /></svg> : lockedIcon, action: onStartFoodFinder, locked: !user, tooltip: user ? undefined : 'Sign in to unlock' },
  ];
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
            setIsMoreMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMoreSectionActive = ['contact', 'appFinderForm', 'musicFinderForm'].includes(activeView);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden no-print">
      <div className="w-full bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)]">
        <div className="flex items-stretch h-16">
          {navItems.map(item => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              onClick={() => handleAction(item.action, item.locked)}
              isActive={item.ids.includes(activeView)}
              locked={item.locked}
              tooltip={item.tooltip}
            />
          ))}
          <div ref={moreMenuRef} className="relative flex-1">
            {isMoreMenuOpen && (
                <MoreMenu
                    onStartAppFinder={onStartAppFinder}
                    onStartMusicFinder={onStartMusicFinder}
                    onGoToContact={onGoToContact}
                    onClose={() => setIsMoreMenuOpen(false)}
                    onOpenAuthModal={onOpenAuthModal}
                    user={user}
                />
            )}
            <button
                onClick={() => setIsMoreMenuOpen(prev => !prev)}
                className={`flex flex-col items-center justify-center w-full h-full pt-2 pb-1 transition-colors duration-200 ${isMoreMenuOpen || isMoreSectionActive ? 'text-violet-600' : 'text-slate-500 hover:text-violet-600'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <span className="text-xs font-semibold mt-1">More</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


type View = 'landing' | 'questionnaire' | 'itineraryResult' | 'packingAssistantForm' | 'packingAssistantResult' | 'foodFinderForm' | 'foodFinderResult' | 'appFinderForm' | 'appFinderResult' | 'musicFinderForm' | 'musicFinderResult' | 'lingoFinderForm' | 'lingoFinderResult' | 'contact' | 'unifiedPlannerForm' | 'unifiedResult' | 'editProfile';

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


const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  
  // State for individual mini-apps
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [foodRecommendations, setFoodRecommendations] = useState<FoodRecommendations | null>(null);
  const [appRecommendations, setAppRecommendations] = useState<AppRecommendations | null>(null);
  const [musicRecommendations, setMusicRecommendations] = useState<MusicRecommendations | null>(null);
  const [lingoRecommendations, setLingoRecommendations] = useState<LingoRecommendations | null>(null);
  
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
  const isFormView = formViews.includes(view);

  // Initialize authentication state
  useEffect(() => {
    console.log('App: useEffect for user initialization called');
    const currentUser = authService.getCurrentUser();
    console.log('App: Retrieved currentUser from authService:', currentUser);
    setUser(currentUser);
    console.log('App: User state set to:', currentUser);
  }, []);

  // Authentication handlers
  const handleLogin = async (email: string, password: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      setIsAuthModalOpen(false); // Close modal on successful login
      handleViewChange('landing'); // Redirect to landing page
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed');
      setIsAuthModalOpen(true); // Keep modal open to display error
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignup = async (full_name: string, email: string, password: string, confirmPassword: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const response = await authService.signup({ full_name, email, password, confirmPassword });
      setUser(response.user);
      setIsAuthModalOpen(false); // Close modal on successful signup
      handleViewChange('landing'); // Redirect to landing page
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Signup failed');
      setIsAuthModalOpen(true); // Keep modal open to display error
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setAuthError(null);
    handleViewChange('landing'); // Redirect to landing page on logout
  };

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

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const user = urlParams.get('user');
    const error = urlParams.get('error');

    if (token && user) {
      try {
        const userData = JSON.parse(decodeURIComponent(user));
        // Store the token and user data
        localStorage.setItem('planora_token', token);
        localStorage.setItem('planora_user', JSON.stringify(userData));
        
        // Update the app state
        setUser(userData);
        setAuthError(null);
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to landing page
        handleViewChange('landing');
      } catch (error) {
        console.error('Error parsing user data from Google OAuth:', error);
        setAuthError('Failed to process Google authentication');
      }
    } else if (error) {
      setAuthError(decodeURIComponent(error));
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [handleViewChange]);

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
      handleViewChange('unifiedPlannerForm');
    }, [handleViewChange]);
  
  const handleStartItineraryPlanner = useCallback(() => {
    setInitialQuestionnaireData(createInitialData());
    handleViewChange('questionnaire');
  }, [handleViewChange]);

  const handleStartPackingAssistant = useCallback(() => {
    setPackingRequestData(null);
    handleViewChange('packingAssistantForm');
  }, [handleViewChange]);

  const handleStartFoodFinder = useCallback(() => {
    setFoodRequestData(null);
    handleViewChange('foodFinderForm');
  }, [handleViewChange]);

  const handleStartAppFinder = useCallback(() => {
    setAppRequestData(null);
    handleViewChange('appFinderForm');
  }, [handleViewChange]);

  const handleStartMusicFinder = useCallback(() => {
    setMusicRequestData(null);
    handleViewChange('musicFinderForm');
  }, [handleViewChange]);

  const handleStartLingoFinder = useCallback(() => {
    setLingoRequestData(null);
    handleViewChange('lingoFinderForm');
  }, [handleViewChange]);

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
    handleViewChange('landing');
  }, [handleViewChange]);

  const handleEditProfile = useCallback(() => {
    handleViewChange('editProfile');
  }, [handleViewChange]);

  const handleProfileUpdate = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    // Update localStorage with new user data
    localStorage.setItem('planora_user', JSON.stringify(updatedUser));
  }, []);
  
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

    if (view === 'itineraryResult' || view === 'packingAssistantResult' || view === 'foodFinderResult' || view === 'appFinderResult' || view === 'musicFinderResult' || view === 'lingoFinderResult') {
        simplePlanCancellationFlag.current = true;
    }

    const formViews: Partial<Record<View, View>> = {
      'itineraryResult': 'questionnaire',
      'packingAssistantResult': 'packingAssistantForm',
      'foodFinderResult': 'foodFinderForm',
      'appFinderResult': 'appFinderForm',
      'musicFinderResult': 'musicFinderForm',
      'lingoFinderResult': 'lingoFinderForm',
    };
    
    const targetView = formViews[view] || 'landing';
    handleViewChange(targetView as View);

  }, [view, handleViewChange]);

  const handleGenerateItinerary = useCallback(async (data: QuestionnaireData) => {
    setInitialQuestionnaireData(data);
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    handleViewChange('itineraryResult');
    
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
                }
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
        handleViewChange('questionnaire');
    }
    
    setIsLoading(false);
    setItineraryAttemptCount(0);
  }, [handleViewChange]);
  
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
            if (view !== 'unifiedResult' || !questionnaireDataForUnifiedPlan) return;
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
                        }
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
    }, [view, questionnaireDataForUnifiedPlan, unifiedPlanLoadingStatus.itinerary]);

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
                lingo: {
                    generator: () => {
                       const lingoData: LingoFinderRequestData = { destination: data.destination, language: data.language };
                       return generateLingoGuide(lingoData);
                    },
                    onSuccess: (result) => setUnifiedPlan(prev => ({ ...prev, lingoRecommendations: result })),
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

        if (view === 'unifiedResult' && unifiedPlan.itinerary && unifiedPlanLoadingStatus.itinerary === 'done') {
            runParallelSteps();
        }
    }, [view, unifiedPlan.itinerary, unifiedPlanLoadingStatus.itinerary, questionnaireDataForUnifiedPlan, generateStep]);


  const handleGenerateUnifiedPlan = useCallback(async (data: QuestionnaireData) => {
    setInitialQuestionnaireData(data);
    setQuestionnaireDataForUnifiedPlan(data);
    setUnifiedPlan({ itinerary: null, packingList: null, foodRecommendations: null, appRecommendations: null, musicRecommendations: null, lingoRecommendations: null });
    setError(null);
    setItineraryStreamedText('');
    setItineraryAttemptCount(0);
    setUnifiedStepErrors({});
    cancellationFlags.current = {};
    handleViewChange('unifiedResult');
    // This state change will trigger the pipeline `useEffect`
    setUnifiedPlanLoadingStatus({ itinerary: 'pending', packing: 'pending', food: 'pending', apps: 'pending', music: 'pending', lingo: 'pending' });
  }, [handleViewChange]);

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


  const handleGeneratePackingList = useCallback(async (data: PackingListRequestData) => {
    setPackingRequestData(data);
    setIsLoading(true);
    setError(null);
    setPackingList(null);
    handleViewChange('packingAssistantResult');

    simplePlanCancellationFlag.current = false;
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        setMiniAppAttemptCount(attempt);
        setStreamedText('');

        if (simplePlanCancellationFlag.current) break;

        try {
            const result = await generatePackingList(data, (chunk) => {
                if (simplePlanCancellationFlag.current) throw new Error("Cancelled");
                setStreamedText(prev => prev + chunk);
            });
            
            if (simplePlanCancellationFlag.current) break;

            setPackingList(result);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMiniAppAttemptCount(0);
            setIsLoading(false);
            return;

        } catch (e) {
            lastError = e instanceof Error ? e : new Error('An unknown error occurred');
            console.error(`Attempt ${attempt} for packing list failed:`, lastError);
            
            if (lastError.message === "Cancelled") break;
            if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    
    if (!simplePlanCancellationFlag.current && lastError) {
        setError(lastError.message);
        handleViewChange('packingAssistantForm');
    }
    
    setIsLoading(false);
    setMiniAppAttemptCount(0);
}, [handleViewChange]);

  const handleGenerateFoodRecommendations = useCallback(async (data: FoodFinderRequestData) => {
    setFoodRequestData(data);
    setIsLoading(true);
    setError(null);
    setFoodRecommendations(null);
    handleViewChange('foodFinderResult');
    
    simplePlanCancellationFlag.current = false;
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        setMiniAppAttemptCount(attempt);
        setStreamedText('');

        if (simplePlanCancellationFlag.current) break;

        try {
            const result = await generateFoodRecommendations(data, (chunk) => {
                if (simplePlanCancellationFlag.current) throw new Error("Cancelled");
                setStreamedText(prev => prev + chunk)
            });
            
            if (simplePlanCancellationFlag.current) break;

            setFoodRecommendations(result);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMiniAppAttemptCount(0);
            setIsLoading(false);
            return;

        } catch (e) {
            lastError = e instanceof Error ? e : new Error('An unknown error occurred');
            console.error(`Attempt ${attempt} for food recommendations failed:`, lastError);
            
            if (lastError.message === "Cancelled") break;
            if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    
    if (!simplePlanCancellationFlag.current && lastError) {
        setError(lastError.message);
        handleViewChange('foodFinderForm');
    }
    
    setIsLoading(false);
    setMiniAppAttemptCount(0);
}, [handleViewChange]);
  
  const handleGenerateAppRecommendations = useCallback(async (data: AppFinderRequestData) => {
    setAppRequestData(data);
    setIsLoading(true);
    setError(null);
    setAppRecommendations(null);
    handleViewChange('appFinderResult');
    
    simplePlanCancellationFlag.current = false;
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        setMiniAppAttemptCount(attempt);
        setStreamedText('');

        if (simplePlanCancellationFlag.current) break;

        try {
            const result = await generateAppRecommendations(data, (chunk) => {
                if (simplePlanCancellationFlag.current) throw new Error("Cancelled");
                setStreamedText(prev => prev + chunk)
            });
            
            if (simplePlanCancellationFlag.current) break;

            setAppRecommendations(result);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMiniAppAttemptCount(0);
            setIsLoading(false);
            return;

        } catch (e) {
            lastError = e instanceof Error ? e : new Error('An unknown error occurred');
            console.error(`Attempt ${attempt} for app recommendations failed:`, lastError);
            
            if (lastError.message === "Cancelled") break;
            if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    
    if (!simplePlanCancellationFlag.current && lastError) {
        setError(lastError.message);
        handleViewChange('appFinderForm');
    }
    
    setIsLoading(false);
    setMiniAppAttemptCount(0);
}, [handleViewChange]);
  
  const handleGenerateMusicRecommendations = useCallback(async (data: MusicFinderRequestData) => {
    setMusicRequestData(data);
    setIsLoading(true);
    setError(null);
    setMusicRecommendations(null);
    handleViewChange('musicFinderResult');
    
    simplePlanCancellationFlag.current = false;
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        setMiniAppAttemptCount(attempt);
        setStreamedText('');

        if (simplePlanCancellationFlag.current) break;

        try {
            const result = await generateMusicRecommendations(data, (chunk) => {
                if (simplePlanCancellationFlag.current) throw new Error("Cancelled");
                setStreamedText(prev => prev + chunk)
            });
            
            if (simplePlanCancellationFlag.current) break;

            setMusicRecommendations(result);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMiniAppAttemptCount(0);
            setIsLoading(false);
            return;

        } catch (e) {
            lastError = e instanceof Error ? e : new Error('An unknown error occurred');
            console.error(`Attempt ${attempt} for music recommendations failed:`, lastError);
            
            if (lastError.message === "Cancelled") break;
            if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    
    if (!simplePlanCancellationFlag.current && lastError) {
        setError(lastError.message);
        handleViewChange('musicFinderForm');
    }
    
    setIsLoading(false);
    setMiniAppAttemptCount(0);
}, [handleViewChange]);
  
  const handleGenerateLingoGuide = useCallback(async (data: LingoFinderRequestData) => {
    setLingoRequestData(data);
    setIsLoading(true);
    setError(null);
    setLingoRecommendations(null);
    handleViewChange('lingoFinderResult');
    
    simplePlanCancellationFlag.current = false;
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        setMiniAppAttemptCount(attempt);
        setStreamedText('');

        if (simplePlanCancellationFlag.current) break;

        try {
            const result = await generateLingoGuide(data, (chunk) => {
                if (simplePlanCancellationFlag.current) throw new Error("Cancelled");
                setStreamedText(prev => prev + chunk)
            });
            
            if (simplePlanCancellationFlag.current) break;

            setLingoRecommendations(result);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMiniAppAttemptCount(0);
            setIsLoading(false);
            return;

        } catch (e) {
            lastError = e instanceof Error ? e : new Error('An unknown error occurred');
            console.error(`Attempt ${attempt} for lingo guide failed:`, lastError);
            
            if (lastError.message === "Cancelled") break;
            if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    
    if (!simplePlanCancellationFlag.current && lastError) {
        setError(lastError.message);
        handleViewChange('lingoFinderForm');
    }
    
    setIsLoading(false);
    setMiniAppAttemptCount(0);
}, [handleViewChange]);


  const renderContent = () => {
    if (isLoading) {
      let loadingProps;
      switch (view) {
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

    if (view === 'unifiedResult') {
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
        />;
    }

    switch (view) {
      case 'landing':
        return (
            <LandingPage user={user} onPlanUnifiedTrip={handleStartUnifiedPlanner} onPlanItinerary={handleStartItineraryPlanner} onStartPacking={handleStartPackingAssistant} onStartFoodFinder={handleStartFoodFinder} onStartAppFinder={handleStartAppFinder} onStartMusicFinder={handleStartMusicFinder} onStartLingoFinder={handleStartLingoFinder} onOpenAuthModal={() => setIsAuthModalOpen(true)} />
        );
      case 'unifiedPlannerForm':
        return <UnifiedPlannerForm onSubmit={handleGenerateUnifiedPlan} initialData={initialQuestionnaireData} onBack={handleBackToHome} error={error} />;
      case 'questionnaire':
        return <Questionnaire onSubmit={handleGenerateItinerary} isLoading={false} error={error} initialData={initialQuestionnaireData} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} />;
      case 'itineraryResult':
        if (itinerary) return <ItineraryPreview itinerary={itinerary} onRegenerate={() => handleViewChange('questionnaire')} />;
        break;
      case 'packingAssistantForm':
        return <PackingAssistantForm onSubmit={handleGeneratePackingList} isLoading={false} error={error} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} initialData={packingRequestData} />;
      case 'packingAssistantResult':
        if (packingList) return <PackingListPreview packingList={packingList} onRegenerate={() => handleViewChange('packingAssistantForm')} />;
        break;
      case 'foodFinderForm':
        return <FoodFinderForm onSubmit={handleGenerateFoodRecommendations} isLoading={false} error={error} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} initialData={foodRequestData} />;
      case 'foodFinderResult':
        if (foodRecommendations) return <FoodFinderResult recommendations={foodRecommendations} onRegenerate={() => handleViewChange('foodFinderForm')} />;
        break;
      case 'appFinderForm':
        return <AppFinderForm onSubmit={handleGenerateAppRecommendations} isLoading={false} error={error} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} initialData={appRequestData} />;
      case 'appFinderResult':
        if (appRecommendations) return <AppFinderResult recommendations={appRecommendations} onRegenerate={() => handleViewChange('appFinderForm')} />;
        break;
      case 'musicFinderForm':
        return <MusicFinderForm onSubmit={handleGenerateMusicRecommendations} isLoading={false} error={error} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} initialData={musicRequestData} />;
      case 'musicFinderResult':
        if (musicRecommendations) return <MusicFinderResult recommendations={musicRecommendations} onRegenerate={() => handleViewChange('musicFinderForm')} />;
        break;
      case 'lingoFinderForm':
        return <LingoFinderForm onSubmit={handleGenerateLingoGuide} isLoading={false} error={error} onBack={handleBackToHome} onCancel={handleCancelGeneration} streamedText={streamedText} initialData={lingoRequestData} />;
      case 'lingoFinderResult':
        if (lingoRecommendations) return <LingoFinderResult recommendations={lingoRecommendations} onRegenerate={() => handleViewChange('lingoFinderForm')} />;
        break;
      case 'contact':
        return <ContactUs onBack={handleBackToHome} />;
      case 'editProfile':
        return <EditProfile user={user!} onBack={handleBackToHome} onProfileUpdate={handleProfileUpdate} />;
    }
    
    // Fallback for any unhandled case or error state where data is null
    return (
        <LandingPage user={user} onPlanUnifiedTrip={handleStartUnifiedPlanner} onPlanItinerary={handleStartItineraryPlanner} onStartPacking={handleStartPackingAssistant} onStartFoodFinder={handleStartFoodFinder} onStartAppFinder={handleStartAppFinder} onStartMusicFinder={handleStartMusicFinder} onStartLingoFinder={handleStartLingoFinder} onOpenAuthModal={() => setIsAuthModalOpen(true)} />
    );
  };

  return (
    <>
      <div className="page-content-wrapper">
        {view === 'landing' && (
          <Header 
            user={user}
            onLogin={handleLogin}
            onSignup={handleSignup}
            onLogout={handleLogout}
            onEditProfile={handleEditProfile}
            isLoading={isAuthLoading}
            error={authError}
            isAuthModalOpen={isAuthModalOpen}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onCloseAuthModal={() => setIsAuthModalOpen(false)}
          />
        )}
        <div ref={mainContentRef} className="min-h-screen">
          <main className={`container mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-8 relative ${view === 'landing' ? 'pt-32' : 'pt-8'}`}>
              {renderContent()}
          </main>
        </div>
      </div>
      
      {view !== 'unifiedResult' && !isLoading && (
        <Navigation
            onGoHome={handleBackToHome}
            onGoToContact={() => handleViewChange('contact')}
            onPlanTrip={() => handleStartUnifiedPlanner()}
            onStartItineraryPlanner={handleStartItineraryPlanner}
            onStartPacking={handleStartPackingAssistant}
            onStartFoodFinder={handleStartFoodFinder}
            onStartAppFinder={handleStartAppFinder}
            onStartMusicFinder={handleStartMusicFinder}
            onStartLingoFinder={handleStartLingoFinder}
            activeView={view}
            isFormView={isFormView}
        />
      )}
      {view !== 'unifiedResult' && (
        <>
            <QuickNavButton
              user={user}
              onGoHome={handleBackToHome}
              onGoToContact={() => handleViewChange('contact')}
              onPlanTrip={handleStartUnifiedPlanner}
              onPlanItinerary={handleStartItineraryPlanner}
              onStartPacking={() => handleViewChange('packingAssistantForm')}
              onStartFoodFinder={() => handleViewChange('foodFinderForm')}
              onStartAppFinder={() => handleViewChange('appFinderForm')}
              onStartMusicFinder={() => handleViewChange('musicFinderForm')}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
            <BottomNavBar
              onGoHome={handleBackToHome}
              onGoToContact={() => handleViewChange('contact')}
              onPlanTrip={handleStartUnifiedPlanner}
              onStartPacking={() => handleViewChange('packingAssistantForm')}
              onStartFoodFinder={() => handleViewChange('foodFinderForm')}
              onStartAppFinder={() => handleViewChange('appFinderForm')}
              onStartMusicFinder={() => handleViewChange('musicFinderForm')}
              activeView={view}
              user={user}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
        </>
      )}
      <ScrollToTopButton isUnifiedView={view === 'unifiedResult'} />
    </>
  );
};

export default App;
