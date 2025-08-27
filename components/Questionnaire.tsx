
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Budget, Vibe, FoodPreference, TripType, QuestionnaireData } from '../types';
import { getDestinationSuggestions } from '../services/geminiService';

interface QuestionnaireProps {
  onSubmit: (data: QuestionnaireData) => void;
  isLoading: boolean;
  error: string | null;
  initialData?: QuestionnaireData | null;
  onBack: () => void;
  onCancel: () => void;
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

const loadingData = [
  { message: "Packing your virtual bags…", icon: "🧳" },
  { message: "Finding hidden gems for your journey", icon: "🌍" },
  { message: "Charting the perfect route for you", icon: "🗺️" },
  { message: "Matching your vibe with the best adventures", icon: "✨" },
  { message: "Your dream trip is loading…", icon: "✈️" },
  { message: "Adventure is just around the corner…", icon: "🧭" },
  { message: "Unlocking destinations you’ll love", icon: "❤️" },
  { message: "Bringing wanderlust to life…", icon: "🌟" },
  { message: "Great trips take a moment to plan", icon: "😉" },
  { message: "We’re almost there… buckle up!", icon: "🚀" },
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

const Questionnaire: React.FC<QuestionnaireProps> = ({ onSubmit, isLoading, error, initialData, onBack, onCancel }) => {
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
    includeMedical: false,
    language: 'English (en)',
    includeTransport: true,
  });
  
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
  const [isDestinationSuggestionsLoading, setIsDestinationSuggestionsLoading] = useState(false);
  const [startPointSuggestions, setStartPointSuggestions] = useState<string[]>([]);
  const [isStartPointSuggestionsLoading, setIsStartPointSuggestionsLoading] = useState(false);

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingSuggestion = useRef(false);

  const destinationSuggestionsRef = useRef<HTMLUListElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const startPointSuggestionsRef = useRef<HTMLUListElement>(null);
  const startPointInputRef = useRef<HTMLInputElement>(null);
  
