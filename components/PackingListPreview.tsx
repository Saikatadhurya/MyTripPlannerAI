import React, { useState, useEffect } from 'react';
import { PackingList } from '../types';
import { useSaveRecommendation } from '../hooks/useSaveRecommendation';

const parseBold = (text: string | undefined) => {
  if (!text) return { __html: '' };
  // Bolding now includes larger, darker text for prominence
  return { __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 text-lg">$1</strong>') };
};

const getWeatherIcon = (tempString: string | undefined): React.ReactNode => {
    if (!tempString) return <span className="text-4xl" role="img" aria-label="thermometer">🌡️</span>;
    
    const weatherText = tempString.toLowerCase();
    
    // First, check weather description keywords for more accurate icon selection
    // Check more specific conditions first
    if (weatherText.includes('partly cloudy') || weatherText.includes('partly cloud')) {
        return <span className="text-4xl" role="img" aria-label="sun behind cloud">⛅</span>;
    }
    if (weatherText.includes('sunny') || weatherText.includes('clear')) {
        return <span className="text-4xl" role="img" aria-label="sun">☀️</span>;
    }
    if (weatherText.includes('rain') || weatherText.includes('shower') || weatherText.includes('drizzle')) {
        return <span className="text-4xl" role="img" aria-label="rain">🌧️</span>;
    }
    if (weatherText.includes('snow') || weatherText.includes('sleet')) {
        return <span className="text-4xl" role="img" aria-label="snowflake">❄️</span>;
    }
    if (weatherText.includes('storm') || weatherText.includes('thunder')) {
        return <span className="text-4xl" role="img" aria-label="storm">⛈️</span>;
    }
    if (weatherText.includes('cloud') || weatherText.includes('overcast')) {
        return <span className="text-4xl" role="img" aria-label="cloud">☁️</span>;
    }
    if (weatherText.includes('fog') || weatherText.includes('mist')) {
        return <span className="text-4xl" role="img" aria-label="fog">🌫️</span>;
    }
    
    // Fall back to temperature-based logic if no weather keywords found
    // Match temperature patterns like "20-28°C", "25°C", "15 to 20°C", etc.
    // First try to match range pattern (e.g., "20-28°C" or "20 to 28°C")
    const rangePattern = /(-?\d+)\s*[-–—to]+\s*(-?\d+)/i;
    const rangeMatch = tempString.match(rangePattern);
    
    let avgTemp: number | null = null;
    
    if (rangeMatch) {
        // Range found (e.g., "20-28°C")
        const temp1 = parseInt(rangeMatch[1], 10);
        const temp2 = parseInt(rangeMatch[2], 10);
        
        if (!isNaN(temp1) && !isNaN(temp2) && temp1 >= -50 && temp1 <= 60 && temp2 >= -50 && temp2 <= 60) {
            avgTemp = (temp1 + temp2) / 2;
        }
    } else {
        // Try to match single temperature (e.g., "25°C")
        const singlePattern = /(-?\d+)\s*°?C/i;
        const singleMatch = tempString.match(singlePattern);
        
        if (singleMatch) {
            const temp = parseInt(singleMatch[1], 10);
            if (!isNaN(temp) && temp >= -50 && temp <= 60) {
                avgTemp = temp;
            }
        }
    }
    
    // If we couldn't parse temperature, return thermometer icon
    if (avgTemp === null || isNaN(avgTemp)) {
        return <span className="text-4xl" role="img" aria-label="thermometer">🌡️</span>;
    }

    // Temperature-based icon selection (Celsius)
    if (avgTemp >= 30) return <span className="text-4xl" role="img" aria-label="sun">☀️</span>;
    if (avgTemp >= 20) return <span className="text-4xl" role="img" aria-label="sun behind cloud">⛅</span>;
    if (avgTemp >= 10) return <span className="text-4xl" role="img" aria-label="cloud">☁️</span>;
    if (avgTemp >= 0) return <span className="text-4xl" role="img" aria-label="coat">🧥</span>;
    // Below 0°C
    return <span className="text-4xl" role="img" aria-label="snowflake">❄️</span>;
};


const CategoryCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    items: string[];
    accentColor: string;
    className?: string;
}> = ({ title, icon, items, accentColor, className = '' }) => {
    if (!items || items.length === 0) return null;

    const accentClasses: { [key: string]: string } = {
        blue: 'border-blue-500 bg-blue-100 text-blue-600',
        green: 'border-green-500 bg-green-100 text-green-600',
        slate: 'border-slate-500 bg-slate-100 text-slate-600',
        pink: 'border-pink-500 bg-pink-100 text-pink-600',
        red: 'border-red-500 bg-red-100 text-red-600',
        amber: 'border-amber-500 bg-amber-100 text-amber-600',
        purple: 'border-purple-500 bg-purple-100 text-purple-600',
    };
    
    const accentStyle = accentClasses[accentColor] || 'border-gray-500 bg-gray-100 text-gray-600';
    const [borderColor, iconBgColor, iconTextColor] = accentStyle.split(' ');

    // Filter out inner garment items from the list
    const filteredItems = items.filter(item => {
        const lowerItem = item.toLowerCase();
        return !lowerItem.includes('underwear') && 
               !lowerItem.includes('bra') && 
               !lowerItem.includes('inner garment') &&
               !lowerItem.includes('undergarment');
    });

    // Check if this is a male or female clothing section
    const isMaleClothing = title.includes('Male');
    const isFemaleClothing = title.includes('Female');

    return (
        <div className={`bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-transform hover:scale-105 shadow-lg border-l-4 ${borderColor} ${className}`}>
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className={`flex-shrink-0 rounded-lg p-1.5 sm:p-2 ${iconBgColor} ${iconTextColor}`}>
                    {icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 break-words">{title}</h3>
            </div>
            <ul className="space-y-1.5 sm:space-y-2 pl-1 sm:pl-2">
                {filteredItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-xs sm:text-sm text-slate-700" dangerouslySetInnerHTML={parseBold(item)} />
                    </li>
                ))}
                {(isMaleClothing || isFemaleClothing) && (
                    <li className="flex items-start mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-300/50">
                        <span className="text-xs sm:text-sm text-slate-600 italic">Inner garments depends on you</span>
                    </li>
                )}
            </ul>
        </div>
    );
};

