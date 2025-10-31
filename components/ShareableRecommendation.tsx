import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { historyService } from '../services/historyService';
import { RecommendationHistory, UnifiedTrip } from '../services/historyService';
import AppFinderResult from './AppFinderResult';
import FoodFinderResult from './FoodFinderResult';
import MusicFinderResult from './MusicFinderResult';
import LingoFinderResult from './LingoFinderResult';
import PackingListPreview from './PackingListPreview';
import ItineraryPreview from './ItineraryPreview';
import UnifiedResultPreview from './UnifiedResultPreview';
import LoadingIndicator from './LoadingIndicator';
import Toast from './Toast';

const ShareableRecommendation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<RecommendationHistory | null>(null);
  const [unifiedTrip, setUnifiedTrip] = useState<UnifiedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const loadRecommendation = async () => {
      if (!id) {
        setError('Invalid recommendation ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Try to load as individual recommendation first
        try {
          const individualRec = await historyService.getPublicRecommendationById(id);
          
          if (individualRec) {
            setRecommendation(individualRec);
            setLoading(false);
            return;
          }
        } catch (individualError) {
          // Individual recommendation not found, continue to unified trip
        }

        // If not found as individual, try as unified trip
        try {
          const trip = await historyService.getPublicUnifiedTripById(id);
          
          if (trip) {
            setUnifiedTrip(trip);
            setLoading(false);
            return;
          }
        } catch (unifiedError) {
          // Unified trip not found
        }

        setError('Recommendation not found');
        setLoading(false);
      } catch (err) {
        setError('Failed to load recommendation');
        setLoading(false);
      }
    };

    loadRecommendation();
  }, [id]);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleCopyLink = async () => {
    if (!id) {
      setToast({ message: 'Invalid share link.', type: 'error' });
      return;
    }
    try {
      const shareUrl = `${window.location.origin}/share/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      setToast({ message: 'Shareable link copied to clipboard!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to copy link. Please try again.', type: 'error' });
    }
  };

  const handleShare = async () => {
    if (!id) {
      setToast({ message: 'Invalid share link.', type: 'error' });
      return;
    }
    try {
      const shareUrl = `${window.location.origin}/share/${id}`;
      const title = unifiedTrip 
        ? `Trip Plan to ${unifiedTrip.destination || 'Your Destination'}`
        : recommendation 
        ? `${recommendation.recommendationType.charAt(0).toUpperCase() + recommendation.recommendationType.slice(1)} Recommendation for ${recommendation.destination || 'Your Destination'}`
        : 'Trip Recommendation';
      
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: 'Check out this amazing trip recommendation!',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading shareable recommendation...</p>
          <p className="text-sm text-slate-500">ID: {id || 'No ID found'}</p>
        </div>
      </div>
    );
  }

  if (error || (!recommendation && !unifiedTrip)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-white/60 max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Recommendation Not Found</h2>
            <p className="text-slate-600 mb-6">{error || 'The shared recommendation could not be found.'}</p>
            <button
              onClick={handleBackToHome}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-violet-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderIndividualRecommendation(rec: RecommendationHistory) {

    if (!rec.responseData) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-white/60 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Invalid Recommendation Data</h2>
              <p className="text-slate-600 mb-6">The recommendation data is missing or corrupted.</p>
              <button
                onClick={handleBackToHome}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-violet-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Extract the actual recommendation data from the API response
    const recommendationData = rec.responseData || {};
    const requestData = rec.requestData || {};


    switch (rec.recommendationType) {
      case 'apps':
        // Ensure the apps data has the expected structure with proper fallbacks
        const appsData = {
          destination: recommendationData.destination || rec.destination || 'Unknown Destination',
          transportAndTravel: Array.isArray(recommendationData.transportAndTravel) ? recommendationData.transportAndTravel : [],
          stayAndLiving: Array.isArray(recommendationData.stayAndLiving) ? recommendationData.stayAndLiving : [],
          foodAndDining: Array.isArray(recommendationData.foodAndDining) ? recommendationData.foodAndDining : [],
          entertainmentAndLeisure: Array.isArray(recommendationData.entertainmentAndLeisure) ? recommendationData.entertainmentAndLeisure : [],
          shoppingAndEssentials: Array.isArray(recommendationData.shoppingAndEssentials) ? recommendationData.shoppingAndEssentials : [],
          explorationAndTours: Array.isArray(recommendationData.explorationAndTours) ? recommendationData.explorationAndTours : [],
          utilitiesAndSafety: Array.isArray(recommendationData.utilitiesAndSafety) ? recommendationData.utilitiesAndSafety : [],
          festivalsAndSeasonal: Array.isArray(recommendationData.festivalsAndSeasonal) ? recommendationData.festivalsAndSeasonal : []
        };
        
        return (
          <AppFinderResult
            recommendations={appsData}
            onRegenerate={() => {}}
            requestData={requestData}
            isHistoryView={true}
          />
        );
      
      case 'food':
        // Ensure the food data has the expected structure with proper fallbacks
        const foodData = {
          destination: recommendationData.destination || rec.destination || 'Unknown Destination',
          breakfast: Array.isArray(recommendationData.breakfast) ? recommendationData.breakfast : [],
          lunch: Array.isArray(recommendationData.lunch) ? recommendationData.lunch : [],
          snacksAndStreetFood: Array.isArray(recommendationData.snacksAndStreetFood) ? recommendationData.snacksAndStreetFood : [],
          dinner: Array.isArray(recommendationData.dinner) ? recommendationData.dinner : [],
          dessertAndSweets: Array.isArray(recommendationData.dessertAndSweets) ? recommendationData.dessertAndSweets : [],
          drinksAndBeverages: Array.isArray(recommendationData.drinksAndBeverages) ? recommendationData.drinksAndBeverages : [],
          iconicDishes: Array.isArray(recommendationData.iconicDishes) ? recommendationData.iconicDishes : [],
          hiddenRecipes: Array.isArray(recommendationData.hiddenRecipes) ? recommendationData.hiddenRecipes : [],
          trendingOrViralFoods: Array.isArray(recommendationData.trendingOrViralFoods) ? recommendationData.trendingOrViralFoods : [],
          chefsSpecials: Array.isArray(recommendationData.chefsSpecials) ? recommendationData.chefsSpecials : [],
          seasonalSpecials: Array.isArray(recommendationData.seasonalSpecials) ? recommendationData.seasonalSpecials : [],
          festivalAndStreetFoods: Array.isArray(recommendationData.festivalAndStreetFoods) ? recommendationData.festivalAndStreetFoods : []
        };
        return (
          <FoodFinderResult
            recommendations={foodData}
            onRegenerate={() => {}}
            requestData={requestData}
            isHistoryView={true}
          />
        );
      
      case 'music':
        // Ensure the music data has the expected structure with proper fallbacks
        const musicData = {
          destination: recommendationData.destination || rec.destination || 'Unknown Destination',
          musicCategories: Array.isArray(recommendationData.musicCategories) ? recommendationData.musicCategories : []
        };
        
        return (
          <MusicFinderResult
            recommendations={musicData}
            onRegenerate={() => {}}
            requestData={requestData}
            isHistoryView={true}
          />
        );
      
      case 'lingo':
        // Ensure the lingo data has the expected structure with proper fallbacks
        const lingoData = {
          destination: recommendationData.destination || rec.destination || 'Unknown Destination',
          localLanguage: recommendationData.localLanguage || 'English',
          categories: Array.isArray(recommendationData.categories) ? recommendationData.categories : []
        };
        return (
          <LingoFinderResult
            recommendations={lingoData}
            onRegenerate={() => {}}
            requestData={requestData}
            isHistoryView={true}
          />
        );
      
      case 'packing':
        // Ensure the packing data has the expected structure with proper fallbacks
        const packingData = {
          destination: recommendationData.destination || rec.destination || 'Unknown Destination',
          clothingAndFootwear: Array.isArray(recommendationData.clothingAndFootwear) ? recommendationData.clothingAndFootwear : [],
          toiletriesAndPersonalCare: Array.isArray(recommendationData.toiletriesAndPersonalCare) ? recommendationData.toiletriesAndPersonalCare : [],
          medicinesAndHealth: Array.isArray(recommendationData.medicinesAndHealth) ? recommendationData.medicinesAndHealth : [],
          electronicsAndGear: Array.isArray(recommendationData.electronicsAndGear) ? recommendationData.electronicsAndGear : [],
          documentsAndMoney: Array.isArray(recommendationData.documentsAndMoney) ? recommendationData.documentsAndMoney : [],
          optionalComfortItems: Array.isArray(recommendationData.optionalComfortItems) ? recommendationData.optionalComfortItems : [],
          adventureClothing: Array.isArray(recommendationData.adventureClothing) ? recommendationData.adventureClothing : [],
          bagSuggestion: recommendationData.bagSuggestion || 'Standard travel bag',
          locallyAvailableItems: Array.isArray(recommendationData.locallyAvailableItems) ? recommendationData.locallyAvailableItems : [],
          days: recommendationData.days || 7,
          approximateTemperature: recommendationData.approximateTemperature || 'Moderate',
          startDate: recommendationData.startDate || new Date().toISOString().split('T')[0]
        };
        
        return (
          <PackingListPreview
            packingList={packingData}
            onRegenerate={() => {}}
            requestData={requestData}
            isHistoryView={true}
          />
        );
      
      case 'itinerary':
        // Ensure the itinerary data has the expected structure with proper fallbacks
        const itineraryData = {
          destination: recommendationData.destination || rec.destination || 'Unknown Destination',
          startPoint: recommendationData.startPoint || requestData.startPoint || 'Unknown',
          tripType: recommendationData.tripType || requestData.tripType || 'leisure',
          isRoundTrip: recommendationData.isRoundTrip || requestData.isRoundTrip || false,
          days: recommendationData.days || requestData.days || 7,
          persons: recommendationData.persons || requestData.persons || 1,
          budget: recommendationData.budget || requestData.budget || { min: 1000, max: 5000, currency: 'USD' },
          vibe: Array.isArray(recommendationData.vibe) ? recommendationData.vibe : (Array.isArray(requestData.vibe) ? requestData.vibe : ['relaxed']),
          foodPreference: recommendationData.foodPreference || requestData.foodPreference || 'any',
          startDate: recommendationData.startDate || requestData.startDate || new Date().toISOString().split('T')[0],
          language: recommendationData.language || requestData.language || 'en',
          currency: recommendationData.currency || requestData.currency || 'USD',
          planNote: recommendationData.planNote || '',
          currencyConversion: recommendationData.currencyConversion || null,
          budgetSummary: {
            stay: recommendationData.budgetSummary?.stay || '500',
            food: recommendationData.budgetSummary?.food || '300',
            fuel: recommendationData.budgetSummary?.fuel || '200',
            miscellaneous: recommendationData.budgetSummary?.miscellaneous || '100',
            total: recommendationData.budgetSummary?.total || '1100'
          },
          coveredDestinations: Array.isArray(recommendationData.coveredDestinations) ? recommendationData.coveredDestinations : [],
          plan: Array.isArray(recommendationData.plan) ? recommendationData.plan : (Array.isArray(recommendationData.dailyItinerary) ? recommendationData.dailyItinerary : []),
          referenceBlogs: Array.isArray(recommendationData.referenceBlogs) ? recommendationData.referenceBlogs : []
        };
        
        return (
          <ItineraryPreview
            itinerary={itineraryData}
            onRegenerate={() => {}}
            requestData={requestData}
            isHistoryView={true}
          />
        );
      
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-white/60 max-w-md mx-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Unsupported Recommendation Type</h2>
                <p className="text-slate-600 mb-6">This recommendation type ({rec.recommendationType}) is not supported for sharing.</p>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg text-left">
                  <h3 className="font-semibold text-slate-700 mb-2">Debug Info:</h3>
                  <p className="text-xs text-slate-600">Type: {rec.recommendationType}</p>
                  <p className="text-xs text-slate-600">Destination: {rec.destination}</p>
                  <p className="text-xs text-slate-600">Has Response Data: {rec.responseData ? 'Yes' : 'No'}</p>
                  {rec.responseData && (
                    <details className="mt-2">
                      <summary className="text-xs text-slate-600 cursor-pointer">View Raw Data</summary>
                      <pre className="text-xs text-slate-600 overflow-auto max-h-40 mt-2">
                        {JSON.stringify(rec.responseData, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <button
                  onClick={handleBackToHome}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-violet-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        );
    }
  }

  function renderUnifiedTrip(trip: UnifiedTrip) {
    // Create a properly structured unified plan from the API response
    const unifiedPlan = {
      itinerary: trip.itinerary || null,
      packingList: trip.packingList || null,
      foodRecommendations: trip.foodRecommendations || null,
      appRecommendations: trip.appRecommendations || null,
      musicRecommendations: trip.musicRecommendations || null,
      lingoRecommendations: trip.lingoRecommendations || null
    };

    // Create loading status - all done since this is from history
    const loadingStatus = {
      itinerary: 'done' as const,
      packing: 'done' as const,
      apps: 'done' as const,
      food: 'done' as const,
      music: 'done' as const,
      lingo: 'done' as const
    };

    // No errors since this is from history
    const stepErrors = {};

    return (
      <UnifiedResultPreview
        plan={unifiedPlan}
        loadingStatus={loadingStatus}
        stepErrors={stepErrors}
        onPlanNew={handleBackToHome}
        onRegenerate={() => {}}
        onRegenerateStep={() => {}}
        onCancel={() => {}}
        onCancelStep={() => {}}
        onTabChangeScrollToTop={() => {}}
        itineraryStreamedText=""
        questionnaireData={trip.questionnaireData}
        isHistoryView={true}
      />
    );
  }


  // Main component return

  // Render individual recommendation
  if (recommendation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center">
            <button
              onClick={handleBackToHome}
              className="px-4 py-2 bg-white/60 text-slate-800 font-semibold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
            >
              ← Back to Home
            </button>
            
            {/* Share buttons */}
            {id && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center px-4 py-2 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-700 transition-all duration-300 shadow-md text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copy Link
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all duration-300 shadow-md text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  Share
                </button>
              </div>
            )}
          </div>
          {renderIndividualRecommendation(recommendation)}
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
  }

  // Render unified trip
  if (unifiedTrip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center">
            <button
              onClick={handleBackToHome}
              className="px-4 py-2 bg-white/60 text-slate-800 font-semibold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
            >
              ← Back to Home
            </button>
            
            {/* Share buttons */}
            {id && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center px-4 py-2 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-700 transition-all duration-300 shadow-md text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copy Link
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all duration-300 shadow-md text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  Share
                </button>
              </div>
            )}
          </div>
          {renderUnifiedTrip(unifiedTrip)}
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
  }

  return null;
};

export default ShareableRecommendation;
