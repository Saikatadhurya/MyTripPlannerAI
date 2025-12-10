import React, { useState, useEffect, useRef } from 'react';
import { Vibe, QuestionnaireData, Budget, FoodPreference, TripType, UnifiedPlanComponent } from '../types';
import { User } from '../services/authService';
import { searchWeekendPackages, WeekendPackage, WeekendExplorerRequest } from '../services/weekendExplorerService';
import { getDestinationSuggestions } from '../services/geminiService';
import { LocationSuggestion } from '../types';
import { currencies } from '../data/currencies';
import BackToHomeButton from './BackToHomeButton';

const budgets: Budget[] = ['Low Budget', 'Midrange', 'Luxury'];
const tripTypes: { label: TripType; icon: string }[] = [
  { label: 'Standard', icon: '✈️' },
  { label: 'Car', icon: '🚗' },
  { label: 'Bike', icon: '🏍️' },
];
const unifiedPlanComponents: { label: UnifiedPlanComponent; icon: string; description: string }[] = [
  { label: 'packing', icon: '🎒', description: 'packing list and essentials' },
  { label: 'food', icon: '🍽️', description: 'restaurant and food recommendations' },
  { label: 'apps', icon: '📱', description: 'useful travel apps' },
  { label: 'music', icon: '🎵', description: 'local music playlists' },
  { label: 'lingo', icon: '🗣️', description: 'language guide and phrases' },
];

// Get component-specific colors for selection
const getComponentColor = (component: UnifiedPlanComponent) => {
  const colors = {
    packing: { bg: 'bg-violet-100/70', border: 'border-violet-500', hover: 'hover:border-violet-400' },
    food: { bg: 'bg-orange-100/70', border: 'border-orange-500', hover: 'hover:border-orange-400' },
    apps: { bg: 'bg-teal-100/70', border: 'border-teal-500', hover: 'hover:border-teal-400' },
    music: { bg: 'bg-fuchsia-100/70', border: 'border-fuchsia-500', hover: 'hover:border-fuchsia-400' },
    lingo: { bg: 'bg-sky-100/70', border: 'border-sky-500', hover: 'hover:border-sky-400' },
  };
  return colors[component] || colors.packing;
};

