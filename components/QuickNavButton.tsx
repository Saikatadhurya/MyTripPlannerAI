import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-expand on hover, collapse when mouse leaves
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 300); // Longer delay for smoother transition
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleAction = (action: () => void) => {
    action();
  };

  // Get component-specific colors
  const getItemColor = (label: string) => {
    const colorMap: { [key: string]: { bg: string; border: string; text: string; hoverBg: string } } = {
      'Complete Trip Plan': { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700', hoverBg: 'hover:bg-yellow-100' },
      'Day-by-Day Itinerary': { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', hoverBg: 'hover:bg-blue-100' },
      'Smart Bag Packing': { bg: 'bg-violet-50', border: 'border-violet-400', text: 'text-violet-700', hoverBg: 'hover:bg-violet-100' },
      'Local Food Finder': { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700', hoverBg: 'hover:bg-orange-100' },
      'Mobile App Finder': { bg: 'bg-teal-50', border: 'border-teal-400', text: 'text-teal-700', hoverBg: 'hover:bg-teal-100' },
      'Local Music Finder': { bg: 'bg-fuchsia-50', border: 'border-fuchsia-400', text: 'text-fuchsia-700', hoverBg: 'hover:bg-fuchsia-100' },
      'Local Lingo Guide': { bg: 'bg-sky-50', border: 'border-sky-400', text: 'text-sky-700', hoverBg: 'hover:bg-sky-100' },
      'Go Home': { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', hoverBg: 'hover:bg-green-100' },
      'My History': { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', hoverBg: 'hover:bg-amber-100' },
      'Contact Us': { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', hoverBg: 'hover:bg-purple-100' },
    };
    return colorMap[label] || { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', hoverBg: 'hover:bg-slate-100' };
  };

  // Check if current route matches
  const isActive = (item: { label: string; action: () => void }) => {
    const path = location.pathname;
    const actionStr = item.action.toString();
    
    // Special cases
    if (path === '/' && item.label === 'Go Home') return true;
    if (path === '/plan' && item.label === 'Complete Trip Plan') return true;
    if (path === '/itinerary' && item.label === 'Day-by-Day Itinerary') return true;
    if (path === '/packing' && item.label === 'Smart Bag Packing') return true;
    if (path === '/food' && item.label === 'Local Food Finder') return true;
    if (path === '/apps' && item.label === 'Mobile App Finder') return true;
    if (path === '/music' && item.label === 'Local Music Finder') return true;
    if (path === '/lingo' && item.label === 'Local Lingo Guide') return true;
    if (path === '/history' && item.label === 'My History') return true;
    if (path === '/contact' && item.label === 'Contact Us') return true;
    
    return false;
  };

  const menuSections = [
    {
      title: 'Start a New Plan',
      items: [
        { 
          label: 'Complete Trip Plan', 
          action: () => navigate('/plan'), 
          icon: '✨'
        },
      ]
    },
    {
      title: 'Quick Tools',
      items: [
        { 
          label: 'Day-by-Day Itinerary', 
          action: () => navigate('/itinerary'), 
          icon: '🗓️'
        },
        { 
          label: 'Smart Bag Packing', 
          action: () => navigate('/packing'), 
          icon: '🧳'
        },
        { 
          label: 'Local Food Finder', 
          action: () => navigate('/food'), 
          icon: '🍲'
        },
        { 
          label: 'Mobile App Finder', 
          action: () => navigate('/apps'), 
          icon: '📱'
        },
        { 
          label: 'Local Music Finder', 
          action: () => navigate('/music'), 
          icon: '🎶'
        },
        { label: 'Local Lingo Guide', action: () => navigate('/lingo'), icon: '🗣️' },
      ]
    },
    {
      title: 'General',
      items: [
        { label: 'Go Home', action: () => navigate('/'), icon: '🏠' },
        { 
          label: 'My History', 
          action: () => navigate('/history'), 
          icon: '📋'
        },
        { label: 'Contact Us', action: () => navigate('/contact'), icon: '✉️' },
      ]
    }
  ];

  return (
    <div 
      ref={navRef}
      className="fixed left-0 top-0 bottom-0 z-30 no-print hidden md:flex flex-col items-start"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Navigation sidebar"
    >
      {/* Sidebar Container */}
      <div 
        className={`h-full bg-white/95 backdrop-blur-xl border-r border-slate-200/50 shadow-xl transition-all duration-500 ease-in-out flex flex-col ${
          isExpanded ? 'w-64 shadow-2xl' : 'w-20'
        }`}
      >
        {/* Logo/Brand Section - Always visible */}
        <div className="px-4 py-5 border-b border-slate-200/50 flex items-center justify-center min-h-[80px]">
          <div className={`flex items-center gap-3 transition-all duration-500 ease-in-out ${isExpanded ? 'w-full' : 'w-auto'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-xl">✨</span>
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-slate-800 truncate">Menu</h2>
                <p className="text-xs text-slate-500 truncate">Your Travel Planner</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-violet-300 scrollbar-track-transparent hover:scrollbar-thumb-violet-400">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {/* Section Title - Only show when expanded */}
              {isExpanded && section.title && (
                <p className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const colors = getItemColor(item.label);
                  const active = isActive(item);
                  
                  // Build hover classes based on item type - using complete Tailwind classes
                  const getHoverClasses = (label: string) => {
                    if (label.includes('Adventure')) return 'hover:bg-yellow-100 hover:border-yellow-400';
                    if (label.includes('Itinerary')) return 'hover:bg-blue-100 hover:border-blue-400';
                    if (label.includes('Packing')) return 'hover:bg-violet-100 hover:border-violet-400';
                    if (label.includes('Food')) return 'hover:bg-orange-100 hover:border-orange-400';
                    if (label.includes('App')) return 'hover:bg-teal-100 hover:border-teal-400';
                    if (label.includes('Music')) return 'hover:bg-fuchsia-100 hover:border-fuchsia-400';
                    if (label.includes('Lingo')) return 'hover:bg-sky-100 hover:border-sky-400';
                    if (label.includes('Home')) return 'hover:bg-green-100 hover:border-green-400';
                    if (label.includes('History')) return 'hover:bg-amber-100 hover:border-amber-400';
                    if (label.includes('Contact')) return 'hover:bg-purple-100 hover:border-purple-400';
                    return 'hover:bg-slate-100 hover:border-slate-300';
                  };
                  
                  const hoverClasses = getHoverClasses(item.label);
                  
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleAction(item.action)}
                      title={!isExpanded ? item.label : undefined}
                      aria-label={item.label}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out group relative overflow-hidden ${
                        active 
                          ? `${colors.bg} ${colors.border} border-2 ${colors.text} shadow-sm` 
                          : `text-slate-600 border-transparent ${hoverClasses} hover:border-2 hover:shadow-sm`
                      } ${isExpanded ? 'justify-start' : 'justify-center'}`}
                    >
                      {/* Icon */}
                      <span className="text-2xl flex-shrink-0 transition-opacity duration-300">
                        {item.icon}
                      </span>
                      
                      {/* Label - Only show when expanded */}
                      {isExpanded && (
                        <span className="flex-1 text-left text-sm font-semibold truncate transition-opacity duration-500 ease-in-out opacity-100">
                          {item.label}
                        </span>
                      )}

                      {/* Active Indicator */}
                      {active && (
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 ${colors.bg} rounded-r-full ${colors.border} border-r-2`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section - Bottom */}
        <div className="px-2 py-4 border-t border-slate-200/50">
          {user ? (
            <div className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-500 ease-in-out ${isExpanded ? 'justify-start' : 'justify-center'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-md">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {isExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user.name || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email || ''}</p>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 shadow-md hover:shadow-lg ${
                isExpanded ? 'justify-start' : 'justify-center'
              }`}
              title={!isExpanded ? 'Sign In' : undefined}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {isExpanded && <span className="text-sm">Sign In</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickNavButton;
