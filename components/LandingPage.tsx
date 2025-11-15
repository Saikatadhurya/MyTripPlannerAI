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
  const hasCheckedAuth = useRef(false);
  const authCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Map of destination names to share links
  const shareLinks: { [key: string]: string } = {
    'Goa, India': '/share/2cf3d8b0-ca4a-41ae-8f63-b0c6372092b1',
    'Rajasthan, India': '/share/6a8d939c-21b6-494c-8fb0-473bd59a1ed9',
    'Dubai, UAE': '/share/f2300726-8744-4f8b-a689-cfcd65a1ee0f',
    'Bangkok, Thailand': '/share/c56afa4b-fd73-4557-8f63-67e1027726fd',
  };

  // Destinations to exclude from display
  const excludedDestinations = ['Singapore', 'Sri Lanka'];

  // Open auth modal if user is not logged in on initial load
  // Wait a bit for user state to initialize to prevent flashing
  useEffect(() => {
    // If user is already loaded and logged in, mark as checked and don't show modal
    if (user) {
      hasCheckedAuth.current = true;
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
        authCheckTimeoutRef.current = null;
      }
      return;
    }
    
    // If we've already checked, don't check again
    if (hasCheckedAuth.current) return;
    
    // Clear any existing timeout
    if (authCheckTimeoutRef.current) {
      clearTimeout(authCheckTimeoutRef.current);
    }
    
    // Wait a short time for user state to initialize from localStorage
    // This prevents the modal from flashing when user is logged in
    authCheckTimeoutRef.current = setTimeout(() => {
      // Double check user state after delay
      if (!hasCheckedAuth.current && !user) {
        hasCheckedAuth.current = true;
        onOpenAuthModal();
      } else if (user) {
        // User loaded during the delay, don't show modal
        hasCheckedAuth.current = true;
      }
    }, 150); // Small delay to allow user state to load from localStorage

    return () => {
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
        authCheckTimeoutRef.current = null;
      }
    };
  }, [user, onOpenAuthModal]);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await fetch('/data/destinations.json');
        const data: PopularDestination[] = await response.json();
        setDestinations(data);
      } catch (error) {
        console.error("Failed to fetch destinations:", error);
      }
    };
    fetchDestinations();
  }, []);

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
      title: 'Itinerary Planner',
      description: 'Get a detailed, step-by-step plan',
      onClick: onPlanItinerary,
      color: 'blue' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      buttonText: 'Plan Itinerary',
    },
    {
      id: 'packing',
      title: 'Smart Bag Packing',
      description: 'AI-powered packing tailored for your trip',
      onClick: onStartPacking,
      color: 'violet' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2zm3-3a1 1 0 011-1h2a1 1 0 110 2H10a1 1 0 01-1-1z" /></svg>,
      buttonText: 'Pack My Bag',
    },
    {
      id: 'food',
      title: 'Local Food Finder',
      description: 'Discover authentic local cuisine',
      onClick: onStartFoodFinder,
      color: 'orange' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      buttonText: 'Find My Feast',
    },
    {
      id: 'apps',
      title: 'Mobile App Finder',
      description: 'Find essential local apps for your trip',
      onClick: onStartAppFinder,
      color: 'teal' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
      buttonText: 'Find My Apps',
    },
    {
      id: 'music',
      title: 'Local Music Finder',
      description: 'Discover the soundtrack of your travels',
      onClick: onStartMusicFinder,
      color: 'fuchsia' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      buttonText: 'Discover Music',
    },
    {
      id: 'lingo',
      title: 'Local Lingo Guide',
      description: 'Learn essential phrases for your trip',
      onClick: onStartLingoFinder,
      color: 'sky' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      buttonText: 'Get Phrases',
    },
  ];
  
  return (
    <div className="space-y-8 md:space-y-16 lg:space-y-20 pb-8 px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-0 lg:pt-4">
      {/* Hero and Mini Apps Container - Side by side on desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-6 xl:gap-8 2xl:gap-10 lg:items-start">
        {/* Hero Section */}
        <div 
          onClick={(e) => {
            // Check if click target is the button or its children
            const target = e.target as HTMLElement;
            if (target.closest('button')) {
              return; // Let button handle its own click
            }
            // Clicking anywhere on the hero section opens the unified planner
            onPlanUnifiedTrip();
          }}
          className="animated-card text-center max-w-4xl mx-auto lg:max-w-none lg:mx-0 p-5 sm:p-6 md:p-10 lg:p-6 xl:p-8 2xl:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-50 via-purple-50/50 to-pink-50/40 backdrop-blur-xl border-2 border-violet-300/80 shadow-xl sm:shadow-2xl shadow-violet-500/30 hover:shadow-2xl sm:hover:shadow-3xl hover:shadow-violet-500/40 transition-all duration-500 relative overflow-y-auto cursor-pointer lg:h-full lg:flex lg:flex-col lg:justify-center lg:items-center mb-4 sm:mb-6 lg:mb-0" 
          style={{ animationDelay: '100ms' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onPlanUnifiedTrip();
            }
          }}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-100/20 via-transparent to-purple-100/20 pointer-events-none"></div>
          
          {/* History Button - Floating in top-right corner */}
          {user && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory();
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-3 lg:right-3 xl:top-4 xl:right-4 z-20 group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-white/90 backdrop-blur-md border border-violet-200/60 shadow-lg hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-300 hover:scale-110 hover:bg-white hover:border-violet-400/80 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:ring-offset-2"
              aria-label="View trip history"
              title="View Your Trip History"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 group-hover:text-violet-700 transition-colors duration-300" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2.5}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span className="text-xs sm:text-sm font-semibold text-violet-600 group-hover:text-violet-700 transition-colors duration-300 hidden sm:inline">
                History
              </span>
            </button>
          )}
          
          <div className="relative z-10 w-full">
            {user && user.full_name && (
              <div className="mb-2 sm:mb-3 md:mb-4 lg:mb-2 xl:mb-3">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl 2xl:text-3xl font-semibold text-violet-600 tracking-wide">
                  Welcome, {user.full_name}! 👋
                </h2>
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight px-2">
              Your Dream Trip, <span className="text-violet-600">Planned to Perfection.</span>
            </h1>
            <p className="mt-2 sm:mt-3 md:mt-4 lg:mt-2 xl:mt-3 text-base sm:text-lg md:text-lg lg:text-sm xl:text-base 2xl:text-lg text-slate-700 max-w-2xl lg:max-w-none mx-auto font-medium px-2">
              Complete travel planning made simple. Just tell us where you want to go.
            </p>
             <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-4 xl:mt-5 2xl:mt-6 flex flex-col gap-3 sm:gap-4 items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent click handler
                  onPlanUnifiedTrip();
                }}
                className="cta-pulse w-full sm:w-auto inline-block px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 lg:px-6 lg:py-2.5 xl:px-8 xl:py-3 2xl:px-10 2xl:py-3.5 font-bold rounded-full text-sm sm:text-base md:text-lg lg:text-sm xl:text-base 2xl:text-lg shadow-xl sm:shadow-2xl transition-all duration-300 transform focus:outline-none focus:ring-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-violet-500/50 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl sm:hover:shadow-2xl hover:shadow-violet-500/60 hover:scale-105 sm:hover:scale-110 focus:ring-violet-300 whitespace-nowrap"
              >
                ✨ Build Your Ultimate Itinerary
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent click handler
                  onStartWeekendExplorer();
                }}
                className="w-full sm:w-auto inline-block px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 lg:px-6 lg:py-2.5 xl:px-8 xl:py-3 2xl:px-10 2xl:py-3.5 font-bold rounded-full text-sm sm:text-base md:text-lg lg:text-sm xl:text-base 2xl:text-lg shadow-xl sm:shadow-2xl transition-all duration-300 transform focus:outline-none focus:ring-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/50 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl sm:hover:shadow-2xl hover:shadow-emerald-500/60 hover:scale-105 sm:hover:scale-110 focus:ring-emerald-300 whitespace-nowrap"
              >
                🗺️ Weekend Explorer
              </button>
              <p className="mt-2 sm:mt-3 md:mt-4 lg:mt-2 xl:mt-3 text-xs sm:text-sm md:text-base lg:text-xs xl:text-sm 2xl:text-base text-violet-700 font-semibold tracking-wide px-2 text-center">
                Includes: Itinerary, Packing, Food, Apps, Music & Language Guides
              </p>
            </div>
          </div>
        </div>

        {/* Mini Apps Section */}
        <div className="text-center lg:flex lg:flex-col pb-10 sm:pb-8 lg:pb-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-xl xl:text-2xl 2xl:text-3xl font-extrabold text-slate-900 tracking-tight animated-card px-2 mb-3 sm:mb-4 md:mb-6 lg:mb-2 xl:mb-3 2xl:mb-4" style={{ animationDelay: '200ms' }}>
            Smart tools to make your trip <span className="text-violet-600">unforgettable.</span>
          </h2>
          <div className="mt-0 sm:mt-4 md:mt-6 lg:mt-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-2 xl:gap-2.5 2xl:gap-3">
          {miniApps.map((app, index) => {
            const colors = colorClasses[app.color];
            return (
              <div
                key={app.id}
                onClick={() => app.onClick()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        app.onClick();
                    }
                }}
                role="button"
                tabIndex={0}
                className={`animated-card h-full w-full bg-gradient-to-br from-white via-white to-slate-50/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-300/50 sm:border-2 sm:border-slate-300/60 shadow-md sm:shadow-xl md:shadow-2xl shadow-slate-400/10 sm:shadow-slate-400/20 group transition-all duration-300 sm:duration-500 sm:[transform-style:preserve-3d] hover:scale-105 sm:hover:[transform:perspective(1000px)_rotateY(4deg)_rotateX(8deg)_scale(1.05)] hover:shadow-lg sm:hover:shadow-3xl ${colors.hoverShadow} ${colors.hoverBorder} focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-offset-1 sm:focus:ring-offset-2 focus:ring-violet-400/50 cursor-pointer relative overflow-hidden`}
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <div className="p-2 sm:p-3 md:p-4 lg:p-3 xl:p-4 2xl:p-5 flex flex-col text-center h-full sm:[transform:translateZ(40px)] relative z-10">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent ${colors.hoverGradient} transition-all duration-300 sm:duration-500 rounded-xl sm:rounded-2xl -z-0`}></div>
                    <div className="flex-grow relative z-10">
                        <div className={`mx-auto w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-12 lg:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 sm:duration-500 group-hover:scale-110 group-hover:shadow-md sm:group-hover:shadow-lg ${colors.iconBg} ${colors.iconText}`}>
                            {app.icon}
                        </div>
                        <h3 className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base 2xl:text-lg font-bold text-slate-900 mt-1 sm:mt-1.5 md:mt-2 lg:mt-1.5 xl:mt-2">{app.title}</h3>
                        <p className="text-[10px] sm:text-xs md:text-sm lg:text-xs xl:text-xs 2xl:text-sm text-slate-600 mt-0.5 sm:mt-0.5 md:mt-1 lg:mt-0.5 xl:mt-1 line-clamp-2">
                            {app.description}
                        </p>
                    </div>
                    <div className="mt-1 sm:mt-1.5 md:mt-2 lg:mt-1.5 xl:mt-2 2xl:mt-3 flex-shrink-0 relative z-10">
                        <span className={`inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 lg:px-3 lg:py-1 xl:px-3.5 xl:py-1.5 2xl:px-4 2xl:py-2 font-semibold rounded-full text-[10px] sm:text-xs md:text-sm lg:text-xs xl:text-xs 2xl:text-sm shadow-sm sm:shadow-md transition-all duration-300 group-hover:shadow-md sm:group-hover:shadow-lg ${colors.button}`}>
                             {app.buttonText}
                        </span>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>


      {/* Popular Destinations Section */}
      <div className="sm:mt-6 md:mt-12 lg:mt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-4 sm:mb-6 animated-card" style={{ animationDelay: '1100ms' }}>Popular Destinations</h2>
        
        {/* Destinations with share links */}
        <div className="mt-6 sm:mt-8 md:mt-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {destinations.map((dest, index) => {
            // Skip excluded destinations
            if (excludedDestinations.includes(dest.name)) {
              return null;
            }
            
            const shareLink = shareLinks[dest.name];
            
            if (shareLink) {
              return (
                <a
                  key={dest.name}
                  href={shareLink}
                  className="animated-card text-left p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 shadow-xl transition-all duration-500 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-violet-400/50 bg-gradient-to-br from-white via-violet-50/40 to-purple-50/30 backdrop-blur-xl border-violet-200/60 hover:shadow-2xl hover:shadow-violet-500/25 hover:border-violet-400/80 cursor-pointer block relative overflow-hidden group"
                  style={{ animationDelay: `${1200 + index * 50}ms` }}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/10 group-hover:to-purple-500/10 transition-all duration-500 rounded-xl sm:rounded-2xl"></div>
                  <span className="text-3xl sm:text-4xl relative z-10 group-hover:scale-110 transition-transform duration-500 inline-block" role="img" aria-label="destination">{dest.icon}</span>
                  <h3 className="text-base sm:text-lg font-semibold mt-2 sm:mt-3 text-slate-800 relative z-10">{dest.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 relative z-10 mt-1">{dest.description}</p>
                </a>
              );
            }
            return null;
          })}
        </div>

        {/* Try Yourself Subsection */}
        <div className="mt-10 sm:mt-12 md:mt-16">
          <h3 className="text-xl sm:text-2xl font-bold text-center text-slate-800 mb-4 sm:mb-6 animated-card" style={{ animationDelay: '1300ms' }}>Try Yourself</h3>
          <p className="text-sm sm:text-base text-center text-slate-600 mb-4 sm:mb-6 px-2 animated-card" style={{ animationDelay: '1350ms' }}>Create your own personalized itinerary for these amazing destinations</p>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {destinations.map((dest, index) => {
              // Skip excluded destinations
              if (excludedDestinations.includes(dest.name)) {
                return null;
              }
              
              const shareLink = shareLinks[dest.name];
              
              if (!shareLink) {
                return (
                  <button 
                    key={dest.name} 
                    onClick={() => onPlanUnifiedTrip(dest.name)} 
                    className="animated-card text-left p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 shadow-xl transition-all duration-500 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-violet-400/50 bg-gradient-to-br from-white via-violet-50/40 to-purple-50/30 backdrop-blur-xl border-violet-200/60 hover:shadow-2xl hover:shadow-violet-500/25 hover:border-violet-400/80 cursor-pointer relative overflow-hidden group"
                    style={{ animationDelay: `${1400 + index * 50}ms` }}
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/10 group-hover:to-purple-500/10 transition-all duration-500 rounded-xl sm:rounded-2xl"></div>
                    <span className="text-3xl sm:text-4xl relative z-10 group-hover:scale-110 transition-transform duration-500 inline-block" role="img" aria-label="destination">{dest.icon}</span>
                    <h3 className="text-base sm:text-lg font-semibold mt-2 sm:mt-3 text-slate-800 relative z-10">{dest.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 relative z-10 mt-1">{dest.description}</p>
                  </button>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>

      {/* Blog Carousel Section */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-4 sm:mb-6 md:mb-8 animated-card" style={{ animationDelay: '1600ms' }}>
          Travel Blog
        </h2>
        <p className="text-sm sm:text-base text-center text-slate-600 mb-6 sm:mb-8 px-2 animated-card" style={{ animationDelay: '1650ms' }}>
          Discover expert travel tips, guides, and stories to inspire your next adventure
        </p>
        <div className="animated-card" style={{ animationDelay: '1700ms' }}>
          <BlogCarousel onViewMore={onGoToBlog} />
        </div>
      </section>

      {/* FAQ Section - Visible on Page for SEO */}
      <section className="mt-10 sm:mt-12 md:mt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-4 sm:mb-6 md:mb-8 animated-card" style={{ animationDelay: '1850ms' }}>
          Frequently Asked Questions
        </h2>
        <p className="text-sm sm:text-base text-center text-slate-600 mb-6 sm:mb-8 px-2 animated-card" style={{ animationDelay: '1900ms' }}>
          Everything you need to know about planning your trip with our AI trip planner
        </p>
        <div className="max-w-4xl mx-auto space-y-4 animated-card" style={{ animationDelay: '1950ms' }}>
          <details className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-200/60 shadow-lg p-4 sm:p-6 group">
            <summary className="font-bold text-lg sm:text-xl text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>How do I plan a trip?</span>
              <svg className="w-5 h-5 text-violet-600 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-slate-700 leading-relaxed">
              Plan a trip easily with our free AI trip planner. Simply enter your destination, travel dates, budget, and preferences. Our AI will generate a complete personalized itinerary with day-by-day activities, budget estimates, packing lists, and local recommendations. Perfect for planning trips anywhere in the world.
            </p>
          </details>

          <details className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-200/60 shadow-lg p-4 sm:p-6 group">
            <summary className="font-bold text-lg sm:text-xl text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>Is the trip planner free?</span>
              <svg className="w-5 h-5 text-violet-600 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-slate-700 leading-relaxed">
              Yes! Plan a trip is completely free. Our AI trip planner creates personalized travel itineraries at no cost. You can plan unlimited trips with full access to all features including itinerary planning, packing lists, food recommendations, and more. No credit card required.
            </p>
          </details>

          <details className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-200/60 shadow-lg p-4 sm:p-6 group">
            <summary className="font-bold text-lg sm:text-xl text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>What can I plan with this trip planner?</span>
              <svg className="w-5 h-5 text-violet-600 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-slate-700 leading-relaxed">
              Plan a trip includes: complete day-by-day itineraries, budget estimation, smart packing lists, local food recommendations, music playlists, language phrase guides, mobile app suggestions, multi-destination trip planning, and weekend getaway planning.
            </p>
          </details>

          <details className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-200/60 shadow-lg p-4 sm:p-6 group">
            <summary className="font-bold text-lg sm:text-xl text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>How accurate are the AI-generated trip plans?</span>
              <svg className="w-5 h-5 text-violet-600 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-slate-700 leading-relaxed">
              Our AI trip planner uses advanced algorithms to create highly personalized and accurate travel plans. The AI considers your budget, preferences, travel dates, and destination to generate detailed itineraries with realistic budget estimates and practical recommendations. Trusted by travelers worldwide.
            </p>
          </details>

          <details className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-200/60 shadow-lg p-4 sm:p-6 group">
            <summary className="font-bold text-lg sm:text-xl text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>Can I plan a trip for multiple destinations?</span>
              <svg className="w-5 h-5 text-violet-600 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-slate-700 leading-relaxed">
              Yes! You can plan a trip for multiple destinations. Our unified trip planner supports multi-stop journeys, creating seamless itineraries that cover all your destinations with optimized travel routes and time management.
            </p>
          </details>

          <details className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-200/60 shadow-lg p-4 sm:p-6 group">
            <summary className="font-bold text-lg sm:text-xl text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>How to plan a trip step by step?</span>
              <svg className="w-5 h-5 text-violet-600 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-slate-700 leading-relaxed">
              To plan a trip step by step: 1) Choose your destination, 2) Enter travel dates and number of travelers, 3) Select your budget range, 4) Pick your travel preferences and vibes, 5) Let our AI generate your personalized itinerary with day-by-day activities, budget breakdown, packing list, and local recommendations.
            </p>
          </details>

          <details className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-200/60 shadow-lg p-4 sm:p-6 group">
            <summary className="font-bold text-lg sm:text-xl text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>What is the best way to plan a trip?</span>
              <svg className="w-5 h-5 text-violet-600 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-slate-700 leading-relaxed">
              The best way to plan a trip is using our AI-powered trip planner. It automatically creates personalized itineraries based on your preferences, budget, and travel style. Our tool handles everything from day-by-day activities to budget estimation, packing lists, and local recommendations - saving you hours of research.
            </p>
          </details>

          <details className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-200/60 shadow-lg p-4 sm:p-6 group">
            <summary className="font-bold text-lg sm:text-xl text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>Can I plan a trip to any country?</span>
              <svg className="w-5 h-5 text-violet-600 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-slate-700 leading-relaxed">
              Yes! You can plan a trip to any country in the world. Our AI trip planner supports destinations globally, providing personalized itineraries, local recommendations, language guides, and cultural insights for any country you want to visit.
            </p>
          </details>

          <details className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-200/60 shadow-lg p-4 sm:p-6 group">
            <summary className="font-bold text-lg sm:text-xl text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>How much does it cost to plan a trip?</span>
              <svg className="w-5 h-5 text-violet-600 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-slate-700 leading-relaxed">
              Planning a trip with our AI trip planner is completely free. There are no hidden fees, no subscription required, and no credit card needed. You get full access to all features including itinerary planning, budget estimation, packing lists, and recommendations at no cost.
            </p>
          </details>

          <details className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-200/60 shadow-lg p-4 sm:p-6 group">
            <summary className="font-bold text-lg sm:text-xl text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>How long does it take to plan a trip?</span>
              <svg className="w-5 h-5 text-violet-600 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-slate-700 leading-relaxed">
              With our AI trip planner, you can plan a trip in just a few minutes. Simply fill out the quick questionnaire about your destination, dates, budget, and preferences. Our AI will generate a complete personalized itinerary within minutes, saving you hours of manual planning.
            </p>
          </details>

          <details className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-slate-200/60 shadow-lg p-4 sm:p-6 group">
            <summary className="font-bold text-lg sm:text-xl text-slate-900 cursor-pointer list-none flex items-center justify-between">
              <span>How do I add my own Gemini API key?</span>
              <svg className="w-5 h-5 text-violet-600 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-4 text-slate-700 leading-relaxed space-y-3">
              <p>
                Adding your own Gemini API key gives you full control over your AI usage and ensures you have your personal Google quota. Here's how to add it:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Go to <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 font-semibold underline">Google AI Studio</a> and click "Create API Key"</li>
                <li>Create a new project or select an existing one</li>
                <li>Copy your generated API key</li>
                <li>Navigate to <a href="/profile" className="text-violet-600 hover:text-violet-700 font-semibold underline">Edit Profile</a> in your account settings</li>
                <li>Paste the key in the "Gemini API Key" field and click "Save Changes"</li>
              </ol>
              <p className="text-sm text-slate-600 italic">
                Your API key will be securely stored and used for all future AI requests. This ensures you have full control over your usage and can avoid any service limitations.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* Testimonials Section */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-4 sm:mb-6 md:mb-8 animated-card" style={{ animationDelay: '1750ms' }}>
          What Our Travelers Say
        </h2>
        <div className="animated-card" style={{ animationDelay: '1800ms' }}>
          <TestimonialsCarousel />
        </div>
      </section>

    </div>
  );
};
export default LandingPage;