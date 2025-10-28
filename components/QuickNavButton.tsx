import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../services/authService';

interface QuickNavButtonProps {
  user: User | null;
  onOpenAuthModal: () => void;
}

const QuickNavButton: React.FC<QuickNavButtonProps> = ({
  user,
  onOpenAuthModal,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const checkScrollability = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current;
        const isScrollable = scrollHeight > clientHeight;
        const scrolledToBottom = scrollContainerRef.current.scrollTop + clientHeight >= scrollHeight - 10;
        setShowDownArrow(isScrollable && !scrolledToBottom);
      }
    };

    checkScrollability();
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const menuSections = [
    {
        title: 'Start a New Plan',
        items: [
            { 
                label: 'Complete Adventure Plan', 
                action: user ? () => navigate('/plan') : onOpenAuthModal, 
                icon: user ? '✨' : '🔒',
                locked: !user,
                tooltip: user ? undefined : 'Sign in to unlock'
            },
        ]
    },
    {
        title: 'Quick Tools',
        items: [
            { 
                label: 'Day-by-Day Itinerary', 
                action: user ? () => navigate('/itinerary') : onOpenAuthModal, 
                icon: user ? '🗓️' : '🔒',
                locked: !user,
                tooltip: user ? undefined : 'Sign in to unlock'
            },
            { 
                label: 'Smart Bag Packing', 
                action: user ? () => navigate('/packing') : onOpenAuthModal, 
                icon: user ? '🧳' : '🔒',
                locked: !user,
                tooltip: user ? undefined : 'Sign in to unlock'
            },
            { 
                label: 'Local Food Finder', 
                action: user ? () => navigate('/food') : onOpenAuthModal, 
                icon: user ? '🍲' : '🔒',
                locked: !user,
                tooltip: user ? undefined : 'Sign in to unlock'
            },
            { 
                label: 'Mobile App Finder', 
                action: user ? () => navigate('/apps') : onOpenAuthModal, 
                icon: user ? '📱' : '🔒',
                locked: !user,
                tooltip: user ? undefined : 'Sign in to unlock'
            },
            { 
                label: 'Local Music Finder', 
                action: user ? () => navigate('/music') : onOpenAuthModal, 
                icon: user ? '🎶' : '🔒',
                locked: !user,
                tooltip: user ? undefined : 'Sign in to unlock'
            },
            { 
                label: 'Local Lingo Guide', 
                action: user ? () => navigate('/lingo') : onOpenAuthModal, 
                icon: user ? '🗣️' : '🔒',
                locked: !user,
                tooltip: user ? undefined : 'Sign in to unlock'
            },
        ]
    },
    {
        title: 'General',
        items: [
            { label: 'Go Home', action: () => navigate('/'), icon: '🏠', locked: false },
            { 
                label: 'My History', 
                action: user ? () => navigate('/history') : onOpenAuthModal, 
                icon: user ? '📋' : '🔒',
                locked: !user,
                tooltip: user ? undefined : 'Sign in to view your history'
            },
            { label: 'Contact Us', action: () => navigate('/contact'), icon: '✉️', locked: false },
        ]
    }
  ];

  let itemIndex = 0;

  return (
    <div ref={navRef} className="fixed bottom-6 left-6 z-50 no-print hidden sm:block" aria-live="polite">
      {/* Scrollbar Styling */}
      <style>{`
        #quick-nav-menu > div::-webkit-scrollbar {
          width: 8px;
        }
        #quick-nav-menu > div::-webkit-scrollbar-track {
          background: transparent;
        }
        #quick-nav-menu > div::-webkit-scrollbar-thumb {
          background: #c4b5fd;
          border-radius: 10px;
          opacity: 0.7;
        }
        #quick-nav-menu > div::-webkit-scrollbar-thumb:hover {
          background: #a78bfa;
          opacity: 1;
        }
      `}</style>
      
      {/* Wrapper to handle positioning and animation context */}
      <div className="relative flex flex-col items-start">

        {/* Menu Panel */}
        <div
          id="quick-nav-menu"
          className={`absolute bottom-full mb-4 w-72 origin-bottom-left transition-all duration-300 ease-out max-h-[calc(100vh-120px)] ${
            isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
          }`}
          aria-hidden={!isOpen}
        >
          {/* Top Fade Indicator */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/90 to-transparent pointer-events-none z-10 rounded-t-xl" />
          
          {/* Down Arrow Indicator */}
          {showDownArrow && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <svg className="w-6 h-6 text-violet-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
          
          <div 
            ref={scrollContainerRef}
            className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-xl shadow-lg p-1.5 flex flex-col overflow-y-auto max-h-[calc(100vh-120px)] scroll-smooth" 
            style={{ 
              scrollbarWidth: 'thin', 
              scrollbarColor: '#c4b5fd transparent',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {menuSections.map((section, sectionIndex) => (
              <React.Fragment key={section.title}>
                {sectionIndex > 0 && <hr className="border-slate-200/80 mx-2 my-0.5" />}
                {section.title && <p className="px-3 pt-1.5 pb-0.5 text-xs font-bold text-slate-500 uppercase tracking-wider">{section.title}</p>}
                {section.items.map((item) => {
                  const currentItemIndex = itemIndex++;
                  const isLocked = item.locked || false;
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleAction(item.action)}
                      title={item.tooltip || item.label}
                      aria-label={item.label}
                      tabIndex={isOpen ? 0 : -1}
                      className={`w-full flex items-center text-left px-3 py-1.5 rounded-lg font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                        isLocked 
                          ? 'text-gray-500 hover:bg-gray-100/80 cursor-pointer' 
                          : 'text-slate-800 hover:bg-violet-100/80'
                      }`}
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
                      {isLocked && (
                        <span className="ml-auto text-xs text-gray-400">
                          Sign in
                        </span>
                      )}
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