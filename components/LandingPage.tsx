import React, { useState, useEffect } from 'react';
import { PopularDestination } from '../types';

interface LandingPageProps {
  onPlanTrip: (destination?: string) => void;
  onStartPacking: () => void;
  onStartFoodFinder: () => void;
  onStartAppFinder: () => void;
  onStartMusicFinder: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg h-full">
    <div className="flex items-center space-x-4">
      <div className="bg-violet-100 text-violet-600 rounded-full p-3">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <p className="text-slate-600 text-sm mt-1">{children}</p>
      </div>
    </div>
  </div>
);

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
  
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center bg-white/40 backdrop-blur-md p-3 rounded-full shadow-lg mb-6 border border-white/50">
            <div className="bg-indigo-500 text-white rounded-full p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M21.435 2.585a2.02 2.02 0 0 0-1.89-.865H4.455a2.02 2.02 0 0 0-1.89.865L.01 9.42a1.514 1.514 0 0 0 .53 1.83l8.45 6.015V21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3.735l8.45-6.015a1.514 1.514 0 0 0 .53-1.83l-2.555-6.835zM14 15.265V20h-4v-4.735L2.615 9.78l2.04-5.46h14.71l2.04 5.46L14 15.265z"/></svg>
            </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Plan Your Dream Trip with AI
        </h1>
        <p className="mt-4 text-lg text-slate-700 max-w-xl mx-auto">
          Get personalized travel itineraries powered by AI. From budget planning to day-wise activities, we've got you covered.
        </p>
        <button
          onClick={() => onPlanTrip()}
          className="mt-8 px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          ✨ Plan My Trip
        </button>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            <button
              onClick={onStartPacking}
              className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/30 shadow-lg text-center flex flex-col justify-between items-center group hover:border-violet-300/50 transition-all duration-300 transform hover:-translate-y-1 h-full"
            >
              <div>
                <div className="bg-violet-100 text-violet-600 rounded-full p-4 inline-block transform group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path fillRule="evenodd" d="M5 4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H5zm0 2h10v10H5V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-4">Smart Bag Packing</h3>
                <p className="text-slate-600 mt-2 text-sm">AI-powered packing tailored for your trip</p>
              </div>
              <div className="mt-6 px-5 py-2 bg-violet-600 text-white font-bold rounded-full group-hover:bg-violet-700 transition-all duration-300 transform group-hover:scale-105 shadow-lg text-sm">
                ✨ Pack My Bag
              </div>
            </button>

            <button
              onClick={onStartFoodFinder}
              className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/30 shadow-lg text-center flex flex-col justify-between items-center group hover:border-amber-300/50 transition-all duration-300 transform hover:-translate-y-1 h-full"
            >
              <div>
                <div className="bg-amber-100 text-amber-600 rounded-full p-4 inline-block transform group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 10-2 0v1.088A7 7 0 004.53 10.756.5.5 0 005 11h10a.5.5 0 00.47-.244A7 7 0 0011 4.088V3z" />
                    <path fillRule="evenodd" d="M15 13a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h10z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-4">Local Food Finder</h3>
                <p className="text-slate-600 mt-2 text-sm">Discover authentic local cuisine</p>
              </div>
              <div className="mt-6 px-5 py-2 bg-amber-600 text-white font-bold rounded-full group-hover:bg-amber-700 transition-all duration-300 transform group-hover:scale-105 shadow-lg text-sm">
                🍴 Find My Feast
              </div>
            </button>
            
            <button
              onClick={onStartAppFinder}
              className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/30 shadow-lg text-center flex flex-col justify-between items-center group hover:border-teal-300/50 transition-all duration-300 transform hover:-translate-y-1 h-full"
            >
              <div>
                <div className="bg-teal-100 text-teal-600 rounded-full p-4 inline-block transform group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2h-6zm-2 2a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2h-6a2 2 0 01-2-2V4z" clipRule="evenodd" /><path d="M6 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-4">Mobile App Finder</h3>
                <p className="text-slate-600 mt-2 text-sm">Find essential local apps for your trip</p>
              </div>
              <div className="mt-6 px-5 py-2 bg-teal-600 text-white font-bold rounded-full group-hover:bg-teal-700 transition-all duration-300 transform group-hover:scale-105 shadow-lg text-sm">
                📱 Find My Apps
              </div>
            </button>

            <button
              onClick={onStartMusicFinder}
              className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/30 shadow-lg text-center flex flex-col justify-between items-center group hover:border-fuchsia-300/50 transition-all duration-300 transform hover:-translate-y-1 h-full"
            >
              <div>
                <div className="bg-fuchsia-100 text-fuchsia-600 rounded-full p-4 inline-block transform group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-1-1z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-4">Local Music Finder</h3>
                <p className="text-slate-600 mt-2 text-sm">Discover the soundtrack of your travels</p>
              </div>
              <div className="mt-6 px-5 py-2 bg-fuchsia-600 text-white font-bold rounded-full group-hover:bg-fuchsia-700 transition-all duration-300 transform group-hover:scale-105 shadow-lg text-sm">
                🎶 Discover Local Music
              </div>
            </button>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} title="Day-wise Planning">
              Detailed itineraries with activities planned for each day.
            </FeatureCard>
            
            <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9" /></svg>} title="Cultural Discovery">
              Find local food, music, and essential mobile apps for your trip.
            </FeatureCard>
            
            <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>} title="Smart Travel Tools">
              Weather-aware packing lists to currency conversion.
            </FeatureCard>
            
            <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="Budget Friendly">
              Transparent pricing with options for every budget range.
            </FeatureCard>
        </div>
      </div>

      {/* Popular Destinations Section */}
      <div>
        <h2 className="text-3xl font-bold text-center text-slate-900">Popular Destinations</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {destinations.map((dest) => (
            <button key={dest.name} onClick={() => onPlanTrip(dest.name)} className="text-left bg-white/40 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl hover:border-indigo-300/50 transition-all duration-300 transform hover:-translate-y-1">
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