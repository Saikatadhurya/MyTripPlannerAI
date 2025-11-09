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

  // Update page title based on the loaded recommendation or trip
  useEffect(() => {
    if (unifiedTrip) {
      // Use tripName if available, otherwise generate from destination
      const title = unifiedTrip.tripName || 
                   `Trip Plan to ${unifiedTrip.destination || 'Your Destination'}`;
      document.title = `${title} | Plan My Trip AI`;
    } else if (recommendation) {
      // Use title if available, otherwise generate from type and destination
      const typeName = recommendation.recommendationType.charAt(0).toUpperCase() + 
                      recommendation.recommendationType.slice(1);
      const title = recommendation.title || 
                   `${typeName} Recommendation for ${recommendation.destination || 'Your Destination'}`;
      document.title = `${title} | Plan My Trip AI`;
    } else if (loading) {
      document.title = 'Loading... | Plan My Trip AI';
    } else if (error) {
      document.title = 'Recommendation Not Found | Plan My Trip AI';
    }
    
    // Cleanup: reset to default title when component unmounts
    return () => {
      document.title = 'Plan My Trip | Free AI Trip Planner - Create Perfect Travel Itinerary in Minutes';
    };
  }, [unifiedTrip, recommendation, loading, error]);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleStartItineraryPlanner = () => {
    navigate('/itinerary');
  };

  const handleStartPackingAssistant = () => {
    navigate('/packing');
  };

  const handleStartFoodFinder = () => {
    navigate('/food');
  };

  const handleStartAppFinder = () => {
    navigate('/apps');
  };

  const handleStartMusicFinder = () => {
    navigate('/music');
  };

  const handleStartLingoFinder = () => {
    navigate('/lingo');
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
            onRegenerate={handleStartAppFinder}
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
            onRegenerate={handleStartFoodFinder}
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
            onRegenerate={handleStartMusicFinder}
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
            onRegenerate={handleStartLingoFinder}
            requestData={requestData}
            isHistoryView={true}
          />
        );
      
      case 'packing':
        // Ensure the packing data has the expected structure with proper fallbacks
        const packingData = {
          destination: recommendationData.destination || rec.destination || 'Unknown Destination',
          maleClothing: Array.isArray(recommendationData.maleClothing) ? recommendationData.maleClothing : [],
          femaleClothing: Array.isArray(recommendationData.femaleClothing) ? recommendationData.femaleClothing : [],
          clothingAndFootwear: Array.isArray(recommendationData.clothingAndFootwear) ? recommendationData.clothingAndFootwear : undefined, // For backward compatibility
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
            onRegenerate={handleStartPackingAssistant}
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
            onRegenerate={handleStartItineraryPlanner}
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
        onRegenerate={handleStartItineraryPlanner}
        onRegenerateStep={(step) => {
          // Navigate to appropriate form based on step
          switch (step) {
            case 'itinerary':
              handleStartItineraryPlanner();
              break;
            case 'packing':
              handleStartPackingAssistant();
              break;
            case 'food':
              handleStartFoodFinder();
              break;
            case 'apps':
              handleStartAppFinder();
              break;
            case 'music':
              handleStartMusicFinder();
              break;
            case 'lingo':
              handleStartLingoFinder();
              break;
          }
        }}
        onCancel={() => {}}
        onCancelStep={() => {}}
        onTabChangeScrollToTop={() => {
          // Scroll to top when tab changes in shareable view
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }}
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          {/* Share buttons - Positioned at top, matching result pages */}
          {id && (
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 no-print">
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          {/* Share buttons - Positioned at top, matching result pages */}
          {id && (
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 no-print">
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
