import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Budget, Vibe, FoodPreference, TripType, QuestionnaireData, LocationSuggestion, PopularDestination } from '../types';
import { getDestinationSuggestions } from '../services/geminiService';
import { useQuotas } from '../hooks/useQuotas';
import { User } from '../services/authService';
import { currencies } from '../data/currencies';
import BackToHomeButton from './BackToHomeButton';
import DateRangePicker from './DateRangePicker';
import SelectionPage from './SelectionPage';

// FIX: Renamed props interface for clarity and correctness
interface UnifiedPlannerFormProps {
  onSubmit: (data: QuestionnaireData) => void;
  error: string | null;
  initialData?: QuestionnaireData | null;
  onBack: () => void;
  user: User | null;
}

const budgets: Budget[] = ['Budget', 'Midrange', 'Luxury'];
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
    { label: 'Luxury & Leisure', icon: '💎', description: 'resorts, cruises, premium experiences' },
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
          <p className="text-sm text-slate-600">{description}</p>
      </div>
      <div className={`w-12 h-6 flex items-center rounded-full transition-colors duration-300 ${enabled ? 'bg-violet-500' : 'bg-slate-300'}`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
      </div>
    </button>
);

// FIX: Renamed component to UnifiedPlannerForm and updated props
const UnifiedPlannerForm: React.FC<UnifiedPlannerFormProps> = ({ onSubmit, error, initialData, onBack, user }) => {
  const { quotas, quotasLoading } = useQuotas(user);
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 2);

  const [formData, setFormData] = useState<QuestionnaireData>(initialData || {
    destination: '',
    startPoint: '',
    tripType: 'Standard',
    days: 3,
    budget: 'Midrange',
    vibe: ['Adventure & Thrill'],
    persons: 1,
    foodPreference: 'Non-Veg',
    startDate: new Date().toISOString().split('T')[0],
    endDate: defaultEndDate.toISOString().split('T')[0],
    includeMedical: false,
    language: 'English (en)',
    currency: 'India (INR) – ₹',
    isRoundTrip: false,
    includeAlcoholicDrinks: false,
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

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingSuggestion = useRef(false);

  const destinationSuggestionsRef = useRef<HTMLUListElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const startPointSuggestionsRef = useRef<HTMLUListElement>(null);
  const startPointInputRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [selectionView, setSelectionView] = useState<{ field: keyof QuestionnaireData, title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const [langSearchTerm, setLangSearchTerm] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [currencySearchTerm, setCurrencySearchTerm] = useState('');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

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

  const handleInputChange = (field: keyof QuestionnaireData, value: any) => {
    setFormData(prev => {
        const newState = { ...prev, [field]: value };
        if (field === 'tripType') {
            if (value === 'Standard') {
                newState.startPoint = '';
                newState.isRoundTrip = false; // Reset when switching to standard
                setIsStartPointSelected(false);
                setStartPointError(null);
            } else if (prev.tripType === 'Standard') {
                // When switching from Standard to Car/Bike, enable round trip by default
                newState.isRoundTrip = true;
            }
        }
        return newState;
    });
  };

  const handleDateSelect = (start: string, end: string) => {
      const startDate = new Date(start + 'T00:00:00');
      const endDate = new Date(end + 'T00:00:00');
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      setFormData(prev => ({ ...prev, startDate: start, endDate: end, days: diffDays }));
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('destination', value);
    setIsDestinationSelected(false);
    setDestinationError(null);
    isSelectingSuggestion.current = false;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (value.trim().length > 1) {
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
              
              // Check if it's a Gemini API key error
              if (error.message && error.message.includes('Gemini key not set')) {
                setApiKeyError('Gemini API key not set. Please add your API key in profile settings to search for destinations.');
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
    isSelectingSuggestion.current = false;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (value.trim().length > 1) {
        setIsStartPointSuggestionsLoading(true);
        debounceTimeout.current = setTimeout(() => {
          if (!isSelectingSuggestion.current) {
            getDestinationSuggestions(value, user?.gemini_api_key).then(results => {
              setStartPointSuggestions(results);
              setIsStartPointSuggestionsLoading(false);
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
        if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
            setIsLangDropdownOpen(false);
        }
        if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
            setIsCurrencyDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenSelection = (field: keyof QuestionnaireData, title: string) => {
    if (!isMobile) return;
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
            const setLoading = field === 'destination' ? setIsDestinationSuggestionsLoading : setIsStartPointSuggestionsLoading;
            const setSuggestions = field === 'destination' ? setDestinationSuggestions : setStartPointSuggestions;
            setLoading(true);
            debounceTimeout.current = setTimeout(() => {
                getDestinationSuggestions(value, user?.gemini_api_key).then(results => {
                    setSuggestions(results);
                    setLoading(false);
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

    // Check quota limits
    if (user && quotas.unified && quotas.unified.remaining <= 0) {
        setDestinationError("You have reached your weekly limit for unified plans. Please try again next week or upgrade your plan.");
        hasError = true;
    }
    
    if (hasError) return;
    onSubmit(formData);
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
        />
    );
  };


  const showStartPoint = formData.tripType !== 'Standard' || !!formData.isRoundTrip;

  return (
    <div className="max-w-2xl mx-auto">
      <BackToHomeButton onClick={onBack} />

      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Unified Trip Planner</h1>
        <p className="mt-2 text-lg text-slate-600">Tell us about your dream trip to get a complete, AI-generated plan.</p>
        {user && (
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-800">
            {quotasLoading ? (
              <>⏳ Loading limits...</>
            ) : (
              <>✨ {quotas.unified || quotas.itinerary ? `${(quotas.unified || quotas.itinerary).remaining}/${(quotas.unified || quotas.itinerary).weekly_limit}` : '0/5'} uses left this week</>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
          <p className="font-bold">Oops!</p>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-6 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/70 shadow-xl z-20 relative">
             <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.998 5.998 0 0116 10c0 .954-.225 1.852-.635 2.667a2.5 2.5 0 01-5.033 0 2.5 2.5 0 00-4.667 0c-.35-.74-.533-1.554-.533-2.394a6.01 6.01 0 011.567-4.243z" clipRule="evenodd" /></svg>
                <span>Plan Language</span>
            </h2>
            <div className="relative">
                {isMobile ? (
                    <div onClick={() => handleOpenSelection('language', 'Select Language')} className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition flex justify-between items-center text-left cursor-pointer">
                        <span className="truncate">{formData.language}</span>
                        <svg className={`h-5 w-5 text-slate-400`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </div>
                ) : (
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
                            }}
                            className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                            placeholder="Search language..."
                            autoComplete="off"
                        />
                        {isLangDropdownOpen && (
                            <ul className="absolute z-20 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
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
                )}
            </div>
        </div>

        <div className="space-y-6 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/70 shadow-xl">
            <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m-6 3l6-3m0 0l6-3m-6 3v6.382" />
              </svg>
              <span>Trip Type</span>
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {tripTypes.map(({ label, icon }) => (
                <button key={label} type="button" onClick={() => handleInputChange('tripType', label)} className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border-2 flex items-center justify-center space-x-2 ${formData.tripType === label ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 border-white/50 hover:border-violet-400'}`}>
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-violet-200/50">
              <Toggle
                label="Round Trip"
                description={formData.tripType === 'Standard' ? "Plan a multi-stop circuit using public transport" : "Create a road trip circuit back to the start"}
                enabled={formData.isRoundTrip ?? false}
                onChange={(enabled) => handleInputChange('isRoundTrip', enabled)}
              />
            </div>
        </div>

        <div className="space-y-6 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/70 shadow-xl">
            <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" /></svg>
                <span>Core Details</span>
            </h2>
            <div className={`grid grid-cols-1 ${showStartPoint ? 'sm:grid-cols-2' : ''} gap-4`}>
               {showStartPoint && (
                    <div className="relative min-w-0">
                        <label htmlFor="startPoint" className="block text-sm font-medium text-slate-700 mb-1">Starting Point</label>
                        <div className="relative" onClick={() => handleOpenSelection('startPoint', 'Select Starting Point')}>
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.172-8.243a.75.75 0 01.12-1.06l3-3a.75.75 0 011.06 1.06l-3 3a.75.75 0 01-1.18 0z" clipRule="evenodd" /></svg>
                          </div>
                          <input id="startPoint" ref={startPointInputRef} type="text" value={formData.startPoint} onChange={isMobile ? undefined : handleStartPointChange} onBlur={isMobile ? undefined : handleStartPointBlur} placeholder="e.g., Mumbai, India" className="w-full pl-10 pr-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition" required autoComplete="off" readOnly={isMobile} />
                        </div>
                        {isStartPointSuggestionsLoading && !isMobile && <div className="absolute right-3 top-9"><svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
                        {!isMobile && startPointSuggestions.length > 0 && (
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
                    </div>
                )}
                <div className={`relative min-w-0 ${!showStartPoint ? 'col-span-1 sm:col-span-2' : ''}`}>
                    <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
                    <div className="relative" onClick={() => handleOpenSelection('destination', 'Select Destination')}>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                      </div>
                      <input id="destination" ref={destinationInputRef} type="text" value={formData.destination} onChange={isMobile ? undefined : handleDestinationChange} onBlur={isMobile ? undefined : handleDestinationBlur} placeholder="e.g., Paris, France" className="w-full pl-10 pr-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition" required autoComplete="off" readOnly={isMobile} />
                    </div>
                    {isDestinationSuggestionsLoading && !isMobile && <div className="absolute right-3 top-9"><svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
                    {!isMobile && destinationSuggestions.length > 0 && (
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
                              <span>{apiKeyError}</span>
                          </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="min-w-0">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Trip Dates</label>
                        <button
                            type="button"
                            onClick={() => setIsDatePickerOpen(true)}
                            className="w-full flex justify-between items-center text-left p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                        >
                            <div className="flex items-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                                <span className="font-semibold text-slate-800">
                                    {new Date(formData.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {formData.endDate ? new Date(formData.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}
                                </span>
                            </div>
                            <span className="bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full text-sm">{formData.days} {formData.days === 1 ? 'day' : 'days'}</span>
                        </button>
                    </div>
                  <div>
                    <label htmlFor="persons" className="block text-sm font-medium text-slate-700 mb-1">Travelers</label>
                    <div className="flex items-center w-full bg-white border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition">
                      <button type="button" onClick={() => handleInputChange('persons', Math.max(1, formData.persons - 1))} disabled={formData.persons <= 1} className="p-3 text-violet-600 rounded-l-lg hover:bg-violet-50 transition disabled:text-slate-300 disabled:cursor-not-allowed" aria-label="Decrease number of travelers"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
                      <input id="persons" type="text" inputMode="numeric" pattern="[0-9]*" value={formData.persons === 0 ? '' : formData.persons} onChange={handleTravelersChange} onBlur={handleTravelersBlur} className="font-semibold text-lg text-center flex-grow tabular-nums w-full bg-transparent border-none text-gray-800 focus:ring-0 focus:outline-none" aria-label="Number of travelers" />
                      <button type="button" onClick={() => handleInputChange('persons', Math.min(20, formData.persons + 1))} disabled={formData.persons >= 20} className="p-3 text-violet-600 rounded-r-lg hover:bg-violet-50 transition disabled:text-slate-300 disabled:cursor-not-allowed" aria-label="Increase number of travelers"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
                    </div>
                  </div>
                </div>
            </div>

            <div className="space-y-4 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/70 shadow-xl relative z-10">
                <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.168-.217c-1.36.0-2.5 1.119-2.5 2.5s1.14 2.5 2.5 2.5c.346 0 .682-.07.98-.2a2.5 2.5 0 001.52-2.3z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.879.938.5.5 0 00-.22.643l.612 1.224a.5.5 0 00.643.22A3.49 3.49 0 0110 7.5v1.698a2.5 2.5 0 00-1.168-.217c-1.36.0-2.5 1.119-2.5 2.5s1.14 2.5 2.5 2.5c.346 0 .682-.07.98-.2a2.5 2.5 0 001.52-2.3V9.5a1 1 0 10-2 0v1a.5.5 0 01-1 0V9.5a.5.5 0 01.5-.5h1V8a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.879.938.5.5 0 00-.22.643l.612 1.224a.5.5 0 00.643.22A3.49 3.49 0 0110 7.5v1.698a2.5 2.5 0 00-1.168-.217c-1.36.0-2.5 1.119-2.5 2.5s1.14 2.5 2.5 2.5c.346 0 .682-.07.98-.2a2.5 2.5 0 001.52-2.3V9.5a1 1 0 10-2 0v1a.5.5 0 01-1 0V9.5a.5.5 0 01.5-.5h1V8a1 1 0 00-2 0z" clipRule="evenodd" /></svg>
                  <span>Budget</span>
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {budgets.map(b => (<button key={b} type="button" onClick={() => handleInputChange('budget', b)} className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border-2 ${formData.budget === b ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 border-white/50 hover:border-violet-400'}`}>{b}</button>))}
                </div>
                <div className="pt-4 border-t border-violet-200/50">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Currency for Plan</label>
                     {isMobile ? (
                        <div onClick={() => handleOpenSelection('currency', 'Select Currency')} className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition flex justify-between items-center text-left cursor-pointer">
                            <span className="truncate">{formData.currency}</span>
                            <svg className={`h-5 w-5 text-slate-400`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </div>
                     ) : (
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
                                }}
                                className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                                placeholder="Search currency..."
                                autoComplete="off"
                            />
                            {isCurrencyDropdownOpen && (
                                <ul className="absolute z-20 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
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
                     )}
                </div>
            </div>

            <div className="space-y-4 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/70 shadow-xl">
              <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                <span>What's your vibe?</span>
              </h2>
              <p className="text-sm text-slate-600">Select one or more vibes that best describe your ideal trip.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vibes.map(v => (<button key={v.label} type="button" onClick={() => handleVibeToggle(v.label)} className={`p-4 rounded-lg text-left transition-all duration-200 border-2 flex items-start space-x-3 ${formData.vibe.includes(v.label) ? 'bg-violet-100/70 border-violet-500' : 'bg-white/40 border-white/40 hover:bg-white/60'}`}><span className="text-2xl mt-1">{v.icon}</span><div><p className="font-semibold text-slate-800">{v.label}</p><p className="text-xs text-slate-500">{v.description}</p></div></button>))}
              </div>
            </div>
            
            <div className="space-y-4 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/70 shadow-xl">
               <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1.088A7 7 0 004.53 10.756.5.5 0 005 11h10a.5.5 0 00.47-.244A7 7 0 0011 4.088V3z" /><path fillRule="evenodd" d="M15 13a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h10z" clipRule="evenodd" /></svg>
                 <span>Food & Drink</span>
               </h2>
                <div className="grid grid-cols-3 gap-3">
                    {foodPreferences.map(({ label, icon }) => (
                        <button key={label} type="button" onClick={() => handleInputChange('foodPreference', label)} className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border-2 flex items-center justify-center space-x-2 ${formData.foodPreference === label ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 border-white/50 hover:border-violet-400'}`}>
                            <span className="text-xl">{icon}</span>
                            <span>{label}</span>
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

            <div className="space-y-4 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/70 shadow-xl">
                <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                  <span>Trip Add-ons</span>
                </h2>
                <p className="text-sm text-slate-600">Add extra details to your plan for a more comprehensive experience.</p>
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
                disabled={!isDestinationSelected || !!destinationError || (showStartPoint && (!isStartPointSelected || !!startPointError)) || formData.vibe.length === 0 || quotasLoading || (user && quotas.unified && quotas.unified.remaining <= 0)}
              >
                {quotasLoading ? '⏳ Loading limits...' : (user && quotas.unified && quotas.unified.remaining <= 0) ? '🚫 Limit Reached' : '✨ Plan My Adventure'}
              </button>
            </div>
          </form>
          <DateRangePicker
            isOpen={isDatePickerOpen}
            onClose={() => setIsDatePickerOpen(false)}
            onSelect={handleDateSelect}
            initialStartDate={formData.startDate}
            initialEndDate={formData.endDate}
          />
          {renderSelectionPage()}
        </div>
      );
};

// FIX: Correctly export the component defined in this file.
export default UnifiedPlannerForm;