import React, { useState, useRef, useEffect } from 'react';
import { MusicFinderRequestData, LocationSuggestion } from '../types';
import { getDestinationSuggestions } from '../services/geminiService';
import StreamingLoadingIndicator from './LoadingIndicator';

interface MusicFinderFormProps {
  onSubmit: (data: MusicFinderRequestData) => void;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onCancel: () => void;
  streamedText: string;
}

const musicStages = [
    { key: '"musicCategories":[', text: 'Curating music categories' },
    { key: '"genre":"TopTrendingHits"', text: 'Finding top trending hits' },
];

const funFacts = [
    { icon: '🎧', text: 'Tuning into local radio...' },
    { icon: '🎶', text: 'Discovering the local anthems...' },
    { icon: '🎸', text: 'Finding iconic folk songs...' },
    { icon: '🎤', text: 'Checking the top of the charts...' },
    { icon: '💿', text: 'Building the perfect travel playlist...' },
];

const languages = [
    'Afrikaans (af)', 'Akan (ak)', 'Albanian (sq)', 'Amharic (am)', 'Arabic (ar)', 'Armenian (hy)', 'Assamese (as)', 'Aymara (ay)', 'Azerbaijani (az)', 
    'Bambara (bm)', 'Basque (eu)', 'Belarusian (be)', 'Bengali (bn)', 'Bhojpuri (bho)', 'Bosnian (bs)', 'Bulgarian (bg)', 'Catalan (ca)', 'Cebuano (ceb)', 'Chinese (Simplified) (zh-CN)', 'Chinese (Traditional) (zh-TW)', 'Corsican (co)', 'Croatian (hr)', 'Czech (cs)', 'Danish (da)', 'Dhivehi (dv)', 'Dogri (doi)', 'Dutch (nl)', 'English (en)', 'Esperanto (eo)', 'Estonian (et)', 'Ewe (ee)', 'Filipino (Tagalog) (fil)', 'Finnish (fi)', 'French (fr)', 'Frisian (fy)', 'Galician (gl)', 'Ganda (lg)', 'Georgian (ka)', 'German (de)', 'Goan Konkani (gom)', 'Greek (el)', 'Guarani (gn)', 'Gujarati (gu)', 'Haitian Creole (ht)', 'Hausa (ha)', 'Hawaiian (haw)', 'Hebrew (iw)', 'Hindi (hi)', 'Hmong (hmn)', 'Hungarian (hu)', 'Icelandic (is)', 'Igbo (ig)', 'Ilocano (ilo)', 'Indonesian (id)', 'Irish (ga)', 'Italian (it)', 'Japanese (ja)', 'Javanese (jv)', 'Kannada (kn)', 'Kazakh (kk)', 'Khmer (km)', 'Kinyarwanda (rw)', 'Korean (ko)', 'Krio (kri)', 'Kurdish (ku)', 'Kurdish (Sorani) (ckb)', 'Kyrgyz (ky)', 'Lao (lo)', 'Latin (la)', 'Latvian (lv)', 'Lingala (ln)', 'Lithuanian (lt)', 'Luganda (lg)', 'Luxembourgish (lb)', 'Macedonian (mk)', 'Maithili (mai)', 'Malagasy (mg)', 'Malay (ms)', 'Malayalam (ml)', 'Maltese (mt)', 'Maori (mi)', 'Marathi (mr)', 'Meiteilon (Manipuri) (mni-Mtei)', 'Mizo (lus)', 'Mongolian (mn)', 'Myanmar (Burmese) (my)', 'Nepali (ne)', 'Norwegian (no)', 'Nyanja (Chichewa) (ny)', 'Odia (Oriya) (or)', 'Oromo (om)', 'Pashto (ps)', 'Persian (fa)', 'Polish (pl)', 'Portuguese (Brazil) (pt-BR)', 'Portuguese (Portugal) (pt-PT)', 'Punjabi (pa)', 'Quechua (qu)', 'Romanian (ro)', 'Russian (ru)', 'Samoan (sm)', 'Sanskrit (sa)', 'Scots Gaelic (gd)', 'Sepedi (nso)', 'Serbian (sr)', 'Sesotho (st)', 'Shona (sn)', 'Sindhi (sd)', 'Sinhala (si)', 'Slovak (sk)', 'Slovenian (sl)', 'Somali (so)', 'Spanish (es)', 'Sundanese (su)', 'Swahili (sw)', 'Swedish (sv)', 'Tagalog (Filipino) (tl)', 'Tajik (tg)', 'Tamil (ta)', 'Tatar (tt)', 'Telugu (te)', 'Thai (th)', 'Tigrinya (ti)', 'Tsonga (ts)', 'Turkish (tr)', 'Turkmen (tk)', 'Ukrainian (uk)', 'Urdu (ur)', 'Uyghur (ug)', 'Uzbek (uz)', 'Vietnamese (vi)', 'Welsh (cy)', 'Xhosa (xh)', 'Yiddish (yi)', 'Yoruba (yo)', 'Zulu (zu)',
];

