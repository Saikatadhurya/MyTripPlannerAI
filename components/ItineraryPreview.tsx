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


const ItineraryPreview: React.FC<{ itinerary: Itinerary; onRegenerate: () => void; }> = ({ itinerary, onRegenerate }) => {
  const formattedStartDate = new Date(itinerary.startDate + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-12" id="itinerary-preview-content">
      <header className="space-y-4">
        <button onClick={onRegenerate} className="text-slate-600 hover:text-slate-900 flex items-center space-x-2 no-print">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <span>Plan another trip</span>
        </button>
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight" dangerouslySetInnerHTML={parseBold(itinerary.destination)} />
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
          <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} label="Travelers">
            {itinerary.persons} Person{itinerary.persons > 1 ? 's' : ''}
          </SummaryItem>
          <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} label="Budget / Vibe">
            {itinerary.budget} & {itinerary.vibe.join(', ')}
          </SummaryItem>
          <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>} label="Est. Stay / Person">
            <span dangerouslySetInnerHTML={parseBold(itinerary.budgetSummary.stay)} />
          </SummaryItem>
          <SummaryItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>} label="Est. Total / Person">
            <span dangerouslySetInnerHTML={parseBold(itinerary.budgetSummary.total)} />
          </SummaryItem>
        </div>
      </section>

      <div className="space-y-8">
        <section className="space-y-4">
            <h2 className="text-3xl font-bold text-slate-800">About {itinerary.destination}</h2>
            <InfoSection title="Historic Background">
                <p dangerouslySetInnerHTML={parseBold(itinerary.historicBackground)} />
            </InfoSection>
            <InfoSection title="Famous Culture" items={itinerary.famousCulture} />
        </section>

        <section className="space-y-4">
            <h2 className="text-3xl font-bold text-slate-800">Trip Essentials</h2>
            <InfoSection title="Special Events During Your Trip" items={itinerary.specialEvents} />
            <InfoSection title="Recommended Restaurants" items={itinerary.recommendedRestaurants} />
            <InfoSection title="Natural Places to Explore" items={itinerary.naturalPlaces} />
            <InfoSection title="Museums" items={itinerary.museums} />
            <InfoSection title="Special Ornaments & Souvenirs" items={itinerary.specialOrnaments} />
        </section>

        <section className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-800">Your Daily Plan</h2>
            {itinerary.plan.map((dayPlan) => (
                <div key={dayPlan.day} className="bg-white/40 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/50 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4 border-b border-violet-200/50 pb-4">
                        <h3 className="text-2xl font-bold text-violet-800">Day {dayPlan.day}: <span dangerouslySetInnerHTML={parseBold(dayPlan.title)} /></h3>
                        {dayPlan.approxCost && (
                            <div className="text-left sm:text-right flex-shrink-0 mt-2 sm:mt-0 sm:ml-4">
                            <p className="text-sm text-violet-700">Approx. Cost / Person</p>
                            <p className="font-bold text-xl text-slate-800" dangerouslySetInnerHTML={parseBold(dayPlan.approxCost)} />
                            </div>
                        )}
                    </div>
                    <div className="mt-4 grid md:grid-cols-3 gap-x-8 gap-y-6 text-gray-700 prose max-w-none">
                        <div>
                            <h4 className="font-semibold text-lg mb-2 text-slate-800 not-prose">Activities</h4>
                            <ul className="list-disc pl-5 space-y-1">
                            {dayPlan.activities.map((activity, index) => <li key={index} dangerouslySetInnerHTML={parseBold(activity)} />)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg mb-2 text-slate-800 not-prose">Food</h4>
                            <ul className="list-disc pl-5 space-y-1">
                            {dayPlan.food.map((foodItem, index) => <li key={index} dangerouslySetInnerHTML={parseBold(foodItem)} />)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg mb-2 text-slate-800 not-prose">Suggested Stay</h4>
                            <ul className="list-disc pl-5 space-y-1">
                            {dayPlan.placesToStay && dayPlan.placesToStay.length > 0
                                ? dayPlan.placesToStay.map((place, index) => <li key={index} dangerouslySetInnerHTML={parseBold(place)} />)
                                : <li>N/A</li>
                            }
                            </ul>
                        </div>
                    </div>
                </div>
            ))}
        </section>
        
        {itinerary.referenceBlogs && itinerary.referenceBlogs.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-slate-800">Reference Blog Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {itinerary.referenceBlogs.map((blog, index) => (
                <a
                  key={index}
                  href={blog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/40 backdrop-blur-lg p-5 rounded-xl shadow-lg border border-white/50 hover:shadow-xl hover:border-violet-300/50 transition-all duration-300 transform hover:-translate-y-1 block group"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-bold text-violet-900 group-hover:text-violet-700 transition-colors" dangerouslySetInnerHTML={parseBold(blog.title)} />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 group-hover:text-violet-600 transition-colors flex-shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 break-all">{blog.url}</p>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="mt-10 text-center space-y-4 no-print">
        <ExportOptions itinerary={itinerary} />
        <button
          onClick={onRegenerate}
          className="px-8 py-3 bg-white/60 text-slate-700 font-bold rounded-full hover:bg-white/80 transition-colors"
        >
          ✨ Spark a New Adventure
        </button>
      </footer>
    </div>
  );
};
export default ItineraryPreview;