import React from 'react';
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
  const headerBaseClasses = "fixed top-0 left-0 right-0 z-50 w-full no-print h-20 md:h-24";
  
  // Container for the content inside the header
  const containerBaseClasses = "flex items-center container mx-auto h-full";

  // Classes for the initial, transparent, centered state
  const headerInitialClasses = "bg-white/90 backdrop-blur-xl"; // Always use glassmorphic style
  const containerInitialClasses = "justify-between px-4 sm:px-6 lg:px-8";
  
  // Logo scaling effect
  const logoContainerBaseClasses = "flex items-center space-x-3 text-slate-800";

  return (
    <>
      <header
        className={`${headerBaseClasses} ${headerInitialClasses}`}
        aria-label="Application Header"
      >
        <div className={`${containerBaseClasses} ${containerInitialClasses}`}>
          <button 
            onClick={() => navigate('/')}
            className={`${logoContainerBaseClasses} hover:opacity-80 transition-opacity cursor-pointer`}
          >
            {/* PlanMyTrip Logo */}
            <img 
              src="/PlanMyTrip.png" 
              alt="PlanMyTrip AI Logo" 
              className="h-16 md:h-18 w-auto"
            />
          </button>

          {/* Authentication Section */}
          <div className="flex items-center space-x-4">
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
        onForgotPassword={onForgotPassword}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
};

export default Header;