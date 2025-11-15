import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { generateItinerary } from '../services/geminiService';
import { generatePackingList } from '../services/packingService';
import { generateFoodRecommendations } from '../services/foodService';
import { generateAppRecommendations } from '../services/appFinderService';
import { generateMusicRecommendations } from '../services/musicService';
import { generateLingoGuide } from '../services/lingoService';
import { UnifiedPlan, UnifiedPlanLoadingStatus } from '../types';
import { authService, User } from '../services/authService';
import { useSaveRecommendation } from '../hooks/useSaveRecommendation';

const ShareableRecommendation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<RecommendationHistory | null>(null);
  const [unifiedTrip, setUnifiedTrip] = useState<UnifiedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // State for unified plan regeneration
  const [unifiedPlan, setUnifiedPlan] = useState<UnifiedPlan>({
    itinerary: null,
    packingList: null,
    foodRecommendations: null,
    appRecommendations: null,
    musicRecommendations: null,
    lingoRecommendations: null,
  });
  const [unifiedPlanLoadingStatus, setUnifiedPlanLoadingStatus] = useState<UnifiedPlanLoadingStatus>({
    itinerary: 'done',
    packing: 'done',
    food: 'done',
    apps: 'done',
    music: 'done',
    lingo: 'done',
  });
  const [unifiedStepErrors, setUnifiedStepErrors] = useState<Partial<Record<keyof UnifiedPlanLoadingStatus, string>>>({});
  const [user, setUser] = useState<User | null>(null);
  const cancellationFlags = useRef<Partial<Record<keyof UnifiedPlanLoadingStatus, boolean>>>({});
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [ownershipChecked, setOwnershipChecked] = useState<boolean>(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const savedTypesRef = useRef<Set<string>>(new Set());
  const isSavingRef = useRef<boolean>(false);
  const savedTripIdRef = useRef<string | null>(null);
  
  const { 
    saveUnifiedTripRecommendations,
    saveItineraryRecommendation,
    savePackingRecommendation,
    saveFoodRecommendation,
    saveAppRecommendation,
    saveMusicRecommendation,
    saveLingoRecommendation
  } = useSaveRecommendation();

  // Sync savedTripIdRef with savedTripId state
  useEffect(() => {
    savedTripIdRef.current = savedTripId;
  }, [savedTripId]);

  // Load user on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Check ownership when user, trip/recommendation, or id changes
  useEffect(() => {
    if (!id) {
      setIsOwner(false);
      setOwnershipChecked(true);
      return;
    }
    
    // Wait for trip/recommendation to be loaded
    if (!unifiedTrip && !recommendation) {
      setIsOwner(false);
      setOwnershipChecked(false);
      return;
    }
    
    const checkOwnership = async () => {
      // Always get fresh user from authService to ensure we have the latest
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        setIsOwner(false);
        setOwnershipChecked(true);
        return;
      }
      
      try {
        let owns = false;
        if (unifiedTrip) {
          // For unified trips, use the tripId from the trip object, or fall back to id
          // The backend accepts either trip_id or id, so either should work
          const tripIdToCheck = unifiedTrip.tripId || id;
          owns = await historyService.checkUnifiedTripOwnership(tripIdToCheck);
        } else if (recommendation) {
          owns = await historyService.checkRecommendationOwnership(id);
        }
        setIsOwner(owns);
        setOwnershipChecked(true);
      } catch (error: any) {
        // Log detailed error for debugging
        console.error('Error checking ownership:', {
          error,
          status: error?.response?.status,
          message: error?.message,
          unifiedTrip: !!unifiedTrip,
          recommendation: !!recommendation,
          id,
          tripId: unifiedTrip?.tripId
        });
        setIsOwner(false);
        setOwnershipChecked(true);
      }
    };
    
    checkOwnership();
  }, [user, unifiedTrip, recommendation, id]);

  // Save regenerated unified plan to history (only if user is owner and signed in)
  useEffect(() => {
    if (!isOwner || !user || !unifiedTrip?.questionnaireData || isSavingRef.current) return;
    if (!unifiedPlan.itinerary) return; // Don't save until at least itinerary is generated

    const availableTypes: Array<{ key: string; saver: () => Promise<string | null> }> = [];
    const data = unifiedTrip.questionnaireData;
    const destination = data.destination;
    const language = data.language || 'en';
    const tripName = `${destination} Trip - ${new Date().toLocaleDateString()}`;
    const currentTripId = savedTripIdRef.current;

    if (unifiedPlan.itinerary && !savedTypesRef.current.has('itinerary')) {
      availableTypes.push({
        key: 'itinerary',
        saver: async () => {
          return await saveItineraryRecommendation(
            data,
            unifiedPlan.itinerary,
            destination,
            language,
            data,
            currentTripId || undefined,
            tripName
          );
        }
      });
    }
    if (unifiedPlan.packingList && !savedTypesRef.current.has('packing')) {
      availableTypes.push({
        key: 'packing',
        saver: async () => {
          return await savePackingRecommendation(
            data,
            unifiedPlan.packingList,
            destination,
            language,
            data,
            currentTripId || undefined,
            tripName
          );
        }
      });
    }
    if (unifiedPlan.foodRecommendations && !savedTypesRef.current.has('food')) {
      availableTypes.push({
        key: 'food',
        saver: async () => {
          return await saveFoodRecommendation(
            data,
            unifiedPlan.foodRecommendations,
            destination,
            language,
            data,
            currentTripId || undefined,
            tripName
          );
        }
      });
    }
    if (unifiedPlan.appRecommendations && !savedTypesRef.current.has('apps')) {
      availableTypes.push({
        key: 'apps',
        saver: async () => {
          return await saveAppRecommendation(
            data,
            unifiedPlan.appRecommendations,
            destination,
            language,
            data,
            currentTripId || undefined,
            tripName
          );
        }
      });
    }
    if (unifiedPlan.musicRecommendations && !savedTypesRef.current.has('music')) {
      availableTypes.push({
        key: 'music',
        saver: async () => {
          return await saveMusicRecommendation(
            data,
            unifiedPlan.musicRecommendations,
            destination,
            language,
            data,
            currentTripId || undefined,
            tripName
          );
        }
      });
    }
    if (unifiedPlan.lingoRecommendations && !savedTypesRef.current.has('lingo')) {
      availableTypes.push({
        key: 'lingo',
        saver: async () => {
          return await saveLingoRecommendation(
            data,
            unifiedPlan.lingoRecommendations,
            destination,
            language,
            data,
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
            const responseData = (unifiedPlan as any)[type === 'packing' ? 'packingList' : type === 'apps' ? 'appRecommendations' : type === 'food' ? 'foodRecommendations' : type === 'music' ? 'musicRecommendations' : type === 'lingo' ? 'lingoRecommendations' : 'itinerary'];
            return { type, requestData: data, responseData };
          });
          const saveResult = await saveUnifiedTripRecommendations(
            recs,
            destination,
            language,
            data,
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
  }, [unifiedPlan, unifiedTrip, isOwner, user, saveUnifiedTripRecommendations, saveItineraryRecommendation, savePackingRecommendation, saveFoodRecommendation, saveAppRecommendation, saveMusicRecommendation, saveLingoRecommendation]);

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
            // Ownership will be checked by the separate useEffect when user is loaded
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
            // Initialize unified plan state from trip data
            setUnifiedPlan({
              itinerary: trip.itinerary || null,
              packingList: trip.packingList || null,
              foodRecommendations: trip.foodRecommendations || null,
              appRecommendations: trip.appRecommendations || null,
              musicRecommendations: trip.musicRecommendations || null,
              lingoRecommendations: trip.lingoRecommendations || null,
            });
            
            setLoading(false);
            // Ownership will be checked by the separate useEffect when user is loaded
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

  // Regeneration handlers for unified trip
  const stepToPlanKey = (step: keyof UnifiedPlanLoadingStatus): keyof UnifiedPlan => {
    const mapping: Record<keyof UnifiedPlanLoadingStatus, keyof UnifiedPlan> = {
      itinerary: 'itinerary',
      packing: 'packingList',
      food: 'foodRecommendations',
      apps: 'appRecommendations',
      music: 'musicRecommendations',
      lingo: 'lingoRecommendations',
    };
    return mapping[step];
  };

  const handleRegenerateUnifiedPlanStep = useCallback(async (step: keyof UnifiedPlanLoadingStatus) => {
    if (!user) {
      setToast({ message: 'Please sign in to regenerate plans', type: 'error' });
      return;
    }
    
    if (!isOwner) {
      setToast({ message: 'You can only regenerate your own plans', type: 'error' });
      return;
    }
    
    if (!unifiedTrip?.questionnaireData) {
      setToast({ message: 'Cannot regenerate: no questionnaire data available', type: 'error' });
      return;
    }

    const data = unifiedTrip.questionnaireData;
    const planKey = stepToPlanKey(step);

    // If itinerary is regenerated, all dependent steps must be regenerated too
    if (step === 'itinerary') {
      // Clear all plan data
      setUnifiedPlan({
        itinerary: null,
        packingList: null,
        foodRecommendations: null,
        appRecommendations: null,
        musicRecommendations: null,
        lingoRecommendations: null,
      });
      // Reset cancellation flags
      cancellationFlags.current = {};
      // Clear errors
      setUnifiedStepErrors({});
      // Clear saved types so they get saved again after regeneration
      savedTypesRef.current.clear();
      // Set all to loading
      setUnifiedPlanLoadingStatus({
        itinerary: 'loading',
        packing: 'pending',
        food: 'pending',
        apps: 'pending',
        music: 'pending',
        lingo: 'pending',
      });
    } else {
      // Clear old data for the step being regenerated
      setUnifiedPlan(prev => ({ ...prev, [planKey]: null }));
      setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'loading' }));
      setUnifiedStepErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[step];
        return newErrors;
      });
      // Clear saved type so it gets saved again after regeneration
      savedTypesRef.current.delete(step);
      cancellationFlags.current[step] = false;
    }

    try {
      let result: any = null;

      switch (step) {
        case 'itinerary':
          const { result: itineraryResult } = await generateItinerary(
            data.destination,
            data.startPoint,
            data.tripType,
            data.days,
            data.budget,
            data.vibe,
            data.persons,
            data.foodPreference,
            data.startDate,
            data.includeMedical,
            data.language,
            data.isRoundTrip,
            data.currency,
            () => {},
            user?.gemini_api_key,
            data.stops
          );
          result = itineraryResult;
          break;

        case 'packing':
          const { result: packingResult } = await generatePackingList(
            data,
            () => {},
            user?.gemini_api_key
          );
          result = packingResult;
          break;

        case 'food':
          const { result: foodResult } = await generateFoodRecommendations(
            data,
            () => {},
            user?.gemini_api_key
          );
          result = foodResult;
          break;

        case 'apps':
          const { result: appResult } = await generateAppRecommendations(
            data,
            () => {},
            user?.gemini_api_key
          );
          result = appResult;
          break;

        case 'music':
          const isMultiStop = data.coveredDestinations && data.coveredDestinations.length > 1;
          const musicData = {
            destination: data.destination,
            language: data.language,
            coveredDestinations: isMultiStop ? data.coveredDestinations : undefined,
          };
          const { result: musicResult } = await generateMusicRecommendations(
            musicData,
            () => {},
            user?.gemini_api_key
          );
          result = musicResult;
          break;

        case 'lingo':
          const isMultiStopLingo = data.coveredDestinations && data.coveredDestinations.length > 1;
          const lingoData = {
            destination: data.destination,
            language: data.language,
            coveredDestinations: isMultiStopLingo ? data.coveredDestinations : undefined,
          };
          const { result: lingoResult } = await generateLingoGuide(
            lingoData,
            () => {},
            user?.gemini_api_key
          );
          result = lingoResult;
          break;
      }

      if (result && !cancellationFlags.current[step]) {
        setUnifiedPlan(prev => ({ ...prev, [planKey]: result }));
        setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'done' }));
      } else if (cancellationFlags.current[step]) {
        setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'cancelled' }));
      }
    } catch (error: any) {
      if (!cancellationFlags.current[step]) {
        const errorMessage = error?.message || 'An unknown error occurred';
        setUnifiedStepErrors(prev => ({ ...prev, [step]: errorMessage }));
        setUnifiedPlanLoadingStatus(prev => ({ ...prev, [step]: 'error' }));
      }
    }
  }, [unifiedTrip, user]);

  const handleRegenerateUnifiedPlan = useCallback(() => {
    if (!user) {
      setToast({ message: 'Please sign in to regenerate plans', type: 'error' });
      return;
    }
    
    if (!isOwner) {
      setToast({ message: 'You can only regenerate your own plans', type: 'error' });
      return;
    }
    
    if (!unifiedTrip?.questionnaireData) {
      setToast({ message: 'Cannot regenerate: no questionnaire data available', type: 'error' });
      return;
    }

    // Reset all steps to pending
    setUnifiedPlan({
      itinerary: null,
      packingList: null,
      foodRecommendations: null,
      appRecommendations: null,
      musicRecommendations: null,
      lingoRecommendations: null,
    });
    setUnifiedPlanLoadingStatus({
      itinerary: 'pending',
      packing: 'pending',
      food: 'pending',
      apps: 'pending',
      music: 'pending',
      lingo: 'pending',
    });
    setUnifiedStepErrors({});
    cancellationFlags.current = {};
    // Clear saved types so they get saved again after regeneration
    savedTypesRef.current.clear();

    // Start with itinerary
    handleRegenerateUnifiedPlanStep('itinerary');
  }, [unifiedTrip, handleRegenerateUnifiedPlanStep]);

  const handleCancelUnifiedPlanStep = useCallback((step: keyof UnifiedPlanLoadingStatus) => {
    cancellationFlags.current[step] = true;
  }, []);

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
    // Use the state-based unified plan (which gets updated during regeneration)
    // Merge: use unifiedPlan values if they exist (regenerated), otherwise use trip data
    const currentPlan: UnifiedPlan = {
      itinerary: unifiedPlan.itinerary ?? trip.itinerary ?? null,
      packingList: unifiedPlan.packingList ?? trip.packingList ?? null,
      foodRecommendations: unifiedPlan.foodRecommendations ?? trip.foodRecommendations ?? null,
      appRecommendations: unifiedPlan.appRecommendations ?? trip.appRecommendations ?? null,
      musicRecommendations: unifiedPlan.musicRecommendations ?? trip.musicRecommendations ?? null,
      lingoRecommendations: unifiedPlan.lingoRecommendations ?? trip.lingoRecommendations ?? null,
    };

    return (
      <UnifiedResultPreview
        plan={currentPlan}
        loadingStatus={unifiedPlanLoadingStatus}
        stepErrors={unifiedStepErrors}
        onPlanNew={handleBackToHome}
        onRegenerate={isOwner && user ? handleRegenerateUnifiedPlan : () => {}}
        onRegenerateStep={isOwner && user ? handleRegenerateUnifiedPlanStep : () => {}}
        onCancel={() => {}}
        onCancelStep={handleCancelUnifiedPlanStep}
        onTabChangeScrollToTop={() => {
          // Scroll to top when tab changes in shareable view
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }}
        itineraryStreamedText=""
        questionnaireData={trip.questionnaireData}
        isHistoryView={true}
        canRegenerate={isOwner && user}
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
