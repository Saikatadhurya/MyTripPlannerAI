import React, { useState, useEffect } from 'react';
import { LingoRecommendations, PhraseCategory } from '../types';
import { useSaveRecommendation } from '../hooks/useSaveRecommendation';
import Toast from './Toast';

const AccordionItem: React.FC<{ category: PhraseCategory, isOpen: boolean, onToggle: () => void }> = ({ category, isOpen, onToggle }) => {
    const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedPhrase(text);
        setTimeout(() => setCopiedPhrase(null), 2000);
    };

    return (
        <div className="bg-white/30 backdrop-blur-lg border border-white/40 rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center text-left p-3 sm:p-4 md:p-5"
                aria-expanded={isOpen}
            >
                <h3 className="text-base sm:text-lg font-bold text-slate-800 break-words pr-2">{category.categoryName}</h3>
                <svg
                    className={`h-5 w-5 sm:h-6 sm:w-6 text-violet-600 transition-transform duration-300 printable-accordion-toggle-icon flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            <div
                className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out printable-accordion-content ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                }}
            >
                <div className="overflow-hidden">
                    <div className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 md:pb-5">
                        <div className="space-y-3 sm:space-y-4">
                            {category.phrases.map((phrase, index) => (
                                <div key={index} className="p-3 sm:p-4 bg-white/50 rounded-lg border border-white/50">
                                    <p className="font-semibold text-sm sm:text-base text-slate-800 break-words">{phrase.english}</p>
                                    <div className="flex items-center justify-between mt-2 gap-2">
                                        <p className="text-sky-700 font-bold text-base sm:text-lg break-words flex-1">{phrase.local}</p>
                                        <button onClick={() => handleCopy(phrase.local)} className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-200/70 rounded-full hover:bg-slate-300/80 transition-colors no-print flex-shrink-0">
                                            {copiedPhrase === phrase.local ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-600 italic mt-1 break-words">"{phrase.pronunciation}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface LingoFinderResultProps {
    recommendations: LingoRecommendations;
    onRegenerate: () => void;
    isUnifiedView?: boolean;
    requestData?: any; // Add request data for history saving
    isHistoryView?: boolean; // Add flag to indicate if this is from history
}

const LingoFinderResult: React.FC<LingoFinderResultProps> = ({ recommendations, onRegenerate, isUnifiedView = false, requestData, isHistoryView = false }) => {
    const [openCategory, setOpenCategory] = useState<string | null>(recommendations.categories[0]?.categoryName || null);
    const [hasBeenSaved, setHasBeenSaved] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const { saveLingoRecommendation } = useSaveRecommendation();

    const toggleCategory = (categoryName: string) => {
        setOpenCategory(prev => (prev === categoryName ? null : categoryName));
    };

    // Save to history when component mounts (only if not in unified view and request data is available)
    useEffect(() => {
        // Don't save if this is a history view
        if (!isUnifiedView && requestData && !hasBeenSaved && !isHistoryView) {
            const saveRecommendation = async () => {
                const id = await saveLingoRecommendation(requestData, recommendations, recommendations.destination, requestData.language);
                if (id) {
                    setSavedId(id);
                }
                setHasBeenSaved(true);
            };
            saveRecommendation();
        }
    }, [isUnifiedView, requestData, recommendations, saveLingoRecommendation, hasBeenSaved, isHistoryView]);
    
    const handleCopyLink = async () => {
        if (!savedId) {
            setToast({ message: 'Recommendation is still being saved. Please wait a moment.', type: 'error' });
            return;
        }
        try {
            const shareUrl = `${window.location.origin}/share/${savedId}`;
            await navigator.clipboard.writeText(shareUrl);
            setToast({ message: 'Shareable link copied to clipboard!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to copy link. Please try again.', type: 'error' });
        }
    };

    const handleShare = async () => {
        if (!savedId) {
            setToast({ message: 'Recommendation is still being saved. Please wait a moment.', type: 'error' });
            return;
        }
        try {
            const shareUrl = `${window.location.origin}/share/${savedId}`;
            if (navigator.share) {
                await navigator.share({
                    title: `Local Lingo Guide for ${recommendations.destination}`,
                    text: 'Check out this essential phrasebook!',
                    url: shareUrl,
                });
                setToast({ message: 'Recommendation shared successfully!', type: 'success' });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                setToast({ message: 'Shareable link copied to clipboard!', type: 'success' });
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                setToast({ message: 'Failed to share link. Please try again.', type: 'error' });
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 md:space-y-12 animated-card mb-16 px-1 sm:px-4" id="lingo-finder-result-content">
            {!isUnifiedView && (
            <div className="flex justify-start items-center no-print">
                <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRegenerate();
                    }}
                    className="inline-flex items-center justify-center px-4 py-1.5 sm:px-6 sm:py-2 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50 text-xs sm:text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                    <span>Create Another Guide</span>
                </button>
            </div>
            )}
            
            <header className="space-y-2 sm:space-y-4 text-center">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight break-words px-1 sm:px-2">
                    Local Lingo Guide for {recommendations.destination}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 mt-1 sm:mt-2 px-1 sm:px-2">
                    Your essential phrasebook for speaking <span className="font-semibold text-sky-700">{recommendations.localLanguage}</span>.
                </p>
            </header>
            
            {/* Share buttons - Only show when saved and not in history view */}
            {savedId && !isHistoryView && !isUnifiedView && (
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
            
            <div className="space-y-3 sm:space-y-4">
                {recommendations.categories.map((category, index) => (
                    <AccordionItem
                        key={category.categoryName || index}
                        category={category}
                        isOpen={openCategory === category.categoryName}
                        onToggle={() => toggleCategory(category.categoryName)}
                    />
                ))}
            </div>

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
                        className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-sky-600 text-white font-bold rounded-full hover:bg-sky-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                        <span>Create Another Guide</span>
                    </button>
                    )}
                </div>
            </div>
            
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

export default LingoFinderResult;
