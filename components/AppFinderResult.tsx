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

const AppCard: React.FC<{ app: MobileApp }> = ({ app }) => (
    <div className="bg-white/40 backdrop-blur-lg p-4 rounded-xl shadow-md border border-white/50 space-y-3 h-full flex flex-col">
        <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
                <span className="text-3xl">{app.icon}</span>
                <div>
                    <h4 className="font-bold text-slate-800 break-words">{app.name}</h4>
                    <PlatformBadge platform={app.platform} />
                </div>
            </div>
        </div>
        <p className="text-sm text-slate-600 flex-grow">{app.description}</p>
        <div className="flex items-center space-x-2 pt-2 border-t border-violet-200/50">
            {(app.platform === 'iOS' || app.platform === 'Both') && app.appStoreUrl && (
                <a href={app.appStoreUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-black text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center space-x-1">
                    <span>App Store</span>
                </a>
            )}
            {(app.platform === 'Android' || app.platform === 'Both') && app.playStoreUrl && (
                <a href={app.playStoreUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-gray-200 text-black px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center space-x-1">
                    <span>Play Store</span>
                </a>
            )}
        </div>
    </div>
);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((app, index) => (
                    <AppCard key={index} app={app} />
                ))}
            </div>
        </div>
    );
};

const AppFinderResult: React.FC<{ recommendations: AppRecommendations; onRegenerate: () => void; }> = ({ recommendations, onRegenerate }) => {
    const iconClass = "h-6 w-6";
    
    const categoryDetails = {
        transportAndTravel: { title: "Transport & Travel", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C20.7 7.6 20 4 16 4c-1.1 0-2.1.2-3 .6"/><path d="M2 12h10"/><path d="M16 12h-2"/><path d="M12 11v4"/><path d="m10 15-1.5-1.5"/><path d="M14 15-1.5-1.5"/><path d="M4.5 11.5 3 10"/><path d="M4.5 13.5 3 15"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>, color: "blue" },
        stayAndLiving: { title: "Stay & Living", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>, color: "green" },
        foodAndDining: { title: "Food & Dining", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M17 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2h-2a2 2 0 00-2 2v2a2 2 0 00-2-2h-2a2 2 0 00-2-2z"/></svg>, color: "amber" },
        entertainmentAndLeisure: { title: "Entertainment & Leisure", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/><path d="M12 4h.01"/><path d="M8 4h.01"/><path d="M16 4h.01"/><path d="M12 20h.01"/><path d="M8 20h.01"/><path d="M16 20h.01"/><path d="M8 12h8"/></svg>, color: "red" },
        shoppingAndEssentials: { title: "Shopping & Essentials", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg>, color: "indigo" },
        explorationAndTours: { title: "Exploration & Tours", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2L12 22"/><path d="M2 12L22 12"/></svg>, color: "sky" },
        utilitiesAndSafety: { title: "Utilities & Safety", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, color: "slate" },
        festivalsAndSeasonal: { title: "Festivals & Seasonal", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5.5V4M12 20v-1.5M5.5 12H4M20 12h-1.5M17.8 6.2l1-1M5.2 18.8l1-1M17.8 17.8l1 1M5.2 6.2l1 1"/><circle cx="12" cy="12" r="4"/><path d="M12 12a5 5 0 00-5 5h10a5 5 0 00-5-5z"/></svg>, color: "fuchsia" },
    };

    const displayOrder = Object.keys(categoryDetails) as Array<keyof typeof categoryDetails>;
    const allApps = displayOrder.flatMap(key => recommendations[key]);

    return (
        <div className="max-w-6xl mx-auto space-y-12 animated-card">
            <div className="flex justify-start items-center no-print">
                <button
                    onClick={onRegenerate}
                    className="inline-flex items-center justify-center px-6 py-2 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                    <span>Find Apps for another trip</span>
                </button>
            </div>
            
            <header className="space-y-4 text-center -mt-8">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                    Essential Apps for {recommendations.destination}
                </h1>
                <p className="text-lg text-gray-700 mt-2">
                    Your personalized guide to the best local mobile apps.
                </p>
            </header>
            
            {allApps.length > 0 ? (
                <div className="space-y-8">
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
            ) : (
                <div className="text-center bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-12 shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-800">No Specific Apps Found</h2>
                    <p className="text-slate-600 mt-2">We couldn't find unique local apps for {recommendations.destination}. Standard international apps like Google Maps, Uber, and Airbnb are great choices!</p>
                </div>
            )}


            <div className="pt-8 text-center no-print">
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
                    <button
                        onClick={onRegenerate}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                        <span>Find More Apps</span>
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v-1a1 1 0 011-1h10a1 1 0 011 1v1h1a2 2 0 002-2v-3a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                        </svg>
                        <span>Print App List</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppFinderResult;