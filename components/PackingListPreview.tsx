import React, { useEffect } from 'react';
import { PackingList } from '../types';
import { useSaveRecommendation } from '../hooks/useSaveRecommendation';

const parseBold = (text: string | undefined) => {
  if (!text) return { __html: '' };
  // Bolding now includes larger, darker text for prominence
  return { __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 text-lg">$1</strong>') };
};

const getWeatherIcon = (tempString: string | undefined): React.ReactNode => {
    if (!tempString) return <span className="text-4xl" role="img" aria-label="thermometer">🌡️</span>;
    
    const matches = tempString.match(/-?\d+/g);
    if (!matches) return <span className="text-4xl" role="img" aria-label="thermometer">🌡️</span>;
    
    const temps = matches.map(Number);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;

    if (avgTemp > 25) return <span className="text-4xl" role="img" aria-label="sun">☀️</span>;
    if (avgTemp > 15) return <span className="text-4xl" role="img" aria-label="sun behind cloud">🌥️</span>;
    if (avgTemp > 5) return <span className="text-4xl" role="img" aria-label="coat">🧥</span>;
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

    return (
        <div className={`bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 transition-transform hover:scale-105 shadow-lg border-l-4 ${borderColor} ${className}`}>
            <div className="flex items-center space-x-3 mb-4">
                <div className={`flex-shrink-0 rounded-lg p-2 ${iconBgColor} ${iconTextColor}`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 break-words">{title}</h3>
            </div>
            <ul className="space-y-2 pl-2">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-sm text-slate-700" dangerouslySetInnerHTML={parseBold(item)} />
                    </li>
                ))}
            </ul>
        </div>
    );
};

interface PackingListPreviewProps {
    packingList: PackingList;
    onRegenerate: () => void;
    isUnifiedView?: boolean;
    onPrint?: () => void;
    requestData?: any; // Add request data for history saving
}

const PackingListPreview: React.FC<PackingListPreviewProps> = ({ packingList, onRegenerate, isUnifiedView = false, onPrint, requestData }) => {
    const iconClass = "h-6 w-6";
    const { savePackingRecommendation } = useSaveRecommendation();
    
    // Save to history when component mounts (only if not in unified view and request data is available)
    useEffect(() => {
        if (!isUnifiedView && requestData) {
            savePackingRecommendation(requestData, packingList, packingList.destination, requestData.language);
        }
    }, [isUnifiedView, requestData, packingList, savePackingRecommendation]);
    
    const categoryDetails = {
        clothingAndFootwear: { title: "Clothing & Footwear", items: packingList.clothingAndFootwear, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, color: "blue", className: "md:col-span-2" },
        adventureClothing: { title: "Adventure & Activity Gear", items: packingList.adventureClothing, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.998 5.998 0 0116 10c0 .954-.225 1.852-.635 2.667a2.5 2.5 0 01-5.033 0 2.5 2.5 0 00-4.667 0c-.35-.74-.533-1.554-.533-2.394a6.01 6.01 0 011.567-4.243z" clipRule="evenodd" /></svg>, color: "green", className: "" },
        electronicsAndGear: { title: "Electronics & Gear", items: packingList.electronicsAndGear, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>, color: "slate", className: "" },
        toiletriesAndPersonalCare: { title: "Toiletries & Personal Care", items: packingList.toiletriesAndPersonalCare, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>, color: "pink", className: "" },
        medicinesAndHealth: { title: "Medicines & Health", items: packingList.medicinesAndHealth, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>, color: "red", className: "" },
        documentsAndMoney: { title: "Documents & Money", items: packingList.documentsAndMoney, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>, color: "amber", className: "" },
        optionalComfortItems: { title: "Optional Comfort Items", items: packingList.optionalComfortItems, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>, color: "purple", className: "" },
    };

    const displayOrder = Object.keys(categoryDetails) as Array<keyof typeof categoryDetails>;

    const formattedStartDate = new Date(packingList.startDate + 'T00:00:00').toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    
    const handlePrint = onPrint || (() => window.print());

    return (
        <div className="max-w-5xl mx-auto space-y-12 animated-card" id="packing-list-preview-content">
            {!isUnifiedView && (
            <div className="flex justify-start items-center no-print">
                 <button
                    onClick={onRegenerate}
                    className="inline-flex items-center px-6 py-2 my-2 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                    <span>Create Another List</span>
                </button>
            </div>
            )}

            <header className="space-y-4 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight break-words">Packing for {packingList.destination}</h1>
                <p className="text-lg text-gray-700 mt-2">Your personalized {packingList.days}-day packing checklist</p>
            </header>

            <section className="space-y-6">
                <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg flex items-start space-x-6">
                    <div className="flex-shrink-0 bg-white/30 p-4 rounded-xl">
                        {getWeatherIcon(packingList.approximateTemperature)}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Expected Weather</h3>
                        <p className="text-sm text-slate-600 -mt-1">{formattedStartDate}</p>
                        <p className="text-2xl font-bold text-violet-700 mt-1 leading-tight break-words whitespace-pre-wrap">{packingList.approximateTemperature}</p>
                        <p className="text-sm text-slate-600 mt-2">Pack accordingly for the weather conditions.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center space-x-3 mb-3">
                           <div className="flex-shrink-0 bg-purple-100 text-purple-600 rounded-lg p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 2a3 3 0 00-3 3v1H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-2V5a3 3 0 00-3-3zm-1 4a1 1 0 10-2 0v1h2V6z" clipRule="evenodd" />
                                </svg>
                           </div>
                           <h3 className="text-lg font-bold text-slate-800">Bag Suggestion</h3>
                        </div>
                        <div className="text-slate-700 text-base" dangerouslySetInnerHTML={parseBold(packingList.bagSuggestion)} />
                    </div>
                    
                    {packingList.locallyAvailableItems && packingList.locallyAvailableItems.length > 0 && (
                         <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="flex-shrink-0 bg-sky-100 text-sky-600 rounded-lg p-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M8 1a1 1 0 000 2h2a1 1 0 100-2H8z" />
                                      <path fillRule="evenodd" d="M.458 3.242A2 2 0 012 2h16a2 2 0 011.542 1.242l-2.18 4.361A2 2 0 0115.542 9H4.458a2 2 0 01-1.819-1.397L.458 3.242zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM2 14a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                               <h3 className="text-lg font-bold text-slate-800">Buy Locally</h3>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">To save space, consider buying these items at your destination:</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                                {packingList.locallyAvailableItems.map((item, index) => (
                                    <li key={index} dangerouslySetInnerHTML={parseBold(item)} />
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </section>

            <section>
                 <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Your Packing Checklist</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            
            <div className="pt-8 text-center no-print">
                 <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
                    {!isUnifiedView && (
                    <button
                        onClick={onRegenerate}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                        <span>Create Another List</span>
                    </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v-1a1 1 0 011-1h10a1 1 0 011 1v1h1a2 2 0 002-2v-3a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                        </svg>
                        <span>{isUnifiedView ? 'Print This Section' : 'Print List'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PackingListPreview;