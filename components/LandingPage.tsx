
import React, { useState, useEffect } from 'react';
import { PopularDestination } from '../types';
import TestimonialsCarousel from './TestimonialsCarousel';

interface LandingPageProps {
  onPlanTrip: (destination?: string) => void;
  onStartPacking: () => void;
  onStartFoodFinder: () => void;
  onStartAppFinder: () => void;
  onStartMusicFinder: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onPlanTrip, onStartPacking, onStartFoodFinder, onStartAppFinder, onStartMusicFinder }) => {
  const [destinations, setDestinations] = useState<PopularDestination[]>([]);

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

  const miniApps = [
    {
      id: 'packing',
      title: 'Smart Bag Packing',
      description: 'AI-powered packing tailored for your trip',
      onClick: onStartPacking,
      color: 'violet' as const,
      icon: (
        <span className="text-4xl">🧳</span>
      ),
      buttonText: 'Pack My Bag',
      buttonIcon: '✨',
    },
    {
      id: 'food',
      title: 'Local Food Finder',
      description: 'Discover authentic local cuisine',
      onClick: onStartFoodFinder,
      color: 'orange' as const,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2zM12 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" /><path d="M15 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" /></svg>
      ),
      buttonText: 'Find My Feast',
      buttonIcon: '🍴',
    },
    {
      id: 'apps',
      title: 'Mobile App Finder',
      description: 'Find essential local apps for your trip',
      onClick: onStartAppFinder,
      color: 'teal' as const,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
      ),
      buttonText: 'Find My Apps',
      buttonIcon: '📱',
    },
    {
      id: 'music',
      title: 'Local Music Finder',
      description: 'Discover the soundtrack of your travels',
      onClick: onStartMusicFinder,
      color: 'fuchsia' as const,
      icon: (
         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
      ),
      buttonText: 'Discover Local Music',
      buttonIcon: '🎶',
    },
  ];

  const colorClasses = {
    violet: {
        iconBg: 'bg-violet-100/80',
        iconText: 'text-violet-600',
        button: 'bg-violet-600 hover:bg-violet-700 text-white',
    },
    orange: {
        iconBg: 'bg-yellow-100/80',
        iconText: 'text-orange-500',
        button: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    teal: {
        iconBg: 'bg-teal-100/80',
        iconText: 'text-teal-600',
        button: 'bg-teal-500 hover:bg-teal-600 text-white',
    },
    fuchsia: {
        iconBg: 'bg-fuchsia-100/80',
        iconText: 'text-fuchsia-600',
        button: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
    },
  };

  const supportingFeatures = [
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      title: 'Day-wise Planning',
      description: 'Get a detailed, step-by-step plan for each day of your trip.'
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>,
      title: 'Cultural Discovery',
      description: 'Learn about the history, culture, and must-see sights.'
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.11a12.003 12.003 0 015.655 5.655c.103.55.568 1.02 1.11 1.11a11.97 11.97 0 010 2.828c-.542.09-1.007.56-1.11 1.11a12.003 12.003 0 01-5.655 5.655c-.55.103-1.02.568-1.11 1.11a11.97 11.97 0 01-2.828 0c-.09-.542-.56-1.007-1.11-1.11a12.003 12.003 0 01-5.655-5.655c-.103-.55-.568-1.02-1.11-1.11a11.97 11.97 0 010-2.828c.542-.09 1.007.56 1.11-1.11a12.003 12.003 0 015.655-5.655z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" /></svg>,
      title: 'Smart Travel Tools',
      description: 'Find packing lists, local apps, music, and food recommendations.'
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
      title: 'Budget Friendly',
      description: 'Get cost estimates for your entire trip, from stay to food.'
    }
  ];
  
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <div className="animated-card text-center" style={{ animationDelay: '100ms' }}>
        <button
          onClick={() => onPlanTrip()}
          className="w-full max-w-5xl mx-auto p-6 md:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/50 shadow-2xl group transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-violet-300"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Plan Your Next Adventure</h1>
          <p className="mt-2 text-lg text-slate-600 max-w-xl mx-auto">
            Tell us your travel preferences, and our AI will craft a personalized, day-by-day itinerary just for you.
          </p>
          <div className="mt-6">
            <div
              className="inline-block px-8 py-3 bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold rounded-full text-base md:text-lg shadow-xl shadow-indigo-500/30 group-hover:shadow-2xl group-hover:shadow-indigo-500/50 transition-all duration-300"
            >
              ✨ Plan My Trip
            </div>
          </div>
        </button>
      </div>
      
      {/* Mini Apps Section */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 animated-card" style={{ animationDelay: '200ms' }}>Quick Tools for Your Journey</h2>
        <p className="text-slate-600 mt-1 animated-card" style={{ animationDelay: '250ms' }}>Smart tools to make your trip unforgettable.</p>
        <div className="flex justify-center mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {miniApps.map((app, index) => {
                const colors = colorClasses[app.color];
                return (
                <button
                    key={app.id}
                    onClick={app.onClick}
                    className="animated-card h-full w-full text-center bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg flex flex-col justify-between group transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-violet-300"
                    style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                    <div>
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${colors.iconBg} ${colors.iconText}`}>
                            {app.icon}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mt-4">{app.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                            {app.description}
                        </p>
                    </div>
                    <div className="mt-6">
                        <div
                            className={`w-full px-5 py-3 rounded-full text-base font-semibold flex items-center justify-center space-x-2 transition-all duration-300 transform group-hover:shadow-lg ${colors.button}`}
                            >
                            <span>{app.buttonIcon}</span>
                            <span>{app.buttonText}</span>
                        </div>
                    </div>
                </button>
                );
            })}
            </div>
        </div>
      </div>


      {/* Supporting Features Section */}
      <div>
        <h2 className="text-2xl font-bold text-center text-slate-900 animated-card" style={{ animationDelay: '600ms' }}>Your AI Travel Toolkit</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportingFeatures.map((feature, index) => (
            <div 
              key={index} 
              className="animated-card bg-white/40 backdrop-blur-md p-6 rounded-xl border border-white/50 shadow-lg text-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl" 
              style={{ animationDelay: `${700 + index * 100}ms` }}
            >
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-violet-100 text-violet-600">
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
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-6 animated-card" style={{ animationDelay: '1100ms' }}>Popular Destinations</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {destinations.map((dest, index) => (
            <button key={dest.name} onClick={() => onPlanTrip(dest.name)} className="animated-card text-left bg-white/40 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl hover:border-indigo-300/50 transition-all duration-300 transform hover:scale-105" style={{ animationDelay: `${1200 + index * 50}ms` }}>
              <span className="text-3xl" role="img" aria-label="">{dest.icon}</span>
              <h3 className="text-lg font-semibold mt-3 text-slate-800">{dest.name}</h3>
              <p className="text-slate-600 text-sm">{dest.description}</p>
            </button>
          ))}
          {destinations.length === 0 && Array(10).fill(0).map((_, i) => (
            <div key={i} className="bg-white/40 p-5 rounded-2xl border border-white/50 shadow-lg animate-pulse">
              <div className="h-8 w-8 bg-slate-200/50 rounded-md"></div>
              <div className="h-4 bg-slate-200/50 rounded mt-4 w-3/4"></div>
              <div className="h-3 bg-slate-200/50 rounded mt-2 w-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <section>
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-8 animated-card" style={{ animationDelay: '1600ms' }}>
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