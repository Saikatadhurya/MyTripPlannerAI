

import React, { useState, Fragment } from 'react';
import { UnifiedPlan, UnifiedPlanLoadingStatus } from '../types';
import ItineraryPreview from './ItineraryPreview';
import PackingListPreview from './PackingListPreview';
import FoodFinderResult from './FoodFinderResult';
import AppFinderResult from './AppFinderResult';
import MusicFinderResult from './MusicFinderResult';
import StreamingLoadingIndicator from './LoadingIndicator';

type Tab = 'itinerary' | 'packing' | 'food' | 'apps' | 'music';

const tabs: { id: Tab; name: string; icon: React.ReactNode }[] = [
    { id: 'itinerary', name: 'Itinerary', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" /></svg> },
    { id: 'packing', name: 'Packing', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a3 3 0 00-3 3v1H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-2V5a3 3 0 00-3-3zm-1 4a1 1 0 10-2 0v1h2V6z" clipRule="evenodd" /></svg> },
    { id: 'food', name: 'Food Guide', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1.088A7 7 0 004.53 10.756.5.5 0 005 11h10a.5.5 0 00.47-.244A7 7 0 0011 4.088V3z" /><path fillRule="evenodd" d="M15 13a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h10z" clipRule="evenodd" /></svg> },
    { id: 'apps', name: 'Local Apps', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg> },
    { id: 'music', name: 'Music', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-1-1z" /></svg> },
];

const loadingStages = {
    itinerary: [
        { key: '"stay":', text: 'Analyzing budget and costs' },
        { key: '"historicBackground":', text: 'Researching destinations' },
        { key: '"day":', text: 'Building the day-by-day plan' },
    ],
    packing: [
        { key: '"approximateTemperature":"', text: 'Checking the weather forecast' },
        { key: '"clothingAndFootwear":[', text: 'Selecting outfits and shoes' },
        { key: '"bagSuggestion":"', text: 'Recommending the perfect bag' },
    ],
    food: [
        { key: '"breakfast":[', text: 'Discovering morning bites' },
        { key: '"snacksAndStreetFood":[', text: 'Finding popular street food' },
        { key: '"iconicDishes":[', text: 'Identifying iconic dishes' },
    ],
    apps: [
        { key: '"transportAndTravel":[', text: 'Finding transport apps' },
        { key: '"foodAndDining":[', text: 'Discovering food apps' },
        { key: '"explorationAndTours":[', text: 'Locating exploration apps' },
    ],
    music: [
        { key: '"musicCategories":[', text: 'Curating music categories' },
        { key: '"genre":"TopTrendingHits"', text: 'Finding top trending hits' },
    ],
};

const loadingFunFacts = {
    itinerary: [
        { icon: '🗺️', text: 'Plotting scenic routes...' },
        { icon: '💎', text: 'Finding hidden gems...' },
        { icon: '🏨', text: 'Scouting the best stays...' },
    ],
    packing: [
        { icon: '🌤️', text: 'Checking the weather forecast...' },
        { icon: '👕', text: 'Choosing the perfect outfits...' },
        { icon: '🔌', text: 'Remembering all the chargers...' },
    ],
    food: [
        { icon: '🧑‍🍳', text: 'Consulting with local chefs...' },
        { icon: '🌶️', text: 'Searching for the spiciest dishes...' },
        { icon: '🤫', text: 'Discovering secret family recipes...' },
    ],
    apps: [
        { icon: '📲', text: 'Scanning the local app stores...' },
        { icon: '🧭', text: 'Finding the best navigation tools...' },
        { icon: '🚕', text: 'Locating top ride-sharing apps...' },
    ],
    music: [
        { icon: '🎧', text: 'Tuning into local radio...' },
        { icon: '🎶', text: 'Discovering the local anthems...' },
        { icon: '🎤', text: 'Checking the top of the charts...' },
    ],
};

interface UnifiedResultPreviewProps {
    plan: UnifiedPlan;
    loadingStatus: UnifiedPlanLoadingStatus;
    error: string | null;
    onPlanNew: () => void;
    onRegenerate: () => void;
    unifiedStreamedText: string;
    onCancel: () => void;
}

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-md my-8">
        <p className="font-bold">An Error Occurred</p>
        <p>{message}</p>
    </div>
);


const UnifiedResultPreview: React.FC<UnifiedResultPreviewProps> = ({ plan, loadingStatus, error, onPlanNew, onRegenerate, unifiedStreamedText, onCancel }) => {
    const [activeTab, setActiveTab] = useState<Tab>('itinerary');

    const getPlanDataForTab = (tab: Tab) => {
        switch (tab) {
            case 'itinerary': return plan.itinerary;
            case 'packing': return plan.packingList;
            case 'food': return plan.foodRecommendations;
            case 'apps': return plan.appRecommendations;
            case 'music': return plan.musicRecommendations;
            default: return null;
        }
    };

    const renderTabContent = () => {
        const currentStatus = loadingStatus[activeTab];
        const currentData = getPlanDataForTab(activeTab);

        if (currentStatus === 'loading' && !currentData) {
            const activeTabDetails = tabs.find(t => t.id === activeTab);
            return (
                <StreamingLoadingIndicator
                    streamedText={unifiedStreamedText}
                    stages={loadingStages[activeTab]}
                    onCancel={onCancel}
                    title={`Crafting Your ${activeTabDetails?.name}...`}
                    accentColor="violet"
                    funFacts={loadingFunFacts[activeTab]}
                />
            );
        }
        if (currentStatus === 'error') {
            return <ErrorState message={error || "Failed to load this section. Please try regenerating."} />;
        }
        if (!currentData) {
             return <div className="text-center py-20 text-slate-500">Waiting for data...</div>;
        }

        switch (activeTab) {
            case 'itinerary':
                return <ItineraryPreview itinerary={plan.itinerary!} onRegenerate={onRegenerate} isUnifiedView />;
            case 'packing':
                return <PackingListPreview packingList={plan.packingList!} onRegenerate={onRegenerate} isUnifiedView />;
            case 'food':
                return <FoodFinderResult recommendations={plan.foodRecommendations!} onRegenerate={onRegenerate} isUnifiedView />;
            case 'apps':
                return <AppFinderResult recommendations={plan.appRecommendations!} onRegenerate={onRegenerate} isUnifiedView />;
            case 'music':
                return <MusicFinderResult recommendations={plan.musicRecommendations!} onRegenerate={onRegenerate} isUnifiedView />;
            default:
                return null;
        }
    };
    
    const isInitialLoading = loadingStatus.itinerary === 'loading' && !plan.itinerary;

    if (isInitialLoading) {
        return (
            <StreamingLoadingIndicator
                streamedText={unifiedStreamedText}
                stages={loadingStages.itinerary}
                onCancel={onCancel}
                title="Crafting Your Unified Plan..."
                accentColor="violet"
                funFacts={loadingFunFacts.itinerary}
            />
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto space-y-8 animated-card">
            <header className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
                 <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight text-center sm:text-left">
                    Your Unified Trip Plan to <span className="text-violet-700">{plan.itinerary?.destination || '...'}</span>
                </h1>
                <div className="flex-shrink-0 flex items-center space-x-3">
                     <button
                        onClick={onRegenerate}
                        className="inline-flex items-center px-4 py-2 bg-white/60 text-slate-800 font-semibold rounded-full hover:bg-white/80 transition-all duration-300 shadow-sm border border-white/50 text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 2.566l-1.581.53a5.002 5.002 0 00-8.917-1.789v.962a1 1 0 01-2 0V3a1 1 0 011-1zm12 15a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.898-2.566l1.581-.53a5.002 5.002 0 008.917 1.789v-.962a1 1 0 012 0V17a1 1 0 01-1 1z" clipRule="evenodd" /></svg>
                        Regenerate
                    </button>
                    <button
                        onClick={onPlanNew}
                        className="inline-flex items-center px-4 py-2 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-700 transition-all duration-300 shadow-md text-sm"
                    >
                       ✨ Plan New Trip
                    </button>
                </div>
            </header>
            
            <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-2 mb-2">
                <div className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 hide-scrollbar overflow-x-auto">
                    {tabs.map(tab => {
                         const status = loadingStatus[tab.id];
                         const dataExists = !!getPlanDataForTab(tab.id);
                        return (
                             <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 text-sm sm:text-base font-semibold rounded-lg transition-colors duration-200 w-full sm:w-auto
                                    ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-md' : 'text-slate-600 hover:bg-violet-100/70'}`}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                            >
                                {tab.icon}
                                <span>{tab.name}</span>
                                {status === 'loading' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>}
                                {status === 'done' && dataExists && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                                {status === 'error' && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-7-8a7 7 0 1114 0 7 7 0 01-14 0z" clipRule="evenodd" /><path fillRule="evenodd" d="M10 4a1 1 0 011 1v4a1 1 0 11-2 0V5a1 1 0 011-1zm0 8a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>}
                            </button>
                        );
                    })}
                </div>
            </nav>

            <main className="mt-6">
                {renderTabContent()}
            </main>
        </div>
    );
};

export default UnifiedResultPreview;
