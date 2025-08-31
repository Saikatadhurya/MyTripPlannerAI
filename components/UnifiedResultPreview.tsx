import React, { useState, Fragment, useRef, useEffect } from 'react';
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
    { id: 'food', name: 'Food Guide', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 01-2 0V3a1 1 0 011-1zM4 9a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm3 3a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1zm5 0a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1z" /></svg> },
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
    stepErrors: Partial<Record<keyof UnifiedPlanLoadingStatus, string>>;
    onPlanNew: () => void;
    onRegenerate: () => void;
    onRegenerateStep: (step: Tab) => void;
    unifiedStreamedText: string;
    onCancel: () => void;
    onCancelStep: (step: Tab) => void;
    currentlyGeneratingStep: keyof UnifiedPlanLoadingStatus | null;
}


const UnifiedResultPreview: React.FC<UnifiedResultPreviewProps> = ({ plan, loadingStatus, stepErrors, onPlanNew, onRegenerate, onRegenerateStep, unifiedStreamedText, onCancel, onCancelStep, currentlyGeneratingStep }) => {
    const [activeTab, setActiveTab] = useState<Tab>('itinerary');
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        contentRef.current?.scrollTo(0, 0);
    }, [activeTab]);

    const handleExportPdf = () => {
        setIsExportingPdf(true);
        const element = document.getElementById('printable-plan');
        if (!element) {
            alert("Could not find content to print.");
            setIsExportingPdf(false);
            return;
        }
        const destinationName = plan.itinerary?.destination.split(',')[0] || 'Trip';
        const opt = {
            margin: 0.5,
            filename: `Planora-Guide-${destinationName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            enableLinks: true
        };

        // Use the global html2pdf object from the CDN
        (window as any).html2pdf().from(element).set(opt).save().then(() => {
            setIsExportingPdf(false);
        }).catch((err: any) => {
            console.error("PDF export failed:", err);
            setIsExportingPdf(false);
            alert("Sorry, there was an error creating the PDF. Please try again.");
        });
    };
    
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
        const tabName = tabs.find(t => t.id === activeTab)?.name || 'This Section';

        if (currentStatus === 'loading' && !currentData) {
            const activeTabDetails = tabs.find(t => t.id === activeTab);
            return (
                <StreamingLoadingIndicator
                    streamedText={unifiedStreamedText}
                    stages={loadingStages[activeTab]}
                    onCancel={() => onCancelStep(activeTab)}
                    title={`Crafting Your ${activeTabDetails?.name}...`}
                    accentColor="violet"
                    funFacts={loadingFunFacts[activeTab]}
                />
            );
        }
        
        const renderActionCard = (title: string, message: string) => (
             <div className={`backdrop-blur-sm p-6 rounded-2xl my-8 shadow-lg animated-card ${currentStatus === 'error' ? 'bg-red-100/60 border-l-4 border-red-500 text-red-800' : 'bg-yellow-100/60 border-l-4 border-yellow-500 text-yellow-800'}`}>
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 pt-1">
                        {currentStatus === 'error' ? 
                            <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg> :
                            <svg className="h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        }
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-lg">{title}</p>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{message}</p>
                        <button
                            onClick={() => onRegenerateStep(activeTab)}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-all duration-300 shadow-md text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 2.566l-1.581.53a5.002 5.002 0 00-8.917-1.789v.962a1 1 0 01-2 0V3a1 1 0 011-1zm12 15a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.898-2.566l1.581-.53a5.002 5.002 0 008.917 1.789v-.962a1 1 0 012 0V17a1 1 0 01-1 1z" clipRule="evenodd" /></svg>
                            Regenerate {tabName}
                        </button>
                    </div>
                </div>
            </div>
        );

        if (currentStatus === 'error') {
            return renderActionCard(`Failed to Generate ${tabName}`, stepErrors[activeTab] || `An unknown error occurred.`);
        }
        if (currentStatus === 'cancelled') {
            return renderActionCard(`${tabName} Generation Cancelled`, `The process was cancelled. You can try generating it again.`);
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
            <header className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 no-print">
                 <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight text-center sm:text-left">
                    Your Unified Trip Plan to <span className="text-violet-700">{plan.itinerary?.destination || '...'}</span>
                </h1>
                <div className="flex-shrink-0 flex items-center space-x-3">
                     <button
                        onClick={handleExportPdf}
                        disabled={isExportingPdf}
                        className="inline-flex items-center px-4 py-2 bg-white/60 text-slate-800 font-semibold rounded-full hover:bg-white/80 transition-all duration-300 shadow-sm border border-white/50 text-sm disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isExportingPdf ? (
                            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                        )}
                        <span>{isExportingPdf ? 'Creating...' : 'Export Guidebook'}</span>
                    </button>
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
            
            <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-2 mb-2 no-print">
                <div className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 hide-scrollbar overflow-x-auto">
                    {tabs.map(tab => {
                         const status = loadingStatus[tab.id];
                         const dataExists = !!getPlanDataForTab(tab.id);

                        return (
                             <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 text-sm sm:text-base font-semibold rounded-lg transition-colors duration-200
                                    ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-md' : 'text-slate-600 hover:bg-violet-100/70'}`}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.name}</span>
                                {status === 'loading' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>}
                                {status === 'done' && dataExists && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                                {(status === 'error' || status === 'cancelled') && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>}
                            </button>
                        );
                    })}
                </div>
            </nav>

            <main ref={contentRef} className="mt-6 max-h-[70vh] overflow-y-auto pr-2 no-print">
                {renderTabContent()}
            </main>

            {/* Hidden Printable Container */}
            <div id="printable-plan" className="hidden printable-container">
                {plan.itinerary && (
                <>
                    <div id="printable-toc">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Your Adventure Guide</h1>
                        <h2 className="text-2xl text-violet-700 font-bold mb-8">to {plan.itinerary.destination}</h2>
                        <nav>
                            <ul className="space-y-3">
                                {plan.itinerary && <li><a href="#printable-itinerary">Full Itinerary</a></li>}
                                {plan.packingList && <li><a href="#printable-packing">Packing List</a></li>}
                                {plan.foodRecommendations && <li><a href="#printable-food">Food Guide</a></li>}
                                {plan.appRecommendations && <li><a href="#printable-apps">Local Apps</a></li>}
                                {plan.musicRecommendations && <li><a href="#printable-music">Music Playlist</a></li>}
                            </ul>
                        </nav>
                    </div>

                    {plan.itinerary && (
                        <div id="printable-itinerary" className="printable-section">
                            <ItineraryPreview itinerary={plan.itinerary} onRegenerate={() => {}} isUnifiedView />
                        </div>
                    )}
                    {plan.packingList && (
                        <div id="printable-packing" className="printable-section">
                            <PackingListPreview packingList={plan.packingList} onRegenerate={() => {}} isUnifiedView />
                        </div>
                    )}
                    {plan.foodRecommendations && (
                        <div id="printable-food" className="printable-section">
                            <FoodFinderResult recommendations={plan.foodRecommendations} onRegenerate={() => {}} isUnifiedView />
                        </div>
                    )}
                    {plan.appRecommendations && (
                        <div id="printable-apps" className="printable-section">
                            <AppFinderResult recommendations={plan.appRecommendations} onRegenerate={() => {}} isUnifiedView />
                        </div>
                    )}
                    {plan.musicRecommendations && (
                        <div id="printable-music" className="printable-section">
                            <MusicFinderResult recommendations={plan.musicRecommendations} onRegenerate={() => {}} isUnifiedView />
                        </div>
                    )}
                </>
                )}
            </div>
        </div>
    );
};

export default UnifiedResultPreview;