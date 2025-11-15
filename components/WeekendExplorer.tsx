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
  'English (en)', 'Hindi (hi)', 'Spanish (es)', 'French (fr)', 'German (de)', 'Italian (it)', 
  'Portuguese (pt)', 'Chinese (zh)', 'Japanese (ja)', 'Korean (ko)', 'Arabic (ar)', 'Russian (ru)'
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
          selectedComponents: parsed.selectedComponents || ['packing'], // Packing is preselected by default
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
  const [language, setLanguage] = useState(savedState?.language || 'English (en)');
  const [currency, setCurrency] = useState(savedState?.currency || 'India (INR) – ₹');
  const [startDate, setStartDate] = useState(savedState?.startDate || formatDateLocal(getNextSaturday()));
  const [packages, setPackages] = useState<WeekendPackage[]>(savedState?.packages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(savedState?.hasSearched || false);
  const [selectedComponents, setSelectedComponents] = useState<UnifiedPlanComponent[]>(savedState?.selectedComponents || ['packing']); // Packing is preselected by default

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingSuggestion = useRef(false);
  const startPointSuggestionsRef = useRef<HTMLUListElement>(null);
  const startPointInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

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
    isSelectingSuggestion.current = false;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (value.trim().length > 1) {
      setIsStartPointSuggestionsLoading(true);
      debounceTimeout.current = setTimeout(() => {
        if (!isSelectingSuggestion.current) {
          // Check for user only when making the API call, not during typing
          if (!user || !user.gemini_api_key) {
            setStartPointSuggestions([]);
            setIsStartPointSuggestionsLoading(false);
            // Only show auth modal if user is definitely not logged in (not just loading)
            // Check localStorage to see if user might be loading
            const storedUser = localStorage.getItem('planora_user');
            if (!storedUser) {
              onOpenAuthModal();
            }
            return;
          }
          getDestinationSuggestions(value, user.gemini_api_key).then(results => {
            setStartPointSuggestions(results);
            setIsStartPointSuggestionsLoading(false);
          }).catch(error => {
            setStartPointSuggestions([]);
            setIsStartPointSuggestionsLoading(false);
            console.error('Error fetching start point suggestions:', error);
            // If it's an auth error, check if user needs to login
            if (error?.message?.toLowerCase().includes('api key') || error?.message?.toLowerCase().includes('unauthorized')) {
              const storedUser = localStorage.getItem('planora_user');
              if (!storedUser) {
                onOpenAuthModal();
              }
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
    setSelectedComponents(['packing']); // Reset to default (packing preselected)
    
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

    if (!user?.gemini_api_key) {
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

      const results = await searchWeekendPackages(request, user.gemini_api_key);
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
      setError(err.message || 'Failed to search for weekend packages. Please try again.');
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 py-8 px-4 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <BackToHomeButton onBack={onBack} />
        
        <div className="mt-6 mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">
            🗺️ Weekend Explorer
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover perfect weekend getaways near you. Find outdoor destinations you can explore in 2-4 days including Saturday and Sunday.
          </p>
        </div>

        {/* Form Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-white/60 p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trip Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Trip Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {tripTypes.map(({ label, icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleTripTypeChange(label)}
                    className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 flex items-center justify-center space-x-2 ${
                      tripType === label
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white/50 border-slate-300 hover:border-violet-400'
                    }`}
                  >
                    <span className="text-lg">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-violet-50/70 border border-violet-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-violet-800">Round Trip (Automatic)</p>
                    <p className="text-xs text-violet-600 mt-1">All trip types are automatically set as round trips, as you'll return to your starting point.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Starting Point (always shown since all trips are round trips) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Starting Point *
              </label>
              <div className="relative">
                <input
                  ref={startPointInputRef}
                  type="text"
                  value={startPoint}
                  onChange={handleStartPointChange}
                  onBlur={handleStartPointBlur}
                  placeholder="e.g., Mumbai, India"
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
                {isStartPointSuggestionsLoading && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600"></div>
                  </div>
                )}
                {startPointSuggestions.length > 0 && !isStartPointSelected && (
                  <ul
                    ref={startPointSuggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {startPointSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleStartPointSelect(suggestion)}
                        className="px-4 py-3 cursor-pointer hover:bg-violet-100/60 flex justify-between items-center transition-colors border-b border-slate-100 last:border-b-0"
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
              </div>
              {startPointError && (
                <div className="mt-2 text-sm text-rose-700 bg-rose-100/60 p-2 rounded-md flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>{startPointError}</span>
                </div>
              )}
            </div>

            {/* Number of Travelers */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Number of Travelers
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={travelers}
                onChange={(e) => setTravelers(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Start Date (Weekend)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={formatDateLocal(today)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </div>

            {/* Vibes Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Preferred Vibes (Select one or more)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {vibes.map((vibe) => (
                  <button
                    key={vibe.label}
                    type="button"
                    onClick={() => handleVibeToggle(vibe.label)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedVibes.includes(vibe.label)
                        ? 'border-violet-500 bg-violet-100'
                        : 'border-slate-300 bg-white hover:border-violet-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{vibe.icon}</div>
                    <div className="text-xs font-medium text-slate-700">{vibe.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Budget
              </label>
              <div className="grid grid-cols-3 gap-3">
                {budgets.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>

            {/* Plan Components */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Plan Components
              </label>
              <p className="text-xs text-slate-600 mb-3">Select which components to include in your trip plan. Itinerary is always included.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {unifiedPlanComponents.map(comp => (
                  <button
                    key={comp.label}
                    type="button"
                    onClick={() => handleComponentToggle(comp.label)}
                    className={`p-3 rounded-lg text-left transition-all duration-200 border-2 flex items-start space-x-2 ${
                      selectedComponents.includes(comp.label)
                        ? 'bg-violet-100/70 border-violet-500'
                        : 'bg-white/40 border-slate-300 hover:border-violet-400'
                    }`}
                  >
                    <span className="text-xl mt-0.5 flex-shrink-0">{comp.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm">{comp.label.charAt(0).toUpperCase() + comp.label.slice(1)}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">{comp.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
            <button
              onClick={handleSearch}
              disabled={isLoading || !startPoint || !isStartPointSelected}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Searching for packages...
                </span>
              ) : (
                '🔍 Search Weekend Packages'
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-full shadow-md hover:shadow-lg hover:border-slate-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Packages Display */}
        {hasSearched && (
          <div ref={searchResultsRef} className="mt-8">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Searching for perfect weekend getaways...</p>
              </div>
            ) : packages.length > 0 ? (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 text-center">
                  🎯 Weekend Packages Found
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => handlePackageSelect(pkg)}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-white/60 p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-violet-400"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-slate-900 flex-1">{pkg.title}</h3>
                        <span className="text-sm font-semibold text-violet-600 bg-violet-100 px-3 py-1 rounded-full">
                          {pkg.days} Days
                        </span>
                      </div>
                      <p className="text-slate-600 mb-4 text-sm">{pkg.description}</p>
                      
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-slate-500 mb-2">📍 {pkg.destination}</div>
                        <div className="text-xs text-slate-600 mb-2">
                          🚗 {pkg.distance} • ⏱️ {pkg.travelTime}
                        </div>
                        <div className="text-sm font-semibold text-green-600 mb-3">
                          💰 {pkg.estimatedBudget}
                        </div>
                      </div>

                      {pkg.highlights.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-semibold text-slate-700 mb-2">✨ Highlights:</div>
                          <ul className="space-y-1">
                            {pkg.highlights.slice(0, 3).map((highlight, idx) => (
                              <li key={idx} className="text-xs text-slate-600 flex items-start">
                                <span className="mr-2">•</span>
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {pkg.bestFor.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {pkg.bestFor.map((vibe, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                            >
                              {vibe}
                            </span>
                          ))}
                        </div>
                      )}

                      <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all">
                        Plan This Trip →
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-white/60">
                <p className="text-slate-600 text-lg">No packages found. Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeekendExplorer;

