import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../services/authService';

interface BottomNavBarProps {
  onOpenAuthModal: () => void;
  user: User | null;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  locked?: boolean;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  tooltip?: string;
}> = ({ icon, label, onClick, isActive, locked, tooltip }) => (
  <button
    onClick={onClick}
    title={tooltip || label}
    className={`flex flex-1 flex-col items-center justify-center pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-violet-600' : (locked ? 'text-gray-500' : 'text-slate-500 hover:text-violet-600')}`}
  >
    {icon}
    <span className="text-xs font-semibold mt-1 text-center">{label}</span>
  </button>
);

const MoreMenu: React.FC<{
    onStartAppFinder: () => void;
    onStartMusicFinder: () => void;
    onStartLingoGuide: () => void;
    onStartItinerary: () => void;
    onGoToContact: () => void;
    onClose: () => void;
    onOpenAuthModal: () => void;
    user: User | null;
}> = ({ onStartAppFinder, onStartMusicFinder, onStartLingoGuide, onStartItinerary, onGoToContact, onClose, onOpenAuthModal, user }) => {
    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    const lockedAction = user ? undefined : onOpenAuthModal;

    return (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white/95 backdrop-blur-xl border border-slate-200/70 rounded-xl shadow-lg p-2 flex flex-col z-40">
            <button onClick={() => handleAction(user ? onStartAppFinder : onOpenAuthModal)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">{user ? '📱' : '🔒'}</span>
                <span>App Finder</span>
                {!user && <span className="ml-auto text-xs text-gray-400">Sign in</span>}
            </button>
            <button onClick={() => handleAction(user ? onStartMusicFinder : onOpenAuthModal)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">{user ? '🎶' : '🔒'}</span>
                <span>Music Finder</span>
                {!user && <span className="ml-auto text-xs text-gray-400">Sign in</span>}
            </button>
            <button onClick={() => handleAction(user ? onStartLingoGuide : onOpenAuthModal)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">{user ? '🗣️' : '🔒'}</span>
                <span>Lingo Guide</span>
                {!user && <span className="ml-auto text-xs text-gray-400">Sign in</span>}
            </button>
            <button onClick={() => handleAction(user ? onStartItinerary : onOpenAuthModal)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">{user ? '🗓️' : '🔒'}</span>
                <span>Itinerary Planner</span>
                {!user && <span className="ml-auto text-xs text-gray-400">Sign in</span>}
            </button>
            <hr className="border-slate-200/80 mx-2 my-1" />
            <button onClick={() => handleAction(onGoToContact)} className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-slate-800 font-semibold transition-colors duration-200 hover:bg-violet-100/80">
                <span className="text-xl w-8 text-center">✉️</span>
                <span>Contact Us</span>
            </button>
        </div>
    );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onOpenAuthModal,
  user,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  
  const iconClass = "h-6 w-6";
  const lockedIcon = <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4 4 0 00-4 4v2a2 2 0 00-2 2v5a2 2 0 002 2h8a2 2 0 002-2v-5a2 2 0 00-2-2V5a4 4 0 00-4-4zm-2 6V5a2 2 0 114 0v2H8zm-3 5v2h8v-2H5z" clipRule="evenodd" /></svg>;

  const handleAction = useCallback((action: () => void, isLocked: boolean) => {
    if (isLocked) {
      onOpenAuthModal();
    } else {
      action();
    }
    setIsMoreMenuOpen(false); // Close menu on any action
  }, [onOpenAuthModal]);

  const navItems = [
    { 
      ids: ['/'], 
      label: 'Home', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>, 
      action: () => navigate('/'), 
      locked: false 
    },
    { 
      ids: ['/plan'], 
      label: 'Plan Trip', 
      icon: user ? <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 13.5l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 18l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 21.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 18l1.035-.259a3.375 3.375 0 002.456-2.456L18 13.5z" /></svg> : lockedIcon, 
      action: () => navigate('/plan'), 
      locked: !user, 
      tooltip: user ? undefined : 'Sign in to unlock' 
    },
    { 
      ids: ['/packing'], 
      label: 'Packing', 
      icon: user ? <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a3 3 0 00-3 3v1H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2h-2V5a3 3 0 00-3-3zm-1 4a1 1 0 10-2 0v1h2V6z" clipRule="evenodd" /></svg> : lockedIcon, 
      action: () => navigate('/packing'), 
      locked: !user, 
      tooltip: user ? undefined : 'Sign in to unlock' 
    },
    { 
      ids: ['/food'], 
      label: 'Food', 
      icon: user ? <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1.088A7 7 0 004.53 10.756.5.5 0 005 11h10a.5.5 0 00.47-.244A7 7 0 0011 4.088V3z" /><path fillRule="evenodd" d="M15 13a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h10z" clipRule="evenodd" /></svg> : lockedIcon, 
      action: () => navigate('/food'), 
      locked: !user, 
      tooltip: user ? undefined : 'Sign in to unlock' 
    },
    { 
      ids: ['/history'], 
      label: 'History', 
      icon: user ? <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg> : lockedIcon, 
      action: () => navigate('/history'), 
      locked: !user, 
      tooltip: user ? undefined : 'Sign in to view your history' 
    },
  ];
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
            setIsMoreMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMoreSectionActive = ['/contact', '/apps', '/music', '/lingo', '/itinerary'].includes(location.pathname);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden no-print">
      <div className="w-full bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)]">
        <div className="flex items-stretch h-16">
          {navItems.map(item => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              onClick={() => handleAction(item.action, item.locked)}
              isActive={item.ids.includes(location.pathname)}
              locked={item.locked}
              tooltip={item.tooltip}
            />
          ))}
          <div ref={moreMenuRef} className="relative flex-1">
            {isMoreMenuOpen && (
                <MoreMenu
                    onStartAppFinder={() => navigate('/apps')}
                    onStartMusicFinder={() => navigate('/music')}
                    onStartLingoGuide={() => navigate('/lingo')}
                    onStartItinerary={() => navigate('/itinerary')}
                    onGoToContact={() => navigate('/contact')}
                    onClose={() => setIsMoreMenuOpen(false)}
                    onOpenAuthModal={onOpenAuthModal}
                    user={user}
                />
            )}
            <button
                onClick={() => setIsMoreMenuOpen(prev => !prev)}
                className={`flex flex-col items-center justify-center w-full h-full pt-2 pb-1 transition-colors duration-200 ${isMoreMenuOpen || isMoreSectionActive ? 'text-violet-600' : 'text-slate-500 hover:text-violet-600'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <span className="text-xs font-semibold mt-1">More</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNavBar;