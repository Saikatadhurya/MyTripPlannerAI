
import React, { useState, useEffect } from 'react';
import { LingoRecommendations, PhraseCategory } from '../types';

const AccordionItem: React.FC<{
    category: PhraseCategory;
    isOpen: boolean;
    onToggle: () => void;
    onPlay: (text: string, lang: string) => void;
    speakingPhrase: string | null;
    localLanguage: string;
    isSpeechSupported: boolean;
}> = ({ category, isOpen, onToggle, onPlay, speakingPhrase, localLanguage, isSpeechSupported }) => {
    const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedPhrase(text);
        setTimeout(() => setCopiedPhrase(null), 2000);
    };

    return (
        <div className="bg-white/30 backdrop-blur-lg border border-white/40 rounded-xl shadow-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center text-left p-4 sm:p-5"
                aria-expanded={isOpen}
            >
                <h3 className="text-lg font-bold text-slate-800">{category.categoryName}</h3>
                <svg
                    className={`h-6 w-6 text-violet-600 transition-transform duration-300 printable-accordion-toggle-icon ${isOpen ? 'rotate-180' : ''}`}
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
                    <div className="px-4 sm:px-5 pb-5">
                        <div className="space-y-4">
                            {category.phrases.map((phrase, index) => (
                                <div key={index} className="p-4 bg-white/50 rounded-lg border border-white/50">
                                    <p className="font-semibold text-slate-800">{phrase.english}</p>
                                    <div className="flex items-center justify-between mt-2 gap-2">
                                        <p className="text-sky-700 font-bold text-lg break-all">{phrase.local}</p>
                                        <div className="flex items-center space-x-2 flex-shrink-0">
                                            <button
                                                onClick={() => onPlay(phrase.local, localLanguage)}
                                                className="p-2 text-slate-600 bg-slate-200/70 rounded-full hover:bg-slate-300/80 transition-colors no-print disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label={`Listen to "${phrase.local}"`}
                                                disabled={!isSpeechSupported}
                                                title={isSpeechSupported ? `Listen to pronunciation` : `Text-to-speech not supported by your browser`}
                                            >
                                                {speakingPhrase === phrase.local ? (
                                                    <svg className="h-5 w-5 text-violet-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <style>
                                                            {`.wave-line{stroke:currentColor;stroke-width:2;stroke-linecap:round;animation:wave 1.5s linear infinite}.wave-line:nth-child(2){animation-delay:.2s}.wave-line:nth-child(3){animation-delay:.4s}@keyframes wave{0%,100%{stroke-dasharray:2 12;stroke-dashoffset:0}50%{stroke-dasharray:7 12;stroke-dashoffset:-5}}`}
                                                        </style>
                                                        <path className="wave-line" d="M6 18V6"/>
                                                        <path className="wave-line" d="M12 18V6"/>
                                                        <path className="wave-line" d="M18 18V6"/>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button onClick={() => handleCopy(phrase.local)} className="px-3 py-1 text-sm font-semibold text-slate-600 bg-slate-200/70 rounded-full hover:bg-slate-300/80 transition-colors no-print">
                                                {copiedPhrase === phrase.local ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 italic mt-1">"{phrase.pronunciation}"</p>
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
}

const LingoFinderResult: React.FC<LingoFinderResultProps> = ({ recommendations, onRegenerate, isUnifiedView = false }) => {
    const [openCategory, setOpenCategory] = useState<string | null>(recommendations.categories[0]?.categoryName || null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [speakingPhrase, setSpeakingPhrase] = useState<string | null>(null);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            setIsSpeechSupported(true);
            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                if (availableVoices.length > 0) {
                    setVoices(availableVoices);
                    // No longer need this listener if voices are loaded
                    window.speechSynthesis.onvoiceschanged = null;
                }
            };

            // This event fires when the voice list has been loaded.
            window.speechSynthesis.onvoiceschanged = loadVoices;
            // Also call it directly in case the voices are already loaded.
            loadVoices();

            return () => {
                window.speechSynthesis.onvoiceschanged = null;
                // Cancel any ongoing speech when the component unmounts
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                }
            };
        } else {
            console.warn("Text-to-speech is not supported by this browser.");
        }
    }, []);
    
    // A more robust language code mapping.
    const getLangCode = (langName: string): string => {
        const name = langName.toLowerCase().trim();
        const map: { [key: string]: string } = {
            'japanese': 'ja-JP', 'spanish': 'es-ES', 'french': 'fr-FR', 'german': 'de-DE', 
            'italian': 'it-IT', 'portuguese': 'pt-PT', 'russian': 'ru-RU', 
            'chinese': 'zh-CN', 'hindi': 'hi-IN', 'arabic': 'ar-SA', 'korean': 'ko-KR'
        };
        for (const key in map) {
            if (name.includes(key)) {
                return map[key];
            }
        }
        // Fallback for languages like 'English'
        return 'en-US'; 
    };

    const handlePlay = (text: string, langName: string) => {
        if (!isSpeechSupported) {
            alert("Sorry, your browser doesn't support text-to-speech.");
            return;
        }

        // Stop any currently speaking utterance
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        const targetLangCode = getLangCode(langName);
        
        // Find the best available voice
        const voice = voices.find(v => v.lang === targetLangCode) || // Exact match
                      voices.find(v => v.lang.startsWith(targetLangCode.split('-')[0])) || // Match language part (e.g., 'en' for 'en-US')
                      null;

        if (voice) {
            utterance.voice = voice;
        }
        
        utterance.lang = targetLangCode;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        utterance.onstart = () => setSpeakingPhrase(text);
        utterance.onend = () => setSpeakingPhrase(null);
        utterance.onerror = (event) => {
            setSpeakingPhrase(null);
            console.error("Speech synthesis error occurred:", event.error);
            alert("Sorry, an error occurred while trying to play the audio.");
        };

        window.speechSynthesis.speak(utterance);
    };

    const toggleCategory = (categoryName: string) => {
        setOpenCategory(prev => (prev === categoryName ? null : categoryName));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-12 animated-card">
            {!isUnifiedView && (
            <div className="flex justify-start items-center no-print">
                <button
                    onClick={onRegenerate}
                    className="inline-flex items-center justify-center px-6 py-2 my-2 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                    <span>Create Another Guide</span>
                </button>
            </div>
            )}
            
            <header className="space-y-4 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                    Local Lingo Guide for {recommendations.destination}
                </h1>
                <p className="text-lg text-gray-700 mt-2">
                    Your essential phrasebook for speaking <span className="font-semibold text-sky-700">{recommendations.localLanguage}</span>.
                </p>
                {!isSpeechSupported && (
                    <p className="text-sm text-amber-700 bg-amber-100 p-2 rounded-md mt-2">
                        Note: Text-to-speech pronunciation is not supported by your browser.
                    </p>
                )}
            </header>
            
            <div className="space-y-4">
                {recommendations.categories.map((category, index) => (
                    <AccordionItem
                        key={category.categoryName || index}
                        category={category}
                        isOpen={openCategory === category.categoryName}
                        onToggle={() => toggleCategory(category.categoryName)}
                        onPlay={handlePlay}
                        speakingPhrase={speakingPhrase}
                        localLanguage={recommendations.localLanguage}
                        isSpeechSupported={isSpeechSupported}
                    />
                ))}
            </div>

            <div className="pt-8 text-center no-print">
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
                    {!isUnifiedView && (
                    <button
                        onClick={onRegenerate}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-sky-600 text-white font-bold rounded-full hover:bg-sky-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                        <span>Create Another Guide</span>
                    </button>
                    )}
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v-1a1 1 0 011-1h10a1 1 0 011 1v1h1a2 2 0 002-2v-3a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                        </svg>
                        <span>Print Guide</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LingoFinderResult;