  const [languageQuery, setLanguageQuery] = useState('');
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);

  const [loadingIndex, setLoadingIndex] = useState(0);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      setLoadingIndex(0);
      interval = setInterval(() => {
        setLoadingIndex(prev => (prev + 1) % loadingData.length);
      }, 2500);
    }
    return () => {
      if(interval) clearInterval(interval);
    }
  }, [isLoading]);

  const handleInputChange = (field: keyof QuestionnaireData, value: any) => {
    setFormData(prev => {
        const newState = { ...prev, [field]: value };
        if (field === 'tripType' && value === 'Standard') {
            newState.startPoint = '';
        }
        return newState;
    });
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('destination', value);
    
    isSelectingSuggestion.current = false;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (value.trim().length > 1) {
        setIsDestinationSuggestionsLoading(true);
        debounceTimeout.current = setTimeout(() => {
          if (!isSelectingSuggestion.current) {
            getDestinationSuggestions(value).then(results => {
              setDestinationSuggestions(results);
              setIsDestinationSuggestionsLoading(false);
            });
          }
        }, 500);
    } else {
        setDestinationSuggestions([]);
        setIsDestinationSuggestionsLoading(false);
    }
  };

  const handleDestinationSuggestionClick = (suggestion: string) => {
    isSelectingSuggestion.current = true;
    handleInputChange('destination', suggestion);
    setDestinationSuggestions([]);
    setIsDestinationSuggestionsLoading(false);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
  };
  
  const handleStartPointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('startPoint', value);
    
    isSelectingSuggestion.current = false;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (value.trim().length > 1) {
        setIsStartPointSuggestionsLoading(true);
        debounceTimeout.current = setTimeout(() => {
          if (!isSelectingSuggestion.current) {
            getDestinationSuggestions(value).then(results => {
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
  
  const handleStartPointSuggestionClick = (suggestion: string) => {
    isSelectingSuggestion.current = true;
    handleInputChange('startPoint', suggestion);
    setStartPointSuggestions([]);
    setIsStartPointSuggestionsLoading(false);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
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
  
  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const num = parseInt(value, 10);
    if (value === '') {
      handleInputChange('days', 0);
    } else if (!isNaN(num)) {
      handleInputChange('days', Math.min(30, Math.max(0, num)));
    }
  };

  const handleDaysBlur = () => {
    if (formData.days < 1) {
        handleInputChange('days', 1);
    }
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
        if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
            setLanguageDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const filteredLanguages = languages.filter(lang =>
    lang.toLowerCase().includes(languageQuery.toLowerCase())
  );

  if (isLoading) {
    const { message, icon } = loadingData[loadingIndex];
    return (
      <div className="text-center py-20 fade-in">
        <div className="inline-block relative">
          <div className="w-20 h-20 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl">{icon}</div>
        </div>
        <p className="mt-6 text-xl font-semibold text-slate-800">{message}</p>
        <p className="text-slate-600 mt-2">Crafting your personalized itinerary...</p>
        <button
          onClick={onCancel}
          className="mt-8 px-6 py-2 bg-white/60 text-slate-700 font-bold rounded-full hover:bg-white/80 transition-colors"
        >
          Cancel Generation
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
       <button onClick={onBack} className="text-slate-600 hover:text-slate-900 flex items-center space-x-2 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <span>Back to Home</span>
        </button>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Tell Us About Your Trip</h1>
        <p className="mt-2 text-lg text-slate-600">Fill in the details below to generate a personalized itinerary.</p>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
          <p className="font-bold">Oops!</p>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-6 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg z-20 relative">
             <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.998 5.998 0 0116 10c0 .954-.225 1.852-.635 2.667a2.5 2.5 0 01-5.033 0 2.5 2.5 0 00-4.667 0c-.35-.74-.533-1.554-.533-2.394a6.01 6.01 0 011.567-4.243z" clipRule="evenodd" /></svg>
                <span>Itinerary Language</span>
            </h2>
            <div ref={languageRef} className="relative">
                <div className="relative">
                    <button type="button" onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)} className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition flex justify-between items-center text-left" aria-haspopup="listbox" aria-expanded={languageDropdownOpen}>
                        <span className="truncate">{formData.language}</span>
                        <svg className={`h-5 w-5 text-slate-400 transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    {languageDropdownOpen && (
                        <div className="absolute z-20 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg">
                            <div className="p-2"><input type="text" value={languageQuery} onChange={(e) => setLanguageQuery(e.target.value)} placeholder="Search languages..." className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-violet-500 focus:border-violet-500" /></div>
                            <ul className="max-h-60 overflow-y-auto p-1">
                                {filteredLanguages.length > 0 ? filteredLanguages.map(lang => (
                                    <li key={lang} onClick={() => { handleInputChange('language', lang); setLanguageDropdownOpen(false); setLanguageQuery(''); }} className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-violet-100 text-slate-800">
                                        {lang}
                                    </li>
                                )) : <li className="px-3 py-2 text-sm text-slate-500">No languages found.</li>}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-6 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg">
            <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" /></svg>
                <span>Core Details</span>
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Trip Type</label>
              <div className="grid grid-cols-3 gap-3">
                {tripTypes.map(({ label, icon }) => (
                  <button key={label} type="button" onClick={() => handleInputChange('tripType', label)} className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border-2 flex items-center justify-center space-x-2 ${formData.tripType === label ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 border-white/50 hover:border-violet-400'}`}>
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className={`grid grid-cols-1 ${formData.tripType !== 'Standard' ? 'sm:grid-cols-2' : ''} gap-4`}>
               {formData.tripType !== 'Standard' && (
                    <div className="relative">
                        <label htmlFor="startPoint" className="block text-sm font-medium text-slate-700 mb-1">Starting Point</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.172-8.243a.75.75 0 01.12-1.06l3-3a.75.75 0 011.06 1.06l-3 3a.75.75 0 01-1.18 0z" clipRule="evenodd" /></svg>
                          </div>
                          <input id="startPoint" ref={startPointInputRef} type="text" value={formData.startPoint} onChange={handleStartPointChange} placeholder="e.g., Mumbai, India" className="w-full pl-10 pr-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition" required autoComplete="off"/>
                        </div>
                        {isStartPointSuggestionsLoading && <div className="absolute right-3 top-9"><svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
                        {startPointSuggestions.length > 0 && (<ul ref={startPointSuggestionsRef} className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">{startPointSuggestions.map((s, i) => (<li key={i} onClick={() => handleStartPointSuggestionClick(s)} className="px-4 py-2 cursor-pointer hover:bg-violet-100">{s}</li>))}</ul>)}
                    </div>
                )}
                <div className={`relative ${formData.tripType === 'Standard' ? 'sm:col-span-2' : ''}`}>
                    <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                      </div>
                      <input id="destination" ref={destinationInputRef} type="text" value={formData.destination} onChange={handleDestinationChange} placeholder="e.g., Paris, France" className="w-full pl-10 pr-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition" required autoComplete="off" />
                    </div>
                    {isDestinationSuggestionsLoading && <div className="absolute right-3 top-9"><svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
                    {destinationSuggestions.length > 0 && (<ul ref={destinationSuggestionsRef} className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">{destinationSuggestions.map((s, i) => (<li key={i} onClick={() => handleDestinationSuggestionClick(s)} className="px-4 py-2 cursor-pointer hover:bg-violet-100">{s}</li>))}</ul>)}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                      </div>
                      <input id="startDate" type="date" value={formData.startDate} min={new Date().toISOString().split('T')[0]} onChange={e => handleInputChange('startDate', e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition" required />
                  </div>
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
            <div>
              <label htmlFor="days" className="block text-sm font-medium text-slate-700 mb-1">Duration (days)</label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex-shrink-0 flex items-center space-x-1 bg-slate-200/60 p-1 rounded-lg">
                  {[1, 2, 3, 4, 5].map(d => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => handleInputChange('days', d)}
                      className={`px-3 py-1 text-sm w-10 text-center rounded-md font-semibold transition ${
                        formData.days === d ? 'bg-white text-violet-600 shadow' : 'text-slate-600 hover:bg-white/70'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <input
                  id="days"
                  type="number"
                  value={formData.days === 0 ? '' : formData.days}
                  onBlur={handleDaysBlur}
                  min="1"
                  max="30"
                  onChange={handleDaysChange}
                  className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                  required
                />
              </div>
            </div>
        </div>

        <div className="space-y-4 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg">
            <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.168-.217c-1.36.0-2.5 1.119-2.5 2.5s1.14 2.5 2.5 2.5c.346 0 .682-.07.98-.2a2.5 2.5 0 001.52-2.3z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.879.938.5.5 0 00-.22.643l.612 1.224a.5.5 0 00.643.22A3.49 3.49 0 0110 7.5v1.698a2.5 2.5 0 00-1.168-.217c-1.36.0-2.5 1.119-2.5 2.5s1.14 2.5 2.5 2.5c.346 0 .682-.07.98-.2a2.5 2.5 0 001.52-2.3V9.5a1 1 0 10-2 0v1a.5.5 0 01-1 0V9.5a.5.5 0 01.5-.5h1V8a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.879.938.5.5 0 00-.22.643l.612 1.224a.5.5 0 00.643.22A3.49 3.49 0 0110 7.5v1.698a2.5 2.5 0 00-1.168-.217c-1.36.0-2.5 1.119-2.5 2.5s1.14 2.5 2.5 2.5c.346 0 .682-.07.98-.2a2.5 2.5 0 001.52-2.3V9.5a1 1 0 10-2 0v1a.5.5 0 01-1 0V9.5a.5.5 0 01.5-.5h1V8a1 1 0 00-2 0z" clipRule="evenodd" /></svg>
              <span>Budget</span>
            </h2>
            <div className="grid grid-cols-3 gap-3">
                {budgets.map(b => (<button key={b} type="button" onClick={() => handleInputChange('budget', b)} className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border-2 ${formData.budget === b ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 border-white/50 hover:border-violet-400'}`}>{b}</button>))}
            </div>
        </div>

        <div className="space-y-4 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg">
          <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
            <span>What's your vibe?</span>
          </h2>
          <p className="text-sm text-slate-600">Select one or more vibes that best describe your ideal trip.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vibes.map(v => (<button key={v.label} type="button" onClick={() => handleVibeToggle(v.label)} className={`p-4 rounded-lg text-left transition-all duration-200 border-2 flex items-start space-x-3 ${formData.vibe.includes(v.label) ? 'bg-violet-100/70 border-violet-500' : 'bg-white/40 border-white/40 hover:bg-white/60'}`}><span className="text-2xl mt-1">{v.icon}</span><div><p className="font-semibold text-slate-800">{v.label}</p><p className="text-xs text-slate-500">{v.description}</p></div></button>))}
          </div>
        </div>
        
        <div className="space-y-4 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg">
           <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1.088A7 7 0 004.53 10.756.5.5 0 005 11h10a.5.5 0 00.47-.244A7 7 0 0011 4.088V3z" /><path fillRule="evenodd" d="M15 13a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h10z" clipRule="evenodd" /></svg>
             <span>Food Preference</span>
           </h2>
            <div className="grid grid-cols-3 gap-3">
                {foodPreferences.map(({ label, icon }) => (
                    <button key={label} type="button" onClick={() => handleInputChange('foodPreference', label)} className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border-2 flex items-center justify-center space-x-2 ${formData.foodPreference === label ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 border-white/50 hover:border-violet-400'}`}>
                        <span className="text-xl">{icon}</span>
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-4 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg">
            <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
              <span>Trip Add-ons</span>
            </h2>
            <p className="text-sm text-slate-600">Add extra details to your itinerary for a more comprehensive plan.</p>
            <div className="space-y-4">
              <Toggle
                label="Medical Facilities"
                description="Include nearby hospitals & pharmacies for each day."
                enabled={formData.includeMedical}
                onChange={(enabled) => handleInputChange('includeMedical', enabled)}
              />
              <Toggle
                label="Transport Suggestions"
                description="Get budget-appropriate transport options & costs."
                enabled={formData.includeTransport}
                onChange={(enabled) => handleInputChange('includeTransport', enabled)}
              />
            </div>
        </div>

        <div className="text-center pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-indigo-400 disabled:cursor-not-allowed"
            disabled={!formData.destination || formData.vibe.length === 0}
          >
            ✨ Generate My Itinerary
          </button>
        </div>
      </form>
    </div>
  );
};

export default Questionnaire;
