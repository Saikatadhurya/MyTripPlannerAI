import React, { useState, useEffect, useRef } from 'react';

interface QuickNavButtonProps {
  onPlanTrip: () => void;
  onStartPacking: () => void;
  onStartFoodFinder: () => void;
  onStartAppFinder: () => void;
  onStartMusicFinder: () => void;
  onGoHome: () => void;
  onGoToContact: () => void;
}

const QuickNavButton: React.FC<QuickNavButtonProps> = ({
  onPlanTrip,
  onStartPacking,
  onStartFoodFinder,
  onStartAppFinder,
  onStartMusicFinder,
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

  const menuItems = [
    { label: 'Go Home', action: onGoHome, icon: '🏠' },
    { label: 'Plan New Trip', action: onPlanTrip, icon: '✨' },
    { label: 'Smart Bag Packing', action: onStartPacking, icon: '🧳' },
    { label: 'Local Food Finder', action: onStartFoodFinder, icon: '🍲' },
    { label: 'Mobile App Finder', action: onStartAppFinder, icon: '📱' },
    { label: 'Local Music Finder', action: onStartMusicFinder, icon: '🎶' },
    { label: 'Contact Us', action: onGoToContact, icon: '✉️' },
  ];

  return (
    <div ref={navRef} className="fixed bottom-6 left-6 z-50 flex items-center space-x-3 no-print">
      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 backdrop-blur-lg border-2 border-white/50 shadow-lg shadow-violet-500/30 flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-4 focus:ring-white/50"
        aria-label="Open quick navigation"
        aria-expanded={isOpen}
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

      {/* Menu Items */}
      {menuItems.map((item, index) => (
        <button
          key={item.label}
          onClick={() => handleAction(item.action)}
          title={item.label}
          aria-label={item.label}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all duration-300 ease-in-out bg-white/60 backdrop-blur-lg border border-white/40 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50 ${
            isOpen
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-4 pointer-events-none'
          }`}
          style={{ transitionDelay: isOpen ? `${index * 40}ms` : '0ms' }}
        >
          <span style={{ textShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>{item.icon}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickNavButton;
