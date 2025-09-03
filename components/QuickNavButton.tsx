import React, { useState, useEffect, useRef } from 'react';

interface QuickNavButtonProps {
  onPlanTrip: () => void;
  onPlanItinerary: () => void;
  onStartPacking: () => void;
  onStartFoodFinder: () => void;
  onStartAppFinder: () => void;
  onStartMusicFinder: () => void;
  onStartLingoFinder: () => void;
  onGoHome: () => void;
  onGoToContact: () => void;
}

const QuickNavButton: React.FC<QuickNavButtonProps> = ({
  onPlanTrip,
  onPlanItinerary,
  onStartPacking,
  onStartFoodFinder,
  onStartAppFinder,
  onStartMusicFinder,
  onStartLingoFinder,
  onGoHome,
  onGoToContact,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const menuSections = [
    {
        title: 'Start a New Plan',
        items: [
            { label: 'Complete Adventure Plan', action: onPlanTrip, icon: '✨' },
        ]
    },
    {
        title: 'Quick Tools',
        items: [
            { label: 'Day-by-Day Itinerary', action: onPlanItinerary, icon: '🗓️' },
            { label: 'Smart Bag Packing', action: onStartPacking, icon: '🧳' },
            { label: 'Local Food Finder', action: onStartFoodFinder, icon: '🍲' },
            { label: 'Mobile App Finder', action: onStartAppFinder, icon: '📱' },
            { label: 'Local Music Finder', action: onStartMusicFinder, icon: '🎶' },
            { label: 'Local Lingo Guide', action: onStartLingoFinder, icon: '🗣️' },
        ]
    },
    {
        title: 'General',
        items: [
            { label: 'Go Home', action: onGoHome, icon: '🏠' },
            { label: 'Contact Us', action: onGoToContact, icon: '✉️' },
        ]
    }
  ];

  let itemIndex = 0;

  return (
    <div ref={navRef} className="fixed bottom-6 left-6 z-50 no-print hidden sm:block" aria-live="polite">
      {/* Wrapper to handle positioning and animation context */}
      <div className="relative flex flex-col items-start">

        {/* Menu Panel */}
        <div
          id="quick-nav-menu"
          className={`absolute bottom-full mb-4 w-72 origin-bottom-left transition-all duration-300 ease-out ${
            isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
          }`}
          aria-hidden={!isOpen}
        >
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-xl shadow-lg p-2 flex flex-col">
            {menuSections.map((section, sectionIndex) => (
              <React.Fragment key={section.title}>
                {sectionIndex > 0 && <hr className="border-slate-200/80 mx-2 my-1" />}
                {section.title && <p className="px-3 pt-2 pb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">{section.title}</p>}
                {section.items.map((item) => {
                  const currentItemIndex = itemIndex++;
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleAction(item.action)}
                      title={item.label}
                      aria-label={item.label}
                      tabIndex={isOpen ? 0 : -1}
                      className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80 focus:outline-none focus:ring-2 focus:ring-violet-400"
                      style={{
                          transitionDelay: isOpen ? `${currentItemIndex * 30}ms` : '0ms',
                          opacity: isOpen ? 1 : 0,
                          transform: isOpen ? 'translateY(0)' : 'translateY(5px)',
                          transitionProperty: 'opacity, transform, background-color',
                          transitionDuration: '300ms',
                          transitionTimingFunction: 'ease-out',
                      }}
                    >
                      <span className="text-xl w-8 text-center">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 backdrop-blur-lg border-2 border-white/50 shadow-lg shadow-violet-500/30 flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-4 focus:ring-white/50"
          aria-label="Open quick navigation"
          aria-expanded={isOpen}
          aria-controls="quick-nav-menu"
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
              {/* Grid Icon */}
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`absolute h-7 w-7 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-45 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
              >
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              </svg>

              {/* Close Icon */}
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`absolute h-7 w-7 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-45 scale-50'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
          </div>
        </button>
      </div>
    </div>
  );
};

export default QuickNavButton;