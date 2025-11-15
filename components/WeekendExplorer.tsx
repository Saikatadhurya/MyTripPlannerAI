import React, { useState, useEffect, useRef } from 'react';
import { Vibe, QuestionnaireData, Budget, FoodPreference } from '../types';
import { User } from '../services/authService';
import { searchWeekendPackages, WeekendPackage, WeekendExplorerRequest } from '../services/weekendExplorerService';
import { getDestinationSuggestions } from '../services/geminiService';
import { LocationSuggestion } from '../types';
import { currencies } from '../data/currencies';
import BackToHomeButton from './BackToHomeButton';

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
          location: parsed.location || '',
          isLocationSelected: parsed.isLocationSelected || false,
          travelers: parsed.travelers || 2,
          selectedVibes: parsed.selectedVibes || ['Adventure & Thrill'],
          language: parsed.language || 'English (en)',
          currency: parsed.currency || 'India (INR) – ₹',
          startDate: parsed.startDate || formatDateLocal(getNextSaturday()),
          packages: parsed.packages || [],
          hasSearched: parsed.hasSearched || false,
        };
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
    return null;
  };

  const savedState = loadSavedState();

  const [location, setLocation] = useState(savedState?.location || '');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLocationSuggestionsLoading, setIsLocationSuggestionsLoading] = useState(false);
  const [isLocationSelected, setIsLocationSelected] = useState(savedState?.isLocationSelected || false);
  const [travelers, setTravelers] = useState(savedState?.travelers || 2);
  const [selectedVibes, setSelectedVibes] = useState<Vibe[]>(savedState?.selectedVibes || ['Adventure & Thrill']);
  const [language, setLanguage] = useState(savedState?.language || 'English (en)');
  const [currency, setCurrency] = useState(savedState?.currency || 'India (INR) – ₹');
  const [startDate, setStartDate] = useState(savedState?.startDate || formatDateLocal(getNextSaturday()));
  const [packages, setPackages] = useState<WeekendPackage[]>(savedState?.packages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(savedState?.hasSearched || false);

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingSuggestion = useRef(false);
  const locationSuggestionsRef = useRef<HTMLUListElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Fetch location suggestions
  useEffect(() => {
    if (!location || location.trim().length < 2 || isSelectingSuggestion.current) {
      setLocationSuggestions([]);
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      // Check if user is logged in before searching
      if (!user) {
        onOpenAuthModal();
        return;
      }

      setIsLocationSuggestionsLoading(true);
      getDestinationSuggestions(location, user?.gemini_api_key)
        .then(results => {
          setLocationSuggestions(results);
          setIsLocationSuggestionsLoading(false);
          setError(null); // Clear any previous errors
        })
        .catch(error => {
          setLocationSuggestions([]);
          setIsLocationSuggestionsLoading(false);
          
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
            if (!user?.gemini_api_key) {
              setError('Please set your Gemini API key in profile settings to use this feature.');
            } else {
              setError('Your API key has reached its quota limit. Please set a new Gemini API key in your profile settings.');
            }
          } else if (errorMessage.includes('API key') || errorMessage.includes('Invalid API key')) {
            setError('Please set your Gemini API key in profile settings to use this feature.');
          } else {
            // Don't show error for other issues, just log it
            console.error('Error fetching location suggestions:', error);
          }
        });
    }, 500);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [location, user, onOpenAuthModal]);

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.name);
    setIsLocationSelected(true);
    setLocationSuggestions([]);
    isSelectingSuggestion.current = true;
    setTimeout(() => {
      isSelectingSuggestion.current = false;
    }, 100);
  };

  const handleVibeToggle = (vibe: Vibe) => {
    setSelectedVibes(prev => 
      prev.includes(vibe) 
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe]
    );
  };

  // Save state to sessionStorage whenever relevant state changes
  useEffect(() => {
    if (hasSearched && packages.length > 0) {
      try {
        sessionStorage.setItem('weekendExplorerState', JSON.stringify({
          location,
          isLocationSelected,
          travelers,
          selectedVibes,
          language,
          currency,
          startDate,
          packages,
          hasSearched,
        }));
      } catch (e) {
        console.error('Error saving state:', e);
      }
    }
  }, [location, isLocationSelected, travelers, selectedVibes, language, currency, startDate, packages, hasSearched]);

  const handleSearch = async () => {
    if (!location || !isLocationSelected) {
      setError('Please select a valid location');
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
        location,
        travelers,
        vibes: selectedVibes,
        language,
        currency,
        startDate,
      };

      const results = await searchWeekendPackages(request, user.gemini_api_key);
      setPackages(results);
      
      // Save results to sessionStorage
      try {
        sessionStorage.setItem('weekendExplorerState', JSON.stringify({
          location,
          isLocationSelected,
          travelers,
          selectedVibes,
          language,
          currency,
          startDate,
          packages: results,
          hasSearched: true,
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
      destination: pkg.destination,
      startPoint: location,
      tripType: 'Standard',
      days: pkg.days,
      budget: 'Midrange' as Budget,
      vibe: selectedVibes,
      persons: travelers,
      foodPreference: 'Non-Veg' as FoodPreference,
      startDate: formatDateLocal(startDateObj),
      endDate: formatDateLocal(endDateObj),
      includeMedical: false,
      language,
      currency,
      isRoundTrip: false,
      includeAlcoholicDrinks: false,
      stops: [],
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
        locationSuggestionsRef.current &&
        !locationSuggestionsRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setLocationSuggestions([]);
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
            {/* Location Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Starting Location *
              </label>
              <div className="relative">
                <input
                  ref={locationInputRef}
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setIsLocationSelected(false);
                  }}
                  placeholder="Enter your city or location"
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
                {isLocationSuggestionsLoading && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600"></div>
                  </div>
                )}
                {locationSuggestions.length > 0 && !isLocationSelected && (
                  <ul
                    ref={locationSuggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {locationSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleLocationSelect(suggestion)}
                        className="px-4 py-3 hover:bg-violet-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                      >
                        <div className="font-medium text-slate-800">{suggestion.name}</div>
                        <div className="text-sm text-slate-500">{suggestion.parentHierarchy}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={isLoading || !location || !isLocationSelected}
            className="mt-6 w-full md:w-auto px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

