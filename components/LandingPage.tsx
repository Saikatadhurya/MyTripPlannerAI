import React, { useState, useEffect } from 'react';
import { PopularDestination } from '../types';
import { User } from '../services/authService';
import { useQuotas } from '../hooks/useQuotas';
import TestimonialsCarousel from './TestimonialsCarousel';

interface LandingPageProps {
  user: User | null;
  onPlanUnifiedTrip: (destination?: string) => void;
  onPlanItinerary: () => void;
  onStartPacking: () => void;
  onStartFoodFinder: () => void;
  onStartAppFinder: () => void;
  onStartMusicFinder: () => void;
  onStartLingoFinder: () => void;
  onOpenAuthModal: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ user, onPlanUnifiedTrip, onPlanItinerary, onStartPacking, onStartFoodFinder, onStartAppFinder, onStartMusicFinder, onStartLingoFinder, onOpenAuthModal }) => {
  const [destinations, setDestinations] = useState<PopularDestination[]>([]);
  const { quotas, quotasLoading } = useQuotas(user);

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
    },
    violet: {
      iconBg: 'bg-violet-100', iconText: 'text-violet-600',
      button: 'bg-violet-600 hover:bg-violet-700 text-white',
    },
    orange: {
      iconBg: 'bg-orange-100', iconText: 'text-orange-500',
      button: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    teal: {
      iconBg: 'bg-teal-100', iconText: 'text-teal-500',
      button: 'bg-teal-500 hover:bg-teal-600 text-white',
    },
    fuchsia: {
      iconBg: 'bg-fuchsia-100', iconText: 'text-fuchsia-500',
      button: 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white',
    },
    sky: {
      iconBg: 'bg-sky-100', iconText: 'text-sky-600',
      button: 'bg-sky-500 hover:bg-sky-600 text-white',
    },
  };
  
  const miniApps = [
    {
      id: 'itinerary_planner',
      title: 'Itinerary Planner',
      description: 'Get a detailed, step-by-step plan',
      onClick: user ? onPlanItinerary : onOpenAuthModal,
      color: 'blue' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      buttonText: 'Plan Itinerary',
      locked: !user,
    },
    {
      id: 'packing',
      title: 'Smart Bag Packing',
      description: 'AI-powered packing tailored for your trip',
      onClick: user ? onStartPacking : onOpenAuthModal,
      color: 'violet' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2zm3-3a1 1 0 011-1h2a1 1 0 110 2H10a1 1 0 01-1-1z" /></svg>,
      buttonText: 'Pack My Bag',
      locked: !user,
    },
    {
      id: 'food',
      title: 'Local Food Finder',
      description: 'Discover authentic local cuisine',
      onClick: user ? onStartFoodFinder : onOpenAuthModal,
      color: 'orange' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      buttonText: 'Find My Feast',
      locked: !user,
    },
    {
      id: 'apps',
      title: 'Mobile App Finder',
      description: 'Find essential local apps for your trip',
      onClick: user ? onStartAppFinder : onOpenAuthModal,
      color: 'teal' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
      buttonText: 'Find My Apps',
      locked: !user,
    },
    {
      id: 'music',
      title: 'Local Music Finder',
      description: 'Discover the soundtrack of your travels',
      onClick: user ? onStartMusicFinder : onOpenAuthModal,
      color: 'fuchsia' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      buttonText: 'Discover Music',
      locked: !user,
    },
    {
      id: 'lingo',
      title: 'Local Lingo Guide',
      description: 'Learn essential phrases for your trip',
      onClick: onStartLingoFinder,
      color: 'sky' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      buttonText: 'Get Phrases',
      locked: !user,
    },
  ];
  
  const supportingFeatures = [
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      title: 'Day-wise Planning',
      description: 'Get a detailed, step-by-step plan for each day of your trip.'
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>,
      title: 'Cultural Discovery',
      description: 'Learn about the history, culture, and must-see sights.'
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.11a12.003 12.003 0 015.655 5.655c.103.55.568 1.02 1.11 1.11a11.97 11.97 0 010 2.828c-.542.09-1.007.56-1.11 1.11a12.003 12.003 0 01-5.655 5.655c-.55.103-1.02.568-1.11 1.11a11.97 11.97 0 01-2.828 0c-.09-.542-.56-1.007-1.11-1.11a12.003 12.003 0 01-5.655-5.655c-.103-.55-.568-1.02-1.11-1.11a11.97 11.97 0 010-2.828c.542-.09 1.007.56 1.11-1.11a12.003 12.003 0 015.655-5.655z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" /></svg>,
      title: 'Smart Travel Tools',
      description: 'Find packing lists, local apps, music, and food recommendations.'
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
      title: 'Budget Friendly',
      description: 'Get cost estimates for your entire trip, from stay to food.'
    }
  ];
  
  return (
    <div className="space-y-20 pb-8">
      {/* Hero Section */}
      <div className="animated-card text-center max-w-4xl mx-auto p-6 md:p-8 rounded-3xl bg-white/60 backdrop-blur-lg border border-slate-200/70 shadow-xl" style={{ animationDelay: '100ms' }}>
        {user && user.full_name && (
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-violet-600 tracking-wide">
              Welcome, {user.full_name}! 👋
            </h2>
          </div>
        )}
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          AI-Powered Trip Planning, <span className="text-violet-600">Perfected.</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          From custom itineraries and smart packing lists to local food and music discovery, our AI crafts your complete travel experience. Just tell us where you want to go.
        </p>
         <div className="mt-8">
          {user ? (
            <>
              <button
                 disabled={quotasLoading}
                 onClick={() => { if (!quotasLoading) onPlanUnifiedTrip(); }}
                 className={`cta-pulse inline-block px-10 py-4 font-bold rounded-full text-lg shadow-lg transition-all duration-300 transform focus:outline-none focus:ring-4 ${
                   quotasLoading
                     ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                     : 'bg-violet-600 text-white shadow-violet-500/30 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/40 hover:scale-105 focus:ring-violet-300'
                 }`}
              >
                 {(() => {
                   const suffix = quotasLoading ? ' (⏳ Fetching limit...)' : '';
                   return `✨ Build Your Ultimate Itinerary${suffix}`;
                 })()}
              </button>
              <p className="mt-4 text-sm text-violet-700/80 font-medium tracking-wide">
                Includes: Itinerary, Packing, Food, Apps & Music
              </p>
              {quotasLoading ? (
                <div className="mt-2 text-xs text-blue-600">
                  <span>⏳ Fetching limit...</span>
                </div>
              ) : quotas.unified && (
                <div className="mt-2 text-xs text-slate-600">
                  {quotas.unified.remaining > 0 ? (
                    <span className="text-green-600">✓ {quotas.unified.remaining} unified trips remaining this week</span>
                  ) : (
                    <span className="text-red-600">⚠️ Weekly limit reached - try individual tools</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <button
                disabled
                className="inline-block px-10 py-4 bg-gray-400 text-gray-600 font-bold rounded-full text-lg shadow-lg cursor-not-allowed opacity-60"
              >
                🔒 Build Your Ultimate Itinerary
              </button>
              <p className="mt-4 text-sm text-gray-600 font-medium tracking-wide">
                Sign in to unlock the full itinerary planner
              </p>
              <button
                onClick={onOpenAuthModal}
                className="mt-3 inline-block px-6 py-2 bg-violet-600 text-white font-semibold rounded-full text-sm shadow-lg shadow-violet-500/30 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-300"
              >
                Sign In to Continue
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Mini Apps Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 animated-card" style={{ animationDelay: '200ms' }}>Quick Tools for Your Journey</h2>
        <p className="text-slate-600 mt-2 animated-card" style={{ animationDelay: '250ms' }}>Smart tools to make your trip unforgettable.</p>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {miniApps.map((app, index) => {
            const colors = colorClasses[app.color];
            const quota = user ? quotas[app.id] : undefined;
            const labelSuffix = quotasLoading ? ' (⏳ Fetching limit...)' : '';
            const isLocked = app.locked || quotasLoading;
            return (
              <div
                key={app.id}
                onClick={() => { if (!isLocked) app.onClick(); }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!isLocked) app.onClick();
                    }
                }}
                role="button"
                tabIndex={0}
                className="animated-card h-full w-full bg-white/60 backdrop-blur-lg rounded-2xl border border-slate-200/70 shadow-xl group transition-transform duration-500 [transform-style:preserve-3d] hover:[transform:perspective(1000px)_rotateY(4deg)_rotateX(8deg)_scale(1.05)] focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-violet-400/50 cursor-pointer"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <div className="p-4 sm:p-6 flex flex-col text-center h-full [transform:translateZ(40px)]">
                    <div className="flex-grow">
                        <div className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${colors.iconBg} ${colors.iconText}`}>
                            {app.icon}
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-4 sm:mt-5">{app.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                            {app.description}
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-6 flex-shrink-0">
                        <span className={`inline-block px-4 py-2 sm:px-6 sm:py-2.5 font-semibold rounded-full text-sm shadow-md transition-all duration-300 group-hover:shadow-lg ${
                      isLocked 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : colors.button
                    }`}>
                             {isLocked ? `🔒 ${app.buttonText}` : `${app.buttonText}${labelSuffix}`}
                        </span>
                        {user && (
                          <div className="mt-2 text-xs text-slate-500">
                            {quotasLoading ? (
                              <span className="text-blue-600">⏳ Fetching limit...</span>
                            ) : quota ? (
                              quota.remaining > 0 ? (
                                <span className="text-green-600">✓ {quota.remaining} uses remaining</span>
                              ) : (
                                <span className="text-red-600">⚠️ Limit reached</span>
                              )
                            ) : null}
                          </div>
                        )}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Supporting Features Section */}
      <div>
        <h2 className="text-3xl font-bold text-center text-slate-900 animated-card" style={{ animationDelay: '600ms' }}>Your AI Travel Toolkit</h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportingFeatures.map((feature, index) => (
            <div 
              key={index} 
              className="animated-card bg-slate-50/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/70 text-center shadow-lg hover:shadow-xl transition-shadow" 
              style={{ animationDelay: `${700 + index * 100}ms` }}
            >
              <div className="mx-auto w-16 h-16 flex items-center justify-center text-violet-500">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mt-4">{feature.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Destinations Section */}
      <div>
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-6 animated-card" style={{ animationDelay: '1100ms' }}>Popular Destinations</h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {destinations.map((dest, index) => (
            <button 
              key={dest.name} 
              onClick={user ? () => onPlanUnifiedTrip(dest.name) : onOpenAuthModal} 
              className={`animated-card text-left p-5 rounded-2xl border shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-violet-400/50 ${
                user 
                  ? 'bg-white/50 backdrop-blur-lg border-white/60 hover:shadow-xl hover:border-violet-300/50' 
                  : 'bg-gray-100/50 backdrop-blur-lg border-gray-200/60 hover:shadow-xl hover:border-gray-300/50 cursor-pointer'
              }`} 
              style={{ animationDelay: `${1200 + index * 50}ms` }}
            >
              <span className="text-4xl" role="img" aria-label="">{dest.icon}</span>
              <h3 className="text-lg font-semibold mt-3 text-slate-800">{dest.name}</h3>
              <p className="text-slate-600 text-sm">{dest.description}</p>
              {!user ? (
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <span className="mr-1">🔒</span>
                  <span>Sign in to plan</span>
                </div>
              ) : quotasLoading ? (
                <div className="mt-2 text-xs text-blue-600">
                  <span>⏳ Fetching limit...</span>
                </div>
              ) : quotas.unified && (
                <div className="mt-2 text-xs">
                  {quotas.unified.remaining > 0 ? (
                    <span className="text-green-600">✓ {quotas.unified.remaining} trips left</span>
                  ) : (
                    <span className="text-red-600">⚠️ Limit reached</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <section>
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8 animated-card" style={{ animationDelay: '1600ms' }}>
          What Our Travelers Say
        </h2>
        <div className="animated-card" style={{ animationDelay: '1700ms' }}>
          <TestimonialsCarousel />
        </div>
      </section>

    </div>
  );
};
export default LandingPage;