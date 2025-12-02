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

  // Base classes for the header - relative (non-sticky) for all screens
  const headerBaseClasses = "relative w-full no-print h-16 md:h-20 transition-shadow duration-300";
  
  // Container for the content inside the header
  const containerBaseClasses = "flex items-center container mx-auto h-full";

  // Classes for the initial, transparent, centered state
  const headerInitialClasses = "bg-white/90 backdrop-blur-xl"; // Always use glassmorphic style
  const headerScrolledClasses = isScrolled ? "shadow-lg shadow-slate-200/50" : "";
  const containerInitialClasses = "justify-between px-4 sm:px-6 lg:px-8";
  
  // Logo scaling effect
  const logoContainerBaseClasses = "flex items-center space-x-2 text-slate-800";

  return (
    <>
      <header
        className={`${headerBaseClasses} ${headerInitialClasses} ${headerScrolledClasses} z-[9998]`}
        aria-label="Application Header"
      >
        <div className={`${containerBaseClasses} ${containerInitialClasses}`}>
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
          <div className="flex items-center space-x-3">
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
                  className="px-4 py-1.5 text-sm bg-violet-600 text-white font-semibold rounded-lg shadow-lg shadow-violet-500/30 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-300"
                >
                  Sign In
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