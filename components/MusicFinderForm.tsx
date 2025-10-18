import React, { useState, useRef, useEffect } from 'react';
import { MusicFinderRequestData, LocationSuggestion, PopularDestination } from '../types';
import { getDestinationSuggestions } from '../services/geminiService';
import { useQuotas } from '../hooks/useQuotas';
import { User } from '../services/authService';
import BackToHomeButton from './BackToHomeButton';
import SelectionPage from './SelectionPage';

interface MusicFinderFormProps {
  onSubmit: (data: MusicFinderRequestData) => void;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onCancel: () => void;
  streamedText: string;
  initialData?: MusicFinderRequestData | null;
  user: User | null;
}

const languages = [
    'Afrikaans (af)', 'Akan (ak)', 'Albanian (sq)', 'Amharic (am)', 'Arabic (ar)', 'Armenian (hy)', 'Assamese (as)', 'Aymara (ay)', 'Azerbaijani (az)', 
    'Bambara (bm)', 'Basque (eu)', 'Belarusian (be)', 'Bengali (bn)', 'Bhojpuri (bho)', 'Bosnian (bs)', 'Bulgarian (bg)', 'Catalan (ca)', 'Cebuano (ceb)', 'Chinese (Simplified) (zh-CN)', 'Chinese (Traditional) (zh-TW)', 'Corsican (co)', 'Croatian (hr)', 'Czech (cs)', 'Danish (da)', 'Dhivehi (dv)', 'Dogri (doi)', 'Dutch (nl)', 'English (en)', 'Esperanto (eo)', 'Estonian (et)', 'Ewe (ee)', 'Filipino (Tagalog) (fil)', 'Finnish (fi)', 'French (fr)', 'Frisian (fy)', 'Galician (gl)', 'Ganda (lg)', 'Georgian (ka)', 'German (de)', 'Goan Konkani (gom)', 'Greek (el)', 'Guarani (gn)', 'Gujarati (gu)', 'Haitian Creole (ht)', 'Hausa (ha)', 'Hawaiian (haw)', 'Hebrew (iw)', 'Hindi (hi)', 'Hmong (hmn)', 'Hungarian (hu)', 'Icelandic (is)', 'Igbo (ig)', 'Ilocano (ilo)', 'Indonesian (id)', 'Irish (ga)', 'Italian (it)', 'Japanese (ja)', 'Javanese (jv)', 'Kannada (kn)', 'Kazakh (kk)', 'Khmer (km)', 'Kinyarwanda (rw)', 'Korean (ko)', 'Krio (kri)', 'Kurdish (ku)', 'Kurdish (Sorani) (ckb)', 'Kyrgyz (ky)', 'Lao (lo)', 'Latin (la)', 'Latvian (lv)', 'Lingala (ln)', 'Lithuanian (lt)', 'Luganda (lg)', 'Luxembourgish (lb)', 'Macedonian (mk)', 'Maithili (mai)', 'Malagasy (mg)', 'Malay (ms)', 'Malayalam (ml)', 'Maltese (mt)', 'Maori (mi)', 'Marathi (mr)', 'Meiteilon (Manipuri) (mni-Mtei)', 'Mizo (lus)', 'Mongolian (mn)', 'Myanmar (Burmese) (my)', 'Nepali (ne)', 'Norwegian (no)', 'Nyanja (Chichewa) (ny)', 'Odia (Oriya) (or)', 'Oromo (om)', 'Pashto (ps)', 'Persian (fa)', 'Polish (pl)', 'Portuguese (Brazil) (pt-BR)', 'Portuguese (Portugal) (pt-PT)', 'Punjabi (pa)', 'Quechua (qu)', 'Romanian (ro)', 'Russian (ru)', 'Samoan (sm)', 'Sanskrit (sa)', 'Scots Gaelic (gd)', 'Sepedi (nso)', 'Serbian (sr)', 'Sesotho (st)', 'Shona (sn)', 'Sindhi (sd)', 'Sinhala (si)', 'Slovak (sk)', 'Slovenian (sl)', 'Somali (so)', 'Spanish (es)', 'Sundanese (su)', 'Swahili (sw)', 'Swedish (sv)', 'Tagalog (Filipino) (tl)', 'Tajik (tg)', 'Tamil (ta)', 'Tatar (tt)', 'Telugu (te)', 'Thai (th)', 'Tigrinya (ti)', 'Tsonga (ts)', 'Turkish (tr)', 'Turkmen (tk)', 'Ukrainian (uk)', 'Urdu (ur)', 'Uyghur (ug)', 'Uzbek (uz)', 'Vietnamese (vi)', 'Welsh (cy)', 'Xhosa (xh)', 'Yiddish (yi)', 'Yoruba (yo)', 'Zulu (zu)',
];

