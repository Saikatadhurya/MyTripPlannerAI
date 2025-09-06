
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PackingListRequestData, LocationSuggestion, PopularDestination } from '../types';
import { getDestinationSuggestions } from '../services/geminiService';
import BackToHomeButton from './BackToHomeButton';

// --- Reusable Date Range Picker Component ---
interface DateRangePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (startDate: string, endDate: string) => void;
    initialStartDate?: string;
    initialEndDate?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ isOpen, onClose, onSelect, initialStartDate, initialEndDate }) => {
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const [startDate, setStartDate] = useState<Date | null>(initialStartDate ? new Date(initialStartDate + 'T00:00:00') : null);
    const [endDate, setEndDate] = useState<Date | null>(initialEndDate ? new Date(initialEndDate + 'T00:00:00') : null);
    const initialViewDate = useMemo(() => initialStartDate ? new Date(initialStartDate + 'T00:00:00') : new Date(), [initialStartDate]);
    const [viewDate, setViewDate] = useState(new Date(initialViewDate.getFullYear(), initialViewDate.getMonth(), 1));

    useEffect(() => {
        const bottomNav = document.querySelector('#bottom-nav-bar');
        const html = document.documentElement;
        const body = document.body;

        if (isOpen) {
          html.classList.add('body-scroll-lock');
          body.classList.add('body-scroll-lock');
          if (bottomNav) (bottomNav as HTMLElement).style.display = 'none';
        } else {
          html.classList.remove('body-scroll-lock');
          body.classList.remove('body-scroll-lock');
          if (bottomNav) (bottomNav as HTMLElement).style.display = 'flex';
        }
        return () => {
            html.classList.remove('body-scroll-lock');
            body.classList.remove('body-scroll-lock');
            if (bottomNav) (bottomNav as HTMLElement).style.display = 'flex';
        };
    }, [isOpen]);

    const handleDateClick = (day: number, month: number, year: number) => {
        const clickedDate = new Date(year, month, day);
        if (clickedDate < today) return;

        if (!startDate || (startDate && endDate)) {
            setStartDate(clickedDate);
            setEndDate(null);
        } else if (startDate && !endDate) {
            if (clickedDate < startDate) {
                setStartDate(clickedDate);
            } else {
                setEndDate(clickedDate);
            }
        }
    };

    const handleDone = () => {
        if (startDate && endDate) {
            onSelect(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
        } else if (startDate && !endDate) {
            onSelect(startDate.toISOString().split('T')[0], startDate.toISOString().split('T')[0]);
        }
        onClose();
    };

    const renderMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const areDatesEqual = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

        const days = Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} className="w-10 h-10"></div>);

        for (let i = 1; i <= daysInMonth; i++) {
            const currentDate = new Date(year, month, i);
            const isPast = currentDate < today;
            const isToday = areDatesEqual(currentDate, today);
            const isStartDate = startDate && areDatesEqual(currentDate, startDate);
            const isEndDate = endDate && areDatesEqual(currentDate, endDate);
            const isInRange = startDate && endDate && currentDate > startDate && currentDate < endDate;

            let classNames = 'w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200';
            if (isPast) classNames += ' text-slate-300 cursor-not-allowed';
            else {
                classNames += ' cursor-pointer';
                if (isStartDate || isEndDate) classNames += ' bg-violet-600 text-white font-bold';
                else if (isInRange) classNames += ' bg-violet-100 text-violet-800';
                else classNames += ' text-slate-700 hover:bg-slate-200';
                if (isToday && !isStartDate && !isEndDate) classNames += ' border-2 border-violet-500';
            }

            days.push(<button key={i} onClick={() => handleDateClick(i, month, year)} disabled={isPast} className={classNames}>{i}</button>);
        }
        return (
            <div key={`${year}-${month}`} className="p-4">
                <h3 className="text-lg font-semibold text-center text-slate-800 mb-4">{monthName}</h3>
                <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-500 font-medium mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 place-items-center">{days}</div>
            </div>
        );
    };

    const monthsToRender = useMemo(() => Array.from({ length: 12 }, (_, i) => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + i);
        return d;
    }), [viewDate]);
    
    let nightCount = 0;
    if (startDate && endDate) {
        nightCount = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col slide-down-animation">
            <header className="flex-shrink-0 flex items-center p-2 border-b border-slate-200 bg-white shadow-sm">
                <button onClick={onClose} className="p-2 mr-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                <h2 className="text-lg font-bold text-slate-800">Select Dates</h2>
            </header>
            <main className="flex-grow overflow-y-auto">{monthsToRender.map(renderMonth)}</main>
            <footer className="flex-shrink-0 bg-white p-4 border-t border-slate-200 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1"><p className="text-sm font-medium text-slate-500">START DATE</p><p className="text-lg font-bold text-slate-800">{startDate ? startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select a date'}</p></div>
                    {nightCount > 0 && <div className="flex-shrink-0 px-3 py-1 bg-slate-100 rounded-full text-sm font-semibold text-slate-700">{nightCount} {nightCount === 1 ? 'Night' : 'Nights'}</div>}
                    <div className="flex-1 text-right"><p className="text-sm font-medium text-slate-500">END DATE</p><p className="text-lg font-bold text-slate-800">{endDate ? endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select a date'}</p></div>
                </div>
                <button onClick={handleDone} disabled={!startDate} className="w-full px-6 py-3 bg-violet-600 text-white font-bold rounded-lg transition-colors duration-200 hover:bg-violet-700 disabled:bg-violet-300 disabled:cursor-not-allowed">Done</button>
            </footer>
        </div>
    );
};

// --- Reusable Typeahead Selection Page ---
interface SelectionPageProps<T> {
  isOpen: boolean;
  title: string;
  items: T[];
  onClose: () => void;
  onSelect: (item: T) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  popularItems?: T[];
  renderPopularItem?: (item: T, index: number) => React.ReactNode;
}

const SelectionPage = <T extends any>({
  isOpen,
  title,
  items,
  onClose,
  onSelect,
  renderItem,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  isLoading = false,
  popularItems,
  renderPopularItem,
}: SelectionPageProps<T>) => {

  useEffect(() => {
    const bottomNav = document.querySelector('#bottom-nav-bar');
    const html = document.documentElement;
    const body = document.body;

    if (isOpen) {
      html.classList.add('body-scroll-lock');
      body.classList.add('body-scroll-lock');
      if (bottomNav) (bottomNav as HTMLElement).style.display = 'none';
    } else {
      html.classList.remove('body-scroll-lock');
      body.classList.remove('body-scroll-lock');
      if (bottomNav) (bottomNav as HTMLElement).style.display = 'flex';
    }
    return () => {
        html.classList.remove('body-scroll-lock');
        body.classList.remove('body-scroll-lock');
        if (bottomNav) (bottomNav as HTMLElement).style.display = 'flex';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col slide-down-animation">
      <header className="flex-shrink-0 flex items-center p-2 border-b border-slate-200 bg-white">
        <button onClick={onClose} className="p-2 mr-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </header>

      <div className="flex-shrink-0 p-4 border-b border-slate-200 bg-white">
        <div className="relative">
          <svg className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 text-gray-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
          />
        </div>
      </div>

      <main className="flex-grow overflow-y-auto">
        {isLoading ? (
          <div className="text-center p-8 text-slate-600 font-semibold">Loading suggestions...</div>
        ) : searchValue.trim() === '' && popularItems && popularItems.length > 0 && renderPopularItem ? (
            <div>
              <h3 className="p-4 text-sm font-bold text-slate-500 uppercase tracking-wider bg-slate-100 border-b border-slate-200">Popular Searches</h3>
              <ul className="divide-y divide-slate-200">
                  {popularItems.map((item, index) => (
                      <li key={index} onClick={() => onSelect(item)}>
                          {renderPopularItem(item, index)}
                      </li>
                  ))}
              </ul>
            </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {items.map((item, index) => (
              <li key={index} onClick={() => onSelect(item)}>
                {renderItem(item, index)}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};


interface PackingAssistantFormProps {
  onSubmit: (data: PackingListRequestData) => void;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onCancel: () => void;
  streamedText: string;
  initialData?: PackingListRequestData | null;
}

const languages = [
    'Afrikaans (af)', 'Akan (ak)', 'Albanian (sq)', 'Amharic (am)', 'Arabic (ar)', 'Armenian (hy)', 'Assamese (as)', 'Aymara (ay)', 'Azerbaijani (az)', 
    'Bambara (bm)', 'Basque (eu)', 'Belarusian (be)', 'Bengali (bn)', 'Bhojpuri (bho)', 'Bosnian (bs)', 'Bulgarian (bg)', 'Catalan (ca)', 'Cebuano (ceb)', 'Chinese (Simplified) (zh-CN)', 'Chinese (Traditional) (zh-TW)', 'Corsican (co)', 'Croatian (hr)', 'Czech (cs)', 'Danish (da)', 'Dhivehi (dv)', 'Dogri (doi)', 'Dutch (nl)', 'English (en)', 'Esperanto (eo)', 'Estonian (et)', 'Ewe (ee)', 'Filipino (Tagalog) (fil)', 'Finnish (fi)', 'French (fr)', 'Frisian (fy)', 'Galician (gl)', 'Ganda (lg)', 'Georgian (ka)', 'German (de)', 'Goan Konkani (gom)', 'Greek (el)', 'Guarani (gn)', 'Gujarati (gu)', 'Haitian Creole (ht)', 'Hausa (ha)', 'Hawaiian (haw)', 'Hebrew (iw)', 'Hindi (hi)', 'Hmong (hmn)', 'Hungarian (hu)', 'Icelandic (is)', 'Igbo (ig)', 'Ilocano (ilo)', 'Indonesian (id)', 'Irish (ga)', 'Italian (it)', 'Japanese (ja)', 'Javanese (jv)', 'Kannada (kn)', 'Kazakh (kk)', 'Khmer (km)', 'Kinyarwanda (rw)', 'Korean (ko)', 'Krio (kri)', 'Kurdish (ku)', 'Kurdish (Sorani) (ckb)', 'Kyrgyz (ky)', 'Lao (lo)', 'Latin (la)', 'Latvian (lv)', 'Lingala (ln)', 'Lithuanian (lt)', 'Luganda (lg)', 'Luxembourgish (lb)', 'Macedonian (mk)', 'Maithili (mai)', 'Malagasy (mg)', 'Malay (ms)', 'Malayalam (ml)', 'Maltese (mt)', 'Maori (mi)', 'Marathi (mr)', 'Meiteilon (Manipuri) (mni-Mtei)', 'Mizo (lus)', 'Mongolian (mn)', 'Myanmar (Burmese) (my)', 'Nepali (ne)', 'Norwegian (no)', 'Nyanja (Chichewa) (ny)', 'Odia (Oriya) (or)', 'Oromo (om)', 'Pashto (ps)', 'Persian (fa)', 'Polish (pl)', 'Portuguese (Brazil) (pt-BR)', 'Portuguese (Portugal) (pt-PT)', 'Punjabi (pa)', 'Quechua (qu)', 'Romanian (ro)', 'Russian (ru)', 'Samoan (sm)', 'Sanskrit (sa)', 'Scots Gaelic (gd)', 'Sepedi (nso)', 'Serbian (sr)', 'Sesotho (st)', 'Shona (sn)', 'Sindhi (sd)', 'Sinhala (si)', 'Slovak (sk)', 'Slovenian (sl)', 'Somali (so)', 'Spanish (es)', 'Sundanese (su)', 'Swahili (sw)', 'Swedish (sv)', 'Tagalog (Filipino) (tl)', 'Tajik (tg)', 'Tamil (ta)', 'Tatar (tt)', 'Telugu (te)', 'Thai (th)', 'Tigrinya (ti)', 'Tsonga (ts)', 'Turkish (tr)', 'Turkmen (tk)', 'Ukrainian (uk)', 'Urdu (ur)', 'Uyghur (ug)', 'Uzbek (uz)', 'Vietnamese (vi)', 'Welsh (cy)', 'Xhosa (xh)', 'Yiddish (yi)', 'Yoruba (yo)', 'Zulu (zu)',
];

const PackingAssistantForm: React.FC<PackingAssistantFormProps> = ({ onSubmit, isLoading, error, onBack, onCancel, streamedText, initialData }) => {
  const calculateEndDate = (start: string, days: number): string => {
    if (!start || !days) {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      return d.toISOString().split('T')[0];
    }
    const date = new Date(start + 'T00:00:00');
    date.setDate(date.getDate() + days - 1);
    return date.toISOString().split('T')[0];
  };
  
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 2);
  
  const [formData, setFormData] = useState({
    destination: initialData?.destination || '',
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    endDate: initialData ? calculateEndDate(initialData.startDate, initialData.days) : defaultEndDate.toISOString().split('T')[0],
    language: initialData?.language || 'English (en)',
  });
  const [days, setDays] = useState(initialData?.days || 3);
  
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
  const [selectionView, setSelectionView] = useState<{ field: keyof typeof formData, title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
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

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleDateSelect = (start: string, end: string) => {
      const startDate = new Date(start + 'T00:00:00');
      const endDate = new Date(end + 'T00:00:00');
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      setFormData(prev => ({ ...prev, startDate: start, endDate: end }));
      setDays(diffDays);
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

  const handleOpenSelection = (field: keyof typeof formData, title: string) => {
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
        />
    );
  };
  
  return (
    <div className="max-w-xl mx-auto">
      <BackToHomeButton onClick={onBack} />

      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Smart Bag Packing</h1>
        <p className="mt-2 text-lg text-slate-600">Get an AI-powered packing list tailored to your trip.</p>
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
            <input id="destination" ref={inputRef} type="text" value={formData.destination} onChange={isMobile ? undefined : handleDestinationChange} onBlur={isMobile ? undefined : handleDestinationBlur} placeholder="e.g., Goa, India" className="w-full pl-10 pr-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition" required autoComplete="off" readOnly={isMobile} />
          </div>
          {isSuggestionsLoading && !isMobile && <div className="absolute right-3 top-9"><svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
          {!isMobile && suggestions.length > 0 && (
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
                  <span className="bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full text-sm">{days} {days === 1 ? 'day' : 'days'}</span>
              </button>
          </div>
          <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
                {isMobile ? (
                    <div onClick={() => handleOpenSelection('language', 'Select Language')} className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition flex justify-between items-center text-left cursor-pointer h-[42px]">
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
        
        <div className="text-center pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto px-10 py-4 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-violet-400/80 disabled:cursor-not-allowed disabled:shadow-md disabled:scale-100"
            disabled={!isDestinationSelected || !!destinationError || isLoading}
          >
            🧳 Pack My Bag
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

export default PackingAssistantForm;
