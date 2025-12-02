import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PackingListRequestData, LocationSuggestion, PopularDestination } from '../types';
import { getDestinationSuggestions } from '../services/geminiService';
import { User } from '../services/authService';
import BackToHomeButton from './BackToHomeButton';
import SelectionPage from './SelectionPage';

interface PackingAssistantFormProps {
  onSubmit: (data: PackingListRequestData) => void;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onCancel: () => void;
  streamedText: string;
  initialData?: PackingListRequestData | null;
  user: User | null;
  onOpenAuthModal: () => void;
}

const languages = [
    'Afrikaans (af)', 'Akan (ak)', 'Albanian (sq)', 'Amharic (am)', 'Arabic (ar)', 'Armenian (hy)', 'Assamese (as)', 'Aymara (ay)', 'Azerbaijani (az)', 
    'Bambara (bm)', 'Basque (eu)', 'Belarusian (be)', 'Bengali (bn)', 'Bhojpuri (bho)', 'Bosnian (bs)', 'Bulgarian (bg)', 'Catalan (ca)', 'Cebuano (ceb)', 'Chinese (Simplified) (zh-CN)', 'Chinese (Traditional) (zh-TW)', 'Corsican (co)', 'Croatian (hr)', 'Czech (cs)', 'Danish (da)', 'Dhivehi (dv)', 'Dogri (doi)', 'Dutch (nl)', 'English (en)', 'Esperanto (eo)', 'Estonian (et)', 'Ewe (ee)', 'Filipino (Tagalog) (fil)', 'Finnish (fi)', 'French (fr)', 'Frisian (fy)', 'Galician (gl)', 'Ganda (lg)', 'Georgian (ka)', 'German (de)', 'Goan Konkani (gom)', 'Greek (el)', 'Guarani (gn)', 'Gujarati (gu)', 'Haitian Creole (ht)', 'Hausa (ha)', 'Hawaiian (haw)', 'Hebrew (iw)', 'Hindi (hi)', 'Hmong (hmn)', 'Hungarian (hu)', 'Icelandic (is)', 'Igbo (ig)', 'Ilocano (ilo)', 'Indonesian (id)', 'Irish (ga)', 'Italian (it)', 'Japanese (ja)', 'Javanese (jv)', 'Kannada (kn)', 'Kazakh (kk)', 'Khmer (km)', 'Kinyarwanda (rw)', 'Korean (ko)', 'Krio (kri)', 'Kurdish (ku)', 'Kurdish (Sorani) (ckb)', 'Kyrgyz (ky)', 'Lao (lo)', 'Latin (la)', 'Latvian (lv)', 'Lingala (ln)', 'Lithuanian (lt)', 'Luganda (lg)', 'Luxembourgish (lb)', 'Macedonian (mk)', 'Maithili (mai)', 'Malagasy (mg)', 'Malay (ms)', 'Malayalam (ml)', 'Maltese (mt)', 'Maori (mi)', 'Marathi (mr)', 'Meiteilon (Manipuri) (mni-Mtei)', 'Mizo (lus)', 'Mongolian (mn)', 'Myanmar (Burmese) (my)', 'Nepali (ne)', 'Norwegian (no)', 'Nyanja (Chichewa) (ny)', 'Odia (Oriya) (or)', 'Oromo (om)', 'Pashto (ps)', 'Persian (fa)', 'Polish (pl)', 'Portuguese (Brazil) (pt-BR)', 'Portuguese (Portugal) (pt-PT)', 'Punjabi (pa)', 'Quechua (qu)', 'Romanian (ro)', 'Russian (ru)', 'Samoan (sm)', 'Sanskrit (sa)', 'Scots Gaelic (gd)', 'Sepedi (nso)', 'Serbian (sr)', 'Sesotho (st)', 'Shona (sn)', 'Sindhi (sd)', 'Sinhala (si)', 'Slovak (sk)', 'Slovenian (sl)', 'Somali (so)', 'Spanish (es)', 'Sundanese (su)', 'Swahili (sw)', 'Swedish (sv)', 'Tagalog (Filipino) (tl)', 'Tajik (tg)', 'Tamil (ta)', 'Tatar (tt)', 'Telugu (te)', 'Thai (th)', 'Tigrinya (ti)', 'Tsonga (ts)', 'Turkish (tr)', 'Turkmen (tk)', 'Ukrainian (uk)', 'Urdu (ur)', 'Uyghur (ug)', 'Uzbek (uz)', 'Vietnamese (vi)', 'Welsh (cy)', 'Xhosa (xh)', 'Yiddish (yi)', 'Yoruba (yo)', 'Zulu (zu)',
];

