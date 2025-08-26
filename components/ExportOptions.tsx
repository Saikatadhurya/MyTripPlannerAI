
import React from 'react';
import { Itinerary } from '../types';

interface ExportOptionsProps {
  itinerary: Itinerary;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ itinerary }) => {
  
  const generatePlainText = () => {
    let text = `Your Trip to ${itinerary.destination}\n`;
    text += `===================================\n\n`;
    text += `Duration: ${itinerary.days} days\n`;
    text += `Start Date: ${new Date(itinerary.startDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    text += `Budget: ${itinerary.budget}\n`;
    text += `Vibe: ${itinerary.vibe.join(', ')}\n`;
    text += `Food Preference: ${itinerary.foodPreference}\n\n`;
    text += `Budget Summary:\n`;
    text += `- Stay (est.): ${itinerary.budgetSummary.stay}\n`;
    text += `- Food (est.): ${itinerary.budgetSummary.food}\n`;
    text += `- Total Est. Trip Cost: ${itinerary.budgetSummary.total}\n\n`;
    
    const formatSection = (title: string, content: string[] | string) => {
      let sectionText = `## ${title}\n`;
      if (Array.isArray(content) && content.length > 0) {
        sectionText += content.map(item => `- ${item}`).join('\n') + '\n\n';
      } else if (typeof content === 'string' && content) {
        sectionText += content + '\n\n';
      } else {
        return '';
      }
      return sectionText;
    };

    text += formatSection('Special Events During Your Trip', itinerary.specialEvents);
    text += formatSection('Historic Background', itinerary.historicBackground);
    text += formatSection('Famous Culture', itinerary.famousCulture);
    text += formatSection('Recommended Restaurants', itinerary.recommendedRestaurants);
    text += formatSection('Natural Places to Explore', itinerary.naturalPlaces);
    text += formatSection('Museums', itinerary.museums);
    text += formatSection('Special Ornaments & Souvenirs', itinerary.specialOrnaments);

    text += `## Daily Plan\n`;
    text += `================\n\n`;

    itinerary.plan.forEach(day => {
        text += `Day ${day.day}: ${day.title}\n`;
        text += `-----------------\n`;
        if (day.approxCost) {
          text += `Approx. Cost / Person: ${day.approxCost}\n\n`;
        }
        if (day.activities && day.activities.length > 0) {
          text += `Activities:\n${day.activities.map(a => `- ${a}`).join('\n')}\n\n`;
        }
        if (day.food && day.food.length > 0) {
          text += `Food:\n${day.food.map(f => `- ${f}`).join('\n')}\n\n`;
        }
        
        text += `Suggested Stay:\n`;
        if (day.placesToStay && day.placesToStay.length > 0) {
          text += `${day.placesToStay.map(p => `- ${p}`).join('\n')}\n\n`;
        } else {
          text += `- N/A\n\n`;
        }
    });
    return text;
  };

  const handleCopyToClipboard = async () => {
    const text = generatePlainText().replace(/\*\*/g, ''); // Remove markdown before copying
    try {
      await navigator.clipboard.writeText(text);
      alert('Itinerary copied to clipboard!');
    } catch (err) {
      console.error('Could not copy text: ', err);
      alert('Failed to copy itinerary.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex justify-center items-center space-x-4">
      <button
        onClick={handlePrint}
        className="px-6 py-2 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-colors"
      >
        Print Itinerary
      </button>
      <button
        onClick={handleCopyToClipboard}
        className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-full hover:bg-gray-300 transition-colors"
      >
        Copy to Clipboard
      </button>
    </div>
  );
};

export default ExportOptions;
