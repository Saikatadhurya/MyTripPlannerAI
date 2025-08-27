import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Budget, Vibe, FoodPreference } from '../types';
import { getDestinationSuggestions } from '../services/geminiService';

export interface QuestionnaireData {
    destination: string;
    days: number;
    budget: Budget;
    vibe: Vibe[];
    persons: number;
    foodPreference: FoodPreference;
    startDate: string;
    includeMedical: boolean;
    includeTransport: boolean;
}

interface QuestionnaireProps {
  onSubmit: (data: QuestionnaireData) => void;
  isLoading: boolean;
  error: string | null;
  initialData?: QuestionnaireData | null;
  onBack: () => void;
  onCancel: () => void;
}

const budgets: Budget[] = ['Budget', 'Midrange', 'Luxury'];
const foodPreferences: FoodPreference[] = ['Veg', 'Non-Veg', 'Vegan'];

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

const loadingMessages = [
  "Packing your virtual bags… 🧳",
  "Finding hidden gems for your journey 🌍",
  "Charting the perfect route for you 🗺️",
  "Matching your vibe with the best adventures ✨",
  "Your dream trip is loading… ✈️",
  "Adventure is just around the corner… 🧭",
  "Unlocking destinations you’ll love ❤️",
  "Bringing wanderlust to life… 🌟",
  "Great trips take a moment to plan 😉",
  "We’re almost there… buckle up! 🚀"
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
    days: 3,
    budget: 'Midrange',
    vibe: ['Adventure & Thrill'],
    persons: 1,
    foodPreference: 'Non-Veg',
    startDate: new Date().toISOString().split('T')[0],
    includeMedical: false,
    includeTransport: false,
  });
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const suggestionsRef = useRef<HTMLUListElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);

  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          return loadingMessages[(currentIndex + 1) % loadingMessages.length];
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleInputChange = (field: keyof QuestionnaireData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVibeToggle = (selectedVibe: Vibe) => {
    const newVibes = formData.vibe.includes(selectedVibe)
      ? formData.vibe.filter(v => v !== selectedVibe)
      : [...formData.vibe, selectedVibe];
    // Ensure at least one vibe is selected
    if (newVibes.length > 0) {
      handleInputChange('vibe', newVibes);
    }
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSuggestionsLoading(true);
    const results = await getDestinationSuggestions(query);
    setSuggestions(results);
    setIsSuggestionsLoading(false);
  }, []);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(formData.destination);
    }, 300); // 300ms debounce
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [formData.destination, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            suggestionsRef.current &&
            !suggestionsRef.current.contains(event.target as Node) &&
            destinationInputRef.current &&
            !destinationInputRef.current.contains(event.target as Node)
        ) {
            setSuggestions([]);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 fade-in">
        <div className="inline-block relative">
          <div className="w-20 h-20 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">✈️</div>
        </div>
        <p className="mt-6 text-xl font-semibold text-slate-800">{currentLoadingMessage}</p>
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
        {/* Section 1: Core Details */}
        <div className="space-y-6 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg">
          <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" /></svg>
             <span>Core Details</span>
          </h2>
          <div className="relative">
            <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-1">Where are you going?</label>
            <input
              id="destination"
              ref={destinationInputRef}
              type="text"
              value={formData.destination}
              onChange={e => handleInputChange('destination', e.target.value)}
              placeholder="e.g., Paris, France"
              className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
              required
              autoComplete="off"
            />
            {isSuggestionsLoading &&
              <div className="absolute right-3 top-9">
                <svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            }
            {suggestions.length > 0 && (
              <ul ref={suggestionsRef} className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li key={i} onClick={() => { handleInputChange('destination', s); setSuggestions([]); }}
                      className="px-4 py-2 cursor-pointer hover:bg-violet-100">
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input id="startDate" type="date" value={formData.startDate} min={new Date().toISOString().split('T')[0]} onChange={e => handleInputChange('startDate', e.target.value)} className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition" required />
            </div>
            <div>
              <label htmlFor="persons" className="block text-sm font-medium text-slate-700 mb-1">Travelers</label>
              <input id="persons" type="number" value={formData.persons} min="1" max="20" onChange={e => handleInputChange('persons', parseInt(e.target.value))} className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition" required />
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
                  value={formData.days}
                  min="1"
                  max="30"
                  onChange={e => handleInputChange('days', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white text-gray-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                  required
                />
              </div>
            </div>
        </div>

        {/* Section 2: Budget */}
        <div className="space-y-4 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg">
           <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.168-.217c-1.36.0-2.5 1.119-2.5 2.5s1.14 2.5 2.5 2.5c.346 0 .682-.07.98-.2a2.5 2.5 0 001.52-2.3z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.879.938.5.5 0 00-.22.643l.612 1.224a.5.5 0 00.643.22A3.49 3.49 0 0110 7.5v1.698a2.5 2.5 0 00-1.168-.217c-1.36.0-2.5 1.119-2.5 2.5s1.14 2.5 2.5 2.5c.346 0 .682-.07.98-.2a2.5 2.5 0 001.52-2.3V9.5a1 1 0 10-2 0v1a.5.5 0 01-1 0V9.5a.5.5 0 01.5-.5h1V8a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.879.938.5.5 0 00-.22.643l.612 1.224a.5.5 0 00.643.22A3.49 3.49 0 0110 7.5v1.698a2.5 2.5 0 00-1.168-.217c-1.36.0-2.5 1.119-2.5 2.5s1.14 2.5 2.5 2.5c.346 0 .682-.07.98-.2a2.5 2.5 0 001.52-2.3V9.5a1 1 0 10-2 0v1a.5.5 0 01-1 0V9.5a.5.5 0 01.5-.5h1V8a1 1 0 00-2 0z" clipRule="evenodd" /></svg>
             <span>Budget</span>
           </h2>
           <div className="grid grid-cols-3 gap-3">
              {budgets.map(b => (
                  <button key={b} type="button" onClick={() => handleInputChange('budget', b)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border-2 ${formData.budget === b ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 border-white/50 hover:border-violet-400'}`}>
                      {b}
                  </button>
              ))}
           </div>
        </div>

        {/* Section 3: Vibe */}
        <div className="space-y-4 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg">
          <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
            <span>What's your vibe?</span>
          </h2>
          <p className="text-sm text-slate-600">Select one or more vibes that best describe your ideal trip.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vibes.map(v => (
              <button key={v.label} type="button" onClick={() => handleVibeToggle(v.label)}
                  className={`p-4 rounded-lg text-left transition-all duration-200 border-2 flex items-start space-x-3 ${formData.vibe.includes(v.label) ? 'bg-violet-100/70 border-violet-500' : 'bg-white/40 border-white/40 hover:bg-white/60'}`}>
                <span className="text-2xl mt-1">{v.icon}</span>
                <div>
                  <p className="font-semibold text-slate-800">{v.label}</p>
                  <p className="text-xs text-slate-500">{v.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Section 4: Food Preference */}
        <div className="space-y-4 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg">
           <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1.088A7 7 0 004.53 10.756.5.5 0 005 11h10a.5.5 0 00.47-.244A7 7 0 0011 4.088V3z" /><path fillRule="evenodd" d="M15 13a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h10z" clipRule="evenodd" /></svg>
             <span>Food Preference</span>
           </h2>
           <div className="grid grid-cols-3 gap-3">
              {foodPreferences.map(f => (
                  <button key={f} type="button" onClick={() => handleInputChange('foodPreference', f)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border-2 ${formData.foodPreference === f ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 border-white/50 hover:border-violet-400'}`}>
                      {f}
                  </button>
              ))}
           </div>
        </div>
        
        {/* Section 5: Optional Features */}
        <div className="space-y-4 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg">
            <h2 className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b pb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
              <span>Optional Features</span>
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

        {/* Submission */}
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