import React, { useState, useEffect } from 'react';
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
  onOpenAuthModal: () => void;
  onGoToBlog: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ user, onPlanUnifiedTrip, onPlanItinerary, onStartPacking, onStartFoodFinder, onStartAppFinder, onStartMusicFinder, onStartLingoFinder, onOpenAuthModal, onGoToBlog }) => {
  const [destinations, setDestinations] = useState<PopularDestination[]>([]);

  // Map of destination names to share links
  const shareLinks: { [key: string]: string } = {
    'Goa, India': '/share/2cf3d8b0-ca4a-41ae-8f63-b0c6372092b1',
    'Rajasthan, India': '/share/6a8d939c-21b6-494c-8fb0-473bd59a1ed9',
    'Dubai, UAE': '/share/f2300726-8744-4f8b-a689-cfcd65a1ee0f',
    'Bangkok, Thailand': '/share/c56afa4b-fd73-4557-8f63-67e1027726fd',
    'Singapore': '/share/49c4066d-948b-4ee6-a5fa-7d13d6e6ef04',
  };

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
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      buttonText: 'Plan Itinerary',
    },
    {
      id: 'packing',
      title: 'Smart Bag Packing',
      description: 'AI-powered packing tailored for your trip',
      onClick: onStartPacking,
      color: 'violet' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2zm3-3a1 1 0 011-1h2a1 1 0 110 2H10a1 1 0 01-1-1z" /></svg>,
      buttonText: 'Pack My Bag',
    },
    {
      id: 'food',
      title: 'Local Food Finder',
      description: 'Discover authentic local cuisine',
      onClick: onStartFoodFinder,
      color: 'orange' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      buttonText: 'Find My Feast',
    },
    {
      id: 'apps',
      title: 'Mobile App Finder',
      description: 'Find essential local apps for your trip',
      onClick: onStartAppFinder,
      color: 'teal' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
      buttonText: 'Find My Apps',
    },
    {
      id: 'music',
      title: 'Local Music Finder',
      description: 'Discover the soundtrack of your travels',
      onClick: onStartMusicFinder,
      color: 'fuchsia' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      buttonText: 'Discover Music',
    },
    {
      id: 'lingo',
      title: 'Local Lingo Guide',
      description: 'Learn essential phrases for your trip',
      onClick: onStartLingoFinder,
      color: 'sky' as const,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      buttonText: 'Get Phrases',
    },
  ];
  
  return (
    <div className="space-y-8 md:space-y-16 lg:space-y-20 pb-8 px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
      {/* Hero Section */}
      <div 
        onClick={(e) => {
          // Only trigger on mobile (when button is full width)
          // Check if click target is the button or its children
          const target = e.target as HTMLElement;
          if (target.closest('button')) {
            return; // Let button handle its own click
          }
          // On mobile, clicking anywhere opens the form
          if (window.innerWidth < 640) { // sm breakpoint
            onPlanUnifiedTrip();
          }
        }}
        className="animated-card text-center max-w-4xl mx-auto p-5 sm:p-6 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-50 via-purple-50/50 to-pink-50/40 backdrop-blur-xl border-2 border-violet-300/80 shadow-xl sm:shadow-2xl shadow-violet-500/30 hover:shadow-2xl sm:hover:shadow-3xl hover:shadow-violet-500/40 transition-all duration-500 relative overflow-hidden cursor-pointer sm:cursor-default" 
        style={{ animationDelay: '100ms' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (window.innerWidth < 640) {
              e.preventDefault();
              onPlanUnifiedTrip();
            }
          }
        }}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100/20 via-transparent to-purple-100/20 pointer-events-none"></div>
        <div className="relative z-10">
          {user && user.full_name && (
            <div className="mb-3 sm:mb-4 md:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-violet-600 tracking-wide">
                Welcome, {user.full_name}! 👋
              </h2>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight px-2">
            Your Dream Trip, <span className="text-violet-600">Planned to Perfection.</span>
          </h1>
          <p className="mt-3 sm:mt-4 md:mt-6 text-sm sm:text-base md:text-lg lg:text-xl text-slate-700 max-w-2xl mx-auto font-medium px-2">
            Complete travel planning made simple. Just tell us where you want to go.
          </p>
           <div className="mt-6 sm:mt-8 md:mt-10">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent parent click handler
                onPlanUnifiedTrip();
              }}
              className="cta-pulse w-full sm:w-auto inline-block px-5 py-3 sm:px-6 sm:py-3.5 md:px-10 md:py-4 lg:px-12 lg:py-5 font-bold rounded-full text-sm sm:text-base md:text-lg lg:text-xl shadow-xl sm:shadow-2xl transition-all duration-300 transform focus:outline-none focus:ring-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-violet-500/50 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl sm:hover:shadow-2xl hover:shadow-violet-500/60 hover:scale-105 sm:hover:scale-110 focus:ring-violet-300 whitespace-nowrap"
            >
              ✨ Build Your Ultimate Itinerary
            </button>
            <p className="mt-3 sm:mt-4 md:mt-5 text-xs sm:text-sm md:text-base text-violet-700 font-semibold tracking-wide px-2">
              Includes: Itinerary, Packing, Food, Apps, Music & Language Guides
            </p>
          </div>
        </div>
      </div>

      {/* Mini Apps Section */}
      <div className="text-center">
        <h2 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight animated-card px-2" style={{ animationDelay: '200ms' }}>
          Smart tools to make your trip <span className="text-violet-600">unforgettable.</span>
        </h2>
        <div className="mt-4 sm:mt-6 md:mt-10 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
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
                <div className="p-2 sm:p-4 md:p-6 flex flex-col text-center h-full sm:[transform:translateZ(40px)] relative z-10">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent ${colors.hoverGradient} transition-all duration-300 sm:duration-500 rounded-xl sm:rounded-2xl -z-0`}></div>
                    <div className="flex-grow relative z-10">
                        <div className={`mx-auto w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 sm:duration-500 group-hover:scale-110 group-hover:shadow-md sm:group-hover:shadow-lg ${colors.iconBg} ${colors.iconText}`}>
                            {app.icon}
                        </div>
                        <h3 className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-slate-900 mt-1.5 sm:mt-3 md:mt-5">{app.title}</h3>
                        <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 mt-0.5 sm:mt-1 line-clamp-2">
                            {app.description}
                        </p>
                    </div>
                    <div className="mt-1.5 sm:mt-3 md:mt-6 flex-shrink-0 relative z-10">
                        <span className={`inline-block px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 lg:px-6 lg:py-2.5 font-semibold rounded-full text-[10px] sm:text-xs md:text-sm shadow-sm sm:shadow-md transition-all duration-300 group-hover:shadow-md sm:group-hover:shadow-lg ${colors.button}`}>
                             {app.buttonText}
                        </span>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Popular Destinations Section */}
      <div>
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-6 animated-card" style={{ animationDelay: '1100ms' }}>Popular Destinations</h2>
        
        {/* Destinations with share links */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {destinations.map((dest, index) => {
            const shareLink = shareLinks[dest.name];
            
            if (shareLink) {
              return (
                <a
                  key={dest.name}
                  href={shareLink}
                  className="animated-card text-left p-5 rounded-2xl border-2 shadow-xl transition-all duration-500 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-violet-400/50 bg-gradient-to-br from-white via-violet-50/40 to-purple-50/30 backdrop-blur-xl border-violet-200/60 hover:shadow-2xl hover:shadow-violet-500/25 hover:border-violet-400/80 cursor-pointer block relative overflow-hidden group"
                  style={{ animationDelay: `${1200 + index * 50}ms` }}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/10 group-hover:to-purple-500/10 transition-all duration-500 rounded-2xl"></div>
                  <span className="text-4xl relative z-10 group-hover:scale-110 transition-transform duration-500 inline-block" role="img" aria-label="destination">{dest.icon}</span>
                  <h3 className="text-lg font-semibold mt-3 text-slate-800 relative z-10">{dest.name}</h3>
                  <p className="text-slate-600 text-sm relative z-10">{dest.description}</p>
                </a>
              );
            }
            return null;
          })}
        </div>

        {/* Try Yourself Subsection */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center text-slate-800 mb-6 animated-card" style={{ animationDelay: '1300ms' }}>Try Yourself</h3>
          <p className="text-center text-slate-600 mb-6 animated-card" style={{ animationDelay: '1350ms' }}>Create your own personalized itinerary for these amazing destinations</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {destinations.map((dest, index) => {
              const shareLink = shareLinks[dest.name];
              
              if (!shareLink) {
                return (
                  <button 
                    key={dest.name} 
                    onClick={() => onPlanUnifiedTrip(dest.name)} 
                    className="animated-card text-left p-5 rounded-2xl border-2 shadow-xl transition-all duration-500 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-violet-400/50 bg-gradient-to-br from-white via-violet-50/40 to-purple-50/30 backdrop-blur-xl border-violet-200/60 hover:shadow-2xl hover:shadow-violet-500/25 hover:border-violet-400/80 cursor-pointer relative overflow-hidden group"
                    style={{ animationDelay: `${1400 + index * 50}ms` }}
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/10 group-hover:to-purple-500/10 transition-all duration-500 rounded-2xl"></div>
                    <span className="text-4xl relative z-10 group-hover:scale-110 transition-transform duration-500 inline-block" role="img" aria-label="destination">{dest.icon}</span>
                    <h3 className="text-lg font-semibold mt-3 text-slate-800 relative z-10">{dest.name}</h3>
                    <p className="text-slate-600 text-sm relative z-10">{dest.description}</p>
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
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8 animated-card" style={{ animationDelay: '1600ms' }}>
          Travel Blog
        </h2>
        <p className="text-center text-slate-600 mb-8 animated-card" style={{ animationDelay: '1650ms' }}>
          Discover expert travel tips, guides, and stories to inspire your next adventure
        </p>
        <div className="animated-card" style={{ animationDelay: '1700ms' }}>
          <BlogCarousel onViewMore={onGoToBlog} />
        </div>
      </section>

      {/* Testimonials Section */}
      <section>
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8 animated-card" style={{ animationDelay: '1750ms' }}>
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