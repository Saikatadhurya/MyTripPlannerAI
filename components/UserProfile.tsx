import React, { useState } from 'react';

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
  gemini_api_key?: string;
}

interface UserProfileProps {
  user: User;
  onLogout: () => void;
  onEditProfile: () => void;
  onGoToContact: () => void;
  onViewTokenUsage: () => void;
  onGetApiKey: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onEditProfile, onGoToContact, onViewTokenUsage, onGetApiKey }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Debug logging to understand the user object structure
  console.log('UserProfile received user:', user);
  console.log('User full_name:', user?.full_name);
  console.log('User email:', user?.email);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    onLogout();
    setIsDropdownOpen(false);
  };

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    // Call the parent's onEditProfile function
    onEditProfile();
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Safety check - if user is not properly loaded, show loading state
  if (!user || !user.full_name) {
    console.warn('UserProfile: User or user.full_name is undefined:', user);
    return (
      <div className="flex items-center space-x-3 p-2">
        <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          ...
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-slate-900">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* User Avatar Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-300"
      >
        <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.full_name} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(user.full_name)
          )}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
          <p className="text-xs text-slate-600">{user.email}</p>
        </div>
        <svg 
          className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 z-50">
          {/* User Info Section */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.full_name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(user.full_name)
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{user.full_name}</p>
                <p className="text-sm text-slate-600">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={handleEditProfile}
              className="w-full flex items-center px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-violet-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Edit Profile
            </button>

            <button
              onClick={() => { setIsDropdownOpen(false); onGetApiKey(); }}
              className="w-full flex items-center px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-violet-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Get your API Key
            </button>

            <button
              onClick={() => { setIsDropdownOpen(false); onGoToContact(); }}
              className="w-full flex items-center px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-violet-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help & Support
            </button>

            <button
              onClick={() => { setIsDropdownOpen(false); onViewTokenUsage(); }}
              className="w-full flex items-center px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-violet-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Token Usage
            </button>

            <hr className="my-2 border-slate-100" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

    </div>
  );
};

export default UserProfile;
