import React from 'react';
import { Itinerary } from '../types';
import ExportOptions from './ExportOptions';

// Helper to parse simple markdown bolding
const parseBold = (text: string | undefined) => {
  if (!text) return { __html: '' };
  // Simple regex to replace **text** with <strong>text</strong>
  return { __html: text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') };
};

const InfoSection: React.FC<{ title: string; items?: string[]; children?: React.ReactNode }> = ({ title, items, children }) => {
  if ((!items || items.length === 0) && !children) {
    return null;
  }
  return (
    <div className="bg-white/40 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/50">
      <h3 className="text-xl font-bold text-violet-800 mb-4">{title}</h3>
      <div className="prose prose-slate max-w-none text-gray-700">
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
            <p className="text-sm text-violet-800 font-medium">{label}</p>
            <div className="font-semibold text-lg text-slate-800">{children}</div>
        </div>
    </div>
);

// Helper to identify transport-related blogs
const isTransportBlog = (blog: Itinerary['referenceBlogs'][0]): boolean => {
    const keywords = ['transport', 'getting around', 'driving', 'bus', 'train', 'airport', 'commute', 'travel between', 'route', 'navigation'];
    const content = `${blog.title.toLowerCase()} ${blog.description.toLowerCase()}`;
    return keywords.some(keyword => content.includes(keyword));
};

const ItineraryPreview: React.FC<{ itinerary: Itinerary; onRegenerate: () => void; }> = ({ itinerary, onRegenerate }) => {
  const formattedStartDate = new Date(itinerary.startDate + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-12" id="itinerary-preview-content">
      <header className="space-y-4">
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight" dangerouslySetInnerHTML={parseBold(`Trip to ${itinerary.destination}`)} />
            <p className="text-lg text-gray-700 mt-2">Your amazing {itinerary.days}-day itinerary</p>
        </div>
      </header>
      
      <section>
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Trip Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} label="Start Date">
            {formattedStartDate}
          </SummaryItem>
          <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} label="Duration">
            {itinerary.days} Day{itinerary.days > 1 ? 's' : ''}
          </SummaryItem>
          <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} label="Travelers">
            {itinerary.persons} Person{itinerary.persons > 1 ? 's' : ''}
          </SummaryItem>
          <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} label="Budget">
            {itinerary.budget}
          </SummaryItem>
          <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>} label="Vibe">
            {itinerary.vibe.join(', ')}
          </SummaryItem>
          <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454V5.454c.523 0 1.046-.151 1.5-.454a2.704 2.704 0 013 0 2.704 2.704 0 003 0 2.704 2.704 0 013 0 2.704 2.704 0 003 0c.454.303.977.454 1.5.454v10.092zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} label="Food Preference">
            {itinerary.foodPreference}
          </SummaryItem>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Budget Overview <span className="text-base font-normal text-slate-600">(Est. Per Person)</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <SummaryItem icon={<span>🏨</span>} label="Est. Stay Cost">{itinerary.budgetSummary.stay}</SummaryItem>
          <SummaryItem icon={<span>🍜</span>} label="Est. Food Cost">{itinerary.budgetSummary.food}</SummaryItem>
          <SummaryItem icon={<span>💰</span>} label="Est. Total Cost">{itinerary.budgetSummary.total}</SummaryItem>
        </div>
      </section>
      
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-slate-800">About {itinerary.destination}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoSection title="Historic Background">
            <p dangerouslySetInnerHTML={parseBold(itinerary.historicBackground)} />
          </InfoSection>
          <InfoSection title="Famous Culture" items={itinerary.famousCulture} />
          <InfoSection title="Natural Places to Explore" items={itinerary.naturalPlaces} />
          <InfoSection title="Museums" items={itinerary.museums} />
          <InfoSection title="Recommended Restaurants" items={itinerary.recommendedRestaurants} />
          <InfoSection title="Special Ornaments & Souvenirs" items={itinerary.specialOrnaments} />
          <InfoSection title="Special Events During Your Trip" items={itinerary.specialEvents} />
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-slate-800">Daily Itinerary</h2>
        {itinerary.plan.map((day) => (
          <div key={day.day} className="bg-white/40 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/50 transition-all duration-300 hover:shadow-2xl hover:border-violet-300/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-violet-700">Day {day.day}</p>
                <h3 className="text-2xl font-bold text-slate-800" dangerouslySetInnerHTML={parseBold(day.title)} />
              </div>
              <p className="text-lg font-semibold text-slate-700 bg-violet-100 px-4 py-1 rounded-full">{day.approxCost}</p>
            </div>
            <hr className="my-4 border-violet-200" />
            <div className="space-y-6">
              <InfoSection title="Activities" items={day.activities} />
              <InfoSection title="Food Recommendations" items={day.food} />
              <InfoSection title="Suggested Places to Stay" items={day.placesToStay} />
              
              {day.transport && (
                <div className="bg-violet-50/50 backdrop-blur-lg p-4 rounded-xl border border-violet-200/50">
                   <h4 className="font-bold text-violet-800 flex items-center space-x-2 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                      <span>Transport Suggestions (Cost: {day.transport.cost})</span>
                   </h4>
                   <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      {day.transport.suggestions.map((item, index) => (
                        <li key={index} dangerouslySetInnerHTML={parseBold(item)} />
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
        ))}
      </section>

      {itinerary.referenceBlogs && itinerary.referenceBlogs.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Reference Blog Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {itinerary.referenceBlogs.map((blog, index) => {
               const isTransport = isTransportBlog(blog);
               return (
                <a 
                  href={blog.url} 
                  key={index} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`block p-5 rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    isTransport 
                      ? 'bg-sky-50/40 backdrop-blur-lg border-sky-300/50 hover:border-sky-400/50' 
                      : 'bg-white/40 backdrop-blur-lg border-white/50 hover:border-violet-300/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {blog.source && <p className={`text-xs font-semibold uppercase tracking-wider ${isTransport ? 'text-sky-600' : 'text-violet-600'}`}>{blog.source}</p>}
                      <h4 className="text-lg font-bold text-slate-800 mt-1">{blog.title}</h4>
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