interface PackingListPreviewProps {
    packingList: PackingList;
    onRegenerate: () => void;
    isUnifiedView?: boolean;
    requestData?: any; // Add request data for history saving
    isHistoryView?: boolean; // Add flag to indicate if this is from history
}

const PackingListPreview: React.FC<PackingListPreviewProps> = ({ packingList, onRegenerate, isUnifiedView = false, requestData, isHistoryView = false }) => {
    const iconClass = "h-6 w-6";
    const [hasBeenSaved, setHasBeenSaved] = useState(false);
    const { savePackingRecommendation } = useSaveRecommendation();
    
    // Save to history when component mounts (only if not in unified view and request data is available)
    useEffect(() => {
        // Don't save if this is a history view
        if (!isUnifiedView && requestData && !hasBeenSaved && !isHistoryView) {
            savePackingRecommendation(requestData, packingList, packingList.destination, requestData.language);
            setHasBeenSaved(true);
        }
    }, [isUnifiedView, requestData, packingList, savePackingRecommendation, hasBeenSaved, isHistoryView]);
    
    // Determine if we have new format (maleClothing/femaleClothing) or old format (clothingAndFootwear)
    const hasNewFormat = (packingList.maleClothing && packingList.maleClothing.length > 0) || 
                         (packingList.femaleClothing && packingList.femaleClothing.length > 0);
    
    const categoryDetails: {
        [key: string]: {
            title: string;
            items: string[];
            icon: React.ReactNode;
            color: string;
            className: string;
        }
    } = {
        maleClothing: { 
            title: "Male Clothing & Footwear", 
            items: packingList.maleClothing || [], 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, 
            color: "blue", 
            className: hasNewFormat ? "" : "md:col-span-2" 
        },
        femaleClothing: { 
            title: "Female Clothing & Footwear", 
            items: packingList.femaleClothing || [], 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, 
            color: "pink", 
            className: "" 
        },
        clothingAndFootwear: { 
            title: "Clothing & Footwear", 
            items: packingList.clothingAndFootwear || [], 
            icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, 
            color: "blue", 
            className: "md:col-span-2" 
        },
        adventureClothing: { title: "Adventure & Activity Gear", items: packingList.adventureClothing, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.998 5.998 0 0116 10c0 .954-.225 1.852-.635 2.667a2.5 2.5 0 01-5.033 0 2.5 2.5 0 00-4.667 0c-.35-.74-.533-1.554-.533-2.394a6.01 6.01 0 011.567-4.243z" clipRule="evenodd" /></svg>, color: "green", className: "" },
        electronicsAndGear: { title: "Electronics & Gear", items: packingList.electronicsAndGear, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>, color: "slate", className: "" },
        toiletriesAndPersonalCare: { title: "Toiletries & Personal Care", items: packingList.toiletriesAndPersonalCare, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>, color: "pink", className: "" },
        medicinesAndHealth: { title: "Medicines & Health", items: packingList.medicinesAndHealth, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>, color: "red", className: "" },
        documentsAndMoney: { title: "Documents & Money", items: packingList.documentsAndMoney, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>, color: "amber", className: "" },
        optionalComfortItems: { title: "Optional Comfort Items", items: packingList.optionalComfortItems, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>, color: "purple", className: "" },
    };

    // Display order: show new format if available, otherwise show old format
    const displayOrder = hasNewFormat 
        ? ['maleClothing', 'femaleClothing', 'adventureClothing', 'electronicsAndGear', 'toiletriesAndPersonalCare', 'medicinesAndHealth', 'documentsAndMoney', 'optionalComfortItems'] as Array<keyof typeof categoryDetails>
        : (['clothingAndFootwear', 'adventureClothing', 'electronicsAndGear', 'toiletriesAndPersonalCare', 'medicinesAndHealth', 'documentsAndMoney', 'optionalComfortItems'] as Array<keyof typeof categoryDetails>);

    const formattedStartDate = new Date(packingList.startDate + 'T00:00:00').toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    

    return (
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 md:space-y-12 animated-card mb-16 px-1 sm:px-4" id="packing-list-preview-content">
            {!isUnifiedView && (
            <div className="flex justify-start items-center no-print">
                 <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRegenerate();
                    }}
                    className="inline-flex items-center px-4 py-1.5 sm:px-6 sm:py-2 my-2 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50 text-xs sm:text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                    <span>Create Another List</span>
                </button>
            </div>
            )}

            <header className="space-y-2 sm:space-y-4 text-center">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight break-words px-1 sm:px-2">Packing for {packingList.destination}</h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 mt-1 sm:mt-2 px-1 sm:px-2">Your personalized {packingList.days}-day packing checklist</p>
            </header>

            <section className="space-y-4 sm:space-y-6">
                <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg flex items-start space-x-3 sm:space-x-4 md:space-x-6">
                    <div className="flex-shrink-0 bg-white/30 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                        {getWeatherIcon(packingList.approximateTemperature)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800">Expected Weather</h3>
                        <p className="text-xs sm:text-sm text-slate-600 -mt-0.5 sm:-mt-1">{formattedStartDate}</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-violet-700 mt-1 leading-tight break-words whitespace-pre-wrap">{packingList.approximateTemperature}</p>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2">Pack accordingly for the weather conditions.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                           <div className="flex-shrink-0 bg-purple-100 text-purple-600 rounded-lg p-1.5 sm:p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 2a3 3 0 00-3 3v1H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-2V5a3 3 0 00-3-3zm-1 4a1 1 0 10-2 0v1h2V6z" clipRule="evenodd" />
                                </svg>
                           </div>
                           <h3 className="text-base sm:text-lg font-bold text-slate-800">Bag Suggestion</h3>
                        </div>
                        <div className="text-slate-700 text-sm sm:text-base" dangerouslySetInnerHTML={parseBold(packingList.bagSuggestion)} />
                    </div>
                    
                    {packingList.locallyAvailableItems && packingList.locallyAvailableItems.length > 0 && (
                         <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
                            <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                                <div className="flex-shrink-0 bg-sky-100 text-sky-600 rounded-lg p-1.5 sm:p-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M8 1a1 1 0 000 2h2a1 1 0 100-2H8z" />
                                      <path fillRule="evenodd" d="M.458 3.242A2 2 0 012 2h16a2 2 0 011.542 1.242l-2.18 4.361A2 2 0 0115.542 9H4.458a2 2 0 01-1.819-1.397L.458 3.242zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM2 14a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                               <h3 className="text-base sm:text-lg font-bold text-slate-800">Buy Locally</h3>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3">To save space, consider buying these items at your destination:</p>
                            <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-xs sm:text-sm text-slate-700">
                                {packingList.locallyAvailableItems.map((item, index) => (
                                    <li key={index} dangerouslySetInnerHTML={parseBold(item)} />
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </section>

            <section>
                 <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6 md:mb-8 text-center px-1 sm:px-2">Your Packing Checklist</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                    {displayOrder.map(key => {
                        const details = categoryDetails[key as keyof typeof categoryDetails];
                        return (
                            <CategoryCard
                                key={key}
                                title={details.title}
                                icon={details.icon}
                                items={details.items}
                                accentColor={details.color}
                                className={details.className || ''}
                            />
                        );
                    })}
                </div>
            </section>
            
            <div className="pt-4 sm:pt-6 md:pt-8 text-center no-print">
                 <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-6 md:mt-8">
                    {!isUnifiedView && (
                    <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRegenerate();
                        }}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                        <span>Create Another List</span>
                    </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PackingListPreview;