// Helper function to format date as YYYY-MM-DD in local timezone
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PackingAssistantForm: React.FC<PackingAssistantFormProps> = ({ onSubmit, isLoading, error, onBack, onCancel, streamedText, initialData, user, onOpenAuthModal }) => {
  const calculateEndDate = (start: string, days: number): string => {
    if (!start || !days) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 2);
      return formatDateLocal(d);
    }
    const date = new Date(start + 'T00:00:00');
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days - 1);
    return formatDateLocal(date);
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const defaultEndDate = new Date(today);
  defaultEndDate.setDate(defaultEndDate.getDate() + 2);
  
  const [formData, setFormData] = useState({
    destination: initialData?.destination || '',
    startDate: initialData?.startDate || formatDateLocal(today),
    endDate: initialData ? calculateEndDate(initialData.startDate, initialData.days) : formatDateLocal(defaultEndDate),
    language: initialData?.language || 'English (en)',
  });
  const [days, setDays] = useState(initialData?.days || 3);
  
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isDestinationSelected, setIsDestinationSelected] = useState(!!initialData?.destination);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [popularDestinations, setPopularDestinations] = useState<PopularDestination[]>([]);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingSuggestion = useRef(false);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [selectionView, setSelectionView] = useState<{ field: keyof typeof formData, title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [langSearchTerm, setLangSearchTerm] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  
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

  // Ensure days don't exceed 45 on initialization
  useEffect(() => {
    if (days > 45) {
      const startDate = new Date(formData.startDate + 'T00:00:00');
      const maxEndDate = new Date(startDate);
      maxEndDate.setDate(maxEndDate.getDate() + 44); // 45 days total (inclusive)
      const maxEndDateString = formatDateLocal(maxEndDate);
      setFormData(prev => ({ 
        ...prev, 
        endDate: maxEndDateString
      }));
      setDays(45);
    }
  }, []); // Only run on mount

  // Helper function to calculate days between two dates
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(diffDays, 45); // Cap at 45 days
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    if (!newStartDate) return;
    
    const startDate = new Date(newStartDate + 'T00:00:00');
    const endDate = new Date(formData.endDate + 'T00:00:00');
    
    // Ensure start date is not after end date
    if (startDate > endDate) {
      // If start date is after end date, set end date to start date + current days (capped at 45)
      const currentDays = Math.min(days, 45);
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + currentDays - 1);
      const newEndDateString = formatDateLocal(newEndDate);
      const calculatedDays = calculateDays(newStartDate, newEndDateString);
      
      setFormData(prev => ({ 
        ...prev, 
        startDate: newStartDate,
        endDate: newEndDateString
      }));
      setDays(calculatedDays);
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
          endDate: maxEndDateString
        }));
        setDays(45);
      } else {
        setFormData(prev => ({ 
          ...prev, 
          startDate: newStartDate
        }));
        setDays(calculatedDays);
      }
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    if (!newEndDate) return;
    
    const startDate = new Date(formData.startDate + 'T00:00:00');
    const endDate = new Date(newEndDate + 'T00:00:00');
    
    // Ensure end date is not before start date
    if (endDate < startDate) {
      return;
    }
    
    const calculatedDays = calculateDays(formData.startDate, newEndDate);
    
    setFormData(prev => ({ 
      ...prev, 
      endDate: newEndDate
    }));
    setDays(calculatedDays);
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
      setIsSuggestionsLoading(true);
      debounceTimeout.current = setTimeout(() => {
        if (!isSelectingSuggestion.current) {
          getDestinationSuggestions(value, user?.gemini_api_key).then(results => {
            setSuggestions(results);
            setIsSuggestionsLoading(false);
            setApiKeyError(null); // Clear any previous API key errors
          }).catch(error => {
            setSuggestions([]);
            setIsSuggestionsLoading(false);
            
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
      setSuggestions([]);
      setIsSuggestionsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    isSelectingSuggestion.current = true;
    const fullName = suggestion.parentHierarchy ? `${suggestion.name}, ${suggestion.parentHierarchy}` : suggestion.name;
    handleInputChange('destination', fullName);
    setIsDestinationSelected(true);
    setDestinationError(null);
    setSuggestions([]);
    setIsSuggestionsLoading(false);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
  };

  const handleDestinationBlur = () => {
    setTimeout(() => {
      if (!isSelectingSuggestion.current && formData.destination.trim().length > 0 && !isDestinationSelected) {
        setDestinationError("Please pick a location from the list to lock it in! 🗺️");
      }
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
            inputRef.current && !inputRef.current.contains(event.target as Node)
        ) {
            setSuggestions([]);
        }
        if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
            setIsLangDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenSelection = (field: keyof typeof formData, title: string) => {
    // Disabled - mobile now uses inline suggestions instead of SelectionPage
    return;
    if (!isMobile) return;
    // Check authentication for destination search
    if (field === 'destination' && !user) {
      onOpenAuthModal();
      return;
    }
    if (field === 'destination') setSearchQuery(formData.destination);
    else setSearchQuery('');
    setSelectionView({ field, title });
  };

  const handleSelect = (item: any) => {
    if (!selectionView) return;
    const { field } = selectionView;

    if (field === 'destination') {
      const suggestion = item as LocationSuggestion | PopularDestination;
      const fullName = (suggestion as LocationSuggestion).parentHierarchy
            ? `${suggestion.name}, ${(suggestion as LocationSuggestion).parentHierarchy}`
            : suggestion.name;
      handleInputChange(field, fullName);
      setIsDestinationSelected(true);
      setDestinationError(null);
    } else {
      handleInputChange(field, item);
    }
    setSelectionView(null);
  };

  const handleSelectionSearchChange = (value: string) => {
    setSearchQuery(value);
    if (selectionView?.field === 'destination') {
      handleInputChange('destination', value);
      setIsDestinationSelected(false);
      setDestinationError(null);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      if (value.trim().length > 1) {
        // Check if user is logged in before searching
        if (!user) {
          onOpenAuthModal();
          return;
        }
        setIsSuggestionsLoading(true);
        debounceTimeout.current = setTimeout(() => {
          getDestinationSuggestions(value, user?.gemini_api_key).then(results => {
            setSuggestions(results);
            setIsSuggestionsLoading(false);
            setApiKeyError(null); // Clear any previous API key errors
          }).catch(error => {
            setSuggestions([]);
            setIsSuggestionsLoading(false);
            
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
        }, 500);
      } else {
        setSuggestions([]);
        setIsSuggestionsLoading(false);
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
    if (formData.destination.trim() === '') {
        setDestinationError("Please enter a destination.");
        return;
    }
    if (!isDestinationSelected) {
        setDestinationError("Please pick a location from the list to lock it in! 🗺️");
        return;
    }
    if (apiKeyError) {
        return;
    }
    
    onSubmit({
      destination: formData.destination,
      startDate: formData.startDate,
      days: days,
      language: formData.language
    });
  };

  const renderSelectionPage = () => {
    if (!isMobile || !selectionView) return null;

    const { field, title } = selectionView;
    let items: any[] = [];
    let renderItem: (item: any, index: number) => React.ReactNode;
    let isLoading = false;
    let popularItems: any[] | undefined = undefined;
    let renderPopularItem: ((item: any, index: number) => React.ReactNode) | undefined = undefined;
    
    if (field === 'destination') {
        items = suggestions;
        isLoading = isSuggestionsLoading;
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
    } else if (field === 'language') {
        items = languages.filter(lang => lang.toLowerCase().includes(searchQuery.toLowerCase()));
        renderItem = (lang) => <div className="px-4 py-3 cursor-pointer hover:bg-slate-100 text-slate-800">{lang}</div>;
    } else {
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
            error={apiKeyError && selectionView?.field === 'destination' ? apiKeyError : null}
        />
    );
  };

  // Calculate max end date (45 days from start date)
  const maxEndDate = useMemo(() => {
    if (!formData.startDate) return '';
    const startDate = new Date(formData.startDate + 'T00:00:00');
    const maxDate = new Date(startDate);
    maxDate.setDate(maxDate.getDate() + 44); // 45 days total (inclusive)
    return formatDateLocal(maxDate);
  }, [formData.startDate]);
  
  return (
    <div className="max-w-xl mx-auto">
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

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 bg-white/60 backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-slate-200/70 shadow-xl">
        <div className="relative">
          <label htmlFor="destination" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Destination</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
            </div>
            <input id="destination" ref={inputRef} type="text" value={formData.destination} onChange={handleDestinationChange} onBlur={handleDestinationBlur} placeholder="e.g., Goa, India" className="w-full pl-10 pr-4 py-2 bg-white text-base text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition" required autoComplete="off" />
          </div>
          {isSuggestionsLoading && <div className="absolute right-3 top-9"><svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
          {suggestions.length > 0 && (
             <ul ref={suggestionsRef} className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((s, i) => (
                    <li key={i} onClick={() => handleSuggestionClick(s)} className="px-4 py-3 cursor-pointer hover:bg-violet-100/60 flex justify-between items-center transition-colors">
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
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
              <div className="flex items-center space-x-2">
                  <span className="bg-violet-100 text-violet-700 font-bold px-3 py-1 rounded-full text-sm">
                      {days} {days === 1 ? 'day' : 'days'}
                  </span>
                  {days >= 45 && (
                      <span className="text-xs text-amber-600 font-medium">(Max 45 days)</span>
                  )}
              </div>
          </div>
          <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
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
            </div>
        </div>
        
        <div className="text-center pt-4 mb-24 pb-24">
          <button
            type="submit"
            className="w-full sm:w-auto px-10 py-4 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-violet-400/80 disabled:cursor-not-allowed disabled:shadow-md disabled:scale-100"
            disabled={!user || !isDestinationSelected || !!destinationError || !!apiKeyError || isLoading}
          >
            🧳 Pack My Bag
          </button>
        </div>
      </form>
      {/* SelectionPage disabled - mobile now uses inline suggestions */}
    </div>
  );
};

export default PackingAssistantForm;
