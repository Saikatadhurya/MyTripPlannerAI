import React, { useState, useEffect, useRef } from 'react';

// --- Bottom Nav Bar Component ---
export interface BottomNavBarProps {
  onGoHome: () => void;
  onPlanTrip: () => void;
  onStartItineraryPlanner: () => void;
  onStartPacking: () => void;
  onStartFoodFinder: () => void;
  onStartAppFinder: () => void;
  onStartMusicFinder: () => void;
  onStartLingoFinder: () => void;
  onGoToContact: () => void;
  activeView: string;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}> = ({ icon, label, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-1 flex-col items-center justify-center pt-2 pb-1 transition-colors duration-200 focus:outline-none ${isActive ? 'text-violet-600' : 'text-slate-500 hover:text-violet-600'}`}
    aria-current={isActive ? 'page' : undefined}
  >
    <div className={`absolute top-0 h-1 w-6 rounded-full transition-all duration-300 ${isActive ? 'bg-violet-600' : 'bg-transparent'}`}></div>
    {icon}
    <span className={`text-xs mt-1 text-center ${isActive ? 'font-bold' : 'font-semibold'}`}>{label}</span>
  </button>
);

const MoreMenu: React.FC<{
    onStartItineraryPlanner: () => void;
    onStartFoodFinder: () => void;
    onStartAppFinder: () => void;
    onStartMusicFinder: () => void;
    onStartLingoFinder: () => void;
    onClose: () => void;
}> = ({ onStartItineraryPlanner, onStartFoodFinder, onStartAppFinder, onStartMusicFinder, onStartLingoFinder, onClose }) => {
    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white/95 backdrop-blur-xl border border-slate-200/70 rounded-xl shadow-lg p-2 flex flex-col z-40">
            <button onClick={() => handleAction(onStartItineraryPlanner)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">🗓️</span>
                <span>Itinerary Planner</span>
            </button>
             <hr className="border-slate-200/80 mx-2 my-1" />
             <button onClick={() => handleAction(onStartFoodFinder)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">🍲</span>
                <span>Food Finder</span>
            </button>
            <button onClick={() => handleAction(onStartAppFinder)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">📱</span>
                <span>App Finder</span>
            </button>
            <button onClick={() => handleAction(onStartMusicFinder)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">🎶</span>
                <span>Music Finder</span>
            </button>
            <button onClick={() => handleAction(onStartLingoFinder)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">🗣️</span>
                <span>Lingo Guide</span>
            </button>
        </div>
    );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onGoHome,
  onPlanTrip,
  onStartItineraryPlanner,
  onStartPacking,
  onStartFoodFinder,
  onStartAppFinder,
  onStartMusicFinder,
  onStartLingoFinder,
  onGoToContact,
  activeView,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  
  const iconClass = "h-6 w-6";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
            setIsMoreMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMoreSectionActive = ['foodFinderForm', 'appFinderForm', 'musicFinderForm', 'lingoFinderForm', 'questionnaire'].includes(activeView);

  return (
    <div id="bottom-nav-bar" className="fixed bottom-0 left-0 right-0 z-50 no-print">
      <div className="w-full bg-white border-t border-slate-200/80 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch h-16">
          <NavItem
            label="Home"
            onClick={onGoHome}
            isActive={activeView === 'landing'}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>}
          />
          <NavItem
            label="Plan Trip"
            onClick={onPlanTrip}
            isActive={activeView === 'unifiedPlannerForm'}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 13.5l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 18l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 21.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 18l1.035-.259a3.375 3.375 0 002.456-2.456L18 13.5z" /></svg>}
          />
          <NavItem
            label="Packing"
            onClick={onStartPacking}
            isActive={activeView === 'packingAssistantForm'}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a3 3 0 00-3 3v1H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-2V5a3 3 0 00-3-3zm-1 4a1 1 0 10-2 0v1h2V6z" clipRule="evenodd" /></svg>}
          />
          <NavItem
            label="Contact"
            onClick={onGoToContact}
            isActive={activeView === 'contact'}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <div ref={moreMenuRef} className="relative flex flex-1">
            {isMoreMenuOpen && (
                <MoreMenu
                    onStartItineraryPlanner={onStartItineraryPlanner}
                    onStartFoodFinder={onStartFoodFinder}
                    onStartAppFinder={onStartAppFinder}
                    onStartMusicFinder={onStartMusicFinder}
                    onStartLingoFinder={onStartLingoFinder}
                    onClose={() => setIsMoreMenuOpen(false)}
                />
            )}
            <NavItem
                label="More"
                onClick={() => setIsMoreMenuOpen(prev => !prev)}
                isActive={isMoreMenuOpen || isMoreSectionActive}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNavBar;