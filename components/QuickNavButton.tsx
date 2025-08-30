
import React, { useState, useEffect, useRef } from 'react';

interface QuickNavButtonProps {
  onPlanTrip: () => void;
  onStartPacking: () => void;
  onStartFoodFinder: () => void;
  onStartAppFinder: () => void;
  onStartMusicFinder: () => void;
}

const QuickNavButton: React.FC<QuickNavButtonProps> = ({
  onPlanTrip,
  onStartPacking,
  onStartFoodFinder,
  onStartAppFinder,
  onStartMusicFinder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Auto-collapse on click outside
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

  // Wrapper function to close menu after action
  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const menuItems = [
    { label: 'Plan My Trip', action: () => handleAction(onPlanTrip), icon: '✨' },
    { label: 'Smart Bag Packing', action: () => handleAction(onStartPacking), icon: '🧳' },
    { label: 'Local Food Finder', action: () => handleAction(onStartFoodFinder), icon: '🍲' },
    { label: 'Mobile App Finder', action: () => handleAction(onStartAppFinder), icon: '📱' },
    { label: 'Local Music Finder', action: () => handleAction(onStartMusicFinder), icon: '🎶' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div
      ref={navRef}
      className="fixed bottom-6 left-6 z-50 flex flex-col-reverse items-center space-y-4 space-y-reverse"
      // Expand on hover for desktop
      onMouseEnter={() => window.innerWidth >= 1024 && setIsOpen(true)}
      onMouseLeave={() => window.innerWidth >= 1024 && setIsOpen(false)}
    >
      {/* Main toggle button */}
      <button
        onClick={toggleMenu}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-50/80 to-violet-100/80 backdrop-blur-lg border-2 border-white/90 shadow-lg shadow-violet-500/30 flex items-center justify-center text-slate-800 transition-all duration-300 transform hover:scale-110 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-4 focus:ring-white/50"
        aria-label="Open quick navigation"
        aria-expanded={isOpen}
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Grid Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`absolute h-7 w-7 text-slate-900 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-45 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
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
                className={`absolute h-7 w-7 text-slate-900 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-45 scale-50'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </div>
      </button>

      {/* Menu items list */}
      <div
        className={`flex flex-col-reverse items-center space-y-3 space-y-reverse transition-all duration-300 ease-in-out`}
      >
        {menuItems.map((item, index) => {
          const isPrimary = item.label === 'Plan My Trip';
          const secondaryColors: { [key: string]: string } = {
            'Smart Bag Packing': 'bg-violet-500/40',
            'Local Food Finder': 'bg-amber-500/40',
            'Mobile App Finder': 'bg-teal-500/40',
            'Local Music Finder': 'bg-fuchsia-500/40',
          };
          const buttonColor = isPrimary
            ? 'bg-gradient-to-br from-indigo-500/80 to-violet-500/80 shadow-indigo-500/50'
            : secondaryColors[item.label] || 'bg-slate-500/40';
          
          const buttonSize = isPrimary ? 'w-16 h-16' : 'w-14 h-14';

          return (
            <div
              key={item.label}
              className={`transition-all duration-300 ease-in-out ${
                isOpen
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
              style={{ transitionDelay: isOpen ? `${index * 40}ms` : '0ms' }}
            >
              <button
                onClick={item.action}
                className={`rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform transform hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/50 backdrop-blur-md border border-white/20 ${buttonColor} ${buttonSize}`}
                title={item.label}
              >
                <span style={{ textShadow: '0 2px 5px rgba(0,0,0,0.25)' }}>
                  {item.icon}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickNavButton;
