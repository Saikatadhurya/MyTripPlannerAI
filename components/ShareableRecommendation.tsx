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

const ShareableRecommendation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<RecommendationHistory | null>(null);
  const [unifiedTrip, setUnifiedTrip] = useState<UnifiedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🎯 ShareableRecommendation component mounted');
  console.log('🔍 URL params:', { id });
  console.log('🌐 Current URL:', window.location.href);
  console.log('📍 Current pathname:', window.location.pathname);

  useEffect(() => {
    const loadRecommendation = async () => {
      console.log('🚀 Starting loadRecommendation with ID:', id);
      
      if (!id) {
        console.log('❌ No ID provided');
        setError('Invalid recommendation ID');
        setLoading(false);
        return;
      }

      try {
        console.log('⏳ Setting loading to true');
        setLoading(true);
        setError(null);
        
        // Try to load as individual recommendation first
        try {
          console.log('🔍 Attempting to fetch individual recommendation with ID:', id);
          const individualRec = await historyService.getPublicRecommendationById(id);
          console.log('📊 Individual recommendation API response:', {
            success: !!individualRec,
            hasData: !!individualRec,
            type: individualRec?.recommendationType,
            destination: individualRec?.destination,
            hasResponseData: !!individualRec?.responseData,
            responseDataKeys: individualRec?.responseData ? Object.keys(individualRec.responseData) : 'none',
            responseDataStructure: individualRec?.responseData
          });
          
          if (individualRec) {
            console.log('✅ Individual recommendation found, setting state');
            setRecommendation(individualRec);
            setLoading(false);
            return;
          }
        } catch (individualError) {
          console.log('❌ Individual recommendation fetch failed:', individualError);
        }

        // If not found as individual, try as unified trip
        try {
          console.log('🔍 Attempting to fetch unified trip with tripId:', id);
          const trip = await historyService.getPublicUnifiedTripById(id);
          console.log('📊 Unified trip API response:', {
            success: !!trip,
            hasData: !!trip,
            tripId: trip?.tripId,
            tripName: trip?.tripName,
            destination: trip?.destination,
            hasItinerary: !!trip?.itinerary,
            hasPackingList: !!trip?.packingList,
            hasFoodRecommendations: !!trip?.foodRecommendations,
            hasAppRecommendations: !!trip?.appRecommendations,
            hasMusicRecommendations: !!trip?.musicRecommendations,
            hasLingoRecommendations: !!trip?.lingoRecommendations,
            recommendationTypes: trip?.recommendation_types,
            recommendationCount: trip?.recommendation_count,
            fullTripData: trip
          });
          
          if (trip) {
            console.log('✅ Unified trip found, setting state');
            setUnifiedTrip(trip);
            setLoading(false);
            return;
          }
        } catch (unifiedError) {
          console.log('❌ Unified trip fetch failed:', unifiedError);
        }

        setError('Recommendation not found');
        setLoading(false);
      } catch (err) {
        console.error('Error loading recommendation:', err);
        setError('Failed to load recommendation');
        setLoading(false);
      }
    };

    loadRecommendation();
  }, [id]);

  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    console.log('⏳ ShareableRecommendation: Loading state');
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
    console.log('Rendering individual recommendation:', {
      type: rec.recommendationType,
      hasResponseData: !!rec.responseData,
      responseDataKeys: rec.responseData ? Object.keys(rec.responseData) : 'null/undefined',
      responseData: rec.responseData
    });

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

    console.log('🔍 Processing individual recommendation data:', {
      recommendationType: rec.recommendationType,
      hasResponseData: !!rec.responseData,
      responseDataType: typeof rec.responseData,
      responseDataKeys: rec.responseData ? Object.keys(rec.responseData) : 'none',
      recommendationData,
      requestData
    });

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
        
        console.log('📱 Apps data structure:', {
          destination: appsData.destination,
          transportAndTravel: appsData.transportAndTravel.length,
          stayAndLiving: appsData.stayAndLiving.length,
          foodAndDining: appsData.foodAndDining.length,
          entertainmentAndLeisure: appsData.entertainmentAndLeisure.length,
          shoppingAndEssentials: appsData.shoppingAndEssentials.length,
          explorationAndTours: appsData.explorationAndTours.length,
          utilitiesAndSafety: appsData.utilitiesAndSafety.length,
          festivalsAndSeasonal: appsData.festivalsAndSeasonal.length
        });
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
        
        console.log('🎵 Music data structure:', {
          destination: musicData.destination,
          musicCategories: musicData.musicCategories.length,
          rawRecommendationData: recommendationData
        });
        
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
        
        console.log('🎒 Packing data structure:', {
          destination: packingData.destination,
          clothingAndFootwear: packingData.clothingAndFootwear.length,
          toiletriesAndPersonalCare: packingData.toiletriesAndPersonalCare.length,
          medicinesAndHealth: packingData.medicinesAndHealth.length,
          electronicsAndGear: packingData.electronicsAndGear.length,
          documentsAndMoney: packingData.documentsAndMoney.length,
          optionalComfortItems: packingData.optionalComfortItems.length,
          adventureClothing: packingData.adventureClothing.length,
          bagSuggestion: packingData.bagSuggestion,
          locallyAvailableItems: packingData.locallyAvailableItems.length,
          days: packingData.days,
          approximateTemperature: packingData.approximateTemperature,
          startDate: packingData.startDate,
          rawRecommendationData: recommendationData
        });
        
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
          startDate: recommendationData.startDate || requestData.startDate || '',
          days: recommendationData.days || requestData.days || 0,
          coveredDestinations: Array.isArray(recommendationData.coveredDestinations) ? recommendationData.coveredDestinations : [],
          dailyItinerary: Array.isArray(recommendationData.dailyItinerary) ? recommendationData.dailyItinerary : [],
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
        console.log('❌ Unsupported recommendation type:', rec.recommendationType);
        console.log('📊 Raw recommendation data for debugging:', {
          recommendationType: rec.recommendationType,
          destination: rec.destination,
          hasResponseData: !!rec.responseData,
          responseDataKeys: rec.responseData ? Object.keys(rec.responseData) : 'none',
          responseDataStructure: rec.responseData
        });
        
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
    console.log('Rendering unified trip:', {
      tripId: trip.tripId,
      hasQuestionnaireData: !!trip.questionnaireData,
      questionnaireDataKeys: trip.questionnaireData ? Object.keys(trip.questionnaireData) : 'null/undefined',
      hasItinerary: !!trip.itinerary,
      hasPackingList: !!trip.packingList,
      hasFoodRecommendations: !!trip.foodRecommendations,
      hasAppRecommendations: !!trip.appRecommendations,
      hasMusicRecommendations: !!trip.musicRecommendations,
      hasLingoRecommendations: !!trip.lingoRecommendations
    });

    // Create a properly structured unified plan from the API response
    const unifiedPlan = {
      tripId: trip.tripId,
      tripName: trip.tripName,
      destination: trip.destination,
      language: trip.language,
      created_at: trip.created_at,
      
      // Individual recommendation components
      itinerary: trip.itinerary || null,
      packingList: trip.packingList || null,
      foodRecommendations: trip.foodRecommendations || null,
      appRecommendations: trip.appRecommendations || null,
      musicRecommendations: trip.musicRecommendations || null,
      lingoRecommendations: trip.lingoRecommendations || null,
      
      // Metadata
      recommendation_types: trip.recommendation_types || [],
      recommendation_count: trip.recommendation_count || 0
    };

    return (
      <UnifiedResultPreview
        plan={unifiedPlan}
        loadingStatus={null}
        stepErrors={null}
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
  console.log('🎨 Rendering ShareableRecommendation component');
  console.log('📊 Current state:', { 
    loading, 
    error, 
    hasRecommendation: !!recommendation, 
    hasUnifiedTrip: !!unifiedTrip,
    recommendationType: recommendation?.recommendationType,
    tripId: unifiedTrip?.tripId,
    tripName: unifiedTrip?.tripName
  });

  // Render individual recommendation
  if (recommendation) {
    console.log('🔄 Rendering individual recommendation');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <button
            onClick={handleBackToHome}
            className="mb-6 px-4 py-2 bg-white/60 text-slate-800 font-semibold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
          >
            ← Back to Home
          </button>
          {renderIndividualRecommendation(recommendation)}
        </div>
      </div>
    );
  }

  // Render unified trip
  if (unifiedTrip) {
    console.log('🔄 Rendering unified trip');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <button
            onClick={handleBackToHome}
            className="mb-6 px-4 py-2 bg-white/60 text-slate-800 font-semibold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
          >
            ← Back to Home
          </button>
          {renderUnifiedTrip(unifiedTrip)}
        </div>
      </div>
    );
  }

  console.log('❌ No recommendation or unified trip to render');
  return null;
};

export default ShareableRecommendation;
