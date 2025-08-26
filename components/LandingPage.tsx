import React, { useState, useEffect } from 'react';
import { PopularDestination } from '../types';

interface LandingPageProps {
  onPlanTrip: (destination?: string) => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
    <div className="flex items-center space-x-4">
      <div className="bg-violet-100 text-violet-600 rounded-full p-3">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <p className="text-slate-500 text-sm mt-1">{children}</p>
      </div>
    </div>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onPlanTrip }) => {
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
        <div className="inline-flex items-center justify-center bg-white p-3 rounded-full shadow-md mb-6 border border-slate-200">
            <div className="bg-indigo-500 text-white rounded-full p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M21.435 2.585a2.02 2.02 0 0 0-1.89-.865H4.455a2.02 2.02 0 0 0-1.89.865L.01 9.42a1.514 1.514 0 0 0 .53 1.83l8.45 6.015V21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3.735l8.45-6.015a1.514 1.514 0 0 0 .53-1.83l-2.555-6.835zM14 15.265V20h-4v-4.735L2.615 9.78l2.04-5.46h14.71l2.04 5.46L14 15.265z"/></svg>
            </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Plan Your Dream Trip with AI
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-xl mx-auto">
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
      <div className="max-w-4xl mx-auto grid md:grid-cols-1 gap-6">
         <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} title="Smart Destinations">
            AI-powered recommendations based on your preferences and budget
        </FeatureCard>
        <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} title="Day-wise Planning">
            Detailed itineraries with activities planned for each day
        </FeatureCard>
        <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="Budget Friendly">
            Transparent pricing with options for every budget range
        </FeatureCard>
      </div>
      
      {/* Popular Destinations Section */}
      <div>
        <h2 className="text-3xl font-bold text-center text-slate-900">Popular Destinations</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <button key={dest.name} onClick={() => onPlanTrip(dest.name)} className="text-left bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1">
              <span className="text-3xl" role="img" aria-label="">{dest.icon}</span>
              <h3 className="text-lg font-semibold mt-3 text-slate-800">{dest.name}</h3>
              <p className="text-slate-500 text-sm">{dest.description}</p>
            </button>
          ))}
          {destinations.length === 0 && Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse">
              <div className="h-8 w-8 bg-slate-200 rounded-md"></div>
              <div className="h-4 bg-slate-200 rounded mt-4 w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded mt-2 w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default LandingPage;
