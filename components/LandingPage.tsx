import React, { useState, useEffect, useRef } from 'react';
import { PopularDestination } from '../types';
import { User } from '../services/authService';
import TestimonialsCarousel from './TestimonialsCarousel';
import BlogCarousel from './BlogCarousel';

interface LandingPageProps {
  user: User | null;
  onPlanUnifiedTrip: (destination?: string) => void;
  onPlanItinerary: () => void;
  onStartPacking: () => void;
  onStartFoodFinder: () => void;
  onStartAppFinder: () => void;
  onStartMusicFinder: () => void;
  onStartLingoFinder: () => void;
  onStartWeekendExplorer: () => void;
  onOpenAuthModal: () => void;
  onGoToBlog: () => void;
  onViewHistory: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ user, onPlanUnifiedTrip, onPlanItinerary, onStartPacking, onStartFoodFinder, onStartAppFinder, onStartMusicFinder, onStartLingoFinder, onStartWeekendExplorer, onOpenAuthModal, onGoToBlog, onViewHistory }) => {
  const [destinations, setDestinations] = useState<PopularDestination[]>([]);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [formAnimationState, setFormAnimationState] = useState({
    typing: false,
    currentField: 0,
    filledFields: [] as number[],
    showSuggestions: false,
    isLoading: false,
    suggestions: [] as Array<{ name: string; type: string }>,
  });

  // Map of destination names to share links
  const shareLinks: { [key: string]: string } = {
    'Goa, India': '/share/2cf3d8b0-ca4a-41ae-8f63-b0c6372092b1',
    'Rajasthan, India': '/share/6a8d939c-21b6-494c-8fb0-473bd59a1ed9',
    'Dubai, UAE': '/share/f2300726-8744-4f8b-a689-cfcd65a1ee0f',
    'Bangkok, Thailand': '/share/c56afa4b-fd73-4557-8f63-67e1027726fd',
  };

  // Destinations to exclude from display
  const excludedDestinations = ['Singapore', 'Sri Lanka'];

  const destinationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await fetch('/data/destinations.json', {
          cache: 'force-cache',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: PopularDestination[] = await response.json();
        setDestinations(data);
      } catch (error) {
        console.error("Failed to fetch destinations:", error);
      }
    };
    
    // Load destinations immediately to ensure all 8 are available
    fetchDestinations();
  }, []);

  // Auto-advance tutorial steps - different timing for each step
  useEffect(() => {
    if (!showTutorial) return;
    
    const stepTimings = [6000, 15000, 15000, 8000]; // Step 1: 6s, Step 2: 15s, Step 3: 15s, Step 4: 8s
    
    const timeout = setTimeout(() => {
      setCurrentTutorialStep((prev) => {
        const nextStep = (prev + 1) % 4;
        // Restart the timer with the new step's timing
        return nextStep;
      });
    }, stepTimings[currentTutorialStep]);

    return () => clearTimeout(timeout);
  }, [showTutorial, currentTutorialStep]);

  // Form animation logic - enhanced to match Questionnaire
  useEffect(() => {
    if (!showTutorial || currentTutorialStep !== 1) {
      setFormAnimationState({ 
        typing: false, 
        currentField: 0, 
        filledFields: [],
        showSuggestions: false,
        isLoading: false,
        suggestions: [],
      });
      return;
    }

    const fields = [
      { 
        name: 'Destination', 
        value: 'Paris, France', 
        delay: 500,
        showSuggestions: true,
        suggestions: [
          { name: 'Paris', type: 'City' },
          { name: 'Paris, France', type: 'City' },
          { name: 'Paris, Île-de-France', type: 'Region' },
        ],
      },
      { name: 'Start Date', value: '2025-06-15', delay: 4000, showSuggestions: false },
      { name: 'End Date', value: '2025-06-22', delay: 6000, showSuggestions: false },
      { name: 'Budget', value: 'Midrange', delay: 8000, showSuggestions: false },
      { name: 'Travelers', value: '2', delay: 10000, showSuggestions: false },
    ];

    let fieldIndex = 0;
    const animateField = () => {
      if (fieldIndex >= fields.length) {
        // Reset after showing all fields
        setTimeout(() => {
          setFormAnimationState({ 
            typing: false, 
            currentField: 0, 
            filledFields: [],
            showSuggestions: false,
            isLoading: false,
            suggestions: [],
          });
          fieldIndex = 0;
          setTimeout(animateField, 2000);
        }, 3000);
        return;
      }

      const field = fields[fieldIndex];
      
      // Show loading state for destination field
      if (fieldIndex === 0) {
        setFormAnimationState({
          typing: false,
          currentField: fieldIndex,
          filledFields: fields.slice(0, fieldIndex).map((_, i) => i),
          showSuggestions: false,
          isLoading: true,
          suggestions: [],
        });

        // After loading, show suggestions
        setTimeout(() => {
          setFormAnimationState((prev) => ({
            ...prev,
            isLoading: false,
            showSuggestions: true,
            suggestions: field.suggestions || [],
          }));
        }, 1000);

        // Then start typing
        setTimeout(() => {
          setFormAnimationState((prev) => ({
            ...prev,
            typing: true,
            showSuggestions: false,
          }));
        }, 2500);
      } else {
        setFormAnimationState({
          typing: true,
          currentField: fieldIndex,
          filledFields: fields.slice(0, fieldIndex).map((_, i) => i),
          showSuggestions: false,
          isLoading: false,
          suggestions: [],
        });
      }

      // Mark field as filled after typing animation
      const typingDuration = fieldIndex === 0 ? 2000 : 1500; // Longer for destination field
      setTimeout(() => {
        setFormAnimationState((prev) => ({
          ...prev,
          typing: false,
          filledFields: [...prev.filledFields, fieldIndex],
          showSuggestions: false,
          isLoading: false,
        }));
        fieldIndex++;
        // Move to next field after a short delay
        setTimeout(animateField, 1000);
      }, typingDuration);
    };

    const timer = setTimeout(animateField, 1000);
    return () => clearTimeout(timer);
  }, [currentTutorialStep, showTutorial]);

  const colorClasses = {
    blue: {
      iconBg: 'bg-blue-100', iconText: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      hoverShadow: 'hover:shadow-blue-500/30',
      hoverBorder: 'hover:border-blue-400/80',
      hoverGradient: 'group-hover:from-blue-500/5 group-hover:via-blue-400/5 group-hover:to-blue-600/5',
    },
    violet: {
      iconBg: 'bg-violet-100', iconText: 'text-violet-600',
      button: 'bg-violet-600 hover:bg-violet-700 text-white',
      hoverShadow: 'hover:shadow-violet-500/30',
      hoverBorder: 'hover:border-violet-400/80',
      hoverGradient: 'group-hover:from-violet-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5',
    },
    orange: {
      iconBg: 'bg-orange-100', iconText: 'text-orange-500',
      button: 'bg-orange-500 hover:bg-orange-600 text-white',
      hoverShadow: 'hover:shadow-orange-500/30',
      hoverBorder: 'hover:border-orange-400/80',
      hoverGradient: 'group-hover:from-orange-500/5 group-hover:via-orange-400/5 group-hover:to-amber-500/5',
    },
    teal: {
      iconBg: 'bg-teal-100', iconText: 'text-teal-500',
      button: 'bg-teal-500 hover:bg-teal-600 text-white',
      hoverShadow: 'hover:shadow-teal-500/30',
      hoverBorder: 'hover:border-teal-400/80',
      hoverGradient: 'group-hover:from-teal-500/5 group-hover:via-cyan-500/5 group-hover:to-teal-600/5',
    },
    fuchsia: {
      iconBg: 'bg-fuchsia-100', iconText: 'text-fuchsia-500',
      button: 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white',
      hoverShadow: 'hover:shadow-fuchsia-500/30',
      hoverBorder: 'hover:border-fuchsia-400/80',
      hoverGradient: 'group-hover:from-fuchsia-500/5 group-hover:via-pink-500/5 group-hover:to-rose-500/5',
    },
    sky: {
      iconBg: 'bg-sky-100', iconText: 'text-sky-600',
      button: 'bg-sky-500 hover:bg-sky-600 text-white',
      hoverShadow: 'hover:shadow-sky-500/30',
      hoverBorder: 'hover:border-sky-400/80',
      hoverGradient: 'group-hover:from-sky-500/5 group-hover:via-blue-400/5 group-hover:to-cyan-500/5',
    },
  };
  
  const miniApps = [
    {
      id: 'itinerary_planner',
      title: 'Itinerary',
      description: 'Get a detailed, step-by-step plan',
      onClick: onPlanItinerary,
      color: 'blue' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      buttonText: 'Plan Itinerary',
    },
    {
      id: 'packing',
      title: 'Packing',
      description: 'AI-powered packing tailored for your trip',
      onClick: onStartPacking,
      color: 'violet' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2zm3-3a1 1 0 011-1h2a1 1 0 110 2H10a1 1 0 01-1-1z" /></svg>,
      buttonText: 'Pack My Bag',
    },
    {
      id: 'food',
      title: 'Food',
      description: 'Discover authentic local cuisine',
      onClick: onStartFoodFinder,
      color: 'orange' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      buttonText: 'Find My Feast',
    },
    {
      id: 'apps',
      title: 'Apps',
      description: 'Find essential local apps for your trip',
      onClick: onStartAppFinder,
      color: 'teal' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
      buttonText: 'Find My Apps',
    },
    {
      id: 'music',
      title: 'Music',
      description: 'Discover the soundtrack of your travels',
      onClick: onStartMusicFinder,
      color: 'fuchsia' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      buttonText: 'Discover Music',
    },
    {
      id: 'lingo',
      title: 'Language',
      description: 'Learn essential phrases for your trip',
      onClick: onStartLingoFinder,
      color: 'sky' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      buttonText: 'Get Phrases',
    },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <style>{`
        @keyframes buttonPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7), 0 0 20px rgba(139, 92, 246, 0.5);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 0 10px rgba(139, 92, 246, 0), 0 0 30px rgba(139, 92, 246, 0.8);
          }
        }
        @keyframes buttonFlash {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
        }
        @keyframes buttonShine {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .start-planning-btn {
          animation: buttonPulse 2s ease-in-out infinite, buttonFlash 3s ease-in-out infinite;
          background: linear-gradient(90deg, #7c3aed 0%, #9333ea 50%, #7c3aed 100%);
          background-size: 200% auto;
        }
        .start-planning-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: buttonShine 3s infinite;
        }
        .start-planning-btn:hover {
          animation: buttonPulse 1s ease-in-out infinite, buttonFlash 2s ease-in-out infinite;
        }
        @keyframes tutorialFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes tutorialPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
          }
        }
        @keyframes tutorialSlideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes tutorialHighlight {
          0%, 100% {
            border-color: rgba(139, 92, 246, 0.3);
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.3);
          }
          50% {
            border-color: rgba(139, 92, 246, 0.8);
            box-shadow: 0 0 0 8px rgba(139, 92, 246, 0.2);
          }
        }
        @keyframes typeWriter {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }
        @keyframes fieldFocus {
          0%, 100% {
            border-color: rgba(139, 92, 246, 0.3);
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.2);
          }
          50% {
            border-color: rgba(139, 92, 246, 1);
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.3);
          }
        }
        @keyframes checkmark {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes formSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        @keyframes phoneSlideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .mobile-phone-frame {
          animation: phoneSlideIn 0.6s ease-out;
        }
        .tutorial-step {
          animation: tutorialFadeIn 0.6s ease-out;
        }
        .tutorial-highlight {
          animation: tutorialHighlight 2s ease-in-out infinite;
        }
        .tutorial-icon-pulse {
          animation: tutorialPulse 2s ease-in-out infinite;
        }
        .tutorial-content {
          animation: tutorialSlideIn 0.5s ease-out;
        }
        .form-field-focus {
          animation: fieldFocus 1.5s ease-in-out;
        }
        .form-field-filled {
          border-color: rgba(34, 197, 94, 0.5);
          background-color: rgba(34, 197, 94, 0.05);
        }
        .typing-animation {
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid rgba(139, 92, 246, 0.8);
          animation: typeWriter 1s steps(20, end), blink 0.75s step-end infinite;
        }
        @keyframes blink {
          from, to {
            border-color: transparent;
          }
          50% {
            border-color: rgba(139, 92, 246, 0.8);
          }
        }
        .checkmark-animation {
          animation: checkmark 0.5s ease-out;
        }
        .form-slide-up {
          animation: formSlideUp 0.4s ease-out;
        }
        .form-field-slide {
          animation: formSlideUp 0.5s ease-out;
        }
        .shimmer-effect {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-10 sm:space-y-12 lg:space-y-14">
        {/* Hero Section */}
        <section className="relative">
          {/* History Button */}
          {user && (
            <button
              onClick={onViewHistory}
              className="absolute top-0 right-0 sm:right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
              aria-label="View trip history"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 text-slate-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-slate-700 hidden sm:inline">History</span>
            </button>
          )}

          <div className="text-center space-y-5 sm:space-y-6 max-w-3xl mx-auto pt-4 sm:pt-6">
            {user && user.full_name && (
              <p className="text-sm sm:text-base text-slate-500 font-medium">
                Welcome back, {user.full_name}
              </p>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 leading-tight tracking-tight">
              Plan Your
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Perfect Trip
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
              AI-powered travel planning made simple
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-3">
              <button
                onClick={onPlanUnifiedTrip}
                className="start-planning-btn relative w-full sm:w-auto px-10 py-4 text-white font-bold text-lg rounded-xl shadow-2xl shadow-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/70 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-violet-400 focus:ring-offset-2 ring-4 ring-violet-400/30 overflow-hidden"
              >
                <span className="relative z-10">Start Planning</span>
              </button>
              <button
                onClick={onStartWeekendExplorer}
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
              >
                Weekend Trip
              </button>
            </div>
          </div>
        </section>

        {/* Mini Apps Section */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {miniApps.map((app, index) => {
              const colors = colorClasses[app.color];
              return (
                <button
                  key={app.id}
                  onClick={app.onClick}
                  className="group relative p-4 sm:p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${colors.iconBg} ${colors.iconText} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                      {app.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900">{app.title}</h3>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Animated Tutorial Section - Mobile App View */}
        {showTutorial && (
          <section className="tutorial-step bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-violet-200/50 shadow-xl">
            <div className="max-w-[280px] sm:max-w-sm mx-auto">
              {/* Modern Step Header - Outside Mobile Frame */}
              <div className="mb-4 sm:mb-6 text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center tutorial-icon-pulse shadow-lg shadow-violet-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      How to Use PlanMyTrip AI
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600">Interactive tutorial guide</p>
                  </div>
                </div>
                
                {/* Step Indicator */}
                {currentTutorialStep === 0 && (
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 backdrop-blur-sm rounded-full border border-violet-200 shadow-sm">
                    <span className="text-[10px] sm:text-xs font-bold text-violet-600 bg-violet-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">STEP 1</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">Get Started</span>
                  </div>
                )}
                {currentTutorialStep === 1 && (
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200 shadow-sm">
                    <span className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">STEP 2</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">Enter Your Details</span>
                  </div>
                )}
                {currentTutorialStep === 2 && (
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 backdrop-blur-sm rounded-full border border-orange-200 shadow-sm">
                    <span className="text-[10px] sm:text-xs font-bold text-orange-600 bg-orange-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">STEP 3</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">Explore Mini Apps</span>
                  </div>
                )}
                {currentTutorialStep === 3 && (
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 backdrop-blur-sm rounded-full border border-green-200 shadow-sm">
                    <span className="text-[10px] sm:text-xs font-bold text-green-600 bg-green-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">STEP 4</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">Get Your Complete Plan</span>
                  </div>
                )}
              </div>

              {/* Mobile Phone Frame */}
              <div className="mobile-phone-frame bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] p-1.5 sm:p-2 shadow-2xl">
                {/* Phone Screen */}
                <div className="bg-white rounded-[1.25rem] sm:rounded-[2rem] overflow-hidden relative flex flex-col h-[500px] sm:h-[600px] md:h-[600px] max-h-[500px] sm:max-h-[600px] md:max-h-[600px]">
                  {/* Mobile Status Bar */}
                  <div className="bg-white px-3 sm:px-4 pt-1.5 sm:pt-2 pb-1 flex items-center justify-between text-[10px] sm:text-xs font-semibold text-slate-900 flex-shrink-0">
                    <span>9:41</span>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.076 13.308-5.076 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.5 2A1.5 1.5 0 002 3.5v13A1.5 1.5 0 003.5 18h13a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-13zM4 4h12v12H4V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Mobile App Content */}
                  <div className="flex-1 overflow-hidden">
                    <div className="px-3 sm:px-4 py-2 sm:py-3 h-full flex flex-col">

              {/* Step 1: Click Start Planning - Enhanced */}
              {currentTutorialStep === 0 && (
                <div className="tutorial-content h-full flex flex-col justify-center">
                  
                  {/* Enhanced Hero Section */}
                  <div className="text-center mb-2 sm:mb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-0.5">
                      Plan Your
                      <br />
                      <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        Perfect Trip
                      </span>
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-600">AI-powered travel planning</p>
                  </div>
                  
                  {/* Enhanced Button with Animation */}
                  <div className="bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center my-2 sm:my-3 space-y-2">
                    <button className="relative w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl shadow-xl shadow-violet-500/50 tutorial-icon-pulse overflow-hidden">
                      <span className="relative z-10">Start Planning</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-violet-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span className="font-medium">Tap to begin</span>
                    </div>
                  </div>
                  
                  {/* Quick Features Preview */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-2">
                    {[
                      { icon: '✈️', label: 'Trips' },
                      { icon: '🎒', label: 'Packing' },
                      { icon: '🍽️', label: 'Food' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white/60 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 text-center border border-violet-100">
                        <div className="text-base sm:text-xl mb-0.5">{item.icon}</div>
                        <div className="text-[10px] sm:text-xs font-medium text-slate-700">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Animated Form - Enhanced Design */}
              {currentTutorialStep === 1 && (
                <div className="tutorial-content h-full flex flex-col overflow-hidden">
                  
                  <div className="space-y-1.5 sm:space-y-2 form-slide-up bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-sm p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden">
                    {/* Destination Field - Enhanced */}
                    <div className="relative">
                      <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-0.5 sm:mb-1 flex items-center gap-1">
                        <span className="text-xs sm:text-sm">📍</span>
                        Main Destination
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={formAnimationState.filledFields.includes(0) ? 'Paris, France' : (formAnimationState.currentField === 0 && formAnimationState.typing ? 'Paris, France' : '')}
                          className={`w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 bg-white text-xs sm:text-sm text-gray-800 border-2 rounded-lg sm:rounded-xl transition-all duration-300 shadow-sm ${
                            formAnimationState.currentField === 0
                              ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/30'
                              : formAnimationState.filledFields.includes(0)
                              ? 'border-emerald-400 bg-emerald-50/50'
                              : 'border-slate-200'
                          } ${formAnimationState.currentField === 0 && formAnimationState.typing ? 'typing-animation' : ''}`}
                          placeholder={formAnimationState.currentField === 0 && !formAnimationState.typing && !formAnimationState.filledFields.includes(0) ? 'Typing...' : 'e.g., Paris, France'}
                        />
                        {formAnimationState.currentField === 0 && formAnimationState.isLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                        {formAnimationState.currentField === 0 && formAnimationState.filledFields.includes(0) && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 checkmark-animation">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {/* Suggestions Dropdown - like Questionnaire */}
                      {formAnimationState.currentField === 0 && formAnimationState.showSuggestions && formAnimationState.suggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-32 sm:max-h-40 overflow-y-auto form-slide-up">
                          {formAnimationState.suggestions.map((s, i) => (
                            <li
                              key={i}
                              className="px-2 sm:px-3 py-1.5 sm:py-2 cursor-pointer hover:bg-violet-100/60 flex justify-between items-center transition-colors"
                            >
                              <div>
                                <span className="font-semibold text-xs sm:text-sm text-slate-800">{s.name}</span>
                                {s.name === 'Paris, France' && <span className="text-[10px] sm:text-xs text-slate-600">, France</span>}
                              </div>
                              <span className="text-[10px] sm:text-xs bg-slate-200 text-slate-700 font-medium px-1.5 sm:px-2 py-0.5 rounded-full">{s.type}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {formAnimationState.currentField === 0 && formAnimationState.isLoading && (
                        <div className="mt-1.5 sm:mt-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/50 rounded-lg shadow-sm animate-pulse">
                          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-violet-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="font-medium">Searching for locations</span>
                            <span className="flex space-x-0.5">
                              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Date Fields - Enhanced */}
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      <div className="space-y-0.5 sm:space-y-1">
                        <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <span className="text-xs sm:text-sm">📅</span>
                          Start Date
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            readOnly
                            value={formAnimationState.filledFields.includes(1) ? '2025-06-15' : (formAnimationState.currentField === 1 && formAnimationState.typing ? '2025-06-15' : '')}
                            className={`w-full pl-7 sm:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 bg-white text-[10px] sm:text-xs text-gray-800 border-2 rounded-lg sm:rounded-xl transition-all duration-300 shadow-sm ${
                              formAnimationState.currentField === 1
                                ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/30'
                                : formAnimationState.filledFields.includes(1)
                                ? 'border-emerald-400 bg-emerald-50/50'
                                : 'border-slate-200'
                            }`}
                            placeholder="Start date"
                          />
                        </div>
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <span className="text-xs sm:text-sm">📅</span>
                          End Date
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            readOnly
                            value={formAnimationState.filledFields.includes(2) ? '2025-06-22' : (formAnimationState.currentField === 2 && formAnimationState.typing ? '2025-06-22' : '')}
                            className={`w-full pl-7 sm:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 bg-white text-[10px] sm:text-xs text-gray-800 border-2 rounded-lg sm:rounded-xl transition-all duration-300 shadow-sm ${
                              formAnimationState.currentField === 2
                                ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/30'
                                : formAnimationState.filledFields.includes(2)
                                ? 'border-emerald-400 bg-emerald-50/50'
                                : 'border-slate-200'
                            }`}
                            placeholder="End date"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center py-0">
                      <span className="bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs shadow-sm">
                        ✨ 7 days
                      </span>
                    </div>

                    {/* Budget Selection - Enhanced */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <span className="text-xs sm:text-sm">💰</span>
                        Budget
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {['Low Budget', 'Midrange', 'Luxury'].map((budget, idx) => (
                          <button
                            key={budget}
                            type="button"
                            className={`px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-200 border-2 shadow-sm ${
                              formAnimationState.filledFields.includes(3) && budget === 'Midrange'
                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 shadow-md'
                                : formAnimationState.currentField === 3 && budget === 'Midrange'
                                ? 'bg-violet-100 border-violet-400 text-violet-700'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            {budget}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Travelers - Enhanced */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <span className="text-xs sm:text-sm">👥</span>
                        Travelers
                      </label>
                      <div className="flex items-center w-full bg-white border-2 border-slate-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
                        <button
                          type="button"
                          className="p-1.5 sm:p-2 text-violet-600 hover:bg-violet-50 transition flex-shrink-0"
                          disabled
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <input
                          type="text"
                          readOnly
                          value={formAnimationState.filledFields.includes(4) ? '2' : (formAnimationState.currentField === 4 && formAnimationState.typing ? '2' : '')}
                          className={`font-bold text-sm sm:text-base text-center flex-grow w-full bg-transparent border-none text-gray-800 focus:ring-0 focus:outline-none ${
                            formAnimationState.currentField === 4 ? 'text-violet-600' : ''
                          }`}
                        />
                        <button
                          type="button"
                          className="p-1.5 sm:p-2 text-violet-600 hover:bg-violet-50 transition flex-shrink-0"
                          disabled
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-200">
                      <button className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all duration-200">
                        ✨ Plan My Adventure
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Mini Apps */}
              {currentTutorialStep === 2 && (
                <div className="tutorial-content h-full flex flex-col justify-center">
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {miniApps.slice(0, 6).map((app, index) => {
                      const colors = colorClasses[app.color];
                      return (
                        <div
                          key={app.id}
                          className="form-slide-up bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 border-2 border-slate-200 hover:border-violet-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.iconBg} ${colors.iconText} rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2 tutorial-icon-pulse text-sm sm:text-base`}>
                            {app.icon}
                          </div>
                          <p className="text-[10px] sm:text-xs font-semibold text-slate-700 text-center leading-tight">{app.title}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 mt-2 sm:mt-3 text-center px-2">Use specialized tools for packing, food, music, language, and more</p>
                </div>
              )}

              {/* Step 4: Results */}
              {currentTutorialStep === 3 && (
                <div className="tutorial-content h-full flex flex-col justify-center">
                  <div className="space-y-1.5 sm:space-y-2">
                    {[
                      { title: 'Day 1: Arrival & Exploration', icon: '✈️', gradient: 'from-blue-500 to-cyan-500' },
                      { title: 'Day 2: Cultural Sites', icon: '🏛️', gradient: 'from-purple-500 to-pink-500' },
                      { title: 'Day 3: Local Experiences', icon: '🍷', gradient: 'from-orange-500 to-red-500' },
                    ].map((day, index) => (
                      <div
                        key={index}
                        className={`form-slide-up bg-gradient-to-r ${day.gradient} p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-white shadow-lg`}
                        style={{ animationDelay: `${index * 0.2}s` }}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-lg sm:text-xl">{day.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm">{day.title}</h4>
                            <p className="text-[10px] sm:text-xs opacity-90">Activities, restaurants & budget included</p>
                          </div>
                          <span className="checkmark-animation flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gradient-to-r from-violet-100 to-purple-100 rounded-lg sm:rounded-xl border-2 border-violet-200">
                      <div className="space-y-1.5 sm:space-y-2">
                        <div>
                          <p className="text-[10px] sm:text-xs font-semibold text-slate-700">Total Budget</p>
                          <p className="text-lg sm:text-xl font-bold text-violet-600">$2,500</p>
                        </div>
                        <button className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-violet-600 text-white font-semibold rounded-lg text-xs sm:text-sm">
                          View Full Plan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

                      {/* Mobile Navigation Dots */}
                      <div className="flex items-center justify-center gap-2 mt-6 mb-4">
                        {[0, 1, 2, 3].map((step) => (
                          <button
                            key={step}
                            onClick={() => setCurrentTutorialStep(step)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              currentTutorialStep === step ? 'bg-violet-600 w-8' : 'bg-violet-300 w-2'
                            }`}
                            aria-label={`Go to step ${step + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Bottom Navigation */}
                  <div className="bg-white border-t border-slate-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between flex-shrink-0">
                    <button
                      onClick={() => setCurrentTutorialStep(Math.max(0, currentTutorialStep - 1))}
                      disabled={currentTutorialStep === 0}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-violet-600 font-medium disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTutorialStep((currentTutorialStep + 1) % 4);
                      }}
                      className="px-4 sm:px-6 py-1.5 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg transition-all duration-200 active:scale-95"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}


        {/* Destinations Section */}
        <section ref={destinationsRef}>
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Popular Destinations</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
            {destinations.length > 0 ? (
              destinations
                .filter((dest) => !excludedDestinations.includes(dest.name) && !shareLinks[dest.name])
                .slice(0, 8)
                .map((dest) => (
                  <button 
                    key={dest.name} 
                    onClick={() => onPlanUnifiedTrip(dest.name)} 
                    className="group p-4 sm:p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-violet-200 transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <span className="text-3xl sm:text-4xl transition-transform duration-200 group-hover:scale-110" role="img" aria-label="destination">{dest.icon}</span>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900">{dest.name}</h3>
                    </div>
                  </button>
                ))
            ) : (
              Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-100 animate-pulse"
                >
                  <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Blog Section */}
        <section>
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Travel Blog</h2>
            <p className="text-sm sm:text-base text-slate-600">Tips, guides & stories</p>
          </div>
          <BlogCarousel onViewMore={onGoToBlog} />
        </section>

        {/* FAQ Section */}
        <section>
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">FAQ</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            <details className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                <span>How do I plan a trip?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Enter your destination, dates, budget, and preferences. Our AI generates a complete personalized itinerary with activities, budget estimates, and recommendations.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                <span>Is it free?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Yes, completely free. No credit card required. Plan unlimited trips with full access to all features.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                <span>What can I plan?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Itineraries, packing lists, food recommendations, music playlists, language guides, app suggestions, and multi-destination trips.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                <span>How accurate are the plans?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Our AI uses advanced algorithms to create personalized plans based on your budget, preferences, and destination with realistic estimates.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                <span>Can I plan multiple destinations?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Yes, our unified planner supports multi-stop journeys with optimized routes and time management.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                <span>How do I add my Gemini API key?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-3 text-sm text-slate-600 space-y-2">
                <p>1. Go to <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 font-medium underline">Google AI Studio</a> and create an API key</p>
                <p>2. Copy the key and go to <a href="/profile" className="text-violet-600 hover:text-violet-700 font-medium underline">Edit Profile</a></p>
                <p>3. Paste the key and save</p>
              </div>
            </details>
          </div>
        </section>

        {/* Testimonials Section */}
        <section>
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">What Travelers Say</h2>
          </div>
          <TestimonialsCarousel />
        </section>
      </div>
    </div>
  );
};
export default LandingPage;