const MusicFinderForm: React.FC<MusicFinderFormProps> = ({ onSubmit, isLoading, error, onBack, onCancel, streamedText }) => {
  const [formData, setFormData] = useState<MusicFinderRequestData>({
    destination: '',
    language: 'English (en)',
  });

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isDestinationSelected, setIsDestinationSelected] = useState(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingSuggestion = useRef(false);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [languageQuery, setLanguageQuery] = useState('');
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  
  const handleInputChange = (field: keyof MusicFinderRequestData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange('destination', value);
    setIsDestinationSelected(false);
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
    setSuggestions([]);
    setIsSuggestionsLoading(false);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
            inputRef.current && !inputRef.current.contains(event.target as Node)
        ) {
            setSuggestions([]);
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
    if (!isDestinationSelected) return;
    onSubmit(formData);
  };

  const filteredLanguages = languages.filter(lang =>
    lang.toLowerCase().includes(languageQuery.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <StreamingLoadingIndicator
        streamedText={streamedText}
        stages={musicStages}
        onCancel={onCancel}
        title="Curating Your Playlist..."
        accentColor="fuchsia"
        funFacts={funFacts}
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={onBack} className="text-slate-600 hover:text-slate-900 flex items-center space-x-2 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <span>Back to Home</span>
      </button>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Local Music Finder</h1>
        <p className="mt-2 text-lg text-slate-600">Discover the soundtrack of your travels.</p>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
          <p className="font-bold">Oops!</p>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white/40 backdrop-blur-md p-8 rounded-2xl border border-white/50 shadow-lg">
        <div className="relative">
          <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
            </div>
            <input id="destination" ref={inputRef} type="text" value={formData.destination} onChange={handleDestinationChange} placeholder="e.g., Havana, Cuba" className="w-full pl-10 pr-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition" required autoComplete="off" />
          </div>
          {isSuggestionsLoading && <div className="absolute right-3 top-9"><svg className="animate-spin h-5 w-5 text-fuchsia-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
          {suggestions.length > 0 && (
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
        </div>
        
        <div ref={languageRef} className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
            <button type="button" onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)} className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition flex justify-between items-center text-left" aria-haspopup="listbox" aria-expanded={languageDropdownOpen}>
                <span className="truncate">{formData.language}</span>
                <svg className={`h-5 w-5 text-slate-400 transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {languageDropdownOpen && (
                <div className="absolute z-20 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg">
                    <div className="p-2"><input type="text" value={languageQuery} onChange={(e) => setLanguageQuery(e.target.value)} placeholder="Search languages..." className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500" /></div>
                    <ul className="max-h-60 overflow-y-auto p-1">
                        {filteredLanguages.length > 0 ? filteredLanguages.map(lang => (
                            <li key={lang} onClick={() => { handleInputChange('language', lang); setLanguageDropdownOpen(false); setLanguageQuery(''); }} className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-fuchsia-100 text-slate-800">
                                {lang}
                            </li>
                        )) : <li className="px-3 py-2 text-sm text-slate-500">No languages found.</li>}
                    </ul>
                </div>
            )}
        </div>

        <div className="text-center pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto px-10 py-4 bg-fuchsia-600 text-white font-bold rounded-full hover:bg-fuchsia-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-fuchsia-400/80 disabled:cursor-not-allowed disabled:shadow-md disabled:scale-100"
            disabled={!isDestinationSelected || isLoading}
          >
            🎶 Discover Local Music
          </button>
        </div>
      </form>
    </div>
  );
};

export default MusicFinderForm;