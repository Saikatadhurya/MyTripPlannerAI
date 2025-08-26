
import React, { useState, useEffect, useRef } from 'react';
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
}

interface QuestionnaireProps {
  onSubmit: (data: QuestionnaireData) => void;
  isLoading: boolean;
  error: string | null;
  initialData?: QuestionnaireData | null;
  onBack: () => void;
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

const Questionnaire: React.FC<QuestionnaireProps> = ({ onSubmit, isLoading, error, initialData, onBack }) => {
  const getTodayString = () => new Date().toISOString().split('T')[0];
  
  const [destination, setDestination] = useState(initialData?.destination || '');
  const [days, setDays] = useState(initialData?.days || 3);
  const [budget, setBudget] = useState<Budget>(initialData?.budget || 'Midrange');
  const [vibe, setVibe] = useState<Vibe[]>(initialData?.vibe || ['Adventure & Thrill']);
  const [persons, setPersons] = useState(initialData?.persons || 1);
  const [foodPreference, setFoodPreference] = useState<FoodPreference>(initialData?.foodPreference || 'Non-Veg');
  const [startDate, setStartDate] = useState(initialData?.startDate || getTodayString());

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  const suggestionsListRef = useRef<HTMLUListElement>(null);

  const dayPresets = [1, 2, 3, 4, 5];
  const isCustomDays = !dayPresets.includes(days);

  useEffect(() => {
    const controller = new AbortController();

    const handler = setTimeout(async () => {
        setIsSuggestionsLoading(true);
        try {
            const fetchedSuggestions = await getDestinationSuggestions(destination);
            if (!controller.signal.aborted) {
                setSuggestions(fetchedSuggestions);
                setHighlightedIndex(-1); // Reset highlight when suggestions change
            }
        } catch (error) {
            if (!controller.signal.aborted) {
                console.error(`Failed to fetch suggestions for "${destination}":`, error);
                setSuggestions([]);
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsSuggestionsLoading(false);
            }
        }
    }, destination ? 300 : 0); // No debounce for initial fetch, 300ms for user input

    return () => {
        clearTimeout(handler);
        controller.abort();
    };
  }, [destination]);

  useEffect(() => {
    if (highlightedIndex > -1 && suggestionsListRef.current) {
      const highlightedItem = suggestionsListRef.current.children[highlightedIndex] as HTMLLIElement;
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  useEffect(() => {
    if (isLoading) {
      const intervalId = setInterval(() => {
        setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
      }, 2500);
      return () => clearInterval(intervalId);
    }
  }, [isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prevIndex => (prevIndex + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prevIndex => (prevIndex - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
            if (highlightedIndex > -1) {
                e.preventDefault(); // Prevent form submission
                setDestination(suggestions[highlightedIndex]);
                setShowSuggestions(false);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    }
  };

  const handleVibeToggle = (selectedVibe: Vibe) => {
    setVibe(prev => {
        const isSelected = prev.includes(selectedVibe);
        if (isSelected) {
            // Remove it, but ensure at least one remains
            return prev.length > 1 ? prev.filter(v => v !== selectedVibe) : prev;
        } else {
            // Add it
            return [...prev, selectedVibe];
        }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      alert("Please enter a destination.");
      return;
    }
    if (persons <= 0) {
      alert("Please enter a valid number of people.");
      return;
    }
     if (days <= 0) {
      alert("Please enter a valid number of days.");
      return;
    }
    if (vibe.length === 0) {
      alert("Please select at least one travel vibe.");
      return;
    }
    onSubmit({ destination, days, budget, vibe, persons, foodPreference, startDate });
  };
  
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-8 bg-white/40 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <svg className="animate-spin h-10 w-10 text-violet-600 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p key={currentMessageIndex} className="text-xl font-semibold text-slate-700 fade-in px-4">
            {loadingMessages[currentMessageIndex]}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 bg-white/40 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="text-slate-600 hover:text-slate-900 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span>Back</span>
            </button>
            <h2 className="text-2xl font-bold text-slate-800">Plan Your Journey</h2>
            <div></div>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">{error}</div>}
      
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Destination */}
            <section>
              <label htmlFor="destination" className="block text-lg font-semibold text-slate-700 mb-3">Where do you want to go?</label>
              <div className="relative">
                <input
                    type="text" id="destination" value={destination}
                    onChange={(e) => { setDestination(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-3 bg-white/50 text-slate-800 border border-white/40 rounded-lg focus:bg-white/70 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition-all duration-200 shadow-sm placeholder-slate-500"
                    placeholder="e.g., Paris, Tokyo, Bali..." required autoComplete="off"
                />
                 {isSuggestionsLoading && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white/90 backdrop-blur-xl rounded-lg shadow-lg border border-white/50">
                      <ul ref={suggestionsListRef} className="py-1 max-h-60 overflow-y-auto">
                          {suggestions.map((s, index) => (
                              <li key={index}>
                                  <button
                                      type="button"
                                      className={`w-full text-left px-4 py-2 text-slate-700 transition-colors ${index === highlightedIndex ? 'bg-violet-100' : 'hover:bg-violet-100/50'}`}
                                      onMouseDown={() => { // use onMouseDown to fire before input's onBlur
                                          setDestination(s);
                                          setShowSuggestions(false);
                                      }}
                                      onMouseEnter={() => setHighlightedIndex(index)}
                                  >
                                      {s}
                                  </button>
                              </li>
                          ))}
                      </ul>
                  </div>
                )}
              </div>
            </section>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Persons */}
              <section>
                <label htmlFor="persons" className="block text-lg font-semibold text-slate-700 mb-3">How many people?</label>
                <input
                  type="number"
                  id="persons"
                  value={persons === 0 ? '' : persons}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setPersons(0);
                    } else {
                      const num = Number(val);
                      if (Number.isInteger(num) && num > 0) {
                        setPersons(num);
                      }
                    }
                  }}
                  className="w-full px-4 py-3 bg-white/50 text-slate-800 border border-white/40 rounded-lg focus:bg-white/70 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition-all duration-200 shadow-sm placeholder-slate-500"
                  min="1"
                  placeholder="Number of travelers"
                  required
                />
              </section>

              {/* Start Date */}
              <section>
                <label htmlFor="start-date" className="block text-lg font-semibold text-slate-700 mb-3">When do you want to go?</label>
                <input
                    type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={getTodayString()}
                    className="w-full px-4 py-3 bg-white/50 text-slate-800 border border-white/40 rounded-lg focus:bg-white/70 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition-all duration-200 shadow-sm"
                    required
                />
              </section>
            </div>
            
            {/* Days */}
            <section>
                <label className="block text-lg font-semibold text-slate-700 mb-3">How many days?</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {dayPresets.map(d => (
                        <button type="button" key={d} onClick={() => setDays(d)} className={`py-3 rounded-lg font-semibold transition-all duration-200 ${days === d && !isCustomDays ? 'bg-violet-600 text-white shadow-md' : 'bg-white/40 hover:bg-white/70'}`}>
                            {d} Day{d > 1 ? 's' : ''}
                        </button>
                    ))}
                    <input
                      type="number"
                      value={days === 0 ? '' : days}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Allow empty for editing, otherwise only positive integers
                        if (val === '') {
                          setDays(0);
                        } else {
                          const num = Number(val);
                          if (Number.isInteger(num) && num > 0) {
                            setDays(num);
                          }
                        }
                      }}
                      className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 text-center border-2 focus:ring-2 focus:ring-violet-500/50 placeholder-slate-500 ${isCustomDays ? 'bg-white/70 border-violet-500 text-violet-700' : 'bg-white/30 border-transparent text-slate-700'}`}
                      min="1"
                      placeholder="Custom"
                    />
                </div>
            </section>

            {/* Budget */}
            <section>
                <label className="block text-lg font-semibold text-slate-700 mb-3">What's your budget range?</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {budgets.map(b => (
                        <button type="button" key={b} onClick={() => setBudget(b)} className={`p-4 rounded-lg text-center border-2 transition-all ${budget === b ? 'bg-violet-100/70 border-violet-500 shadow-md' : 'bg-white/40 border-white/40 hover:bg-white/60'}`}>
                            <span className="font-bold text-slate-800">{b}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Food Preference */}
            <section>
                <label className="block text-lg font-semibold text-slate-700 mb-3">What's your food preference?</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {foodPreferences.map(fp => (
                        <button type="button" key={fp} onClick={() => setFoodPreference(fp)} className={`p-4 rounded-lg text-center border-2 transition-all ${foodPreference === fp ? 'bg-violet-100/70 border-violet-500 shadow-md' : 'bg-white/40 border-white/40 hover:bg-white/60'}`}>
                            <span className="font-bold text-slate-800">{fp}</span>
                        </button>
                    ))}
                </div>
            </section>
            
            {/* Vibe */}
            <section>
                <label className="block text-lg font-semibold text-slate-700 mb-3">What's your travel vibe? (Select one or more)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {vibes.map(v => (
                        <button type="button" key={v.label} onClick={() => handleVibeToggle(v.label)} className={`p-4 rounded-lg border-2 flex flex-col items-center justify-start text-center space-y-2 transition-all h-full ${vibe.includes(v.label) ? 'bg-violet-100/80 text-violet-600 border-violet-500' : 'bg-white/40 text-slate-600 border-white/40 hover:bg-white/60'}`}>
                            <span className="text-3xl">{v.icon}</span>
                            <span className="font-semibold text-sm leading-tight">{v.label}</span>
                            <p className="text-xs text-slate-500 font-medium">{v.description}</p>
                        </button>
                    ))}
                </div>
            </section>

            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center px-6 py-4 border border-transparent text-base font-bold rounded-full text-white bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl">
                ✨ Generate My Itinerary
            </button>
        </form>
    </div>
  );
};
export default Questionnaire;