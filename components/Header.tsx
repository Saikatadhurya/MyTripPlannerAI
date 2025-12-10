import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../services/authService';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';

interface HeaderProps {
  user: User | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (full_name: string, email: string, password: string, confirmPassword: string) => Promise<void>; // Corrected 'name' to 'full_name'
  onLogout: () => void;
  onEditProfile: () => void;
  isLoading?: boolean;
  error?: string;
  isAuthModalOpen: boolean;
  onOpenAuthModal: () => void;
  onCloseAuthModal: () => void;
  onForgotPassword?: () => void;
  onViewTokenUsage: () => void;
  onGoToContact: () => void;
  onGetApiKey: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  onLogin, 
  onSignup, 
  onLogout, 
  onEditProfile,
  isLoading = false, 
  error,
  isAuthModalOpen,
  onOpenAuthModal,
  onCloseAuthModal,
  onForgotPassword,
  onViewTokenUsage,
  onGoToContact,
  onGetApiKey,
}) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll event to add shadow effect
  useEffect(() => {
    const handleScroll = () => {
      // Check window scroll
      const windowScroll = window.scrollY || document.documentElement.scrollTop;
      
      // Check main content container scroll (the app uses overflow-y-auto on main content)
      const mainContent = document.querySelector('.flex-1.overflow-y-auto') as HTMLElement;
      const mainScroll = mainContent?.scrollTop || 0;
      
      // Show shadow if either scroll position is past threshold
      setIsScrolled(windowScroll > 10 || mainScroll > 10);
    };

    // Listen to window scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Listen to main content scroll
    const mainContent = document.querySelector('.flex-1.overflow-y-auto');
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainContent) {
        mainContent.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      await onLogin(email, password);
      onCloseAuthModal(); // Close modal on successful login
    } catch (error) {
      // Error is handled by the parent component (App.tsx) which will keep the modal open
    }
  };

  const handleSignup = async (full_name: string, email: string, password: string, confirmPassword: string) => { // Corrected 'name' to 'full_name'
    try {
      await onSignup(full_name, email, password, confirmPassword); // Corrected 'name' to 'full_name'
      onCloseAuthModal(); // Close modal on successful signup
    } catch (error) {
      // Error is handled by the parent component (App.tsx) which will keep the modal open
    }
  };

  // Base classes for the header - relative (non-sticky) for all screens, with left margin for sidebar on desktop
  const headerBaseClasses = "relative w-full no-print h-16 md:h-20 md:ml-20 md:w-[calc(100%-5rem)] transition-shadow duration-300";
  
  // Container for the content inside the header
  const containerBaseClasses = "flex items-center container mx-auto h-full max-w-full overflow-visible px-4 sm:px-6 lg:px-8";

  // Classes for the initial, transparent, centered state
  const headerInitialClasses = "bg-white/90 backdrop-blur-xl"; // Always use glassmorphic style
  const headerScrolledClasses = isScrolled ? "shadow-lg shadow-slate-200/50" : "";
  const containerInitialClasses = "justify-between";
  
  // Logo scaling effect
  const logoContainerBaseClasses = "flex items-center space-x-2 text-slate-800";

  return (
    <>
      <header
        className={`${headerBaseClasses} ${headerInitialClasses} ${headerScrolledClasses} z-[9998] overflow-visible`}
        aria-label="Application Header"
      >
        <div className={`${containerBaseClasses} ${containerInitialClasses} overflow-visible`}>
          <button 
            onClick={() => navigate('/')}
            className={`${logoContainerBaseClasses} hover:opacity-80 transition-opacity cursor-pointer`}
          >
            {/* PlanMyTrip Logo - Optimized for LCP */}
            <img 
              src="/PlanMyTrip.png" 
              alt="PlanMyTrip AI Logo" 
              className="h-12 md:h-14 w-auto"
              width="512"
              height="512"
              fetchPriority="high"
              decoding="async"
            />
          </button>

          {/* Authentication Section */}
          <div className="flex items-center space-x-3 overflow-visible relative z-[9999] flex-shrink-0 min-w-0">
            {user ? (
              user.full_name ? (
                <UserProfile 
                  user={user} 
                  onLogout={onLogout}
                  onEditProfile={onEditProfile}
                  onViewTokenUsage={onViewTokenUsage}
                  onGoToContact={onGoToContact}
                  onGetApiKey={onGetApiKey}
                />
              ) : (
                <div className="flex items-center space-x-2 p-1.5">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    ...
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold text-slate-900">Loading...</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenAuthModal}
                  className="relative px-5 py-2.5 text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/40 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl hover:shadow-violet-500/50 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-violet-300 cursor-pointer animate-pulse hover:animate-none group overflow-hidden"
                >
                  {/* Animated background shimmer */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                  
                  {/* Button content */}
                  <span className="relative flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Sign In</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={onCloseAuthModal}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onForgotPassword={onForgotPassword}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
};

export default Header;