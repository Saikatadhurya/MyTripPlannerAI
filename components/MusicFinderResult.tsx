import React from 'react';
import { MusicRecommendations, MusicItem, MusicGenreCategory } from '../types';

const AppLinkButton: React.FC<{ appName: MusicItem['appLinks'][0]['appName'], url: string }> = ({ appName, url }) => {
    const styles = {
        'Spotify': 'bg-[#1DB954] hover:bg-[#1ED760] text-white',
        'Apple Music': 'bg-[#FC3C44] hover:bg-[#ff5a5f] text-white',
        'YouTube Music': 'bg-[#FF0000] hover:bg-[#ff3333] text-white',
        'JioSaavn': 'bg-[#2BC5B4] hover:bg-[#30d9c8] text-white',
        'Gaana': 'bg-[#FF2800] hover:bg-[#ff5333] text-white',
        'Wynk': 'bg-[#E40035] hover:bg-[#fa003b] text-white',
        'Anghami': 'bg-[#333333] hover:bg-[#4d4d4d] text-white',
        'Boomplay': 'bg-[#FF4F00] hover:bg-[#ff6a29] text-white',
        'Deezer': 'bg-[#FEAA2D] hover:bg-[#ffb74a] text-black',
        'SoundCloud': 'bg-[#FF5500] hover:bg-[#ff7029] text-white',
        'Other': 'bg-slate-500 hover:bg-slate-600 text-white',
    };

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-transform transform hover:scale-105 ${styles[appName] || styles.Other}`}
        >
            {appName}
        </a>
    );
};


const MusicFinderResult: React.FC<{ recommendations: MusicRecommendations; onRegenerate: () => void; }> = ({ recommendations, onRegenerate }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-12 animated-card">
            <div className="flex justify-start items-center no-print">
                <button
                    onClick={onRegenerate}
                    className="inline-flex items-center justify-center px-6 py-2 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                    <span>Find Music for Another Trip</span>
                </button>
            </div>
            
            <header className="space-y-4 text-center -mt-8">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                    The Sound of {recommendations.destination}
                </h1>
                <p className="text-lg text-gray-700 mt-2">
                    Your personalized guide to the local music scene.
                </p>
            </header>
            
            <div className="space-y-8">
                {recommendations.categories && recommendations.categories.length > 0 ? (
                    recommendations.categories.map((category, index) => (
                        <div key={index} className="bg-white/30 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/50">
                            <h2 className="text-2xl font-bold text-slate-800">{category.genre}</h2>
                            <p className="text-sm text-slate-600 mt-1 mb-4">{category.description}</p>
                            <ul className="divide-y divide-fuchsia-200/50">
                                {category.music.map((item, itemIndex) => (
                                    <li key={itemIndex} className="py-4">
                                        <h3 className="font-semibold text-lg text-slate-900">{item.title}</h3>
                                        <p className="text-sm text-slate-700 mb-3">{item.artistOrDescription}</p>
                                        <div className="flex items-center flex-wrap gap-2">
                                            {item.appLinks && item.appLinks.map((link, linkIndex) => (
                                                <AppLinkButton key={linkIndex} appName={link.appName} url={link.url} />
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <div className="text-center bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-12 shadow-lg">
                        <h2 className="text-2xl font-bold text-slate-800">No Specific Music Found</h2>
                        <p className="text-slate-600 mt-2">We couldn't find unique local music for {recommendations.destination}. Try exploring global charts on Spotify or Apple Music for popular hits!</p>
                    </div>
                )}
            </div>

            <div className="pt-8 text-center no-print">
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
                    <button
                        onClick={onRegenerate}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-fuchsia-600 text-white font-bold rounded-full hover:bg-fuchsia-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                        <span>Find More Music</span>
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v-1a1 1 0 011-1h10a1 1 0 011 1v1h1a2 2 0 002-2v-3a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                        </svg>
                        <span>Print Music Guide</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MusicFinderResult;
