import React, { useState, useMemo, useEffect } from 'react';
import { FoodRecommendations, FoodItem, FoodItemGroup } from '../types';
import { useSaveRecommendation } from '../hooks/useSaveRecommendation';
import Toast from './Toast';

const CategoryCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    items: FoodItemGroup[];
    accentColor: string;
}> = ({ title, icon, items, accentColor }) => {
    if (!items || !items.some(group => group.items && group.items.length > 0)) return null;

    const accentClasses: { [key: string]: string } = {
        purple: 'border-purple-500 bg-purple-100 text-purple-600',
        pink: 'border-pink-500 bg-pink-100 text-pink-600',
        yellow: 'border-yellow-500 bg-yellow-100 text-yellow-600',
        green: 'border-green-500 bg-green-100 text-green-600',
        blue: 'border-blue-500 bg-blue-100 text-blue-600',
        teal: 'border-teal-500 bg-teal-100 text-teal-600',
        orange: 'border-orange-500 bg-orange-100 text-orange-600',
        brown: 'border-amber-800 bg-amber-100 text-amber-800',
        fuchsia: 'border-fuchsia-500 bg-fuchsia-100 text-fuchsia-600',
        gold: 'border-amber-500 bg-amber-100 text-amber-600',
        red: 'border-red-500 bg-red-100 text-red-600',
        lime: 'border-lime-500 bg-lime-100 text-lime-600',
        indigo: 'border-indigo-500 bg-indigo-100 text-indigo-600',
    };
    
    const [borderColor, iconBgColor] = accentClasses[accentColor]?.split(' ') || ['border-gray-500', 'bg-gray-100', 'text-gray-600'];
    
    const aggregatedItems = useMemo(() => {
        const foodMap = new Map<string, { name: string; description: string; locations: Set<string> }>();

        items.forEach(group => {
            if (!group.items) return;
            group.items.forEach(item => {
                const normalizedName = item.name.trim().toLowerCase();
                if (foodMap.has(normalizedName)) {
                    const existing = foodMap.get(normalizedName)!;
                    existing.locations.add(group.location);
                } else {
                    foodMap.set(normalizedName, {
                        name: item.name,
                        description: item.description,
                        locations: new Set([group.location]),
                    });
                }
            });
        });

        return Array.from(foodMap.values()).map(item => ({
            ...item,
            locations: Array.from(item.locations),
        }));
    }, [items]);
    
    const uniqueLocations = useMemo(() => new Set(items.flatMap(group => group.location)), [items]);
    const isMultiLocation = uniqueLocations.size > 1;

    const handleFoodItemClick = (foodItem: { name: string; locations: string[] }) => {
        const searchTerm = `${foodItem.name} food ${foodItem.locations[0] || ''}`.trim();
        const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchTerm)}`;
        window.open(googleImagesUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className={`bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-transform hover:scale-105 shadow-lg border-l-4 ${borderColor}`}>
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className={`flex-shrink-0 rounded-lg p-1.5 sm:p-2 ${iconBgColor}`}>
                    {icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 break-words">{title}</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
                 <ul className="space-y-2 -m-2 sm:-m-3">
                    {aggregatedItems.map((item, itemIndex) => (
                        <li key={itemIndex}>
                            <button
                                onClick={() => handleFoodItemClick(item)}
                                className="w-full text-left p-2.5 sm:p-3 rounded-lg hover:bg-amber-100/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
                                aria-label={`Search for images of ${item.name}`}
                            >
                                <div className="font-semibold text-slate-900 flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-1">
                                    <span className="text-sm sm:text-base break-words">{item.name}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 inline-block flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    {isMultiLocation && (
                                        item.locations.map((location, locIndex) => (
                                            <span key={locIndex} className="text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 whitespace-nowrap">
                                                📍 {location}
                                            </span>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">{item.description}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

interface FoodFinderResultProps {
    recommendations: FoodRecommendations;
    onRegenerate: () => void;
    isUnifiedView?: boolean;
    requestData?: any; // Add request data for history saving
    isHistoryView?: boolean; // Add flag to indicate if this is from history
}

const FoodFinderResult: React.FC<FoodFinderResultProps> = ({ recommendations, onRegenerate, isUnifiedView = false, requestData, isHistoryView = false }) => {
    const iconClass = "h-6 w-6";
    const [hasBeenSaved, setHasBeenSaved] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const { saveFoodRecommendation } = useSaveRecommendation();
    
    // Save to history when component mounts (only if not in unified view and request data is available)
    useEffect(() => {
        // Don't save if this is a history view
        if (!isUnifiedView && requestData && !hasBeenSaved && !isHistoryView) {
            const saveRecommendation = async () => {
                const id = await saveFoodRecommendation(requestData, recommendations, recommendations.destination, requestData.language);
                if (id) {
                    setSavedId(id);
                }
                setHasBeenSaved(true);
            };
            saveRecommendation();
        }
    }, [isUnifiedView, requestData, recommendations, saveFoodRecommendation, hasBeenSaved, isHistoryView]);
    
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
                    title: `Local Food Guide for ${recommendations.destination}`,
                    text: 'Check out this amazing food guide!',
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
    const categoryDetails = {
        iconicDishes: { title: "Iconic Dishes", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>, color: "orange"},
        breakfast: { title: "Breakfast", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 3v18H3V3h18zM5 7h14M5 12h14M5 17h14" /></svg>, color: "purple"},
        lunch: { title: "Lunch", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>, color: "pink"},
        dinner: { title: "Dinner", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: "green"},
        snacksAndStreetFood: { title: "Snacks/Street Food", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>, color: "yellow"},
        dessertAndSweets: { title: "Dessert & Sweets", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a.75.75 0 01-.75-.75V10.5h1.5v6.75A.75.75 0 0110 18zM10 5.385a2.25 2.25 0 012.121 1.5c.08.334.12.68.12 1.037 0 .356-.04.703-.12 1.037a2.25 2.25 0 01-4.242 0c-.08-.334-.12-.68-.12-1.037 0-.356.04.703.12-1.037A2.25 2.25 0 0110 5.385z" clipRule="evenodd" /></svg>, color: "blue"},
        drinksAndBeverages: { title: "Drinks & Beverages", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 9a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" /><path fillRule="evenodd" d="M4 11a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" /></svg>, color: "teal"},
        hiddenRecipes: { title: "Hidden Recipes", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>, color: "brown"},
        trendingOrViralFoods: { title: "Trending / Viral Foods", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0zm8 8a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414l3 3a1 1 0 010 1.414z" clipRule="evenodd" /></svg>, color: "fuchsia"},
        chefsSpecials: { title: "Chef’s Specials", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.348 2.368A2.5 2.5 0 008.86 1.114L8.06 3.99a2.5 2.5 0 004.68.63l.66-2.525a2.5 2.5 0 00-2.052-.727zM12.34 3.99l-2.08 7.925a.5.5 0 01-.958.01l-2.08-7.925a2.5 2.5 0 014.68-.63l.218.83a.5.5 0 00.958-.25l.218-.83a2.5 2.5 0 012.34.38l.01.006.01.005a2.5 2.5 0 011.268 4.093l-1.39 1.39a.5.5 0 000 .707l1.39 1.39a2.5 2.5 0 01-3.172 3.84l-1.39-1.39a.5.5 0 00-.707 0l-1.39 1.39a2.5 2.5 0 01-3.84-3.172l1.39-1.39a.5.5 0 000-.707l-1.39-1.39A2.5 2.5 0 015.66 3.618l.01-.005.01-.006a2.5 2.5 0 014.68.63z" clipRule="evenodd" /></svg>, color: "gold"},
        seasonalSpecials: { title: "Seasonal Specials", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM5.226 5.226a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM13.713 5.226a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM2 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 10zM15.5 9.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM10 18a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5A.75.75 0 0110 18zM5.226 13.713a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM13.713 13.713a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>, color: "lime"},
        festivalAndStreetFoods: { title: "Festival & Street Foods", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM7 6a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zM8 9a1 1 0 000 2h4a1 1 0 100-2H8z" clipRule="evenodd" /><path d="M4 12a2 2 0 012-2h8a2 2 0 012 2v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z" /></svg>, color: "indigo"},
    };

    // The order in which categories will be displayed
    const displayOrder = Object.keys(categoryDetails) as Array<keyof typeof categoryDetails>;

    return (
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 md:space-y-12 animated-card mb-16 px-1 sm:px-4" id="food-finder-result-content">
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
                    <span>Find Another Feast</span>
                </button>
            </div>
            )}
            
            <header className="space-y-2 sm:space-y-4 text-center">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight break-words px-1 sm:px-2">
                    Local Food Guide for {recommendations.destination}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 mt-1 sm:mt-2 px-1 sm:px-2">
                    Your personalized culinary journey awaits!
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {displayOrder.map(key => {
                    const details = categoryDetails[key as keyof typeof categoryDetails];
                    const items = recommendations[key as keyof FoodRecommendations] as FoodItemGroup[];
                    return (
                        <CategoryCard
                            key={key}
                            title={details.title}
                            icon={details.icon}
                            items={items}
                            accentColor={details.color}
                        />
                    );
                })}
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
                        className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-amber-600 text-white font-bold rounded-full hover:bg-amber-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                        <span>Find Another Feast</span>
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

export default FoodFinderResult;