import React, { useState, useEffect } from 'react';
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
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
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

  // Base classes for the fixed header - set a consistent height so main content can be offset
  const headerBaseClasses = "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out no-print h-20 md:h-24";
  
  // Container for the content inside the header
  const containerBaseClasses = "flex items-center transition-all duration-300 ease-in-out container mx-auto h-full";

  // Classes for the initial, transparent, centered state
  const headerInitialClasses = ""; // height is controlled by headerBaseClasses
  const containerInitialClasses = "justify-between px-4 sm:px-6 lg:px-8";
  
  // Classes for the scrolled, glassmorphic state
  const headerScrolledClasses = "bg-white/90 backdrop-blur-xl shadow-lg slide-down-animation";
  const containerScrolledClasses = "justify-start px-4 sm:px-6 lg:px-8";
  
  // Logo scaling effect
  const logoContainerBaseClasses = "flex items-center space-x-3 text-slate-800 transition-transform duration-300";

  return (
    <>
      <header
        className={`${headerBaseClasses} ${isScrolled ? headerScrolledClasses : headerInitialClasses}`}
        aria-label="Application Header"
      >
        <div className={`${containerBaseClasses} ${isScrolled ? containerScrolledClasses : containerInitialClasses}`}>
          <div className={`${logoContainerBaseClasses} ${isScrolled ? 'scale-90' : 'scale-100'}`}>
            {/* Simplified SVG Icon inspired by the Planora logo image */}
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="50" cy="50" r="45" />
              <line x1="50" y1="5" x2="50" y2="50" />
              <line x1="50" y1="50" x2="95" y2="50" />
              {/* Fork */}
              <path d="M25 15 v 25" />
              <path d="M35 15 v 25" />
              <path d="M30 15 v 28" />
              <path d="M25 15 C 25 10, 35 10, 35 15" />
              {/* Lute/Music Icon */}
              <circle cx="75" cy="25" r="8" />
              <line x1="75" y1="33" x2="75" y2="45" />
              {/* Plane */}
              <path d="M20 60 l25 25 l-5 -10 l15 -5 l-20 -15Z" fill="currentColor" stroke="none" />
            </svg>
            <span 
              className="text-3xl font-bold tracking-widest uppercase"
            >
              PLANORA
            </span>
          </div>

          {/* Authentication Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              user.full_name ? (
                <UserProfile 
                  user={user} 
                  onLogout={onLogout}
                  onEditProfile={onEditProfile}
                />
              ) : (
                <div className="flex items-center space-x-3 p-2">
                  <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    ...
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-slate-900">Loading...</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={onOpenAuthModal}
                  className="px-6 py-2 bg-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-300"
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
        isLoading={isLoading}
        error={error}
      />
    </>
  );
};

export default Header;