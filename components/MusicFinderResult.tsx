import React from 'react';
import { MusicRecommendations, MusicItem, MusicGenreCategory } from '../types';

const AppLinkButton: React.FC<{ appName: MusicItem['appLinks'][0]['appName'], musicTitle: string, artist: string }> = ({ appName, musicTitle, artist }) => {
    const styles = {
        'Spotify': 'bg-[#1DB954] hover:bg-[#1ED760] text-white',
        'Apple Music': 'bg-[#FC3C44] hover:bg-[#ff5a5f] text-white',
        'YouTube': 'bg-[#FF0000] hover:bg-[#ff3333] text-white',
        'JioSaavn': 'bg-[#2BC5B4] hover:bg-[#30d9c8] text-white',
        'Gaana': 'bg-[#FF2800] hover:bg-[#ff5333] text-white',
        'Wynk': 'bg-[#E40035] hover:bg-[#fa003b] text-white',
        'Anghami': 'bg-[#333333] hover:bg-[#4d4d4d] text-white',
        'Boomplay': 'bg-[#FF4F00] hover:bg-[#ff6a29] text-white',
        'Deezer': 'bg-[#FEAA2D] hover:bg-[#ffb74a] text-black',
        'SoundCloud': 'bg-[#FF5500] hover:bg-[#ff7029] text-white',
    };

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${musicTitle} ${artist} ${appName}`)}`;

    return (
        <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-transform transform hover:scale-105 ${styles[appName] || 'bg-slate-500 hover:bg-slate-600 text-white'}`}
        >
            {appName}
        </a>
    );
};

const MusicItemCard: React.FC<{ item: MusicItem }> = ({ item }) => {
  const handleCardClick = () => {
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${item.title} ${item.artistOrDescription}`)}`;
    window.open(googleSearchUrl, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      // Prevent the default action to stop scrolling when space is pressed
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      className="bg-white/30 backdrop-blur-lg p-4 rounded-xl shadow-lg border border-white/50 flex space-x-4 items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Search for ${item.title} by ${item.artistOrDescription} on Google`}
    >
      <div className="flex-shrink-0 w-16 h-16 bg-fuchsia-100/70 rounded-md flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-fuchsia-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-1-1z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-lg text-slate-900 truncate" title={item.title}>{item.title}</h3>
        <p className="text-sm text-slate-700 truncate" title={item.artistOrDescription}>{item.artistOrDescription}</p>
        <div className="flex items-center flex-wrap gap-2 mt-3 pt-3 border-t border-fuchsia-200/50">
          {item.appLinks && item.appLinks.map((link, linkIndex) => (
            <AppLinkButton key={linkIndex} appName={link.appName} musicTitle={item.title} artist={item.artistOrDescription} />
          ))}
        </div>
      </div>
    </div>
  );
};


const MusicFinderResult: React.FC<{ recommendations: MusicRecommendations; onRegenerate: () => void; }> = ({ recommendations, onRegenerate }) => {
    const hasTrendingHits = recommendations.trendingHits && recommendations.trendingHits.music.length > 0;
    const hasRegionalHighlights = recommendations.regionalHighlights && recommendations.regionalHighlights.length > 0;

    return (
        <div className="max-w-5xl mx-auto space-y-12 animated-card">
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
            
            <div className="space-y-10">
                {hasTrendingHits && (
                    <div className="bg-gradient-to-br from-fuchsia-100 to-purple-100 backdrop-blur-lg p-6 rounded-2xl shadow-xl border-2 border-fuchsia-300/50">
                        <h2 className="text-2xl font-bold text-fuchsia-800 flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0zm8 8a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414l3 3a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                            <span>{recommendations.trendingHits!.genre}</span>
                        </h2>
                        <p className="text-sm text-slate-600 mt-1 mb-6">{recommendations.trendingHits!.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendations.trendingHits!.music.map((item, itemIndex) => (
                                <MusicItemCard key={itemIndex} item={item} />
                            ))}
                        </div>
                    </div>
                )}
                
                {hasRegionalHighlights ? (
                    recommendations.regionalHighlights.map((region, index) => (
                        <div key={index} className="bg-white/30 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/50">
                            <h2 className="text-2xl font-bold text-slate-800">{region.genre}</h2>
                            <p className="text-sm text-slate-600 mt-1 mb-6">{region.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {region.music.map((item, itemIndex) => (
                                    <MusicItemCard key={itemIndex} item={item} />
                                ))}
                            </div>
                        </div>
                    ))
                ) : null }

                {!hasTrendingHits && !hasRegionalHighlights && (
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