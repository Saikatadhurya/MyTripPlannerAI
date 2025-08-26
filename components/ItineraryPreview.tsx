
import React from 'react';
import { Itinerary } from '../types';
import ExportOptions from './ExportOptions';

interface ItineraryPreviewProps {
  itinerary: Itinerary;
  onRegenerate: () => void;
}

const InfoSection: React.FC<{ title: string; items?: string[]; children?: React.ReactNode }> = ({ title, items, children }) => {
  if ((!items || items.length === 0) && !children) {
    return null;
  }
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h3 className="text-2xl font-bold text-violet-600 mb-3">{title}</h3>
      <div className="prose prose-slate max-w-none text-gray-700">
        {children}
        {items && items.length > 0 && (
          <ul className="list-disc pl-5 space-y-1">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const ItineraryPreview: React.FC<ItineraryPreviewProps> = ({ itinerary, onRegenerate }) => {
  const formattedStartDate = new Date(itinerary.startDate + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto" id="itinerary-preview-content">
      <div className="mb-10">
        <button onClick={onRegenerate} className="text-slate-500 hover:text-slate-800 flex items-center space-x-2 mb-4 no-print">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <span>Back</span>
        </button>
        <h1 className="text-4xl font-bold text-gray-900 text-center">{itinerary.destination}</h1>
        <p className="text-lg text-gray-600 mt-2 text-center">Your amazing {itinerary.days}-day itinerary</p>
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-bold mb-4 text-violet-800">Trip Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <div>
                <p className="text-sm text-violet-600">Start Date</p>
                <p className="font-semibold text-lg text-violet-900">{formattedStartDate}</p>
            </div>
            <div>
                <p className="text-sm text-violet-600">Budget</p>
                <p className="font-semibold text-lg text-violet-900">{itinerary.budget}</p>
            </div>
             <div>
                <p className="text-sm text-violet-600">Diet</p>
                <p className="font-semibold text-lg text-violet-900">{itinerary.foodPreference}</p>
            </div>
            <div>
                <p className="text-sm text-violet-600">Stay / day</p>
                <p className="font-semibold text-lg text-violet-900">{itinerary.budgetSummary.stay}</p>
            </div>
            <div>
                <p className="text-sm text-violet-600">Food / day</p>
                <p className="font-semibold text-lg text-violet-900">{itinerary.budgetSummary.food}</p>
            </div>
            <div>
                <p className="text-sm text-violet-600">Total Est.</p>
                <p className="font-semibold text-lg text-violet-900">{itinerary.budgetSummary.total}</p>
            </div>
        </div>
      </div>

      <div className="space-y-8">
        <InfoSection title="Special Events During Your Trip" items={itinerary.specialEvents} />

        <InfoSection title="Historic Background">
          <p>{itinerary.historicBackground}</p>
        </InfoSection>

        <InfoSection title="Famous Culture" items={itinerary.famousCulture} />
        <InfoSection title="Places to Stay" items={itinerary.placesToStay} />
        <InfoSection title="Recommended Restaurants" items={itinerary.recommendedRestaurants} />
        <InfoSection title="Natural Places to Explore" items={itinerary.naturalPlaces} />
        <InfoSection title="Museums" items={itinerary.museums} />
        <InfoSection title="Special Ornaments & Souvenirs" items={itinerary.specialOrnaments} />

        {itinerary.plan.map((dayPlan) => (
          <div key={dayPlan.day} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 transition-all duration-300">
            <h2 className="text-3xl font-bold text-violet-700 mb-4">Day {dayPlan.day}: {dayPlan.title}</h2>
            <div className="mt-4 grid md:grid-cols-2 gap-x-8 gap-y-6 text-gray-700 prose max-w-none">
              <div>
                <h4 className="font-semibold text-lg mb-2 text-slate-800">Activities</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {dayPlan.activities.map((activity, index) => <li key={index}>{activity}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2 text-slate-800">Food</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {dayPlan.food.map((foodItem, index) => <li key={index}>{foodItem}</li>)}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center space-y-4 no-print">
        <ExportOptions itinerary={itinerary} />
        <button
          onClick={onRegenerate}
          className="px-8 py-3 bg-slate-100 text-slate-700 font-bold rounded-full hover:bg-slate-200 transition-colors"
        >
          Regenerate with new preferences
        </button>
      </div>
    </div>
  );
};
export default ItineraryPreview;