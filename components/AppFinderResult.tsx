import React from 'react';
import { AppRecommendations, MobileApp } from '../types';

const PlatformBadge: React.FC<{ platform: MobileApp['platform'] }> = ({ platform }) => {
    const baseClasses = "text-xs font-semibold px-2.5 py-0.5 rounded-full";
    if (platform === 'iOS') {
        return <span className={`${baseClasses} bg-gray-200 text-gray-800`}>iOS</span>;
    }
    if (platform === 'Android') {
        return <span className={`${baseClasses} bg-green-200 text-green-800`}>Android</span>;
    }
    return <span className={`${baseClasses} bg-blue-200 text-blue-800`}>Both</span>;
};

const AppCard: React.FC<{ app: MobileApp }> = ({ app }) => {
    const appStoreSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${app.name} App Store`)}`;
    const playStoreSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${app.name} Play Store`)}`;

    // Intelligent check: Show category only if it's present and different from the app name (case-insensitive).
    const showCategory = app.category && app.category.toLowerCase() !== app.name.toLowerCase();

    return (
        <div className="bg-white/40 backdrop-blur-lg p-4 rounded-xl shadow-md border border-white/50 space-y-3 h-full flex flex-col relative">
             {app.location && (
                <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                    📍 {app.location}
                </span>
            )}
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    {showCategory ? (
                        // Layout with a distinct category title
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 capitalize truncate">{app.category}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-2xl">{app.icon}</span>
                                <h4 className="font-semibold text-slate-700 truncate">{app.name}</h4>
                            </div>
                        </div>
                    ) : (
                        // Standard layout for apps without a category or where category is redundant
                        <div className="flex items-center space-x-3">
                            <span className="text-3xl">{app.icon}</span>
                            <h4 className="font-bold text-slate-800 text-lg truncate">{app.name}</h4>
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 ml-2 mt-1">
                    <PlatformBadge platform={app.platform} />
                </div>
            </div>
            <p className="text-sm text-slate-600 flex-grow">{app.description}</p>
            <div className="flex items-center space-x-2 pt-3 border-t border-violet-200/50">
                {(app.platform === 'iOS' || app.platform === 'Both') && (
                    <a href={appStoreSearchUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-slate-900 transition-colors flex items-center justify-center space-x-1">
                        <span>App Store</span>
                    </a>
                )}
                {(app.platform === 'Android' || app.platform === 'Both') && (
                    <a href={playStoreSearchUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-slate-300 transition-colors flex items-center justify-center space-x-1">
                        <span>Play Store</span>
                    </a>
                )}
            </div>
        </div>
    );
};

const CategorySection: React.FC<{
    title: string;
    icon: React.ReactNode;
    items: MobileApp[];
    accentColor: string;
}> = ({ title, icon, items, accentColor }) => {
    if (!items || items.length === 0) return null;

    const accentClasses: { [key: string]: string } = {
        blue: 'border-blue-500 bg-blue-100 text-blue-600',
        green: 'border-green-500 bg-green-100 text-green-600',
        amber: 'border-amber-500 bg-amber-100 text-amber-600',
        red: 'border-red-500 bg-red-100 text-red-600',
        indigo: 'border-indigo-500 bg-indigo-100 text-indigo-600',
        sky: 'border-sky-500 bg-sky-100 text-sky-600',
        slate: 'border-slate-500 bg-slate-100 text-slate-600',
        fuchsia: 'border-fuchsia-500 bg-fuchsia-100 text-fuchsia-600',
    };
    
    const [borderColor, iconBgColor] = accentClasses[accentColor]?.split(' ') || ['border-gray-500', 'bg-gray-100'];

    return (
        <div className={`bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg border-l-4 ${borderColor} transition-transform hover:scale-105`}>
            <div className="flex items-center space-x-3 mb-4">
                <div className={`flex-shrink-0 rounded-lg p-2 ${iconBgColor}`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((app, index) => (
                    <AppCard key={index} app={app} />
                ))}
            </div>
        </div>
    );
};

interface AppFinderResultProps {
    recommendations: AppRecommendations;
    onRegenerate: () => void;
    isUnifiedView?: boolean;
}

const AppFinderResult: React.FC<AppFinderResultProps> = ({ recommendations, onRegenerate, isUnifiedView = false }) => {
    const iconClass = "h-6 w-6";
    
    const categoryDetails = {
        transportAndTravel: { title: "Transport & Travel", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18.562 6.077C18.238 5.437 17.562 5 16.808 5H3.192c-.754 0-1.43.437-1.754 1.077L.05 9.423A.5.5 0 00.5 10h19a.5.5 0 00.45-.577l-1.388-3.346zM2 11v4a1 1 0 001 1h1a1 1 0 001-1v-4H2zm15 0v4a1 1 0 001 1h1a1 1 0 001-1v-4h-3zM5 11v4a1 1 0 001 1h8a1 1 0 001-1v-4H5z" clipRule="evenodd" /></svg>, color: "blue"},
        stayAndLiving: { title: "Stay & Living", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>, color: "green"},
        foodAndDining: { title: "Food & Dining", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1.088A7 7 0 004.53 10.756.5.5 0 005 11h10a.5.5 0 00.47-.244A7 7 0 0011 4.088V3z" /><path fillRule="evenodd" d="M15 13a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h10z" clipRule="evenodd" /></svg>, color: "amber"},
        entertainmentAndLeisure: { title: "Entertainment & Leisure", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 1.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5H16a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5H4zM4 12a1 1 0 100 2h12a1 1 0 100-2H4z" /></svg>, color: "red"},
        shoppingAndEssentials: { title: "Shopping & Essentials", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>, color: "indigo"},
        explorationAndTours: { title: "Exploration & Tours", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 2.586a2 2 0 012.828 0L18 5.172a2 2 0 010 2.828L12.172 14H14a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 012-2h1.828L2 7.172a2 2 0 010-2.828L4.586 2.586a2 2 0 012.828 0L10 5.172l2.586-2.586zM10 13a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>, color: "sky"},
        utilitiesAndSafety: { title: "Utilities & Safety", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" /></svg>, color: "slate"},
        festivalsAndSeasonal: { title: "Festivals & Seasonal", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 5a3 3 0 013-3h4a3 3 0 013 3v2a3 3 0 01-3 3H8a3 3 0 01-3-3V5zm3-1a1 1 0 00-1 1v2a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1H8zM4 11a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" /></svg>, color: "fuchsia"},
    };

    const displayOrder = Object.keys(categoryDetails) as Array<keyof typeof categoryDetails>;

    return (
        <div className="max-w-6xl mx-auto space-y-12 animated-card">
            {!isUnifiedView && (
            <div className="flex justify-start items-center no-print">
                <button
                    onClick={onRegenerate}
                    className="inline-flex items-center justify-center px-6 py-2 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                    <span>Find Apps for Another Trip</span>
                </button>
            </div>
            )}
            
            <header className="space-y-4 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                    Essential Apps for {recommendations.destination}
                </h1>
                <p className="text-lg text-gray-700 mt-2">
                    Your personalized guide to local and international apps.
                </p>
            </header>
            
            <div className="space-y-10">
                {displayOrder.map(key => {
                    const details = categoryDetails[key];
                    const items = recommendations[key];
                    return (
                        <CategorySection
                            key={key}
                            title={details.title}
                            icon={details.icon}
                            items={items}
                            accentColor={details.color}
                        />
                    );
                })}
            </div>

            <div className="pt-8 text-center no-print">
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
                    {!isUnifiedView && (
                    <button
                        onClick={onRegenerate}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                        <span>Find More Apps</span>
                    </button>
                    )}
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v-1a1 1 0 011-1h10a1 1 0 011 1v1h1a2 2 0 002-2v-3a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                        </svg>
                        <span>Print App Guide</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppFinderResult;