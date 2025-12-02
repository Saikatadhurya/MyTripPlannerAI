import React, { useState, useEffect } from 'react';
import { UnifiedPlan, UnifiedPlanLoadingStatus } from '../types';
import ItineraryPreview from './ItineraryPreview';
import PackingListPreview from './PackingListPreview';
import FoodFinderResult from './FoodFinderResult';
import AppFinderResult from './AppFinderResult';
import MusicFinderResult from './MusicFinderResult';
import LingoFinderResult from './LingoFinderResult';
import { useSaveRecommendation } from '../hooks/useSaveRecommendation';
import Toast from './Toast';

type Tab = 'itinerary' | 'packing' | 'food' | 'apps' | 'music' | 'lingo';

const tabs: { id: Tab; name: string; icon: React.ReactNode }[] = [
    { id: 'itinerary', name: 'Itinerary', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" /></svg> },
    { id: 'packing', name: 'Packing', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a3 3 0 00-3 3v1H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-2V5a3 3 0 00-3-3zm-1 4a1 1 0 10-2 0v1h2V6z" clipRule="evenodd" /></svg> },
    { id: 'food', name: 'Food Guide', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.5,12a9.5,9.5 0 1,1 -19,0" /><path strokeLinecap="round" strokeLinejoin="round" d="M12,2a10,10 0 0,0 -10,10 h20 a10,10 0 0,0 -10,-10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12,18v4" /></svg> },
    { id: 'apps', name: 'Local Apps', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg> },
    { id: 'music', name: 'Music', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: 'lingo', name: 'Lingo', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L4.12 6.586a1 1 0 000 1.828l11.44-3.578A1 1 0 0018 3zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg> },
];

interface UnifiedResultPreviewProps {
    plan: UnifiedPlan;
    loadingStatus: UnifiedPlanLoadingStatus;
    stepErrors: Partial<Record<keyof UnifiedPlanLoadingStatus, string>>;
    onPlanNew: () => void;
    onRegenerate: () => void;
    onRegenerateStep: (step: keyof UnifiedPlanLoadingStatus) => void;
    onCancel: () => void;
    onCancelStep: (step: keyof UnifiedPlanLoadingStatus) => void;
    onTabChangeScrollToTop: () => void;
    itineraryStreamedText: string;
    questionnaireData?: any; // Add questionnaire data for saving
    isHistoryView?: boolean; // Add flag to indicate if this is from history
    canRegenerate?: boolean; // Add flag to indicate if user can regenerate (must be owner and signed in)
}

const UnifiedResultPreview: React.FC<UnifiedResultPreviewProps> = ({ 
    plan, 
    loadingStatus, 
    stepErrors, 
    onPlanNew, 
    onRegenerate, 
    onRegenerateStep, 
    onCancel, 
    onCancelStep, 
    onTabChangeScrollToTop, 
    itineraryStreamedText,
    questionnaireData,
    isHistoryView = false,
    canRegenerate = true
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('itinerary');
    const [savedTripId, setSavedTripId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const savedTypesRef = React.useRef<Set<string>>(new Set());
    const isSavingRef = React.useRef<boolean>(false);
    const savedTripIdRef = React.useRef<string | null>(null);
    const { 
        saveUnifiedTripRecommendations,
        saveItineraryRecommendation,
        savePackingRecommendation,
        saveFoodRecommendation,
        saveAppRecommendation,
        saveMusicRecommendation,
        saveLingoRecommendation
    } = useSaveRecommendation();
    const mainContentRef = React.useRef<HTMLElement>(null);
    const headerRef = React.useRef<HTMLElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    
    const isPlanComplete = Object.values(loadingStatus).every(status => status === 'done');

    // Update page title based on the plan
    useEffect(() => {
        if (plan.itinerary?.destination) {
            const destination = plan.itinerary.destination;
            document.title = `Trip Plan to ${destination} | Plan My Trip AI`;
        } else if (questionnaireData?.destination) {
            document.title = `Planning Trip to ${questionnaireData.destination} | Plan My Trip AI`;
        }
        
        // Cleanup: reset to default title when component unmounts
        return () => {
            document.title = 'Plan My Trip | Free AI Trip Planner - Create Perfect Travel Itinerary in Minutes';
        };
    }, [plan.itinerary?.destination, questionnaireData?.destination]);

    useEffect(() => {
        // Scroll to absolute top when tab changes - use multiple methods to ensure it works
        const scrollToTop = () => {
            // Force instant scroll to absolute top (0, 0) on all scrollable elements
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            window.scrollTo(0, 0);
            
            // Scroll document elements
            if (document.documentElement) {
                document.documentElement.scrollTop = 0;
                document.documentElement.scrollLeft = 0;
            }
            if (document.body) {
                document.body.scrollTop = 0;
                document.body.scrollLeft = 0;
            }
            
            // Scroll container if it exists
            if (containerRef.current) {
                containerRef.current.scrollTop = 0;
                containerRef.current.scrollLeft = 0;
            }
            
            // Scroll main content container if it exists
            if (mainContentRef.current) {
                mainContentRef.current.scrollTop = 0;
                mainContentRef.current.scrollLeft = 0;
            }
            
            // Scroll header ref if it exists
            if (headerRef.current) {
                headerRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
            }
            
            // Find and scroll all scrollable containers
            const scrollableContainers = document.querySelectorAll('[style*="overflow"], .overflow-auto, .overflow-y-auto, .overflow-x-auto');
            scrollableContainers.forEach((container) => {
                if (container instanceof HTMLElement) {
                    container.scrollTop = 0;
                    container.scrollLeft = 0;
                }
            });
            
            // Call the parent scroll function (which also handles main content scroll in App.tsx)
            onTabChangeScrollToTop();
        };
        
        // Immediate scroll
        scrollToTop();
        
        // Use multiple RAFs and timeouts to ensure DOM is fully rendered and layout is stable
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                scrollToTop();
                // Additional delays to catch layout shifts and content rendering
                setTimeout(() => {
                    scrollToTop();
                    setTimeout(scrollToTop, 50);
                    setTimeout(scrollToTop, 100);
                }, 10);
            });
        });
    }, [activeTab, onTabChangeScrollToTop]);

    // Sync savedTripIdRef with savedTripId state
    useEffect(() => {
        savedTripIdRef.current = savedTripId;
    }, [savedTripId]);

    // Initialize savedTripId from questionnaireData if it exists (for existing trips)
    useEffect(() => {
        // Check if questionnaireData has a tripId (from history or shareable view)
        if (questionnaireData?.tripId && !savedTripId) {
            savedTripIdRef.current = questionnaireData.tripId;
            setSavedTripId(questionnaireData.tripId);
        }
    }, [questionnaireData, savedTripId]);

    // Track previous plan data to detect changes (regenerations)
    const prevPlanRef = React.useRef<UnifiedPlan>({ ...plan });
    const isInitialMountRef = React.useRef<boolean>(true);
    
    // Clear saved types when plan data changes (indicating regeneration)
    useEffect(() => {
        // Skip on initial mount to avoid clearing on first load
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false;
            prevPlanRef.current = { ...plan };
            return;
        }
        
        // Check each component and clear saved type if data changed
        const checkAndClear = (key: string, currentData: any, prevData: any) => {
            // If data was null and now has data, or if data changed, clear saved type
            if (currentData && (!prevData || JSON.stringify(currentData) !== JSON.stringify(prevData))) {
                // Data changed or regenerated, clear from saved types so it gets saved again
                savedTypesRef.current.delete(key);
            }
        };
        
        checkAndClear('itinerary', plan.itinerary, prevPlanRef.current.itinerary);
        checkAndClear('packing', plan.packingList, prevPlanRef.current.packingList);
        checkAndClear('food', plan.foodRecommendations, prevPlanRef.current.foodRecommendations);
        checkAndClear('apps', plan.appRecommendations, prevPlanRef.current.appRecommendations);
        checkAndClear('music', plan.musicRecommendations, prevPlanRef.current.musicRecommendations);
        checkAndClear('lingo', plan.lingoRecommendations, prevPlanRef.current.lingoRecommendations);
        
        // Update previous plan reference
        prevPlanRef.current = { ...plan };
    }, [plan]);

    // Incrementally save unified trip to history as each part becomes available
    useEffect(() => {
        if (!questionnaireData || isHistoryView || isSavingRef.current) return;

        const availableTypes: Array<{ key: string; saver: () => Promise<string | null> }> = [];
        const destination = questionnaireData.destination;
        const language = questionnaireData.language || 'en';
        const tripName = `${destination} Trip - ${new Date().toLocaleDateString()}`;
        const currentTripId = savedTripIdRef.current;

        if (plan.itinerary && !savedTypesRef.current.has('itinerary')) {
            availableTypes.push({
                key: 'itinerary',
                saver: async () => {
                    return await saveItineraryRecommendation(
                        questionnaireData,
                        plan.itinerary,
                        destination,
                        language,
                        questionnaireData,
                        currentTripId || undefined,
                        tripName
                    );
                }
            });
        }
        if (plan.packingList && !savedTypesRef.current.has('packing')) {
            availableTypes.push({
                key: 'packing',
                saver: async () => {
                    return await savePackingRecommendation(
                        questionnaireData,
                        plan.packingList,
                        destination,
                        language,
                        questionnaireData,
                        currentTripId || undefined,
                        tripName
                    );
                }
            });
        }
        if (plan.foodRecommendations && !savedTypesRef.current.has('food')) {
            availableTypes.push({
                key: 'food',
                saver: async () => {
                    return await saveFoodRecommendation(
                        questionnaireData,
                        plan.foodRecommendations,
                        destination,
                        language,
                        questionnaireData,
                        currentTripId || undefined,
                        tripName
                    );
                }
            });
        }
        if (plan.appRecommendations && !savedTypesRef.current.has('apps')) {
            availableTypes.push({
                key: 'apps',
                saver: async () => {
                    return await saveAppRecommendation(
                        questionnaireData,
                        plan.appRecommendations,
                        destination,
                        language,
                        questionnaireData,
                        currentTripId || undefined,
                        tripName
                    );
                }
            });
        }
        if (plan.musicRecommendations && !savedTypesRef.current.has('music')) {
            availableTypes.push({
                key: 'music',
                saver: async () => {
                    return await saveMusicRecommendation(
                        questionnaireData,
                        plan.musicRecommendations,
                        destination,
                        language,
                        questionnaireData,
                        currentTripId || undefined,
                        tripName
                    );
                }
            });
        }
        if (plan.lingoRecommendations && !savedTypesRef.current.has('lingo')) {
            availableTypes.push({
                key: 'lingo',
                saver: async () => {
                    return await saveLingoRecommendation(
                        questionnaireData,
                        plan.lingoRecommendations,
                        destination,
                        language,
                        questionnaireData,
                        currentTripId || undefined,
                        tripName
                    );
                }
            });
        }

        if (availableTypes.length === 0) return;

        const run = async () => {
            // Prevent concurrent saves
            if (isSavingRef.current) return;
            isSavingRef.current = true;

            try {
                const currentTripId = savedTripIdRef.current;
                
                if (!currentTripId) {
                    // First-time save: batch-save available types to create a unified trip and obtain tripId
                    const recs = availableTypes.map(t => {
                        const type = t.key;
                        const responseData = (plan as any)[type === 'packing' ? 'packingList' : type === 'apps' ? 'appRecommendations' : type === 'food' ? 'foodRecommendations' : type === 'music' ? 'musicRecommendations' : type === 'lingo' ? 'lingoRecommendations' : 'itinerary'];
                        return { type, requestData: questionnaireData, responseData };
                    });
                    const saveResult = await saveUnifiedTripRecommendations(
                        recs,
                        destination,
                        language,
                        questionnaireData,
                        tripName
                    );
                    if (saveResult && saveResult.tripId) {
                        savedTripIdRef.current = saveResult.tripId;
                        setSavedTripId(saveResult.tripId);
                        // Only mark types that were successfully saved
                        saveResult.successfulTypes.forEach(type => {
                            savedTypesRef.current.add(type);
                        });
                        // Log any failures
                        const failedTypes = recs.map(r => r.type).filter(type => !saveResult.successfulTypes.includes(type));
                        if (failedTypes.length > 0) {
                            console.warn(`Failed to save the following types, will retry: ${failedTypes.join(', ')}`);
                        }
                    }
                } else {
                    // Append new recommendations to existing trip
                    // Save each item individually and only mark as saved if successful
                    for (const item of availableTypes) {
                        try {
                            const result = await item.saver();
                            // Only mark as saved if we got a result (non-null ID)
                            // The saver functions return string | null, so check for truthy value
                            if (result !== null && result !== undefined) {
                                savedTypesRef.current.add(item.key);
                            } else {
                                console.warn(`Failed to save ${item.key} recommendation, will retry on next effect run`);
                            }
                        } catch (error) {
                            console.error(`Failed to save ${item.key} recommendation:`, error);
                            // Don't mark as saved, so it will retry on next effect run
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to save unified trip recommendation(s):', error);
                // Don't mark anything as saved if the entire operation fails
            } finally {
                isSavingRef.current = false;
            }
        };

        run();
    }, [plan, questionnaireData, isHistoryView, saveUnifiedTripRecommendations, saveItineraryRecommendation, savePackingRecommendation, saveFoodRecommendation, saveAppRecommendation, saveMusicRecommendation, saveLingoRecommendation]);
    
    const handleCopyLink = async () => {
        if (!savedTripId) {
            setToast({ message: 'Trip is still being saved. Please wait a moment.', type: 'error' });
            return;
        }
        try {
            const shareUrl = `${window.location.origin}/share/${savedTripId}`;
            await navigator.clipboard.writeText(shareUrl);
            setToast({ message: 'Shareable link copied to clipboard!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to copy link. Please try again.', type: 'error' });
        }
    };

    const handleShare = async () => {
        if (!savedTripId) {
            setToast({ message: 'Trip is still being saved. Please wait a moment.', type: 'error' });
            return;
        }
        try {
            const shareUrl = `${window.location.origin}/share/${savedTripId}`;
            if (navigator.share) {
                await navigator.share({
                    title: `Trip Plan to ${plan.itinerary?.destination || 'Your Destination'}`,
                    text: 'Check out this amazing trip plan!',
                    url: shareUrl,
                });
                setToast({ message: 'Trip plan shared successfully!', type: 'success' });
            } else {
                // Fallback to copy if Web Share API is not available
                await navigator.clipboard.writeText(shareUrl);
                setToast({ message: 'Shareable link copied to clipboard!', type: 'success' });
            }
        } catch (error: any) {
            // User cancelled or error occurred
            if (error.name !== 'AbortError') {
                setToast({ message: 'Failed to share link. Please try again.', type: 'error' });
            }
        }
    };
    
    const getPlanDataForTab = (tab: Tab) => {
        switch (tab) {
            case 'itinerary': return plan.itinerary;
            case 'packing': return plan.packingList;
            case 'food': return plan.foodRecommendations;
            case 'apps': return plan.appRecommendations;
            case 'music': return plan.musicRecommendations;
            case 'lingo': return plan.lingoRecommendations;
            default: return null;
        }
    };

    const renderTabContent = () => {
        const currentStatus = loadingStatus[activeTab];
        const currentData = getPlanDataForTab(activeTab);
        const tabName = tabs.find(t => t.id === activeTab)?.name || 'This Section';

        if (currentStatus === 'loading' && !currentData) {
            return (
                 <div className="text-center py-12 sm:py-16 md:py-20">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-violet-600 mx-auto"></div>
                    <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 font-semibold">Generating {tabName}...</p>
                </div>
            );
        }
        
        const renderActionCard = (title: string, message: string, stepToRegenerate: Tab) => {
            // Check if it's a quota/API key error
            const isQuotaOrApiKeyError = message.includes('[429]') || 
                                        message.toLowerCase().includes('quota') || 
                                        message.toLowerCase().includes('api key') ||
                                        message.toLowerCase().includes('limit') ||
                                        message.toLowerCase().includes('exceeded');
            
            // Extract the message without [429] prefix if present
            const displayMessage = message.replace(/^\[429\]\s*/, '');
            
            return (
             <div className={`backdrop-blur-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl my-4 sm:my-6 md:my-8 shadow-lg animated-card ${currentStatus === 'error' ? 'bg-red-100/60 border-l-4 border-red-500 text-red-800' : 'bg-yellow-100/60 border-l-4 border-yellow-500 text-yellow-800'}`}>
                <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0 pt-0.5 sm:pt-1">
                        {currentStatus === 'error' ? 
                            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg> :
                            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        }
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-base sm:text-lg">{title}</p>
                        <div className="mt-1 text-xs sm:text-sm whitespace-pre-wrap">
                            {isQuotaOrApiKeyError && displayMessage.includes('profile settings') ? (
                                <div className="space-y-2">
                                    <p>{displayMessage.split('profile settings')[0]}</p>
                                    <p className="flex items-center flex-wrap gap-1">
                                        <span>Please set your own Gemini API key in</span>
                                        <a 
                                            href="/profile" 
                                            className="font-semibold underline hover:text-red-900 text-red-700"
                                        >
                                            your profile settings
                                        </a>
                                        <span>to continue.</span>
                                    </p>
                                </div>
                            ) : (
                                <p>{displayMessage}</p>
                            )}
                        </div>
                        {!isQuotaOrApiKeyError && canRegenerate && (
                        <button
                            onClick={() => onRegenerateStep(stepToRegenerate)}
                            className="mt-3 sm:mt-4 inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-all duration-300 shadow-md text-xs sm:text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 2.566l-1.581.53a5.002 5.002 0 00-8.917-1.789v.962a1 1 0 01-2 0V3a1 1 0 011-1zm12 15a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.898-2.566l1.581-.53a5.002 5.002 0 008.917 1.789v-.962a1 1 0 012 0V17a1 1 0 01-1 1z" clipRule="evenodd" /></svg>
                            Regenerate {tabName}
                        </button>
                        )}
                        {isQuotaOrApiKeyError && (
                            <a
                                href="/profile"
                                className="mt-3 sm:mt-4 inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-all duration-300 shadow-md text-xs sm:text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                                Go to Profile Settings
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
        };

        if (currentStatus === 'error') {
            return renderActionCard(`Failed to Generate ${tabName}`, stepErrors[activeTab] || `An unknown error occurred.`, activeTab);
        }
        if (currentStatus === 'cancelled') {
            return renderActionCard(`${tabName} Generation Cancelled`, `This component was skipped initially. You can generate it now.`, activeTab);
        }
        // If no data and not loading, show generate button (for skipped components)
        if (!currentData && currentStatus !== 'loading' && currentStatus !== 'pending') {
            return (
                <div className="text-center py-12 sm:py-16 md:py-20">
                    <div className="space-y-4">
                        <p className="text-sm sm:text-base text-slate-600">This component was not included in your initial plan.</p>
                        {canRegenerate && (
                        <button
                            onClick={() => onRegenerateStep(activeTab)}
                            className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-all duration-300 shadow-md text-sm sm:text-base"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            Generate {tabName}
                        </button>
                        )}
                    </div>
                </div>
            );
        }
        if (!currentData) {
             return <div className="text-center py-12 sm:py-16 md:py-20 text-sm sm:text-base text-slate-500">Waiting for data...</div>;
        }

        switch (activeTab) {
            case 'itinerary':
                return <ItineraryPreview itinerary={plan.itinerary!} onRegenerate={() => onRegenerateStep('itinerary')} isUnifiedView />;
            case 'packing':
                return <PackingListPreview packingList={plan.packingList!} onRegenerate={() => onRegenerateStep('packing')} isUnifiedView />;
            case 'food':
                return <FoodFinderResult recommendations={plan.foodRecommendations!} onRegenerate={() => onRegenerateStep('food')} isUnifiedView />;
            case 'apps':
                return <AppFinderResult recommendations={plan.appRecommendations!} onRegenerate={() => onRegenerateStep('apps')} isUnifiedView />;
            case 'music':
                return <MusicFinderResult recommendations={plan.musicRecommendations!} onRegenerate={() => onRegenerateStep('music')} isUnifiedView />;
            case 'lingo':
                return <LingoFinderResult recommendations={plan.lingoRecommendations!} onRegenerate={() => onRegenerateStep('lingo')} isUnifiedView />;
            default:
                return null;
        }
    };
    
    return (
        <div ref={containerRef} className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 animated-card unified-interactive-view mb-16 px-1 sm:px-4">
            <header ref={headerRef} id="unified-plan-header" className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 py-3 sm:py-4 no-print unified-header scroll-mt-0">
                 <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight text-center sm:text-left break-words">
                    Your Unified Trip Plan to <span className="text-violet-700">{plan.itinerary?.destination || '...'}</span>
                </h1>
                <div className="flex-shrink-0 flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-center sm:justify-end">             
                    <button
                        onClick={onPlanNew}
                        className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-700 transition-all duration-300 shadow-md text-xs sm:text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Home</span>
                    </button>
                     {canRegenerate && (
                    <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRegenerate();
                        }}
                        className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white/60 text-slate-800 font-semibold rounded-full hover:bg-white/80 transition-all duration-300 shadow-sm border border-white/50 text-xs sm:text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 2.566l-1.581.53a5.002 5.002 0 00-8.917-1.789v.962a1 1 0 01-2 0V3a1 1 0 011-1zm12 15a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.898-2.566l1.581-.53a5.002 5.002 0 008.917 1.789v-.962a1 1 0 012 0V17a1 1 0 01-1 1z" clipRule="evenodd" /></svg>
                        Regenerate
                    </button>
                    )}
                </div>
            </header>
            
            {/* Share buttons - Show from the beginning */}
            {!isHistoryView && (
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 no-print">
                    <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white font-semibold rounded-full hover:from-violet-700 hover:to-violet-800 transition-all duration-300 shadow-md text-xs sm:text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Link
                    </button>
                    <button
                        onClick={handleShare}
                        className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md text-xs sm:text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                    </button>
                </div>
            )}
                
                {/* Responsive Navigation */}
                <nav className="no-print fixed bottom-0 left-0 right-0 z-50 md:sticky md:top-4 md:z-40 md:mb-6 unified-nav">
                    <div className="w-full bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1),_0_-8px_10px_-6px_rgba(0,0,0,0.1)] md:max-w-max md:mx-auto md:rounded-full md:p-1 md:border md:shadow-lg">
                        <div className="flex h-20 md:h-auto justify-around md:justify-center md:space-x-1">
                            {tabs.map(tab => {
                                const status = loadingStatus[tab.id];
                                const dataExists = !!getPlanDataForTab(tab.id);

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            // Immediate scroll before state update
                                            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                                            document.documentElement.scrollTop = 0;
                                            document.body.scrollTop = 0;
                                            
                                            setActiveTab(tab.id);
                                            // Additional scroll is handled by useEffect when activeTab changes
                                        }}
                                        className={`relative flex flex-col items-center justify-center flex-1 space-y-1 transition-colors duration-200 md:flex-row md:flex-none md:px-4 md:py-2 md:space-x-2 md:rounded-full
                                            ${activeTab === tab.id
                                                ? 'text-violet-600 md:bg-violet-600 md:text-white md:shadow'
                                                : 'text-slate-600 hover:bg-violet-100/70'
                                            }`}
                                        aria-current={activeTab === tab.id ? 'page' : undefined}
                                    >
                                        <div className="relative flex-shrink-0">
                                            {tab.icon}
                                            {/* Status Indicator Dot */}
                                            {(status === 'loading' || status === 'pending') && (
                                                <span className="absolute -top-1 -right-1 block h-3.5 w-3.5 rounded-full border-2 border-white animate-pulse bg-blue-500"></span>
                                            )}
                                            {status === 'done' && dataExists && (
                                                <span className="absolute -top-1 -right-1 block h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500"></span>
                                            )}
                                            {(status === 'error' || (status === 'cancelled' && !dataExists)) && (
                                                <span className="absolute -top-1 -right-1 block h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500"></span>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold md:text-sm">{tab.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                <main ref={mainContentRef}>
                    {renderTabContent()}
                </main>
                {/* Spacer for bottom nav on mobile */}
                <div className="h-20 md:h-0" />
                
                {/* Toast notification */}
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
    );
};

export default UnifiedResultPreview;
