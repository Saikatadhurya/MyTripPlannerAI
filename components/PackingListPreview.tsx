import React from 'react';
import { PackingList } from '../types';

const parseBold = (text: string | undefined) => {
  if (!text) return { __html: '' };
  return { __html: text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') };
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

const PackingCategoryCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    items: string[];
    className?: string;
}> = ({ title, icon, items, className = '' }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className={`bg-white/40 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/50 h-full flex flex-col ${className}`}>
            <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 bg-violet-100 text-violet-600 rounded-lg p-2">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 break-words">{title}</h3>
            </div>
            <div className="prose prose-slate max-w-none text-gray-700 pl-2 flex-grow">
                <ul className="list-disc pl-5 space-y-1 text-sm">
                    {items.map((item, index) => (
                        <li key={index} dangerouslySetInnerHTML={parseBold(item)} />
                    ))}
                </ul>
            </div>
        </div>
    );
};


const PackingListPreview: React.FC<{ packingList: PackingList; onRegenerate: () => void; }> = ({ packingList, onRegenerate }) => {
    const iconClass = "h-6 w-6";
    const sections = [
        { title: "Clothing & Footwear", items: packingList.clothingAndFootwear, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, className: "sm:col-span-2" },
        { title: "Adventure & Activity Gear", items: packingList.adventureClothing, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.998 5.998 0 0116 10c0 .954-.225 1.852-.635 2.667a2.5 2.5 0 01-5.033 0 2.5 2.5 0 00-4.667 0c-.35-.74-.533-1.554-.533-2.394a6.01 6.01 0 011.567-4.243z" clipRule="evenodd" /></svg>},
        { title: "Electronics & Gear", items: packingList.electronicsAndGear, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg> },
        { title: "Toiletries & Personal Care", items: packingList.toiletriesAndPersonalCare, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg> },
        { title: "Medicines & Health", items: packingList.medicinesAndHealth, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg> },
        { title: "Documents & Money", items: packingList.documentsAndMoney, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg> },
        { title: "Optional Comfort Items", items: packingList.optionalComfortItems, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg> },
    ];
    
    const formattedStartDate = new Date(packingList.startDate + 'T00:00:00').toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="max-w-4xl mx-auto space-y-12 animated-card">
            <header className="space-y-4">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight break-words" dangerouslySetInnerHTML={parseBold(`Packing for ${packingList.destination}`)} />
                    <p className="text-lg text-gray-700 mt-2">Your personalized {packingList.days}-day packing checklist</p>
                </div>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                <div className="bg-white/40 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/50 flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left sm:col-span-2">
                    <div className="flex-shrink-0 w-24 h-24 bg-violet-100/50 rounded-xl flex items-center justify-center border border-violet-200/50">
                        {getWeatherIcon(packingList.approximateTemperature)}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 break-words">Expected Weather</h3>
                        <p className="text-sm text-slate-600 -mt-1">{formattedStartDate}</p>
                        <p className="text-3xl font-bold text-violet-700 mt-1">{packingList.approximateTemperature}</p>
                        <p className="text-sm text-slate-600 mt-1 break-words">Pack accordingly for the weather conditions.</p>
                    </div>
                </div>

                <div className="bg-violet-50/60 backdrop-blur-lg p-6 rounded-2xl border border-violet-200/50 shadow-lg">
                    <div className="flex items-center space-x-3 mb-3">
                         <div className="flex-shrink-0 bg-violet-200 text-violet-700 rounded-lg p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path fillRule="evenodd" d="M5 4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H5zm0 2h10v10H5V6z" clipRule="evenodd" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-violet-800">Bag Suggestion</h3>
                    </div>
                    <p className="text-slate-700 text-lg" dangerouslySetInnerHTML={parseBold(packingList.bagSuggestion)} />
                </div>
                
                {packingList.locallyAvailableItems && packingList.locallyAvailableItems.length > 0 && (
                     <div className="bg-sky-50/60 backdrop-blur-lg p-6 rounded-2xl border border-sky-200/50 shadow-lg">
                        <div className="flex items-center space-x-3 mb-3">
                             <div className="flex-shrink-0 bg-sky-100 text-sky-700 rounded-lg p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4z" clipRule="evenodd" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-sky-800">Buy Locally</h3>
                        </div>
                        <p className="text-slate-600 mb-3 text-sm">To save space, consider buying these items at your destination:</p>
                        <div className="prose prose-slate max-w-none text-gray-700 text-sm">
                            <ul className="list-disc pl-5 space-y-1">
                                {packingList.locallyAvailableItems.map((item, index) => (
                                    <li key={index} dangerouslySetInnerHTML={parseBold(item)} />
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
                
                {sections.map(section => (
                    <PackingCategoryCard key={section.title} {...section} />
                ))}
            </section>
            
            <div className="pt-8 text-center no-print">
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
                    <button
                        onClick={onRegenerate}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                        <span>Create Another List</span>
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v-1a1 1 0 011-1h10a1 1 0 011 1v1h1a2 2 0 002-2v-3a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                        </svg>
                        <span>Print List</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PackingListPreview;