const Toggle: React.FC<{ label: string; description: string; enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ label, description, enabled, onChange }) => (
  <button 
    type="button"
    onClick={() => onChange(!enabled)}
    className={`w-full flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${enabled ? 'bg-violet-100/70 border-violet-500' : 'bg-white/40 border-white/40 hover:bg-white/60'}`}
    role="switch"
    aria-checked={enabled}
  >
    <div className="text-left">
      <p className="font-semibold text-slate-800">{label}</p>
      <p className="text-xs sm:text-sm text-slate-600">{description}</p>
    </div>
    <div className={`w-12 h-6 flex items-center rounded-full transition-colors duration-300 ${enabled ? 'bg-violet-500' : 'bg-slate-300'}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
    </div>
  </button>
);

interface WeekendExplorerProps {
  user: User | null;
  onGenerateUnifiedPlan: (data: QuestionnaireData) => void;
  onBack: () => void;
  onOpenAuthModal: () => void;
}

const vibes: { label: Vibe; icon: string; description: string }[] = [
  { label: 'Adventure & Thrill', icon: '🧗', description: 'trekking, hiking, rafting, outdoor challenges' },
  { label: 'Relaxation & Wellness', icon: '🏖️', description: 'beaches, spas, retreats, slow travel' },
  { label: 'Cultural & Heritage', icon: '🏛️', description: 'history, monuments, traditions, local art' },
  { label: 'Nature & Wildlife', icon: '🌿', description: 'mountains, forests, safaris, eco-travel' },
  { label: 'Food & Culinary', icon: '🍲', description: 'local cuisines, street food, fine dining' },
  { label: 'Nightlife & Entertainment', icon: '🎶', description: 'parties, clubs, festivals, concerts' },
  { label: 'Shopping & Style', icon: '🛍️', description: 'markets, malls, boutiques, fashion districts' },
  { label: 'Romantic & Family Getaways', icon: '❤️', description: 'honeymoons, bonding trips, safe family travel' },
];

const languages = [
  'Afrikaans (af)', 'Akan (ak)', 'Albanian (sq)', 'Amharic (am)', 'Arabic (ar)', 'Armenian (hy)', 'Assamese (as)', 'Aymara (ay)', 'Azerbaijani (az)', 
  'Bambara (bm)', 'Basque (eu)', 'Belarusian (be)', 'Bengali (bn)', 'Bhojpuri (bho)', 'Bosnian (bs)', 'Bulgarian (bg)', 'Catalan (ca)', 'Cebuano (ceb)', 'Chinese (Simplified) (zh-CN)', 'Chinese (Traditional) (zh-TW)', 'Corsican (co)', 'Croatian (hr)', 'Czech (cs)', 'Danish (da)', 'Dhivehi (dv)', 'Dogri (doi)', 'Dutch (nl)', 'English (en)', 'Esperanto (eo)', 'Estonian (et)', 'Ewe (ee)', 'Filipino (Tagalog) (fil)', 'Finnish (fi)', 'French (fr)', 'Frisian (fy)', 'Galician (gl)', 'Ganda (lg)', 'Georgian (ka)', 'German (de)', 'Goan Konkani (gom)', 'Greek (el)', 'Guarani (gn)', 'Gujarati (gu)', 'Haitian Creole (ht)', 'Hausa (ha)', 'Hawaiian (haw)', 'Hebrew (iw)', 'Hindi (hi)', 'Hmong (hmn)', 'Hungarian (hu)', 'Icelandic (is)', 'Igbo (ig)', 'Ilocano (ilo)', 'Indonesian (id)', 'Irish (ga)', 'Italian (it)', 'Japanese (ja)', 'Javanese (jv)', 'Kannada (kn)', 'Kazakh (kk)', 'Khmer (km)', 'Kinyarwanda (rw)', 'Korean (ko)', 'Krio (kri)', 'Kurdish (ku)', 'Kurdish (Sorani) (ckb)', 'Kyrgyz (ky)', 'Lao (lo)', 'Latin (la)', 'Latvian (lv)', 'Lingala (ln)', 'Lithuanian (lt)', 'Luganda (lg)', 'Luxembourgish (lb)', 'Macedonian (mk)', 'Maithili (mai)', 'Malagasy (mg)', 'Malay (ms)', 'Malayalam (ml)', 'Maltese (mt)', 'Maori (mi)', 'Marathi (mr)', 'Meiteilon (Manipuri) (mni-Mtei)', 'Mizo (lus)', 'Mongolian (mn)', 'Myanmar (Burmese) (my)', 'Nepali (ne)', 'Norwegian (no)', 'Nyanja (Chichewa) (ny)', 'Odia (Oriya) (or)', 'Oromo (om)', 'Pashto (ps)', 'Persian (fa)', 'Polish (pl)', 'Portuguese (Brazil) (pt-BR)', 'Portuguese (Portugal) (pt-PT)', 'Punjabi (pa)', 'Quechua (qu)', 'Romanian (ro)', 'Russian (ru)', 'Samoan (sm)', 'Sanskrit (sa)', 'Scots Gaelic (gd)', 'Sepedi (nso)', 'Serbian (sr)', 'Sesotho (st)', 'Shona (sn)', 'Sindhi (sd)', 'Sinhala (si)', 'Slovak (sk)', 'Slovenian (sl)', 'Somali (so)', 'Spanish (es)', 'Sundanese (su)', 'Swahili (sw)', 'Swedish (sv)', 'Tagalog (Filipino) (tl)', 'Tajik (tg)', 'Tamil (ta)', 'Tatar (tt)', 'Telugu (te)', 'Thai (th)', 'Tigrinya (ti)', 'Tsonga (ts)', 'Turkish (tr)', 'Turkmen (tk)', 'Ukrainian (uk)', 'Urdu (ur)', 'Uyghur (ug)', 'Uzbek (uz)', 'Vietnamese (vi)', 'Welsh (cy)', 'Xhosa (xh)', 'Yiddish (yi)', 'Yoruba (yo)', 'Zulu (zu)',
];

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const WeekendExplorer: React.FC<WeekendExplorerProps> = ({ user, onGenerateUnifiedPlan, onBack, onOpenAuthModal }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Default to next Saturday
  const getNextSaturday = () => {
    const nextSat = new Date(today);
    const dayOfWeek = nextSat.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    nextSat.setDate(nextSat.getDate() + daysUntilSaturday);
    return nextSat;
  };

  // Load saved state from sessionStorage
  const loadSavedState = () => {
    try {
      const saved = sessionStorage.getItem('weekendExplorerState');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          travelers: parsed.travelers || 2,
          selectedVibes: parsed.selectedVibes || ['Adventure & Thrill'],
          budget: parsed.budget || 'Midrange',
          tripType: parsed.tripType || 'Standard',
          isRoundTrip: parsed.isRoundTrip !== undefined ? parsed.isRoundTrip : true, // Default to true for round trip
          startPoint: parsed.startPoint || '',
          isStartPointSelected: parsed.isStartPointSelected || false,
          language: parsed.language || 'English (en)',
          currency: parsed.currency || 'India (INR) – ₹',
          startDate: parsed.startDate || formatDateLocal(getNextSaturday()),
          packages: parsed.packages || [],
          hasSearched: parsed.hasSearched || false,
          selectedComponents: parsed.selectedComponents || ['packing', 'food', 'apps', 'music', 'lingo'], // All components preselected by default
        };
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
    return null;
  };

  const savedState = loadSavedState();

  const [travelers, setTravelers] = useState(savedState?.travelers || 2);
  const [selectedVibes, setSelectedVibes] = useState<Vibe[]>(savedState?.selectedVibes || ['Adventure & Thrill']);
  const [budget, setBudget] = useState<Budget>(savedState?.budget || 'Midrange');
  const [tripType, setTripType] = useState<TripType>(savedState?.tripType || 'Standard');
  const [isRoundTrip, setIsRoundTrip] = useState(savedState?.isRoundTrip !== undefined ? savedState.isRoundTrip : true); // Default to true
  const [startPoint, setStartPoint] = useState(savedState?.startPoint || '');
  const [startPointSuggestions, setStartPointSuggestions] = useState<LocationSuggestion[]>([]);
  const [isStartPointSuggestionsLoading, setIsStartPointSuggestionsLoading] = useState(false);
  const [isStartPointSelected, setIsStartPointSelected] = useState(savedState?.isStartPointSelected || false);
  const [startPointError, setStartPointError] = useState<string | null>(null);
  const [startPointApiKeyError, setStartPointApiKeyError] = useState<string | null>(null);
  const [language, setLanguage] = useState(savedState?.language || 'English (en)');
  const [currency, setCurrency] = useState(savedState?.currency || 'India (INR) – ₹');
  const [startDate, setStartDate] = useState(savedState?.startDate || formatDateLocal(getNextSaturday()));
  const [packages, setPackages] = useState<WeekendPackage[]>(savedState?.packages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(savedState?.hasSearched || false);
  const [selectedComponents, setSelectedComponents] = useState<UnifiedPlanComponent[]>(savedState?.selectedComponents || ['packing', 'food', 'apps', 'music', 'lingo']); // All components preselected by default

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingSuggestion = useRef(false);
  const startPointSuggestionsRef = useRef<HTMLUListElement>(null);
  const startPointInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  
  // Language and Currency dropdown state
  const [langSearchTerm, setLangSearchTerm] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [currencySearchTerm, setCurrencySearchTerm] = useState('');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  const handleVibeToggle = (vibe: Vibe) => {
    setSelectedVibes(prev => 
      prev.includes(vibe) 
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe]
    );
  };

  const handleComponentToggle = (component: UnifiedPlanComponent) => {
    setSelectedComponents(prev => 
      prev.includes(component)
        ? prev.filter(c => c !== component)
        : [...prev, component]
    );
  };

  const handleTripTypeChange = (newTripType: TripType) => {
    setTripType(newTripType);
    // All trip types (Standard, Car, Bike) are automatically round trips
    setIsRoundTrip(true);
    if (!startPoint) {
      // If start point is empty, clear selection state
      setIsStartPointSelected(false);
      setStartPointError(null);
    }
  };

  const handleStartPointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartPoint(value);
    setIsStartPointSelected(false);
    setStartPointError(null);
    setStartPointApiKeyError(null);
    isSelectingSuggestion.current = false;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (value.trim().length > 1) {
      // Check if user is logged in before searching
      // Use user from state, or try to get from localStorage as fallback (for Google OAuth)
      let currentUser = user;
      if (!currentUser) {
        try {
          const storedUser = localStorage.getItem('planora_user');
          if (storedUser) {
            currentUser = JSON.parse(storedUser);
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      if (!currentUser) {
        onOpenAuthModal();
        return;
      }
      
      setIsStartPointSuggestionsLoading(true);
      debounceTimeout.current = setTimeout(() => {
        if (!isSelectingSuggestion.current) {
          getDestinationSuggestions(value, currentUser?.gemini_api_key).then(results => {
            setStartPointSuggestions(results);
            setIsStartPointSuggestionsLoading(false);
            setStartPointApiKeyError(null); // Clear any previous API key errors
          }).catch(error => {
            setStartPointSuggestions([]);
            setIsStartPointSuggestionsLoading(false);
            
            // Check if it's a quota/API key error - handle ApiError format
            const errorMessage = error?.message || error?.error?.message || '';
            const errorString = JSON.stringify(error || {});
            const nestedError = error?.error;
            const nestedErrorCode = nestedError?.code;
            const nestedErrorStatus = nestedError?.status;
            
            // Extract error code from nested structure (ApiError format)
            const errorCode = nestedErrorCode || error?.code || (nestedErrorStatus === 'RESOURCE_EXHAUSTED' ? 429 : null);
            
            // Check for quota/exhaustion errors
            const combinedErrorText = (errorMessage + errorString).toLowerCase();
            const isQuotaError = errorCode === 429 || 
                                nestedErrorStatus === 'RESOURCE_EXHAUSTED' ||
                                errorMessage.includes('[429]') || 
                                combinedErrorText.includes('quota') || 
                                combinedErrorText.includes('rate limit') ||
                                combinedErrorText.includes('limit') ||
                                combinedErrorText.includes('exceeded') ||
                                combinedErrorText.includes('resource_exhausted');
            
            if (isQuotaError) {
              // Extract message without [429] prefix
              const cleanMessage = errorMessage.replace(/^\[429\]\s*/, '');
              setStartPointApiKeyError(cleanMessage || 'Your Gemini API key has reached its quota limit. Please set a new Gemini API key in your profile settings to continue.');
            } else if (errorMessage.includes('Gemini key not set') || errorMessage.includes('API key not valid')) {
              setStartPointApiKeyError('API key not valid. Please provide a valid Gemini API key in your profile settings to search for destinations.');
            } else {
              setStartPointApiKeyError('Failed to fetch destination suggestions. Please try again.');
            }
          });
        }
      }, 500);
    } else {
      setStartPointSuggestions([]);
      setIsStartPointSuggestionsLoading(false);
    }
  };

  const handleStartPointSelect = (suggestion: LocationSuggestion) => {
    isSelectingSuggestion.current = true;
    const fullName = suggestion.parentHierarchy ? `${suggestion.name}, ${suggestion.parentHierarchy}` : suggestion.name;
    setStartPoint(fullName);
    setIsStartPointSelected(true);
    setStartPointError(null);
    setStartPointApiKeyError(null);
    setStartPointSuggestions([]);
    setIsStartPointSuggestionsLoading(false);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
  };

  const handleStartPointBlur = () => {
    setTimeout(() => {
      if (!isSelectingSuggestion.current && startPoint.trim().length > 0 && !isStartPointSelected) {
        setStartPointError("Please select your starting point from the list. 📍");
      }
      isSelectingSuggestion.current = false;
    }, 200);
  };

  const handleReset = () => {
    // Clear all form fields
    setTravelers(2);
    setSelectedVibes(['Adventure & Thrill']);
    setBudget('Midrange');
    setTripType('Standard');
    setIsRoundTrip(true);
    setStartPoint('');
    setIsStartPointSelected(false);
    setLanguage('English (en)');
    setCurrency('India (INR) – ₹');
    setStartDate(formatDateLocal(getNextSaturday()));
    setSelectedComponents(['packing', 'food', 'apps', 'music', 'lingo']); // Reset to default (all components preselected)
    
    // Clear search results
    setPackages([]);
    setHasSearched(false);
    setError(null);
    
    // Clear sessionStorage
    try {
      sessionStorage.removeItem('weekendExplorerState');
    } catch (e) {
      console.error('Error clearing sessionStorage:', e);
    }
    
    // Clear suggestions
    setStartPointSuggestions([]);
  };

  // Save state to sessionStorage whenever relevant state changes
  useEffect(() => {
    if (hasSearched && packages.length > 0) {
      try {
        sessionStorage.setItem('weekendExplorerState', JSON.stringify({
          travelers,
          selectedVibes,
          budget,
          tripType,
          isRoundTrip,
          startPoint,
          isStartPointSelected,
          language,
          currency,
          startDate,
          packages,
          hasSearched,
          selectedComponents,
        }));
      } catch (e) {
        console.error('Error saving state:', e);
      }
    }
  }, [travelers, selectedVibes, budget, tripType, isRoundTrip, startPoint, isStartPointSelected, language, currency, startDate, packages, hasSearched, selectedComponents]);

  const handleSearch = async () => {
    // All trips require a starting point since they're all round trips
    if (!startPoint || !isStartPointSelected) {
      setError('Please select a valid starting point');
      return;
    }

    // Check user from state or localStorage (for Google OAuth cases)
    let currentUser = user;
    if (!currentUser) {
      try {
        const storedUser = localStorage.getItem('planora_user');
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    // Only show auth modal if there's no user at all
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    // Scroll to search results section immediately when search starts
    setTimeout(() => {
      if (searchResultsRef.current) {
        searchResultsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);

    try {
      const request: WeekendExplorerRequest = {
        location: startPoint, // Use startPoint as the base location for searching nearby destinations
        travelers,
        vibes: selectedVibes,
        budget,
        tripType,
        isRoundTrip: true, // All trips are round trips
        startPoint: startPoint,
        language,
        currency,
        startDate,
      };

      const results = await searchWeekendPackages(request, currentUser?.gemini_api_key);
      setPackages(results);
      
      // Save results to sessionStorage
      try {
        sessionStorage.setItem('weekendExplorerState', JSON.stringify({
          travelers,
          selectedVibes,
          budget,
          tripType,
          isRoundTrip,
          startPoint,
          isStartPointSelected,
          language,
          currency,
          startDate,
          packages: results,
          hasSearched: true,
          selectedComponents,
        }));
      } catch (e) {
        console.error('Error saving search results:', e);
      }
    } catch (err: any) {
      console.error('Error searching for weekend packages:', err);
      const errorMessage = err?.message || err?.error?.message || '';
      
      // Check if it's an API key error
      if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('invalid api key')) {
        setError('Please set your Gemini API key in your profile settings to search for weekend packages.');
      } else {
        setError(errorMessage || 'Failed to search for weekend packages. Please try again.');
      }
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackageSelect = (pkg: WeekendPackage) => {
    // Calculate end date based on package days
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + pkg.days - 1);

    // Create QuestionnaireData for unified plan
    const questionnaireData: QuestionnaireData = {
      destination: pkg.destination, // Destination comes from the selected package
      startPoint: startPoint, // Starting point from the form
      tripType: tripType,
      days: pkg.days,
      budget: budget,
      vibe: selectedVibes,
      persons: travelers,
      foodPreference: 'Non-Veg' as FoodPreference,
      startDate: formatDateLocal(startDateObj),
      endDate: formatDateLocal(endDateObj),
      includeMedical: false,
      language,
      currency,
      isRoundTrip: true, // All trips are round trips
      includeAlcoholicDrinks: false,
      stops: [],
      selectedComponents: selectedComponents, // Include selected components
    };

    // Ensure we have valid data before generating
    if (!questionnaireData.destination || !questionnaireData.startPoint) {
      setError('Invalid package data. Please try again.');
      return;
    }

    // Call the unified plan generator
    onGenerateUnifiedPlan(questionnaireData);
  };

  // Scroll to results if they exist when component mounts
  useEffect(() => {
    if (hasSearched && packages.length > 0 && searchResultsRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (searchResultsRef.current) {
          searchResultsRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 300);
    }
  }, []); // Only run on mount

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        startPointSuggestionsRef.current &&
        !startPointSuggestionsRef.current.contains(event.target as Node) &&
        startPointInputRef.current &&
        !startPointInputRef.current.contains(event.target as Node)
      ) {
        setStartPointSuggestions([]);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <BackToHomeButton onBack={onBack} />

        {/* Form Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border-2 border-white/60 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Trip Type */}
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                Trip Type
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {tripTypes.map(({ label, icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleTripTypeChange(label)}
                    className={`px-2 py-1.5 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 border-2 flex items-center justify-center space-x-1 sm:space-x-2 ${
                      tripType === label
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white/50 border-slate-300 hover:border-violet-400'
                    }`}
                  >
                    <span className="text-base sm:text-lg">{icon}</span>
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-violet-50/70 border border-violet-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-violet-800">Round Trip (Automatic)</p>
                    <p className="text-[10px] sm:text-xs text-violet-600 mt-1">All trip types are automatically set as round trips, as you'll return to your starting point.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Starting Point (always shown since all trips are round trips) */}
            <div className="md:col-span-2">
              <label htmlFor="startPoint" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Starting Point
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="startPoint"
                  ref={startPointInputRef}
                  type="text"
                  value={startPoint}
                  onChange={handleStartPointChange}
                  onBlur={handleStartPointBlur}
                  placeholder="e.g., Mumbai, India"
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-white text-base text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                  required
                  autoComplete="off"
                />
                {isStartPointSuggestionsLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              {isStartPointSuggestionsLoading && startPoint.trim().length > 1 && (
                <div className="mt-2 px-3 py-2 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/50 rounded-lg shadow-sm animate-pulse">
                  <div className="flex items-center space-x-2 text-sm text-violet-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="font-medium">Searching for locations</span>
                    <span className="flex space-x-1">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                    </span>
                  </div>
                </div>
              )}
              {startPointSuggestions.length > 0 && !isStartPointSelected && (
                <ul
                  ref={startPointSuggestionsRef}
                  className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto"
                >
                  {startPointSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => handleStartPointSelect(suggestion)}
                      className="px-4 py-3 cursor-pointer hover:bg-violet-100/60 flex justify-between items-center transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{suggestion.name}</span>
                        {suggestion.parentHierarchy && <span className="text-sm text-slate-600">, {suggestion.parentHierarchy}</span>}
                      </div>
                      {suggestion.type && (
                        <span className="text-xs bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-full">{suggestion.type}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {startPointError && (
                <div style={{ animation: 'validation-fade-in 0.3s ease' }} className="mt-2 text-sm text-rose-700 bg-rose-100/60 p-2 rounded-md flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>{startPointError}</span>
                </div>
              )}
              {startPointApiKeyError && (
                <div style={{ animation: 'validation-fade-in 0.3s ease' }} className="mt-2 text-sm text-amber-700 bg-amber-100/60 p-2 rounded-md flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="flex items-center flex-wrap gap-1">
                    {startPointApiKeyError.includes('quota') || startPointApiKeyError.includes('limit') || startPointApiKeyError.includes('exceeded') ? (
                      <>
                        {startPointApiKeyError.includes('profile settings') ? (
                          <>
                            {startPointApiKeyError.split('profile settings')[0]}
                            <a href="/profile" className="font-semibold underline hover:text-amber-800">your profile settings</a>
                            {startPointApiKeyError.split('profile settings')[1]}
                          </>
                        ) : (
                          <>
                            {startPointApiKeyError}
                            {' '}Please set your own Gemini API key in{' '}
                            <a href="/profile" className="font-semibold underline hover:text-amber-800">your profile settings</a>
                            {' '}to continue.
                          </>
                        )}
                      </>
                    ) : startPointApiKeyError.includes('API key not valid') || startPointApiKeyError.includes('Gemini key not set') ? (
                      <>
                        API key not valid. Please provide a valid Gemini API key in{' '}
                        <a href="/profile" className="font-semibold underline hover:text-amber-800">Edit Profile</a>
                        {' '}to search for destinations.
                      </>
                    ) : (
                      startPointApiKeyError
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Number of Travelers */}
            <div>
              <label htmlFor="travelers" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                Number of Travelers
              </label>
              <div className="flex items-center w-full bg-white border-2 border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition">
                <button 
                  type="button" 
                  onClick={() => setTravelers(Math.max(1, travelers - 1))} 
                  disabled={travelers <= 1} 
                  className="p-2 sm:p-3 text-violet-600 rounded-l-lg hover:bg-violet-50 transition disabled:text-slate-300 disabled:cursor-not-allowed" 
                  aria-label="Decrease number of travelers"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <input 
                  id="travelers"
                  type="text" 
                  inputMode="numeric" 
                  pattern="[0-9]*" 
                  value={travelers === 0 ? '' : travelers} 
                  onChange={(e) => {
                    const value = e.target.value;
                    const num = parseInt(value, 10);
                    if (!isNaN(num)) {
                      setTravelers(num);
                    } else if (value === '') {
                      setTravelers(0);
                    }
                  }}
                  onBlur={() => {
                    let value = travelers;
                    if (value < 1) value = 1;
                    if (value > 20) value = 20;
                    setTravelers(value);
                  }}
                  className="font-semibold text-base sm:text-lg text-center flex-grow tabular-nums w-full bg-transparent border-none text-gray-800 focus:ring-0 focus:outline-none" 
                  aria-label="Number of travelers" 
                />
                <button 
                  type="button" 
                  onClick={() => setTravelers(Math.min(20, travelers + 1))} 
                  disabled={travelers >= 20} 
                  className="p-2 sm:p-3 text-violet-600 rounded-r-lg hover:bg-violet-50 transition disabled:text-slate-300 disabled:cursor-not-allowed" 
                  aria-label="Increase number of travelers"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                Start Date (Weekend)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={formatDateLocal(today)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-slate-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 text-sm sm:text-base"
              />
            </div>

            {/* Vibes Selection */}
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                Preferred Vibes (Select one or more)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {vibes.map((vibe) => (
                  <button
                    key={vibe.label}
                    type="button"
                    onClick={() => handleVibeToggle(vibe.label)}
                    className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                      selectedVibes.includes(vibe.label)
                        ? 'border-violet-500 bg-violet-100'
                        : 'border-slate-300 bg-white hover:border-violet-300'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl mb-1">{vibe.icon}</div>
                    <div className="text-[10px] sm:text-xs font-medium text-slate-700">{vibe.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                Budget
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {budgets.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className={`px-2 py-1.5 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 border-2 ${
                      budget === b
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white/50 border-slate-300 hover:border-violet-400'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                Language
              </label>
              <div ref={langDropdownRef} className="relative">
                <input 
                  type="text"
                  value={isLangDropdownOpen ? langSearchTerm : language}
                  onChange={e => {
                    setLangSearchTerm(e.target.value);
                    if (!isLangDropdownOpen) {
                      setIsLangDropdownOpen(true);
                    }
                  }}
                  onFocus={() => {
                    setLangSearchTerm('');
                    setIsLangDropdownOpen(true);
                    setIsCurrencyDropdownOpen(false); // Close currency dropdown when language opens
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-800 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition text-base"
                  placeholder="Search language..."
                  autoComplete="off"
                />
                {isLangDropdownOpen && (
                  <ul className="absolute z-[100] w-full bg-white border-2 border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                    {languages
                      .filter(l => l.toLowerCase().includes(langSearchTerm.toLowerCase()))
                      .map(lang => (
                        <li 
                          key={lang} 
                          onClick={() => {
                            setLanguage(lang);
                            setIsLangDropdownOpen(false);
                          }}
                          className="px-4 py-3 cursor-pointer hover:bg-violet-100/60"
                        >
                          {lang}
                        </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                Currency
              </label>
              <div ref={currencyDropdownRef} className="relative">
                <input 
                  type="text"
                  value={isCurrencyDropdownOpen ? currencySearchTerm : currency}
                  onChange={e => {
                    setCurrencySearchTerm(e.target.value);
                    if (!isCurrencyDropdownOpen) {
                      setIsCurrencyDropdownOpen(true);
                    }
                  }}
                  onFocus={() => {
                    setCurrencySearchTerm('');
                    setIsCurrencyDropdownOpen(true);
                    setIsLangDropdownOpen(false); // Close language dropdown when currency opens
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-800 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition text-base"
                  placeholder="Search currency..."
                  autoComplete="off"
                />
                {isCurrencyDropdownOpen && (
                  <ul className="absolute z-[100] w-full bg-white border-2 border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                    {currencies
                      .filter(c => c.toLowerCase().includes(currencySearchTerm.toLowerCase()))
                      .map(curr => (
                        <li 
                          key={curr} 
                          onClick={() => {
                            setCurrency(curr);
                            setIsCurrencyDropdownOpen(false);
                          }}
                          className="px-4 py-3 cursor-pointer hover:bg-violet-100/60"
                        >
                          {curr}
                        </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Plan Components */}
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                Plan Components
              </label>
              <p className="text-[10px] sm:text-xs text-slate-600 mb-2 sm:mb-3">Select which components to include in your trip plan. Itinerary is always included.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {unifiedPlanComponents.map(comp => {
                  const isSelected = selectedComponents.includes(comp.label);
                  const componentColor = getComponentColor(comp.label);
                  return (
                  <button
                    key={comp.label}
                    type="button"
                    onClick={() => handleComponentToggle(comp.label)}
                    className={`p-2 sm:p-3 rounded-lg text-left transition-all duration-200 border-2 flex items-start space-x-2 ${
                      isSelected
                        ? `${componentColor.bg} ${componentColor.border}`
                        : `bg-white/40 border-slate-300 ${componentColor.hover}`
                    }`}
                  >
                    <span className="text-lg sm:text-xl mt-0.5 flex-shrink-0">{comp.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm">{comp.label.charAt(0).toUpperCase() + comp.label.slice(1)}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">{comp.description}</p>
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-lg text-sm sm:text-base text-red-700">
              {error}
            </div>
          )}

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 items-center justify-center">
            <button
              onClick={handleSearch}
              disabled={isLoading || !startPoint || !isStartPointSelected}
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm sm:text-base font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  <span className="text-xs sm:text-sm">Searching for packages...</span>
                </span>
              ) : (
                '🔍 Search Weekend Packages'
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-white border-2 border-slate-300 text-slate-700 text-sm sm:text-base font-semibold rounded-full shadow-md hover:shadow-lg hover:border-slate-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Packages Display */}
        {hasSearched && (
          <div ref={searchResultsRef} className="mt-6 sm:mt-8">
            {isLoading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-violet-600 mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base text-slate-600">Searching...</p>
              </div>
            ) : packages.length > 0 ? (
              <>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
                  Weekend Packages
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {packages.slice(0, 6).map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => handlePackageSelect(pkg)}
                      className="group bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-violet-300"
                    >
                      {/* Location Header - Highlighted */}
                      <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <h3 className="text-base sm:text-lg font-bold text-white truncate">{pkg.destination}</h3>
                            </div>
                            <p className="text-xs sm:text-sm text-violet-100">{pkg.distance} • {pkg.travelTime}</p>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-violet-600 bg-white px-2 sm:px-3 py-1 rounded-full ml-2 flex-shrink-0">
                            {pkg.days}D
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-5">
                        {/* Budget */}
                        <div className="mb-4 flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm sm:text-base font-semibold text-green-600">{pkg.estimatedBudget}</span>
                        </div>

                        {/* Best For Tags - Minimal */}
                        {pkg.bestFor.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {pkg.bestFor.slice(0, 2).map((vibe, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] sm:text-xs px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full font-medium"
                              >
                                {vibe}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* CTA Button */}
                        <button className="w-full mt-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all">
                          Plan Trip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 p-6">
                <p className="text-sm sm:text-base text-slate-600">No packages found. Try adjusting your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeekendExplorer;