const MusicFinderForm: React.FC<MusicFinderFormProps> = ({ onSubmit, isLoading, error, onBack, onCancel, streamedText, initialData, user }) => {
  const { quotas, quotasLoading } = useQuotas(user);
  const [formData, setFormData] = useState<MusicFinderRequestData>(initialData || {
    destination: '',
    language: 'English (en)',
  });

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isDestinationSelected, setIsDestinationSelected] = useState(!!initialData?.destination);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [popularDestinations, setPopularDestinations] = useState<PopularDestination[]>([]);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingSuggestion = useRef(false);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [selectionView, setSelectionView] = useState<{ field: keyof MusicFinderRequestData, title: string } | null>(null);
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
  
  const handleInputChange = (field: keyof MusicFinderRequestData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('destination', value);
    setIsDestinationSelected(false);
    setDestinationError(null);
    isSelectingSuggestion.current = false;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (value.trim().length > 1) {
      setIsSuggestionsLoading(true);
      debounceTimeout.current = setTimeout(() => {
        if (!isSelectingSuggestion.current) {
          getDestinationSuggestions(value).then(results => {
            setSuggestions(results);
            setIsSuggestionsLoading(false);
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

  const handleOpenSelection = (field: keyof MusicFinderRequestData, title: string) => {
    if (!isMobile) return;
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
        setIsSuggestionsLoading(true);
        debounceTimeout.current = setTimeout(() => {
          getDestinationSuggestions(value).then(results => {
            setSuggestions(results);
            setIsSuggestionsLoading(false);
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
    if (formData.destination.trim() === '') {
        setDestinationError("Please enter a destination.");
        return;
    }
    if (!isDestinationSelected) {
        setDestinationError("Please pick a location from the list to lock it in! 🗺️");
        return;
    }

    // Check quota limits
    if (user && quotas.music && quotas.music.remaining <= 0) {
        setDestinationError("You have reached your weekly limit for music recommendations. Please try again next week or upgrade your plan.");
        return;
    }

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
            accentColor="fuchsia"
        />
    );
  };
  
  return (
    <div className="max-w-xl mx-auto">
      <BackToHomeButton onClick={onBack} />

      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Local Music Finder</h1>
        <p className="mt-2 text-lg text-slate-600">Discover the soundtrack of your travels.</p>
        {user && (
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-fuchsia-100 text-fuchsia-800">
            {quotasLoading ? (
              <>⏳ Loading limits...</>
            ) : (
              <>🎵 {quotas.music ? `${quotas.music.remaining}/${quotas.music.weekly_limit}` : '0/2'} uses left this week</>
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

      <form onSubmit={handleSubmit} className="space-y-8 bg-white/60 backdrop-blur-md p-8 rounded-2xl border border-slate-200/70 shadow-xl">
        <div className="relative">
          <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
          <div className="relative" onClick={() => handleOpenSelection('destination', 'Select Destination')}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
            </div>
            <input id="destination" ref={inputRef} type="text" value={formData.destination} onChange={isMobile ? undefined : handleDestinationChange} onBlur={isMobile ? undefined : handleDestinationBlur} placeholder="e.g., Havana, Cuba" className="w-full pl-10 pr-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition" required autoComplete="off" readOnly={isMobile} />
          </div>
          {isSuggestionsLoading && !isMobile && <div className="absolute right-3 top-9"><svg className="animate-spin h-5 w-5 text-fuchsia-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
          {!isMobile && suggestions.length > 0 && (
            <ul ref={suggestionsRef} className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((s, i) => (
                    <li key={i} onClick={() => handleSuggestionClick(s)} className="px-4 py-3 cursor-pointer hover:bg-fuchsia-100/60 flex justify-between items-center transition-colors">
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
        </div>
        
        <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
            {isMobile ? (
                 <div onClick={() => handleOpenSelection('language', 'Select Language')} className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition flex justify-between items-center text-left cursor-pointer">
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
                        className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition"
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
                                        className="px-4 py-3 cursor-pointer hover:bg-fuchsia-100/60"
                                    >
                                        {lang}
                                    </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>

        <div className="text-center pt-4 mb-32 pb-12">
          <button
            type="submit"
            className="w-full sm:w-auto px-10 py-4 bg-fuchsia-600 text-white font-bold rounded-full hover:bg-fuchsia-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-fuchsia-400/80 disabled:cursor-not-allowed disabled:shadow-md disabled:scale-100"
            disabled={!isDestinationSelected || !!destinationError || isLoading || quotasLoading || (user && quotas.music && quotas.music.remaining <= 0)}
          >
            {quotasLoading ? '⏳ Loading limits...' : (user && quotas.music && quotas.music.remaining <= 0) ? '🚫 Limit Reached' : '🎶 Discover Local Music'}
          </button>
        </div>
      </form>
      {renderSelectionPage()}
    </div>
  );
};

export default MusicFinderForm;
