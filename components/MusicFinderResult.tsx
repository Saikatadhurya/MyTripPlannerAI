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

const getIconForGenre = (genreTitle: string): { icon: React.ReactNode; color: string } => {
    const lowerCaseTitle = genreTitle.toLowerCase();
    const iconClass = "h-6 w-6";

    // Priority Keywords
    if (lowerCaseTitle.includes('trending')) return { icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0zm8 8a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414l3 3a1 1 0 010 1.414z" clipRule="evenodd" /></svg>, color: 'fuchsia' };
    
    // Regional Keywords
    if (lowerCaseTitle.includes('north')) return { icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L10 4.414l6.293 6.293a1 1 0 001.414-1.414l-7-7z" /></svg>, color: 'red' };
    if (lowerCaseTitle.includes('south')) return { icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M10 17.414l-6.293-6.293a1 1 0 011.414-1.414L10 15.586l6.293-6.293a1 1 0 011.414 1.414L10.707 17.707a1 1 0 01-1.414 0z" /></svg>, color: 'amber' };
    if (lowerCaseTitle.includes('east')) return { icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor" transform="rotate(-90 10 10)"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L10 4.414l6.293 6.293a1 1 0 001.414-1.414l-7-7z" /></svg>, color: 'teal' };
    if (lowerCaseTitle.includes('west')) return { icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor" transform="rotate(90 10 10)"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L10 4.414l6.293 6.293a1 1 0 001.414-1.414l-7-7z" /></svg>, color: 'sky' };
    
    // Genre Keywords
    if (lowerCaseTitle.includes('pop')) return { icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>, color: 'pink' };
    if (lowerCaseTitle.includes('rock') || lowerCaseTitle.includes('metal')) return { icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0zm8 8a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414l3 3a1 1 0 010 1.414z" clipRule="evenodd" /></svg>, color: 'slate' };
    if (lowerCaseTitle.includes('folk') || lowerCaseTitle.includes('traditional')) return { icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M14.293 5.293a1 1 0 011.414 1.414L10 12.414l-5.707-5.707a1 1 0 011.414-1.414L10 9.586l4.293-4.293zM5 14a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" /></svg>, color: 'green' };
    if (lowerCaseTitle.includes('classical') || lowerCaseTitle.includes('orchestra')) return { icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>, color: 'indigo' };
    if (lowerCaseTitle.includes('hip hop') || lowerCaseTitle.includes('rap')) return { icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM5 11a1 1 0 100 2h8a1 1 0 100-2H5z" /></svg>, color: 'purple' };
    if (lowerCaseTitle.includes('electronic') || lowerCaseTitle.includes('dance')) return { icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>, color: 'cyan' };
    
    // Default
    return { icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-1-1z" /></svg>, color: 'slate' };
};

const CategoryHeader: React.FC<{ category: MusicGenreCategory }> = ({ category }) => {
    const { icon, color } = getIconForGenre(category.genre);
    
    const accentClasses: { [key: string]: string } = {
        fuchsia: 'bg-fuchsia-100 text-fuchsia-600',
        red: 'bg-red-100 text-red-600',
        amber: 'bg-amber-100 text-amber-600',
        teal: 'bg-teal-100 text-teal-600',
        sky: 'bg-sky-100 text-sky-600',
        slate: 'bg-slate-100 text-slate-600',
        pink: 'bg-pink-100 text-pink-600',
        green: 'bg-green-100 text-green-600',
        indigo: 'bg-indigo-100 text-indigo-600',
        purple: 'bg-purple-100 text-purple-600',
        cyan: 'bg-cyan-100 text-cyan-600',
    };
    
    const iconBg = accentClasses[color] || accentClasses['slate'];

    return (
        <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 rounded-lg p-3 ${iconBg}`}>
                {icon}
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{category.genre}</h2>
                <p className="text-sm text-slate-600 mt-1">{category.description}</p>
            </div>
        </div>
    );
};

const MusicFinderResult: React.FC<{ recommendations: MusicRecommendations; onRegenerate: () => void; }> = ({ recommendations, onRegenerate }) => {
    const hasMusic = recommendations.musicCategories && recommendations.musicCategories.length > 0;

    return (
        <div className="max-w-5xl mx-auto space-y-12 animated-card">
            <div className="flex justify-start items-center no-print">
                <button
                    onClick={onRegenerate}
                    className="inline-flex items-center justify-center px-6 py-2 my-2 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
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
                {hasMusic ? (
                    recommendations.musicCategories.map((category, index) => (
                        <div key={index} className="bg-white/30 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/50">
                            <CategoryHeader category={category} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                {category.music.map((item, itemIndex) => (
                                    <MusicItemCard key={itemIndex} item={item} />
                                ))}
                            </div>
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