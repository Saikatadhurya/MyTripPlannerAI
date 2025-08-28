import React, { useState } from 'react';
import { PackingList } from '../types';

const parseBold = (text: string | undefined) => {
  if (!text) return { __html: '' };
  return { __html: text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') };
};

const AccordionSection: React.FC<{ title: string; icon: React.ReactNode; items: string[]; }> = ({ title, icon, items }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!items || items.length === 0) return null;

    return (
        <div className="bg-white/40 backdrop-blur-lg p-4 rounded-xl shadow-lg border border-white/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left"
                aria-expanded={isOpen}
            >
                <div className="flex items-center space-x-3">
                    <span className="text-violet-600">{icon}</span>
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                </div>
                <svg className={`h-6 w-6 text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen mt-4' : 'max-h-0 mt-0'}`}>
                <div className="prose prose-slate max-w-none text-gray-700 pl-4">
                    <ul className="list-disc pl-5 space-y-1">
                        {items.map((item, index) => (
                            <li key={index} dangerouslySetInnerHTML={parseBold(item)} />
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};


const PackingListPreview: React.FC<{ packingList: PackingList; onRegenerate: () => void; }> = ({ packingList, onRegenerate }) => {
    const iconClass = "h-6 w-6";
    const sections = [
        { title: "Clothing & Footwear", items: packingList.clothingAndFootwear, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16.5a1.5 1.5 0 01-1.415-1.031l-1.12-3.36A1.5 1.5 0 014.38 10.5H5a2 2 0 012 2v2.5a.5.5 0 001 0V12a2 2 0 012-2h1.122a1.5 1.5 0 011.415 1.531l-1.12 3.36A1.5 1.5 0 0114.5 16.5h-9z" /><path fillRule="evenodd" d="M12.5 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM4 5.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" clipRule="evenodd" /></svg> },
        { title: "Toiletries & Personal Care", items: packingList.toiletriesAndPersonalCare, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16.5a1.5 1.5 0 01-1.415-1.031l-1.12-3.36A1.5 1.5 0 014.38 10.5H5a2 2 0 012 2v2.5a.5.5 0 001 0V12a2 2 0 012-2h1.122a1.5 1.5 0 011.415 1.531l-1.12 3.36A1.5 1.5 0 0114.5 16.5h-9z" /><path fillRule="evenodd" d="M12.5 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM4 5.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" clipRule="evenodd" /></svg> },
        { title: "Medicines & Health", items: packingList.medicinesAndHealth, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg> },
        { title: "Electronics & Gear", items: packingList.electronicsAndGear, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg> },
        { title: "Documents & Money", items: packingList.documentsAndMoney, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg> },
        { title: "Optional Comfort Items", items: packingList.optionalComfortItems, icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg> },
    ];
    
    return (
        <div className="max-w-2xl mx-auto space-y-12 animated-card">
            <header className="space-y-4">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight" dangerouslySetInnerHTML={parseBold(`Packing for ${packingList.destination}`)} />
                    <p className="text-lg text-gray-700 mt-2">Your personalized {packingList.days}-day packing checklist</p>
                </div>
            </header>

            <section className="space-y-6">
                <div className="bg-violet-50/60 backdrop-blur-lg p-6 rounded-2xl border border-violet-200/50 shadow-lg">
                    <h3 className="text-xl font-bold text-violet-800 mb-2">Bag Suggestion</h3>
                    <p className="text-slate-700 text-lg" dangerouslySetInnerHTML={parseBold(packingList.bagSuggestion)} />
                </div>
                {packingList.locallyAvailableItems && packingList.locallyAvailableItems.length > 0 && (
                    <div className="bg-sky-50/60 backdrop-blur-lg p-6 rounded-2xl border border-sky-200/50 shadow-lg">
                        <h3 className="text-xl font-bold text-sky-800 mb-2">Consider Buying Locally</h3>
                        <p className="text-slate-600 mb-3 text-sm">To save space, you can easily purchase these items at your destination:</p>
                        <div className="prose prose-slate max-w-none text-gray-700">
                            <ul className="list-disc pl-5 space-y-1">
                                {packingList.locallyAvailableItems.map((item, index) => (
                                    <li key={index} dangerouslySetInnerHTML={parseBold(item)} />
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </section>

            <section className="space-y-4">
                {sections.map(section => (
                    <AccordionSection key={section.title} {...section} />
                ))}
            </section>
            
            <div className="pt-8 text-center no-print">
                <button
                    onClick={onRegenerate}
                    className="mt-8 inline-flex items-center px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.22M20 15a9 9 0 01-14.13 5.22" /></svg>
                    <span>Create Another List</span>
                </button>
            </div>
        </div>
    );
};

export default PackingListPreview;
