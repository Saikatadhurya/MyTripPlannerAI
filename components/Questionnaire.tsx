import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Budget, Vibe, FoodPreference, TripType, QuestionnaireData, LocationSuggestion, PopularDestination } from '../types';
import { getDestinationSuggestions } from '../services/geminiService';
import { User } from '../services/authService';
import { currencies } from '../data/currencies';
import BackToHomeButton from './BackToHomeButton';
import SelectionPage from './SelectionPage';

interface QuestionnaireProps {
  onSubmit: (data: QuestionnaireData) => void;
  isLoading: boolean;
  error: string | null;
  initialData?: QuestionnaireData | null;
  onBack: () => void;
  onCancel: () => void;
  streamedText: string;
  user: User | null;
  onOpenAuthModal: () => void;
}

const budgets: Budget[] = ['Low Budget', 'Midrange', 'Luxury'];
const foodPreferences: {label: FoodPreference, icon: string}[] = [
    {label: 'Veg', icon: '🥗'},
    {label: 'Non-Veg', icon: '🍗'},
    {label: 'Vegan', icon: '🌱'},
];
const tripTypes: { label: TripType; icon: string }[] = [
    { label: 'Standard', icon: '✈️' },
    { label: 'Car', icon: '🚗' },
    { label: 'Bike', icon: '🏍️' },
];

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

