import React, { useState, useEffect } from 'react';
import { PopularDestination } from '../types';

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

  const supportingApps = [
    {
      id: 'packing',
      title: 'Smart Bag Packing',
      description: 'AI-powered packing tailored for your trip',
      onClick: onStartPacking,
      color: 'violet' as const,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
          <path fillRule="evenodd" d="M5 4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H5zm0 2h10v10H5V6z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'food',
      title: 'Local Food Finder',
      description: 'Discover authentic local cuisine',
      onClick: onStartFoodFinder,
      color: 'amber' as const,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11 3a1 1 0 10-2 0v1.088A7 7 0 004.53 10.756.5.5 0 005 11h10a.5.5 0 00.47-.244A7 7 0 0011 4.088V3z" />
          <path fillRule="evenodd" d="M15 13a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h10z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'apps',
      title: 'Mobile App Finder',
      description: 'Find essential local apps for your trip',
      onClick: onStartAppFinder,
      color: 'teal' as const,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2h-6zm-2 2a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2h-6a2 2 0 01-2-2V4z" clipRule="evenodd" /><path d="M6 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" /></svg>
      ),
    },
    {
      id: 'music',
      title: 'Local Music Finder',
      description: 'Discover the soundtrack of your travels',
      onClick: onStartMusicFinder,
      color: 'fuchsia' as const,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-1-1z" />
        </svg>
      ),
    },
  ];

  const colorClasses = {
    violet: { bg: 'bg-violet-100', text: 'text-violet-600', hoverBorder: 'hover:border-violet-300/50' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', hoverBorder: 'hover:border-amber-300/50' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600', hoverBorder: 'hover:border-teal-300/50' },
    fuchsia: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600', hoverBorder: 'hover:border-fuchsia-300/50' },
  };
  
  return (
    <div className="space-y-16 py-8">
      {/* Main Features Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        {/* Primary Feature Card */}
        <div className="md:col-span-2 animated-card" style={{ animationDelay: '100ms' }}>
          <button
            onClick={() => onPlanTrip()}
            className="w-full h-full p-8 md:p-10 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/60 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/20 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor"><path d="M21.435 2.585a2.02 2.02 0 0 0-1.89-.865H4.455a2.02 2.02 0 0 0-1.89.865L.01 9.42a1.514 1.514 0 0 0 .53 1.83l8.45 6.015V21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3.735l8.45-6.015a1.514 1.514 0 0 0 .53-1.83l-2.555-6.835zM14 15.265V20h-4v-4.735L2.615 9.78l2.04-5.46h14.71l2.04 5.46L14 15.265z"/></svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Plan My Trip</h1>
              <p className="mt-2 text-indigo-100 max-w-xs">
                Get a personalized, day-by-day itinerary powered by AI.
              </p>
            </div>
          </button>
        </div>

        {/* Supporting App Cards */}
        {supportingApps.map((app, index) => (
          <button
            key={app.id}
            onClick={app.onClick}
            className={`animated-card bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg text-left flex flex-col justify-between items-start group transition-all duration-300 transform hover:-translate-y-1 h-full ${colorClasses[app.color].hoverBorder}`}
            style={{ animationDelay: `${200 + index * 100}ms` }}
          >
            <div>
              <div className={`${colorClasses[app.color].bg} ${colorClasses[app.color].text} rounded-full p-3 inline-block transform group-hover:scale-110 transition-transform`}>
                {app.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mt-4">{app.title}</h3>
              <p className="text-slate-600 mt-1 text-sm">{app.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Popular Destinations Section */}
      <div>
        <h2 className="text-3xl font-bold text-center text-slate-900 animated-card" style={{ animationDelay: '600ms' }}>Popular Destinations</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {destinations.map((dest, index) => (
            <button key={dest.name} onClick={() => onPlanTrip(dest.name)} className="animated-card text-left bg-white/40 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl hover:border-indigo-300/50 transition-all duration-300 transform hover:-translate-y-1" style={{ animationDelay: `${700 + index * 50}ms` }}>
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
    </div>
  );
};
export default LandingPage;