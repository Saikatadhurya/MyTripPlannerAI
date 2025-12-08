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
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Start Planning
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