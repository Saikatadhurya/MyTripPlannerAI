

import React, { useState, useEffect } from 'react';
import { Itinerary } from '../types';
import ExportOptions from './ExportOptions';
import { getReferenceBlogs } from '../services/geminiService';

// Helper to parse simple markdown bolding
const parseBold = (text: string | undefined) => {
  if (!text) return { __html: '' };
  // Simple regex to replace **text** with <strong>text</strong>
  return { __html: text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') };
};

const InfoSection: React.FC<{ title: string; icon: React.ReactNode; items?: string[]; children?: React.ReactNode }> = ({ title, icon, items, children }) => {
  if ((!items || items.length === 0) && !children) {
    return null;
  }
  return (
    <div className="bg-white/40 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-shrink-0 bg-violet-100 text-violet-600 rounded-lg p-3">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 break-words">{title}</h3>
      </div>
      <div className="prose prose-slate max-w-none text-gray-700 pl-1">
        {children}
        {items && items.length > 0 && (
          <ul className="list-disc pl-5 space-y-1">
            {items.map((item, index) => (
              <li key={index} dangerouslySetInnerHTML={parseBold(item)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const SummaryItem: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
    <div className="bg-white/40 backdrop-blur-md p-4 rounded-xl border border-white/50 flex items-center space-x-4">
        <div className="flex-shrink-0 bg-violet-100 text-violet-600 rounded-full p-3">
            {icon}
        </div>
        <div>
            <p className="text-sm text-violet-800 font-medium break-words">{label}</p>
            <div className="font-semibold text-lg text-slate-800 break-words">{children}</div>
        </div>
    </div>
);

// Helper to get currency symbol or code
const getCurrencySymbol = (currencyString: string): string => {
    if (!currencyString) return '';
    const symbolMatch = currencyString.match(/–\s*(.*)$/);
    if (symbolMatch && symbolMatch[1]) return symbolMatch[1].trim();
    const codeMatch = currencyString.match(/\((.*?)\)/);
    if (codeMatch && codeMatch[1]) return codeMatch[1].trim();
    return '';
};

// New component for budget cards
const BudgetCard: React.FC<{ title: string; icon: React.ReactNode; value: string; currencySymbol: string; isHighlighted?: boolean; animationDelay: string; }> = ({ title, icon, value, currencySymbol, isHighlighted = false, animationDelay }) => {
  // Clean value from any currency prefix the AI might have added
  const cleanedValue = value.replace(/^[A-Z]{3,5}\s?/, '').replace(/^[^\d\s.,-]+/, '').trim();
  
  // Regex to split the numerical part from the description
  const match = cleanedValue.match(/([\d,.\s-]+)\s*(.*)/s);
  
  let mainValue = cleanedValue;
  let description = '';

  if (match) {
    mainValue = match[1].trim();
    description = match[2].trim();
  }
  
  const cardClasses = isHighlighted 
    ? "bg-violet-600 text-white shadow-xl shadow-violet-500/30" 
    : "bg-white/50 backdrop-blur-lg border border-white/60 shadow-lg";
  
  const iconContainerClasses = isHighlighted
    ? "bg-white/20 text-white"
    : "bg-violet-100 text-violet-600";
    
  const textColorClasses = isHighlighted
    ? { title: 'text-violet-200', value: 'text-white', description: 'text-violet-200/90' }
    : { title: 'text-slate-600', value: 'text-slate-800', description: 'text-slate-500' };

  return (
    <div 
      className={`p-6 rounded-2xl text-center flex flex-col justify-start animated-card h-full ${cardClasses}`}
      style={{ animationDelay }}
    >
      <div className={`mx-auto rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0 ${iconContainerClasses}`}>
        {icon}
      </div>
      <p className={`mt-4 text-sm font-medium break-words ${textColorClasses.title}`}>{title}</p>
      <div className="mt-2 flex-grow flex flex-col justify-center">
        <p className={`text-2xl font-bold break-words ${textColorClasses.value}`}>{currencySymbol} {mainValue}</p>
        {description && <p className={`text-sm mt-1 break-words ${textColorClasses.description}`}>{description}</p>}
      </div>
    </div>
  );
};

// Helper to identify transport-related blogs
const isTransportBlog = (blog: Itinerary['referenceBlogs'][0]): boolean => {
    const keywords = ['transport', 'getting around', 'driving', 'bus', 'train', 'airport', 'commute', 'travel between', 'route', 'navigation'];
    const content = `${blog.title.toLowerCase()} ${blog.description.toLowerCase()}`;
    return keywords.some(keyword => content.includes(keyword));
};

const ItineraryPreview: React.FC<{ itinerary: Itinerary; onRegenerate: () => void; }> = ({ itinerary, onRegenerate }) => {
  const [blogs, setBlogs] = useState<Itinerary['referenceBlogs']>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  
  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoadingBlogs(true);
      const fetchedBlogs = await getReferenceBlogs(itinerary.destination, itinerary.language);
      setBlogs(fetchedBlogs);
      setIsLoadingBlogs(false);
    };
    fetchBlogs();
  }, [itinerary.destination, itinerary.language]);

  const formattedStartDate = new Date(itinerary.startDate + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const iconClass = "h-6 w-6";
  const currencySymbol = getCurrencySymbol(itinerary.currency);
  const isRoadTrip = itinerary.tripType === 'Car' || itinerary.tripType === 'Bike';

  // Helper function to safely parse cost strings into numbers
  const parseCost = (costString?: string): number => {
    if (!costString) return 0;
    // Removes currency symbols, codes, commas, and any other text before parsing.
    const cleaned = String(costString).replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const breakdownItems: Array<{ key: string; title: string; icon: React.ReactNode; value: string; }> = [];
  breakdownItems.push({
    key: 'stay',
    title: "Est. Stay Cost",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
    value: itinerary.budgetSummary.stay,
  });

  breakdownItems.push({
    key: 'food',
    title: "Est. Food Cost",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454V5.454c.523 0 1.046-.151 1.5-.454a2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0 2.704 2.704 0 003 0c.454.303.977.454 1.5.454v10.092zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    value: itinerary.budgetSummary.food,
  });

  if (isRoadTrip && itinerary.budgetSummary.fuel) {
    breakdownItems.push({
      key: 'fuel',
      title: "Est. Fuel Cost",
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
      value: itinerary.budgetSummary.fuel,
    });
  }

  if (itinerary.budgetSummary.miscellaneous) {
    breakdownItems.push({
      key: 'misc',
      title: isRoadTrip ? "Misc. & Tolls" : "Activities & Misc.",
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
      value: itinerary.budgetSummary.miscellaneous,
    });
  }
  
  const stayCost = parseCost(itinerary.budgetSummary.stay);
  const foodCost = parseCost(itinerary.budgetSummary.food);
  const miscCost = parseCost(itinerary.budgetSummary.miscellaneous);
  const fuelCost = isRoadTrip ? parseCost(itinerary.budgetSummary.fuel) : 0;
  const calculatedTotal = stayCost + foodCost + miscCost + fuelCost;
  
  const budgetItemsForGrid = [
    ...breakdownItems.map(item => ({ ...item, isHighlighted: false })),
    {
      key: 'total',
      title: "Total Est. Per Person",
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      value: calculatedTotal.toFixed(2),
      isHighlighted: true,
    }
  ];
  
  const getAboutSectionsForDestination = (destinationDetails: Itinerary['coveredDestinations'][0]) => {
    return [
      { title: 'History', items: destinationDetails.historicBackground, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
      { title: 'Culture', items: destinationDetails.famousCulture, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-3-5.197m0 0A7.962 7.962 0 0112 4.354a7.962 7.962 0 013 3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 003-5.197z" /></svg> },
      { title: 'Nature', items: destinationDetails.naturalPlaces, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9" /></svg> },
      { title: 'Museums', items: destinationDetails.museums, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg> },
      { title: 'Restaurants', items: destinationDetails.recommendedRestaurants, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 13.5l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 18l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 21.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 18l1.035-.259a3.375 3.375 0 002.456-2.456L18 13.5z" /></svg> },
      { title: 'Souvenirs', items: destinationDetails.specialOrnaments, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg> },
      { title: 'Events', content: destinationDetails.specialEvents, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    ].filter(section => (section.content || (section.items && section.items.length > 0)));
  };

  const generateMapsUrl = () => {
    const waypoints: string[] = [];

    // Add start point if it exists
    if (itinerary.startPoint) {
        waypoints.push(itinerary.startPoint);
    }

    // Add covered destinations, avoiding consecutive duplicates
    if (itinerary.coveredDestinations) {
        itinerary.coveredDestinations.forEach(dest => {
            if (waypoints.length === 0 || waypoints[waypoints.length - 1].toLowerCase() !== dest.name.toLowerCase()) {
                waypoints.push(dest.name);
            }
        });
    }

    // If it's a round trip, add start point at the end if it's not already there
    if (itinerary.isRoundTrip && itinerary.startPoint) {
        if (waypoints.length === 0 || waypoints[waypoints.length - 1].toLowerCase() !== itinerary.startPoint.toLowerCase()) {
            waypoints.push(itinerary.startPoint);
        }
    }
    
    // If we have less than 2 waypoints, it's not a route. Search for the main destination instead.
    if (waypoints.length < 2) {
        const singlePlace = itinerary.destination || itinerary.startPoint || 'world';
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(singlePlace)}`;
    }
    
    // Build the directions URL
    return `https://www.google.com/maps/dir/${waypoints.map(p => encodeURIComponent(p)).join('/')}`;
  };


  return (
    <div className="max-w-4xl mx-auto space-y-12" id="itinerary-preview-content">
       <div className="flex justify-start items-center no-print animated-card">
        <button
          onClick={onRegenerate}
          className="inline-flex items-center px-6 py-2 my-2 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 2.566l-1.581.53a5.002 5.002 0 00-8.917-1.789v.962a1 1 0 01-2 0V3a1 1 0 011-1zm12 15a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.898-2.566l1.581-.53a5.002 5.002 0 008.917 1.789v-.962a1 1 0 012 0V17a1 1 0 01-1 1z" clipRule="evenodd" />
          </svg>
          <span>Plan Another Trip</span>
        </button>
      </div>
      <header className="space-y-4 animated-card">
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight break-words" dangerouslySetInnerHTML={parseBold(`Trip to ${itinerary.destination}`)} />
            <p className="text-lg text-gray-700 mt-2 break-words">Your amazing {itinerary.days}-day {itinerary.isRoundTrip ? 'round trip ' : ''}itinerary</p>
        </div>
      </header>
      
      <section>
        <h2 className="text-3xl font-bold text-slate-800 mb-6 animated-card" style={{ animationDelay: '100ms' }}>Trip Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="animated-card" style={{ animationDelay: '200ms' }}>
            <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} label="Start Date">
              {formattedStartDate}
            </SummaryItem>
          </div>
          <div className="animated-card" style={{ animationDelay: '250ms' }}>
            <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} label="Duration">
              {itinerary.days} Day{itinerary.days > 1 ? 's' : ''}
            </SummaryItem>
          </div>
          <div className="animated-card" style={{ animationDelay: '300ms' }}>
            <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} label="Travelers">
              {itinerary.persons} Person{itinerary.persons > 1 ? 's' : ''}
            </SummaryItem>
          </div>
          <div className="animated-card" style={{ animationDelay: '350ms' }}>
            <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>} label="Vibe">
              {itinerary.vibe.join(', ')}
            </SummaryItem>
          </div>
           <div className="animated-card" style={{ animationDelay: '400ms' }}>
            <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454V5.454c.523 0 1.046-.151 1.5-.454a2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0 2.704 2.704 0 003 0c.454.303.977.454 1.5.454v10.092zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} label="Food Preference">
              {itinerary.foodPreference}
            </SummaryItem>
          </div>
          <div className="animated-card" style={{ animationDelay: '450ms' }}>
            <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m-6 3l6-3m0 0l6-3m-6 3v6.382" /></svg>} label="Trip Type">
              {itinerary.tripType} {itinerary.isRoundTrip && <span className="text-sm font-normal">(Round Trip)</span>}
            </SummaryItem>
          </div>
        </div>

        <div className="mt-8 text-center animated-card" style={{ animationDelay: '500ms' }}>
          <a
            href={generateMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center group px-8 py-4 bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold rounded-full transition-all duration-300 shadow-lg shadow-violet-500/30 transform hover:scale-105 hover:shadow-xl hover:shadow-violet-500/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m-6 3l6-3m0 0l6-3m-6 3v6.382" />
            </svg>
            View Route on Google Maps
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-slate-800 mb-6 animated-card" style={{ animationDelay: '500ms' }}>Budget Overview <span className="text-base font-normal text-slate-600">(Est. Per Person)</span></h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {budgetItemsForGrid.map((item, index) => {
            const isLastItem = index === budgetItemsForGrid.length - 1;
            // Span the last item if the total number of items is odd
            const wrapperClass = (isLastItem && budgetItemsForGrid.length % 2 !== 0) ? 'sm:col-span-2' : '';

            return (
              <div key={item.key} className={wrapperClass}>
                <BudgetCard
                  title={item.title}
                  icon={item.icon}
                  value={String(item.value)}
                  currencySymbol={currencySymbol}
                  isHighlighted={item.isHighlighted}
                  animationDelay={`${550 + index * 50}ms`}
                />
              </div>
            );
          })}
        </div>
      </section>

      {itinerary.planNote && (
        <section className="animated-card" style={{ animationDelay: '800ms' }}>
            <div className="bg-amber-50/60 backdrop-blur-lg p-6 rounded-2xl border border-amber-200/50 shadow-lg flex items-start space-x-4">
                <div className="flex-shrink-0 bg-amber-100 text-amber-600 rounded-full p-3 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-amber-800">Important Plan Note</h3>
                    <div className="mt-2 text-md text-slate-700" dangerouslySetInnerHTML={parseBold(itinerary.planNote)} />
                </div>
            </div>
        </section>
      )}

      {itinerary.currencyConversion && (
        <section className="animated-card" style={{ animationDelay: '850ms' }}>
            <div className="bg-sky-50/60 backdrop-blur-lg p-6 rounded-2xl border border-sky-200/50 shadow-lg flex items-start space-x-4">
                <div className="flex-shrink-0 bg-sky-100 text-sky-600 rounded-full p-3 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-sky-800">Currency Conversion</h3>
                    <div className="mt-2 space-y-1">
                        <p className="text-sm text-slate-700">
                            Destination's Local Currency: <strong className="font-semibold text-slate-800">{itinerary.currencyConversion.toCurrency}</strong>
                        </p>
                        <p className="text-md text-slate-700">
                            Conversion Rate: <strong className="font-semibold text-slate-900">{itinerary.currencyConversion.rateText}</strong>
                        </p>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                        Note: All costs in this itinerary are shown in your chosen currency ({itinerary.currencyConversion.fromCurrency}). This rate helps you understand local prices.
                    </p>
                </div>
            </div>
        </section>
      )}
      
      <section>
        <h2 className="text-3xl font-bold text-slate-800 mb-6 animated-card" style={{ animationDelay: '900ms' }}>About the Destinations</h2>
        <div className="space-y-10">
          {itinerary.coveredDestinations && itinerary.coveredDestinations.map((dest, destIndex) => {
            const aboutSections = getAboutSectionsForDestination(dest);
            const eventSection = aboutSections.find(s => s.title === 'Events');
            const otherSections = aboutSections.filter(s => s.title !== 'Events');
            
            return (
              <div key={destIndex} className="animated-card" style={{ animationDelay: `${950 + destIndex * 200}ms` }}>
                <h3 className="text-2xl font-bold text-slate-700 mb-4 border-b border-violet-200 pb-2 break-words" dangerouslySetInnerHTML={parseBold(dest.name)} />
                {otherSections.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {otherSections.map((section, index) => (
                      <InfoSection key={index} title={section.title} icon={section.icon} items={section.items}>
                        {section.content && !section.items ? (
                          <div dangerouslySetInnerHTML={parseBold(section.content as string)} />
                        ) : null}
                      </InfoSection>
                    ))}
                  </div>
                )}
                {eventSection && (
                    <div className="mt-6">
                        <InfoSection title={eventSection.title} icon={eventSection.icon}>
                           {eventSection.content && <div dangerouslySetInnerHTML={parseBold(eventSection.content as string)} />}
                        </InfoSection>
                    </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-slate-800 animated-card" style={{ animationDelay: '1050ms' }}>Daily Itinerary</h2>
        {itinerary.plan.map((day, index) => {
          let dailyFuelCostPerPerson = 0;
          let totalDailyCostPerPerson = parseFloat(day.approxCost) || 0;

          if (isRoadTrip && day.transport?.cost && parseFloat(day.transport.cost) > 0) {
              const vehicleCapacity = itinerary.tripType === 'Car' ? 5 : 2;
              const numVehicles = Math.ceil(itinerary.persons / vehicleCapacity);
              const dayTotalFuelCost = parseFloat(day.transport.cost) * numVehicles;
              if (itinerary.persons > 0) {
                dailyFuelCostPerPerson = dayTotalFuelCost / itinerary.persons;
                totalDailyCostPerPerson += dailyFuelCostPerPerson;
              }
          }

          return (
          <div key={day.day} className="bg-white/40 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/50 transition-all duration-300 hover:shadow-2xl hover:border-violet-300/50 hover:-translate-y-1 animated-card" style={{ animationDelay: `${1100 + index * 100}ms` }}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-semibold text-violet-700">Day {day.day}</p>
                <h3 className="text-2xl font-bold text-slate-800 break-words" dangerouslySetInnerHTML={parseBold(day.title)} />
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-bold text-slate-800 bg-violet-100 px-4 py-1 rounded-full whitespace-nowrap">{currencySymbol} {totalDailyCostPerPerson.toFixed(2)}</p>
                <p className="text-xs text-slate-600 mt-1">Total/Person</p>
              </div>
            </div>
            <hr className="my-4 border-violet-200" />
            <div className="space-y-6">
              <div className="bg-white/40 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/50">
                  <h3 className="text-xl font-bold text-violet-800 mb-4">Activities</h3>
                  <div className="prose prose-slate max-w-none text-gray-700">
                    {day.activities && day.activities.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1">
                        {day.activities.map((item, index) => (
                          <li key={index} dangerouslySetInnerHTML={parseBold(item)} />
                        ))}
                      </ul>
                    )}
                  </div>
              </div>

              <div className="bg-white/40 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/50">
                  <h3 className="text-xl font-bold text-violet-800 mb-4">Food Recommendations</h3>
                  <div className="prose prose-slate max-w-none text-gray-700">
                     {day.food && day.food.length > 0 && (
                        <ul className="list-disc pl-5 space-y-1">
                          {day.food.map((item, index) => (
                            <li key={index} dangerouslySetInnerHTML={parseBold(item)} />
                          ))}
                        </ul>
                      )}
                  </div>
              </div>
              
               <div className="bg-white/40 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/50">
                  <h3 className="text-xl font-bold text-violet-800 mb-4">Suggested Places to Stay</h3>
                  <div className="prose prose-slate max-w-none text-gray-700">
                    {day.placesToStay && day.placesToStay.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1">
                        {day.placesToStay.map((item, index) => (
                          <li key={index} dangerouslySetInnerHTML={parseBold(item)} />
                        ))}
                      </ul>
                    )}
                  </div>
              </div>
              
              {day.transport && (
                <div className="bg-violet-50/50 backdrop-blur-lg p-4 rounded-xl border border-violet-200/50">
                   <h4 className="font-bold text-violet-800 flex items-center space-x-2 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18.562 6.077C18.238 5.437 17.562 5 16.808 5H3.192c-.754 0-1.43.437-1.754 1.077L.05 9.423A.5.5 0 00.5 10h19a.5.5 0 00.45-.577l-1.388-3.346zM2 11v4a1 1 0 001 1h1a1 1 0 001-1v-4H2zm15 0v4a1 1 0 001 1h1a1 1 0 001-1v-4h-3zM5 11v4a1 1 0 001 1h8a1 1 0 001-1v-4H5z" clipRule="evenodd" /></svg>
                      <span>Transport Suggestions</span>
                   </h4>
                   {isRoadTrip && dailyFuelCostPerPerson > 0 && (
                      <p className="text-sm text-slate-700 mb-2">
                          <strong>Est. Fuel Cost:</strong> {currencySymbol}{dailyFuelCostPerPerson.toFixed(2)} per person
                      </p>
                   )}
                   <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      {[].concat(day.transport.suggestions || []).map((item, index) => (
                        <li key={index} dangerouslySetInnerHTML={parseBold(String(item))} />
                      ))}
                   </ul>
                </div>
              )}
              
              {day.medicalFacilities && day.medicalFacilities.length > 0 && (
                <div className="bg-green-50/50 backdrop-blur-lg p-4 rounded-xl border border-green-200/50">
                   <h4 className="font-bold text-green-800 flex items-center space-x-2 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414L9 10.414V13a1 1 0 102 0v-2.586l.293.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" /></svg>
                      <span>Nearby Medical Facilities</span>
                   </h4>
                   <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      {day.medicalFacilities.map((item, index) => (
                        <li key={index} dangerouslySetInnerHTML={parseBold(item)} />
                      ))}
                   </ul>
                </div>
              )}

            </div>
          </div>
        )})}
      </section>

      {isLoadingBlogs ? (
        <section>
          <h2 className="text-3xl font-bold text-slate-800 mb-6 animated-card flex items-center space-x-3">
             <svg className="animate-spin h-6 w-6 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             <span>Finding helpful blogs...</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array(2).fill(0).map((_, i) => (
              <div key={i} className="bg-white/40 p-5 rounded-xl border border-white/50 shadow-lg animate-pulse">
                <div className="h-4 bg-slate-200/50 rounded w-1/4"></div>
                <div className="h-5 bg-slate-200/50 rounded mt-2 w-3/4"></div>
                <div className="h-4 bg-slate-200/50 rounded mt-3 w-full"></div>
                <div className="h-4 bg-slate-200/50 rounded mt-1 w-5/6"></div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        blogs && blogs.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-slate-800 mb-6 animated-card" style={{ animationDelay: '1250ms' }}>Reference Blog Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogs.map((blog, index) => {
               const isTransport = isTransportBlog(blog);
               return (
                <a 
                  key={index}
                  href={blog.url} target="_blank" rel="noopener noreferrer"
                  className={`block p-5 rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animated-card ${
                    isTransport 
                      ? 'bg-sky-50/40 backdrop-blur-lg border-sky-300/50 hover:border-sky-400/50' 
                      : 'bg-white/40 backdrop-blur-lg border-white/50 hover:border-violet-300/50'
                  }`}
                   style={{ animationDelay: `${1300 + index * 100}ms` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {blog.source && <p className={`text-xs font-semibold uppercase tracking-wider ${isTransport ? 'text-sky-600' : 'text-violet-600'}`}>{blog.source}</p>}
                      <h4 className="text-lg font-bold text-slate-800 mt-1 hover:underline break-words">{blog.title}</h4>
                    </div>
                    {isTransport && (
                      <div className="flex-shrink-0 ml-4 bg-sky-100 text-sky-600 rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18.562 6.077C18.238 5.437 17.562 5 16.808 5H3.192c-.754 0-1.43.437-1.754 1.077L.05 9.423A.5.5 0 00.5 10h19a.5.5 0 00.45-.577l-1.388-3.346zM2 11v4a1 1 0 001 1h1a1 1 0 001-1v-4H2zm15 0v4a1 1 0 001 1h1a1 1 0 001-1v-4h-3zM5 11v4a1 1 0 001 1h8a1 1 0 001-1v-4H5z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{blog.description}</p>
                </a>
              );
            })}
          </div>
        </section>
        )
      )}

      <div className="pt-8 text-center no-print">
        <ExportOptions itinerary={itinerary} />
        <button
            onClick={onRegenerate}
            className="mt-8 inline-flex items-center px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 2.566l-1.581.53a5.002 5.002 0 00-8.917-1.789v.962a1 1 0 01-2 0V3a1 1 0 011-1zm12 15a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.898-2.566l1.581-.53a5.002 5.002 0 008.917 1.789v-.962a1 1 0 012 0V17a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
            <span>Plan Another Trip</span>
        </button>
      </div>
    </div>
  );
};

export default ItineraryPreview;