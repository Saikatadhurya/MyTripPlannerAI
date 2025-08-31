import React, { useState, Fragment, useRef, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import { UnifiedPlan, UnifiedPlanLoadingStatus } from '../types';
import ItineraryPreview from './ItineraryPreview';
import PackingListPreview from './PackingListPreview';
import FoodFinderResult from './FoodFinderResult';
import AppFinderResult from './AppFinderResult';
import MusicFinderResult from './MusicFinderResult';
import StreamingLoadingIndicator from './LoadingIndicator';
import Guidebook from './Guidebook';

type Tab = 'itinerary' | 'packing' | 'food' | 'apps' | 'music';

const tabs: { id: Tab; name: string; icon: React.ReactNode }[] = [
    { id: 'itinerary', name: 'Itinerary', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" /></svg> },
    { id: 'packing', name: 'Packing', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a3 3 0 00-3 3v1H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-2V5a3 3 0 00-3-3zm-1 4a1 1 0 10-2 0v1h2V6z" clipRule="evenodd" /></svg> },
    { id: 'food', name: 'Food Guide', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 01-2 0V3a1 1 0 011-1zM4 9a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm3 3a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1zm5 0a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1z" /></svg> },
    { id: 'apps', name: 'Local Apps', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg> },
    { id: 'music', name: 'Music', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-1-1z" /></svg> },
];

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
    onCancel: () => void;
    onCancelStep: (step: Tab) => void;
    onTabChangeScrollToTop: () => void;
}


const UnifiedResultPreview: React.FC<UnifiedResultPreviewProps> = ({ plan, loadingStatus, stepErrors, onPlanNew, onRegenerate, onRegenerateStep, onCancel, onCancelStep, onTabChangeScrollToTop }) => {
    const [activeTab, setActiveTab] = useState<Tab>('itinerary');
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    
    const isPlanComplete = Object.values(loadingStatus).every(status => status === 'done');

    useEffect(() => {
        onTabChangeScrollToTop();
    }, [activeTab, onTabChangeScrollToTop]);

    const getGuidebookStyles = () => {
        // This function embeds all necessary CSS for the guidebook to render correctly in a new window.
        return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body {
                font-family: 'Inter', sans-serif;
                margin: 0;
                padding: 0;
                background: white;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .guidebook-page {
                page-break-before: always;
                break-before: page;
                padding: 2rem 1rem 1rem;
                box-sizing: border-box;
            }
            .cover-page, .toc-page {
                page-break-before: avoid !important;
                break-before: auto !important;
                height: 100vh;
                display: flex !important;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
            }
            .cover-page {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                color: white !important;
            }
            .cover-subtitle { font-size: 1.25rem; letter-spacing: 0.1em; text-transform: uppercase; }
            .cover-title { font-size: 4rem; font-weight: 800; margin: 1rem 0; line-height: 1.1; }
            .cover-footer { font-size: 1rem; margin-top: 4rem; opacity: 0.8; }
            .toc-page { page-break-after: always !important; }
            .toc-title { font-size: 2.5rem; font-weight: bold; margin-bottom: 2rem; border-bottom: 2px solid #6366f1; padding-bottom: 0.5rem; }
            .toc-list { list-style: none; padding: 0; display: inline-block; text-align: left; }
            .toc-list li { font-size: 1.75rem; margin-bottom: 1rem; }
            .toc-list a { text-decoration: none; color: #6366f1; font-weight: 500; }
            h1, h2, h3, h4 { break-after: avoid; color: #1e293b; }
            strong { color: #1e293b; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; }
            /* Add any other styles from the app that are needed for the guidebook components */
            .bg-white\\/40 { background-color: rgba(255, 255, 255, 0.4); }
            .backdrop-blur-lg { backdrop-filter: blur(16px); }
            .p-6 { padding: 1.5rem; } .rounded-xl { border-radius: 0.75rem; }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
            .border { border-width: 1px; } .border-white\\/50 { border-color: rgba(255, 255, 255, 0.5); }
            .text-slate-800 { color: #1e293b; } .font-bold { font-weight: 700; }
            .prose { max-width: 65ch; }
            ul { list-style-position: inside; }
        `;
    };

    const handleExportPdf = () => {
        if (isExportingPdf || !isPlanComplete) return;
        setIsExportingPdf(true);

        try {
            const guidebookHTML = ReactDOMServer.renderToStaticMarkup(<Guidebook plan={plan} />);
            const styles = getGuidebookStyles();
            
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <title>Your Travel Guidebook for ${plan.itinerary?.destination || 'Trip'}</title>
                            <script src="https://cdn.tailwindcss.com"></script>
                            <style>${styles}</style>
                        </head>
                        <body>
                            ${guidebookHTML}
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.onload = () => {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                    setIsExportingPdf(false);
                };
            } else {
                throw new Error("Could not open new window. Please disable your pop-up blocker.");
            }
        } catch (error) {
            console.error("Failed to generate guidebook:", error);
            alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsExportingPdf(false);
        }
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
                    streamedText={''}
                    stages={[]}
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
                streamedText=""
                stages={[]}
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
                        disabled={isExportingPdf || !isPlanComplete}
                        className="inline-flex items-center px-4 py-2 bg-white/60 text-slate-800 font-semibold rounded-full hover:bg-white/80 transition-all duration-300 shadow-sm border border-white/50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isPlanComplete ? 'Please wait for all sections to finish generating.' : 'Export your plan as a PDF guidebook'}
                    >
                        {isExportingPdf ? (
                            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                        )}
                        <span>{isExportingPdf ? 'Creating...' : 'Export Guidebook'}</span>
                         {!isPlanComplete && !isExportingPdf && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                        )}
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

            <main className="mt-6 no-print">
                {renderTabContent()}
            </main>
        </div>
    );
};

export default UnifiedResultPreview;