// Helper function to format date as YYYY-MM-DD in local timezone
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Questionnaire: React.FC<QuestionnaireProps> = ({ onSubmit, isLoading, error, initialData, onBack, onCancel, streamedText, user, onOpenAuthModal }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const defaultEndDate = new Date(today);
  defaultEndDate.setDate(defaultEndDate.getDate() + 3); // Changed from +2 to +3 days

  // Calculate end date based on start date and days
  const calculateEndDateFromStart = (startDateStr: string, days: number): string => {
    const startDate = new Date(startDateStr + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);
    return formatDateLocal(endDate);
  };

  const [formData, setFormData] = useState<QuestionnaireData>(() => {
    if (initialData) {
      // If initialData has endDate, use it; otherwise calculate from startDate and days
      const endDate = initialData.endDate || calculateEndDateFromStart(initialData.startDate || formatDateLocal(today), initialData.days || 3);
      return {
        ...initialData,
        endDate: endDate
      };
    }
    return {
      destination: '',
      startPoint: '',
      tripType: 'Standard',
      days: 3,
      budget: 'Midrange',
      vibe: ['Food & Culinary'],
      persons: 1,
      foodPreference: 'Non-Veg',
      startDate: formatDateLocal(today),
      endDate: formatDateLocal(defaultEndDate),
      includeMedical: false,
      language: 'English (en)',
      currency: 'India (INR) – ₹',
      isRoundTrip: false,
      includeAlcoholicDrinks: false,
      stops: [],
    };
  });
  
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isDestinationSuggestionsLoading, setIsDestinationSuggestionsLoading] = useState(false);
  const [isDestinationSelected, setIsDestinationSelected] = useState(!!initialData?.destination);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [popularDestinations, setPopularDestinations] = useState<PopularDestination[]>([]);

  const [startPointSuggestions, setStartPointSuggestions] = useState<LocationSuggestion[]>([]);
  const [isStartPointSuggestionsLoading, setIsStartPointSuggestionsLoading] = useState(false);
  const [isStartPointSelected, setIsStartPointSelected] = useState(!!initialData?.startPoint);
  const [startPointError, setStartPointError] = useState<string | null>(null);
  const [startPointApiKeyError, setStartPointApiKeyError] = useState<string | null>(null);

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingSuggestion = useRef(false);

  const destinationSuggestionsRef = useRef<HTMLUListElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const startPointSuggestionsRef = useRef<HTMLUListElement>(null);
  const startPointInputRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [selectionView, setSelectionView] = useState<{ field: keyof QuestionnaireData, title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [langSearchTerm, setLangSearchTerm] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [currencySearchTerm, setCurrencySearchTerm] = useState('');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  // State for multiple stops
  const [stops, setStops] = useState<Array<{
    id: string;
    value: string;
    isSelected: boolean;
    suggestions: LocationSuggestion[];
    isLoading: boolean;
    error: string | null;
  }>>(initialData?.stops?.map((stop, idx) => ({
    id: `stop-${idx}`,
    value: stop,
    isSelected: true,
    suggestions: [],
    isLoading: false,
    error: null,
  })) || []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartIndex = useRef<number | null>(null);
  const stopElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  
  const stopsRefs = useRef<Map<string, { inputRef: HTMLInputElement | null, suggestionsRef: HTMLUListElement | null }>>(new Map());
  const stopsSelectingRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    fetch('/data/destinations.json')
      .then(res => res.json())
      .then(data => setPopularDestinations(data))
      .catch(err => console.error("Failed to load popular destinations", err));
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ensure endDate is always calculated from startDate and days on mount
  useEffect(() => {
    if (!formData.endDate || formData.endDate.trim() === '') {
      const calculatedEndDate = calculateEndDateFromStart(formData.startDate, formData.days);
      setFormData(prev => ({ 
        ...prev, 
        endDate: calculatedEndDate
      }));
    }
  }, []); // Run only on mount

  // Ensure days don't exceed 45 on initialization
  useEffect(() => {
    if (formData.days > 45) {
      const startDate = new Date(formData.startDate + 'T00:00:00');
      const maxEndDate = new Date(startDate);
      maxEndDate.setDate(maxEndDate.getDate() + 44); // 45 days total (inclusive)
      const maxEndDateString = formatDateLocal(maxEndDate);
      setFormData(prev => ({ 
        ...prev, 
        endDate: maxEndDateString, 
        days: 45 
      }));
    }
  }, []); // Only run on mount

  const handleInputChange = (field: keyof QuestionnaireData, value: any) => {
    setFormData(prev => {
        const newState = { ...prev, [field]: value };
        if (field === 'tripType') {
            if (value === 'Standard') {
                newState.startPoint = '';
                newState.isRoundTrip = false; // Reset when switching to standard
                setIsStartPointSelected(false);
                setStartPointError(null);
            } else if (value === 'Car' || value === 'Bike') {
                // Car and Bike trips are always round trips by default
                newState.isRoundTrip = true;
            }
        }
        return newState;
    });
  };

  // Calculate days between two dates
  const calculateDays = (start: string, end: string): number => {
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Handle start date change - recalculate days based on existing end date (max 45)
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    if (!newStartDate) return;
    
    const startDate = new Date(newStartDate + 'T00:00:00');
    const endDate = new Date(formData.endDate + 'T00:00:00');
    
    // Ensure start date is not after end date
    if (startDate > endDate) {
      // If start date is after end date, set end date to start date + current days (capped at 45)
      const currentDays = Math.min(formData.days, 45);
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + currentDays - 1);
      const newEndDateString = formatDateLocal(newEndDate);
      const calculatedDays = calculateDays(newStartDate, newEndDateString);
      
      setFormData(prev => ({ 
        ...prev, 
        startDate: newStartDate, 
        endDate: newEndDateString, 
        days: calculatedDays 
      }));
    } else {
      // Recalculate days based on new start date and existing end date
      let calculatedDays = calculateDays(newStartDate, formData.endDate);
      
      // Limit to max 45 days
      if (calculatedDays > 45) {
        calculatedDays = 45;
        const maxEndDate = new Date(startDate);
        maxEndDate.setDate(maxEndDate.getDate() + 44); // 45 days total (inclusive)
        const maxEndDateString = formatDateLocal(maxEndDate);
        setFormData(prev => ({ 
          ...prev, 
          startDate: newStartDate, 
          endDate: maxEndDateString, 
          days: 45 
        }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          startDate: newStartDate, 
          days: calculatedDays 
        }));
      }
    }
  };

  // Handle end date change - recalculate days (max 45)
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    if (!newEndDate) return;
    
    const startDate = new Date(formData.startDate + 'T00:00:00');
    const endDate = new Date(newEndDate + 'T00:00:00');
    
    // Ensure end date is not before start date
    if (endDate < startDate) {
      return;
    }
    
    let calculatedDays = calculateDays(formData.startDate, newEndDate);
    
    // Limit to max 45 days
    if (calculatedDays > 45) {
      calculatedDays = 45;
      const maxEndDate = new Date(startDate);
      maxEndDate.setDate(maxEndDate.getDate() + 44); // 45 days total (inclusive)
      const maxEndDateString = formatDateLocal(maxEndDate);
      setFormData(prev => ({ 
        ...prev, 
        endDate: maxEndDateString, 
        days: 45 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        endDate: newEndDate, 
        days: calculatedDays 
      }));
    }
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('destination', value);
    setIsDestinationSelected(false);
    setDestinationError(null);
    isSelectingSuggestion.current = false;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (value.trim().length > 1) {
        // Check if user is logged in before searching
        if (!user) {
          onOpenAuthModal();
          return;
        }
        setIsDestinationSuggestionsLoading(true);
        debounceTimeout.current = setTimeout(() => {
          if (!isSelectingSuggestion.current) {
            getDestinationSuggestions(value, user?.gemini_api_key).then(results => {
              setDestinationSuggestions(results);
              setIsDestinationSuggestionsLoading(false);
              setApiKeyError(null); // Clear any previous API key errors
            }).catch(error => {
              setDestinationSuggestions([]);
              setIsDestinationSuggestionsLoading(false);
              
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
                setApiKeyError(cleanMessage || 'Your Gemini API key has reached its quota limit. Please set a new Gemini API key in your profile settings to continue.');
              } else if (errorMessage.includes('Gemini key not set') || errorMessage.includes('API key not valid')) {
                setApiKeyError('API key not valid. Please provide a valid Gemini API key in your profile settings to search for destinations.');
              } else {
                setApiKeyError('Failed to fetch destination suggestions. Please try again.');
              }
            });
          }
        }, 500);
    } else {
        setDestinationSuggestions([]);
        setIsDestinationSuggestionsLoading(false);
    }
  };

  const handleDestinationSuggestionClick = (suggestion: LocationSuggestion) => {
    isSelectingSuggestion.current = true;
    const fullName = suggestion.parentHierarchy ? `${suggestion.name}, ${suggestion.parentHierarchy}` : suggestion.name;
    handleInputChange('destination', fullName);
    setIsDestinationSelected(true);
    setDestinationError(null);
    setDestinationSuggestions([]);
    setIsDestinationSuggestionsLoading(false);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
  };
  
  const handleDestinationBlur = () => {
    setTimeout(() => {
      if (!isSelectingSuggestion.current && formData.destination.trim().length > 0 && !isDestinationSelected) {
        setDestinationError("Please pick a location from the list to lock it in! 🗺️");
      }
    }, 200);
  };

  const handleStartPointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('startPoint', value);
    setIsStartPointSelected(false);
    setStartPointError(null);
    setStartPointApiKeyError(null);
    isSelectingSuggestion.current = false;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (value.trim().length > 1) {
        // Check if user is logged in before searching
        if (!user) {
          onOpenAuthModal();
          return;
        }
        setIsStartPointSuggestionsLoading(true);
        debounceTimeout.current = setTimeout(() => {
          if (!isSelectingSuggestion.current) {
            getDestinationSuggestions(value, user?.gemini_api_key).then(results => {
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
  
  const handleStartPointSuggestionClick = (suggestion: LocationSuggestion) => {
    isSelectingSuggestion.current = true;
    const fullName = suggestion.parentHierarchy ? `${suggestion.name}, ${suggestion.parentHierarchy}` : suggestion.name;
    handleInputChange('startPoint', fullName);
    setIsStartPointSelected(true);
    setStartPointError(null);
    setStartPointSuggestions([]);
    setIsStartPointSuggestionsLoading(false);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
  };

  const handleStartPointBlur = () => {
    setTimeout(() => {
      if (!isSelectingSuggestion.current && formData.startPoint.trim().length > 0 && !isStartPointSelected) {
        setStartPointError("Please select your starting point from the list. 📍");
      }
    }, 200);
  };

  const handleVibeToggle = (selectedVibe: Vibe) => {
    const newVibes = formData.vibe.includes(selectedVibe)
      ? formData.vibe.filter(v => v !== selectedVibe)
      : [...formData.vibe, selectedVibe];
    if (newVibes.length > 0) {
      handleInputChange('vibe', newVibes);
    }
  };

  const handleTravelersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      handleInputChange('persons', num);
    } else if (value === '') {
      handleInputChange('persons', 0);
    }
  };

  const handleTravelersBlur = () => {
    let value = formData.persons;
    if (value < 1) value = 1;
    if (value > 20) value = 20;
    handleInputChange('persons', value);
  };
  

  const addStop = () => {
    const newId = `stop-${Date.now()}`;
    setStops(prev => [...prev, {
      id: newId,
      value: '',
      isSelected: false,
      suggestions: [],
      isLoading: false,
      error: null,
    }]);
  };

  const removeStop = (id: string) => {
    setStops(prev => prev.filter(stop => stop.id !== id));
    stopsRefs.current.delete(id);
    stopsSelectingRef.current.delete(id);
    setFormData(prev => ({
      ...prev,
      stops: prev.stops?.filter((_, idx) => stops.findIndex(s => s.id === id) !== idx) || []
    }));
  };

  const reorderStops = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    setStops(prev => {
      const newStops = [...prev];
      const [moved] = newStops.splice(fromIndex, 1);
      newStops.splice(toIndex, 0, moved);
      
      // Update formData stops array to match the new order
      setFormData(prevFormData => ({
        ...prevFormData,
        stops: newStops.map(s => s.value)
      }));
      
      return newStops;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const draggedOverElement = e.currentTarget as HTMLElement;
    const rect = draggedOverElement.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const mouseY = e.clientY;
    
    if (mouseY < midpoint && draggedIndex > index) {
      reorderStops(draggedIndex, index);
      setDraggedIndex(index);
    } else if (mouseY > midpoint && draggedIndex < index) {
      reorderStops(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Touch handlers for mobile drag and drop
  const handleTouchStart = (e: TouchEvent, index: number) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.closest('button[aria-label="Remove stop"]')) {
      return;
    }
    touchStartY.current = e.touches[0].clientY;
    touchStartIndex.current = index;
    setDraggedIndex(index);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartY.current === null || touchStartIndex.current === null) return;
    
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    
    // Find which stop item the touch is currently over
    let targetIndex = touchStartIndex.current;
    
    stopElementsRef.current.forEach((stopElement, idx) => {
      const rect = stopElement.getBoundingClientRect();
      if (touchY >= rect.top && touchY <= rect.bottom) {
        const midpoint = rect.top + rect.height / 2;
        if (touchY < midpoint && touchStartIndex.current! > idx) {
          targetIndex = idx;
        } else if (touchY > midpoint && touchStartIndex.current! < idx) {
          targetIndex = idx;
        }
      }
    });
    
    if (targetIndex !== touchStartIndex.current) {
      reorderStops(touchStartIndex.current, targetIndex);
      touchStartIndex.current = targetIndex;
      setDraggedIndex(targetIndex);
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
    touchStartIndex.current = null;
    setDraggedIndex(null);
  };

  // Add touch event listeners with passive: false
  useEffect(() => {
    const cleanupFunctions: Array<() => void> = [];
    
    stopElementsRef.current.forEach((element, index) => {
      if (!element) return;
      
      const touchStartHandler = (e: TouchEvent) => handleTouchStart(e, index);
      const touchMoveHandler = (e: TouchEvent) => handleTouchMove(e);
      const touchEndHandler = () => handleTouchEnd();
      
      element.addEventListener('touchstart', touchStartHandler, { passive: true });
      element.addEventListener('touchmove', touchMoveHandler, { passive: false });
      element.addEventListener('touchend', touchEndHandler, { passive: true });
      
      cleanupFunctions.push(() => {
        element.removeEventListener('touchstart', touchStartHandler);
        element.removeEventListener('touchmove', touchMoveHandler);
        element.removeEventListener('touchend', touchEndHandler);
      });
    });
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [stops.length, draggedIndex]);

  const handleStopChange = (id: string, value: string) => {
    setStops(prev => {
      const updated = prev.map(stop => 
        stop.id === id ? { ...stop, value, isSelected: false, error: null } : stop
      );
      setFormData(formData => ({
        ...formData,
        stops: updated.filter(s => s.isSelected && s.value.trim().length > 0).map(s => s.value)
      }));
      return updated;
    });

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    stopsSelectingRef.current.set(id, false);

    if (value.trim().length > 1) {
      if (!user) {
        onOpenAuthModal();
        return;
      }
      setStops(prev => prev.map(stop => 
        stop.id === id ? { ...stop, isLoading: true } : stop
      ));
      debounceTimeout.current = setTimeout(() => {
        if (!stopsSelectingRef.current.get(id)) {
          getDestinationSuggestions(value, user?.gemini_api_key).then(results => {
            setStops(prev => prev.map(stop => 
              stop.id === id ? { ...stop, suggestions: results, isLoading: false, error: null } : stop
            ));
          }).catch(error => {
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
            
            let errorText = null;
            if (isQuotaError) {
              // Extract message without [429] prefix
              const cleanMessage = errorMessage.replace(/^\[429\]\s*/, '');
              errorText = cleanMessage || 'Your Gemini API key has reached its quota limit. Please set a new Gemini API key in your profile settings to continue.';
            } else if (errorMessage.includes('Gemini key not set') || errorMessage.includes('API key not valid')) {
              errorText = 'API key not valid. Please provide a valid Gemini API key in your profile settings to search for destinations.';
            }
            
            setStops(prev => prev.map(stop => 
              stop.id === id ? { ...stop, suggestions: [], isLoading: false, error: errorText } : stop
            ));
          });
        }
      }, 500);
    } else {
      setStops(prev => prev.map(stop => 
        stop.id === id ? { ...stop, suggestions: [], isLoading: false } : stop
      ));
    }
  };

  const handleStopSuggestionClick = (id: string, suggestion: LocationSuggestion) => {
    stopsSelectingRef.current.set(id, true);
    const fullName = suggestion.parentHierarchy ? `${suggestion.name}, ${suggestion.parentHierarchy}` : suggestion.name;
    setStops(prev => {
      const updated = prev.map(stop => 
        stop.id === id ? { ...stop, value: fullName, isSelected: true, error: null, suggestions: [] } : stop
      );
      setFormData(formData => ({
        ...formData,
        stops: updated.filter(s => s.isSelected && s.value.trim().length > 0).map(s => s.value)
      }));
      return updated;
    });
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
  };

  const handleStopBlur = (id: string) => {
    setTimeout(() => {
      const stop = stops.find(s => s.id === id);
      if (!stopsSelectingRef.current.get(id) && stop && stop.value.trim().length > 0 && !stop.isSelected) {
        setStops(prev => prev.map(s => 
          s.id === id ? { ...s, error: "Please pick a location from the list to lock it in! 🗺️" } : s
        ));
      }
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            destinationSuggestionsRef.current && !destinationSuggestionsRef.current.contains(event.target as Node) &&
            destinationInputRef.current && !destinationInputRef.current.contains(event.target as Node)
        ) {
            setDestinationSuggestions([]);
        }
        if (
            startPointSuggestionsRef.current && !startPointSuggestionsRef.current.contains(event.target as Node) &&
            startPointInputRef.current && !startPointInputRef.current.contains(event.target as Node)
        ) {
            setStartPointSuggestions([]);
        }
        stops.forEach(stop => {
          const refs = stopsRefs.current.get(stop.id);
          if (refs) {
            if (refs.suggestionsRef && !refs.suggestionsRef.contains(event.target as Node) &&
                refs.inputRef && !refs.inputRef.contains(event.target as Node)) {
              setStops(prev => prev.map(s => 
                s.id === stop.id ? { ...s, suggestions: [] } : s
              ));
            }
          }
        });
        if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
            setIsLangDropdownOpen(false);
        }
        if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
            setIsCurrencyDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [stops]);

  const handleOpenSelection = (field: keyof QuestionnaireData, title: string) => {
    // Disabled - mobile now uses inline suggestions instead of SelectionPage
    return;
    if (!isMobile) return;
    // Check authentication for destination and startPoint searches
    if ((field === 'destination' || field === 'startPoint') && !user) {
      onOpenAuthModal();
      return;
    }
    if (field === 'destination') setSearchQuery(formData.destination);
    else if (field === 'startPoint') setSearchQuery(formData.startPoint);
    else setSearchQuery('');
    setSelectionView({ field, title });
  };

  const handleSelect = (item: any) => {
    if (!selectionView) return;
    const { field } = selectionView;

    if (field === 'destination' || field === 'startPoint') {
        const suggestion = item as LocationSuggestion | PopularDestination;
        const fullName = (suggestion as LocationSuggestion).parentHierarchy
            ? `${suggestion.name}, ${(suggestion as LocationSuggestion).parentHierarchy}`
            : suggestion.name;
        handleInputChange(field, fullName);
        if (field === 'destination') setIsDestinationSelected(true);
        if (field === 'startPoint') setIsStartPointSelected(true);
    } else {
        handleInputChange(field, item);
    }
    setSelectionView(null);
  };
  
  const handleSelectionSearchChange = (value: string) => {
    setSearchQuery(value);
    const field = selectionView?.field;

    if (field === 'destination' || field === 'startPoint') {
        handleInputChange(field, value);
        if (field === 'destination') setIsDestinationSelected(false);
        if (field === 'startPoint') setIsStartPointSelected(false);
        
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        if (value.trim().length > 1) {
            // Check if user is logged in before searching
            if (!user) {
              onOpenAuthModal();
              return;
            }
            const setLoading = field === 'destination' ? setIsDestinationSuggestionsLoading : setIsStartPointSuggestionsLoading;
            const setSuggestions = field === 'destination' ? setDestinationSuggestions : setStartPointSuggestions;
            setLoading(true);
            debounceTimeout.current = setTimeout(() => {
                getDestinationSuggestions(value, user?.gemini_api_key).then(results => {
                    setSuggestions(results);
                    setLoading(false);
                    setApiKeyError(null); // Clear any previous API key errors
                }).catch(error => {
                    setSuggestions([]);
                    setLoading(false);
                    
                    // Check if it's a quota/API key error
                    const errorMessage = error?.message || '';
                    const isQuotaError = errorMessage.includes('[429]') || 
                                        errorMessage.toLowerCase().includes('quota') || 
                                        errorMessage.toLowerCase().includes('rate limit') ||
                                        errorMessage.toLowerCase().includes('limit') ||
                                        errorMessage.toLowerCase().includes('exceeded');
                    
                    if (isQuotaError) {
                      // Extract message without [429] prefix
                      const cleanMessage = errorMessage.replace(/^\[429\]\s*/, '');
                      setApiKeyError(cleanMessage || 'The API key has reached its quota limit. Please set your own Gemini API key in your profile settings to continue.');
                    } else if (errorMessage.includes('Gemini key not set') || errorMessage.includes('API key not valid')) {
                        setApiKeyError('API key not valid. Please provide a valid Gemini API key in your profile settings to search for destinations.');
                    } else {
                        setApiKeyError('Failed to fetch destination suggestions. Please try again.');
                    }
                });
            }, 500);
        } else {
            if (field === 'destination') {
                setDestinationSuggestions([]);
                setIsDestinationSuggestionsLoading(false);
            }
            if (field === 'startPoint') {
                setStartPointSuggestions([]);
                setIsStartPointSuggestionsLoading(false);
            }
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Check if user is logged in before submitting
    if (!user) {
      onOpenAuthModal();
      return;
    }
    let hasError = false;
    if (formData.destination.trim() === '') {
        setDestinationError("Please enter a destination.");
        hasError = true;
    } else if (!isDestinationSelected) {
        setDestinationError("Please pick a location from the list to lock it in! 🗺️");
        hasError = true;
    }

    if (showStartPoint) {
        if (formData.startPoint.trim() === '') {
            setStartPointError("Please enter a starting point.");
            hasError = true;
        } else if (!isStartPointSelected) {
            setStartPointError("Please select your starting point from the list. 📍");
            hasError = true;
        }
    }
    
    if (startPointApiKeyError) {
        hasError = true;
    }

    const invalidStops = stops.filter(stop => stop.value.trim().length > 0 && !stop.isSelected);
    if (invalidStops.length > 0) {
      invalidStops.forEach(stop => {
        setStops(prev => prev.map(s => 
          s.id === stop.id ? { ...s, error: "Please pick a location from the list to lock it in! 🗺️" } : s
        ));
      });
      hasError = true;
    }

    if (apiKeyError) {
        hasError = true;
    }
    
    if (hasError) return;
    
    const finalFormData = {
      ...formData,
      stops: stops.filter(s => s.isSelected && s.value.trim().length > 0).map(s => s.value)
    };
    onSubmit(finalFormData);
  };

  const renderSelectionPage = () => {
    if (!isMobile || !selectionView) return null;

    const { field, title } = selectionView;
    let items: any[] = [];
    let renderItem: (item: any, index: number) => React.ReactNode;
    let isLoading = false;
    let popularItems: any[] | undefined = undefined;
    let renderPopularItem: ((item: any, index: number) => React.ReactNode) | undefined = undefined;

    switch (field) {
        case 'destination':
        case 'startPoint':
            items = field === 'destination' ? destinationSuggestions : startPointSuggestions;
            isLoading = field === 'destination' ? isDestinationSuggestionsLoading : isStartPointSuggestionsLoading;
            popularItems = popularDestinations;
            renderPopularItem = (dest: PopularDestination) => (
                <div className="px-4 py-3 cursor-pointer hover:bg-slate-100 flex items-center space-x-4">
                    <span className="text-2xl">{dest.icon}</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{dest.name}</p>
                        <p className="text-sm text-slate-600 truncate">{dest.description}</p>
                    </div>
                </div>
            );
            renderItem = (s) => (
                <div className="px-4 py-3 cursor-pointer hover:bg-slate-100 flex justify-between items-center transition-colors">
                  <div>
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    {s.parentHierarchy && <span className="text-sm text-slate-600">, {s.parentHierarchy}</span>}
                  </div>
                  <span className="text-xs bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-full">{s.type}</span>
                </div>
            );
            break;
        case 'language':
            items = languages.filter(lang => lang.toLowerCase().includes(searchQuery.toLowerCase()));
            renderItem = (lang) => <div className="px-4 py-3 cursor-pointer hover:bg-slate-100 text-slate-800">{lang}</div>;
            break;
        case 'currency':
            items = currencies.filter(curr => curr.toLowerCase().includes(searchQuery.toLowerCase()));
            renderItem = (curr) => <div className="px-4 py-3 cursor-pointer hover:bg-slate-100 text-slate-800">{curr}</div>;
            break;
        default:
            return null;
    }

    return (
        <SelectionPage
            isOpen={!!selectionView}
            title={title}
            items={items}
            onClose={() => setSelectionView(null)}
            onSelect={handleSelect}
            renderItem={renderItem}
            searchValue={searchQuery}
            onSearchChange={handleSelectionSearchChange}
            isLoading={isLoading}
            popularItems={popularItems}
            renderPopularItem={renderPopularItem}
            accentColor="violet"
            error={apiKeyError && (selectionView?.field === 'destination' || selectionView?.field === 'startPoint') ? apiKeyError : null}
        />
    );
  };


  const showStartPoint = formData.tripType !== 'Standard' || !!formData.isRoundTrip;

  // Calculate max end date (45 days from start date)
  const maxEndDate = useMemo(() => {
    if (!formData.startDate) return '';
    const startDate = new Date(formData.startDate + 'T00:00:00');
    const maxDate = new Date(startDate);
    maxDate.setDate(maxDate.getDate() + 44); // 45 days total (inclusive)
    return formatDateLocal(maxDate);
  }, [formData.startDate]);

  return (
    <div className="max-w-2xl mx-auto">
      <BackToHomeButton onClick={onBack} />

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
          <p className="font-bold">Oops!</p>
          {typeof error === 'string' && error.toLowerCase().includes('gemini') && error.toLowerCase().includes('key') ? (
            <p>
              Gemini API key not set. Please add your API key in{' '}
              <a href="/profile" className="font-semibold underline hover:text-red-800">Edit Profile</a>
              {' '}to continue.
            </p>
          ) : (
            <p>{error}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 md:space-y-10">

        <div className="space-y-4 sm:space-y-6 bg-white/60 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-xl">
            <h2 className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl md:text-2xl font-bold text-slate-800 border-b pb-2 sm:pb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m-6 3l6-3m0 0l6-3m-6 3v6.382" />
              </svg>
              <span>Trip Type</span>
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {tripTypes.map(({ label, icon }) => (
                <button key={label} type="button" onClick={() => handleInputChange('tripType', label)} className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm md:text-base font-semibold transition-all duration-200 border-2 flex items-center justify-center space-x-1 sm:space-x-2 ${formData.tripType === label ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 border-white/50 hover:border-violet-400'}`}>
                  <span className="text-base">{icon}</span>
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
            {formData.tripType === 'Standard' && (
              <div className="mt-4 pt-4 border-t border-violet-200/50">
                <Toggle
                  label="Round Trip"
                  description="Plan a multi-stop circuit using public transport"
                  enabled={formData.isRoundTrip ?? false}
                  onChange={(enabled) => handleInputChange('isRoundTrip', enabled)}
                />
              </div>
            )}
            {(formData.tripType === 'Car' || formData.tripType === 'Bike') && (
              <div className="mt-4 pt-4 border-t border-violet-200/50">
                <div className="flex items-start space-x-2 p-3 bg-violet-50/70 border border-violet-200 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-violet-800">Round Trip (Automatic)</p>
                    <p className="text-xs text-violet-600 mt-1">Car and Bike trips are automatically set as round trips, as you'll return to your starting point.</p>
                  </div>
                </div>
              </div>
            )}
        </div>

        <div className="space-y-4 sm:space-y-6 bg-white/60 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-xl">
            <h2 className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl md:text-2xl font-bold text-slate-800 border-b pb-2 sm:pb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" /></svg>
                <span>Journey Blueprint</span>
            </h2>
            <div className={`grid grid-cols-1 ${showStartPoint ? 'sm:grid-cols-2' : ''} gap-4`}>
               {showStartPoint && (
                    <div className="relative min-w-0">
                        <label htmlFor="startPoint" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Starting Point</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.172-8.243a.75.75 0 01.12-1.06l3-3a.75.75 0 011.06 1.06l-3 3a.75.75 0 01-1.18 0z" clipRule="evenodd" /></svg>
                          </div>
                          <input id="startPoint" ref={startPointInputRef} type="text" value={formData.startPoint} onChange={handleStartPointChange} onBlur={handleStartPointBlur} placeholder="e.g., Mumbai, India" className="w-full pl-10 pr-4 py-2 bg-white text-base text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition" required autoComplete="off" />
                        </div>
                        {isStartPointSuggestionsLoading && <div className="absolute right-3 top-9"><svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
                        {startPointSuggestions.length > 0 && (
                            <ul ref={startPointSuggestionsRef} className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                                {startPointSuggestions.map((s, i) => (
                                    <li key={i} onClick={() => handleStartPointSuggestionClick(s)} className="px-4 py-3 cursor-pointer hover:bg-violet-100/60 flex justify-between items-center transition-colors">
                                        <div>
                                            <span className="font-semibold text-slate-800">{s.name}</span>
                                            {s.parentHierarchy && <span className="text-sm text-slate-600">, {s.parentHierarchy}</span>}
                                        </div>
                                        <span className="text-xs bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-full">{s.type}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {startPointError && (
                          <div style={{ animation: 'validation-fade-in 0.3s ease' }} className="mt-2 text-sm text-rose-700 bg-rose-100/60 p-2 rounded-md flex items-center space-x-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                              <span>{startPointError}</span>
                          </div>
                        )}
                        {startPointApiKeyError && (
                          <div style={{ animation: 'validation-fade-in 0.3s ease' }} className="mt-2 text-sm text-amber-700 bg-amber-100/60 p-2 rounded-md flex items-center space-x-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
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
                )}
            </div>
                
                {/* Multiple Stops Section */}
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs sm:text-sm font-medium text-slate-700">Additional Stops (Optional)</label>
                    <button
                      type="button"
                      onClick={addStop}
                      className="text-sm px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition flex items-center space-x-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      <span>Add Stop</span>
                    </button>
                  </div>
                  {stops.map((stop, index) => (
                    <div 
                      key={stop.id} 
                      ref={(el) => {
                        if (el) {
                          stopElementsRef.current.set(index, el);
                        } else {
                          stopElementsRef.current.delete(index);
                        }
                      }}
                      data-stop-index={index}
                      className={`relative transition-all ${draggedIndex === index ? 'opacity-50 scale-95' : ''} ${draggedIndex !== null && draggedIndex !== index ? 'opacity-100' : ''}`}
                      draggable
                      onDragStart={(e) => {
                        // Only allow drag if not clicking on input or remove button
                        const target = e.target as HTMLElement;
                        if (target.tagName === 'INPUT' || target.closest('button[aria-label="Remove stop"]')) {
                          e.preventDefault();
                          return;
                        }
                        handleDragStart(index);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/html', '');
                      }}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-start space-x-2">
                        <div
                          className="mt-2 p-1.5 text-slate-400 hover:text-slate-600 cursor-move transition-colors select-none"
                          aria-label="Drag to reorder"
                          title="Drag to reorder"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 2a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM7 18a2 2 0 11-4 0 2 2 0 014 0zM15 2a2 2 0 11-4 0 2 2 0 014 0zM15 10a2 2 0 11-4 0 2 2 0 014 0zM15 18a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            ref={(el) => {
                              if (el) {
                                const refs = stopsRefs.current.get(stop.id) || { inputRef: null, suggestionsRef: null };
                                refs.inputRef = el;
                                stopsRefs.current.set(stop.id, refs);
                              }
                            }}
                            value={stop.value}
                            onChange={(e) => handleStopChange(stop.id, e.target.value)}
                            onBlur={() => handleStopBlur(stop.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onDragStart={(e) => e.preventDefault()}
                            placeholder={`Stop ${index + 1} (e.g., Paris, France)`}
                            className="w-full pl-10 pr-4 py-2 bg-white text-base text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                            autoComplete="off"
                            draggable={false}
                          />
                          {stop.isLoading && (
                            <div className="absolute right-3 top-2.5">
                              <svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          )}
                          {stop.suggestions.length > 0 && (
                            <ul
                              ref={(el) => {
                                if (el) {
                                  const refs = stopsRefs.current.get(stop.id) || { inputRef: null, suggestionsRef: null };
                                  refs.suggestionsRef = el;
                                  stopsRefs.current.set(stop.id, refs);
                                }
                              }}
                              className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto"
                            >
                              {stop.suggestions.map((s, i) => (
                                <li
                                  key={i}
                                  onClick={() => handleStopSuggestionClick(stop.id, s)}
                                  className="px-4 py-3 cursor-pointer hover:bg-violet-100/60 flex justify-between items-center transition-colors"
                                >
                                  <div>
                                    <span className="font-semibold text-slate-800">{s.name}</span>
                                    {s.parentHierarchy && <span className="text-sm text-slate-600">, {s.parentHierarchy}</span>}
                                  </div>
                                  <span className="text-xs bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-full">{s.type}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStop(stop.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          aria-label="Remove stop"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      {stop.error && (
                        <div style={{ animation: 'validation-fade-in 0.3s ease' }} className={`mt-2 text-sm p-2 rounded-md flex items-center space-x-2 ${stop.error.includes('quota') || stop.error.includes('limit') || stop.error.includes('exceeded') || stop.error.includes('API key') ? 'text-amber-700 bg-amber-100/60' : 'text-rose-700 bg-rose-100/60'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            {stop.error.includes('quota') || stop.error.includes('limit') || stop.error.includes('exceeded') || stop.error.includes('API key') ? (
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            )}
                          </svg>
                          <span className="flex items-center flex-wrap gap-1">
                            {stop.error.includes('quota') || stop.error.includes('limit') || stop.error.includes('exceeded') ? (
                              <>
                                {stop.error.includes('profile settings') ? (
                                  <>
                                    {stop.error.split('profile settings')[0]}
                                    <a href="/profile" className="font-semibold underline hover:text-amber-800">your profile settings</a>
                                    {stop.error.split('profile settings')[1]}
                                  </>
                                ) : (
                                  <>
                                    {stop.error}
                                    {' '}Please set your own Gemini API key in{' '}
                                    <a href="/profile" className="font-semibold underline hover:text-amber-800">your profile settings</a>
                                    {' '}to continue.
                                  </>
                                )}
                              </>
                            ) : stop.error.includes('API key not valid') || stop.error.includes('Gemini key not set') ? (
                              <>
                                API key not valid. Please provide a valid Gemini API key in{' '}
                                <a href="/profile" className="font-semibold underline hover:text-amber-800">Edit Profile</a>
                                {' '}to search for destinations.
                              </>
                            ) : (
                              stop.error
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {stops.length > 0 && (
                    <p className="text-xs text-slate-500 mt-2">Add multiple stops to create a multi-destination itinerary</p>
                  )}
                </div>
                
                {/* Main Destination Field - After Stops */}
                <div className="relative min-w-0">
                    <label htmlFor="destination" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Main Destination{formData.tripType === 'Standard' && stops.length > 0 ? ' (Start & End Point)' : ''}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                      </div>
                      <input id="destination" ref={destinationInputRef} type="text" value={formData.destination} onChange={handleDestinationChange} onBlur={handleDestinationBlur} placeholder="e.g., Paris, France" className="w-full pl-10 pr-4 py-2 bg-white text-base text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition" required autoComplete="off" />
                    </div>
                    {isDestinationSuggestionsLoading && <div className="absolute right-3 top-9"><svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
                    {destinationSuggestions.length > 0 && (
                         <ul ref={destinationSuggestionsRef} className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                            {destinationSuggestions.map((s, i) => (
                                <li key={i} onClick={() => handleDestinationSuggestionClick(s)} className="px-4 py-3 cursor-pointer hover:bg-violet-100/60 flex justify-between items-center transition-colors">
                                    <div>
                                        <span className="font-semibold text-slate-800">{s.name}</span>
                                        {s.parentHierarchy && <span className="text-sm text-slate-600">, {s.parentHierarchy}</span>}
                                    </div>
                                    <span className="text-xs bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-full">{s.type}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {destinationError && (
                          <div style={{ animation: 'validation-fade-in 0.3s ease' }} className="mt-2 text-sm text-rose-700 bg-rose-100/60 p-2 rounded-md flex items-center space-x-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                              <span>{destinationError}</span>
                          </div>
                        )}
                        {apiKeyError && (
                          <div style={{ animation: 'validation-fade-in 0.3s ease' }} className="mt-2 text-sm text-amber-700 bg-amber-100/60 p-2 rounded-md flex items-center space-x-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                              <span className="flex items-center flex-wrap gap-1">
                                {apiKeyError.includes('quota') || apiKeyError.includes('limit') || apiKeyError.includes('exceeded') ? (
                                  <>
                                    {apiKeyError.includes('profile settings') ? (
                                      <>
                                        {apiKeyError.split('profile settings')[0]}
                                        <a href="/profile" className="font-semibold underline hover:text-amber-800">your profile settings</a>
                                        {apiKeyError.split('profile settings')[1]}
                                      </>
                                    ) : (
                                      <>
                                        {apiKeyError}
                                        {' '}Please set your own Gemini API key in{' '}
                                        <a href="/profile" className="font-semibold underline hover:text-amber-800">your profile settings</a>
                                        {' '}to continue.
                                      </>
                                    )}
                                  </>
                                ) : apiKeyError.includes('API key not valid') || apiKeyError.includes('Gemini key not set') ? (
                                  <>
                                    API key not valid. Please provide a valid Gemini API key in{' '}
                                    <a href="/profile" className="font-semibold underline hover:text-amber-800">Edit Profile</a>
                                    {' '}to search for destinations.
                                  </>
                                ) : (
                                  apiKeyError
                                )}
                              </span>
                          </div>
                        )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Trip Dates</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="block text-xs text-slate-600">Start Date</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={handleStartDateChange}
                                        min={formatDateLocal(today)}
                                        className="w-full pl-10 pr-3 py-2 bg-white text-base text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs text-slate-600">End Date</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleEndDateChange}
                                        min={formData.startDate}
                                        max={maxEndDate}
                                        className="w-full pl-10 pr-3 py-2 bg-white text-base text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="bg-violet-100 text-violet-700 font-bold px-3 py-1 rounded-full text-sm">
                                {formData.days} {formData.days === 1 ? 'day' : 'days'}
                            </span>
                            {formData.days >= 45 && (
                                <span className="text-xs text-amber-600 font-medium">(Max 45 days)</span>
                            )}
                        </div>
                    </div>
                  <div className="flex flex-col">
                    <label htmlFor="persons" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-[29px]">Travelers</label>
                    <div className="flex items-center w-full bg-white border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition">
                      <button type="button" onClick={() => handleInputChange('persons', Math.max(1, formData.persons - 1))} disabled={formData.persons <= 1} className="p-3 text-violet-600 rounded-l-lg hover:bg-violet-50 transition disabled:text-slate-300 disabled:cursor-not-allowed" aria-label="Decrease number of travelers"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
                      <input id="persons" type="text" inputMode="numeric" pattern="[0-9]*" value={formData.persons === 0 ? '' : formData.persons} onChange={handleTravelersChange} onBlur={handleTravelersBlur} className="font-semibold text-lg text-center flex-grow tabular-nums w-full bg-transparent border-none text-gray-800 focus:ring-0 focus:outline-none" aria-label="Number of travelers" />
                      <button type="button" onClick={() => handleInputChange('persons', Math.min(20, formData.persons + 1))} disabled={formData.persons >= 20} className="p-3 text-violet-600 rounded-r-lg hover:bg-violet-50 transition disabled:text-slate-300 disabled:cursor-not-allowed" aria-label="Increase number of travelers"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
                    </div>
                  </div>
                </div>
            </div>

            <div className="space-y-4 bg-white/60 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-xl relative z-10">
                <h2 className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl md:text-2xl font-bold text-slate-800 border-b pb-2 sm:pb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.168-.217c-1.36.0-2.5 1.119-2.5 2.5s1.14 2.5 2.5 2.5c.346 0 .682-.07.98-.2a2.5 2.5 0 001.52-2.3z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.879.938.5.5 0 00-.22.643l.612 1.224a.5.5 0 00.643.22A3.49 3.49 0 0110 7.5v1.698a2.5 2.5 0 00-1.168-.217c-1.36.0-2.5 1.119-2.5 2.5s1.14 2.5 2.5 2.5c.346 0 .682-.07.98-.2a2.5 2.5 0 001.52-2.3V9.5a1 1 0 10-2 0v1a.5.5 0 01-1 0V9.5a.5.5 0 01.5-.5h1V8a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.879.938.5.5 0 00-.22.643l.612 1.224a.5.5 0 00.643.22A3.49 3.49 0 0110 7.5v1.698a2.5 2.5 0 00-1.168-.217c-1.36.0-2.5 1.119-2.5 2.5s1.14 2.5 2.5 2.5c.346 0 .682-.07.98-.2a2.5 2.5 0 001.52-2.3V9.5a1 1 0 10-2 0v1a.5.5 0 01-1 0V9.5a.5.5 0 01.5-.5h1V8a1 1 0 00-2 0z" clipRule="evenodd" /></svg>
                  <span>Budget</span>
                </h2>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {budgets.map(b => (<button key={b} type="button" onClick={() => handleInputChange('budget', b)} className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm md:text-base font-semibold transition-all duration-200 border-2 ${formData.budget === b ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 border-white/50 hover:border-violet-400'}`}>{b}</button>))}
                </div>
            </div>

            <div className="space-y-4 bg-slate-50/50 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 shadow-sm relative z-20">
                <h3 className="text-base font-medium text-slate-700 mb-3">Plan Preferences</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1.5">Plan Language</label>
                        <div ref={langDropdownRef} className="relative">
                                <input 
                                    type="text"
                                    value={isLangDropdownOpen ? langSearchTerm : formData.language}
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
                                    className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition text-base"
                                    placeholder="Search language..."
                                    autoComplete="off"
                                />
                                {isLangDropdownOpen && (
                                    <ul className="absolute z-[100] w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                                        {languages
                                            .filter(l => l.toLowerCase().includes(langSearchTerm.toLowerCase()))
                                            .map(lang => (
                                                <li 
                                                    key={lang} 
                                                    onClick={() => {
                                                        handleInputChange('language', lang);
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
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1.5">Currency for Plan</label>
                        <div ref={currencyDropdownRef} className="relative">
                                <input 
                                    type="text"
                                    value={isCurrencyDropdownOpen ? currencySearchTerm : formData.currency}
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
                                    className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition text-base"
                                    placeholder="Search currency..."
                                    autoComplete="off"
                                />
                                {isCurrencyDropdownOpen && (
                                    <ul className="absolute z-[100] w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                                        {currencies
                                            .filter(c => c.toLowerCase().includes(currencySearchTerm.toLowerCase()))
                                            .map(currency => (
                                                <li 
                                                    key={currency} 
                                                    onClick={() => {
                                                        handleInputChange('currency', currency);
                                                        setIsCurrencyDropdownOpen(false);
                                                    }}
                                                    className="px-4 py-3 cursor-pointer hover:bg-violet-100/60"
                                                >
                                                    {currency}
                                                </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 bg-white/60 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-xl">
              <h2 className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl md:text-2xl font-bold text-slate-800 border-b pb-2 sm:pb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                <span>What's your vibe?</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">Select one or more vibes that best describe your ideal trip.</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {vibes.map(v => (<button key={v.label} type="button" onClick={() => handleVibeToggle(v.label)} className={`p-2 sm:p-4 rounded-lg text-left transition-all duration-200 border-2 flex items-start space-x-2 sm:space-x-3 ${formData.vibe.includes(v.label) ? 'bg-violet-100/70 border-violet-500' : 'bg-white/40 border-white/40 hover:bg-white/60'}`}><span className="text-xl sm:text-2xl mt-1 flex-shrink-0">{v.icon}</span><div className="min-w-0 flex-1"><p className="font-semibold text-slate-800 text-xs sm:text-sm">{v.label}</p><p className="text-[10px] sm:text-xs text-slate-500">{v.description}</p></div></button>))}
              </div>
            </div>
            
            <div className="space-y-4 bg-white/60 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-xl">
               <h2 className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl md:text-2xl font-bold text-slate-800 border-b pb-2 sm:pb-3">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1.088A7 7 0 004.53 10.756.5.5 0 005 11h10a.5.5 0 00.47-.244A7 7 0 0011 4.088V3z" /><path fillRule="evenodd" d="M15 13a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h10z" clipRule="evenodd" /></svg>
                 <span>Food & Drink</span>
               </h2>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {foodPreferences.map(({ label, icon }) => (
                        <button key={label} type="button" onClick={() => handleInputChange('foodPreference', label)} className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm md:text-base font-semibold transition-all duration-200 border-2 flex items-center justify-center space-x-1 sm:space-x-2 ${formData.foodPreference === label ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 border-white/50 hover:border-violet-400'}`}>
                            <span className="text-base sm:text-xl">{icon}</span>
                            <span className="truncate">{label}</span>
                        </button>
                    ))}
                </div>
                <div className="pt-4 border-t border-violet-200/50">
                   <Toggle
                    label="Include Alcoholic Drinks"
                    description="Get recommendations for local beers, wines, etc."
                    enabled={formData.includeAlcoholicDrinks}
                    onChange={(enabled) => handleInputChange('includeAlcoholicDrinks', enabled)}
                  />
                </div>
            </div>

            <div className="space-y-4 bg-white/60 backdrop-blur-md p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-xl">
                <h2 className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl md:text-2xl font-bold text-slate-800 border-b pb-2 sm:pb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                  <span>Trip Add-ons</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">Add extra details to your plan for a more comprehensive experience.</p>
                <div className="space-y-4">
                  <Toggle
                    label="Medical Facilities"
                    description="Include nearby hospitals & pharmacies in your itinerary."
                    enabled={formData.includeMedical}
                    onChange={(enabled) => handleInputChange('includeMedical', enabled)}
                  />
                </div>
            </div>

            <div className="text-center pt-4 mb-48 pb-16">
              <button
                type="submit"
                className="w-full sm:w-auto px-10 py-4 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-violet-500/30 disabled:bg-violet-400/80 disabled:cursor-not-allowed disabled:shadow-md disabled:scale-100"
                disabled={!user || !isDestinationSelected || !!destinationError || !!apiKeyError || (showStartPoint && (!isStartPointSelected || !!startPointError || !!startPointApiKeyError)) || formData.vibe.length === 0 || stops.some(s => s.value.trim().length > 0 && !s.isSelected)}
              >
                ✨ Plan My Adventure
              </button>
            </div>
          </form>
          {/* SelectionPage disabled - mobile now uses inline suggestions */}
        </div>
      );
};

// FIX: Corrected default export to 'Questionnaire' which is the component defined in this file.
export default Questionnaire;
