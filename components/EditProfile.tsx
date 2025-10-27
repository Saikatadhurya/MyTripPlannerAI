import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import profileService from '../services/profileService';

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
  gemini_api_key?: string;
}

interface EditProfileProps {
  user: User;
  onBack: () => void;
  onProfileUpdate: (updatedUser: User) => void;
}

interface FormData {
  full_name: string;
  email: string;
  gemini_api_key?: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface FormErrors {
  full_name?: string;
  gemini_api_key?: string;
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
  general?: string;
}

const EditProfile: React.FC<EditProfileProps> = ({ user, onBack, onProfileUpdate }) => {

  const [formData, setFormData] = useState<FormData>({
    full_name: user?.full_name || '',
    email: user?.email || '',
    gemini_api_key: user?.gemini_api_key || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
    gemini: false
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security'>('profile');
  
  // Google account linking state
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [isCheckingGoogleStatus, setIsCheckingGoogleStatus] = useState(true);
  // Whether user already has a password set (for social logins)
  const [hasPassword, setHasPassword] = useState<boolean>(true);
  // Whether any social account is linked
  const [hasAnySocialLinked, setHasAnySocialLinked] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        gemini_api_key: user.gemini_api_key || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setErrors({});
      setSuccessMessage('');
      setActiveTab('profile');
    }
  }, [user]);

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('planora_token');
    const user = localStorage.getItem('planora_user');
    
    console.log('EditProfile: Checking authentication...');
    console.log('EditProfile: Token exists:', !!token);
    console.log('EditProfile: User exists:', !!user);
    
    if (!token) {
      setErrors({ general: 'Not authenticated. Please sign in to access your profile.' });
    } else {
      console.log('EditProfile: User is authenticated, token length:', token.length);
    }
  }, []);

  // Load profile meta (has_password) for conditional password UI
  const [isLoadingGeminiKey, setIsLoadingGeminiKey] = useState(true);
  
  useEffect(() => {
    const loadProfileMeta = async () => {
      try {
        setIsLoadingGeminiKey(true);
        const resp = await profileService.getProfile();
        const hp = (resp as any)?.data?.user?.has_password;
        const socials = (resp as any)?.data?.user?.social_accounts || [];
        const geminiApiKey = (resp as any)?.data?.user?.gemini_api_key;
        
        if (typeof hp === 'boolean') setHasPassword(hp);
        setHasAnySocialLinked(Array.isArray(socials) && socials.length > 0);
        
        // Update form data with the fetched Gemini API key
        if (geminiApiKey) {
          setFormData(prev => ({
            ...prev,
            gemini_api_key: geminiApiKey
          }));
        }
      } catch (e) {
        console.warn('EditProfile: Failed to load profile meta');
      } finally {
        setIsLoadingGeminiKey(false);
      }
    };
    loadProfileMeta();
  }, []);

  // Check Google account linking status
  useEffect(() => {
    const checkGoogleStatus = async () => {
      try {
        setIsCheckingGoogleStatus(true);
        const hasGoogle = await profileService.hasGoogleAccount();
        setIsGoogleLinked(hasGoogle);
      } catch (error) {
        console.error('Error checking Google account status:', error);
        setIsGoogleLinked(false);
      } finally {
        setIsCheckingGoogleStatus(false);
      }
    };

    checkGoogleStatus();
  }, []);

  // Handle URL parameters for Google OAuth callbacks
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const error = urlParams.get('error');

    if (message) {
      setSuccessMessage(decodeURIComponent(message));
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh Google account status
      const checkGoogleStatus = async () => {
        try {
          const hasGoogle = await profileService.hasGoogleAccount();
          setIsGoogleLinked(hasGoogle);
        } catch (error) {
          console.error('Error refreshing Google account status:', error);
        }
      };
      checkGoogleStatus();
    }

    if (error) {
      setErrors({ general: decodeURIComponent(error) });
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Profile validation
    if (activeTab === 'profile') {
      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Full name is required';
      } else if (formData.full_name.trim().length < 2) {
        newErrors.full_name = 'Full name must be at least 2 characters';
      }
      
      // Gemini API key validation
      if (formData.gemini_api_key && typeof formData.gemini_api_key === 'string' && formData.gemini_api_key.trim().length > 0 && formData.gemini_api_key.trim().length < 10) {
        newErrors.gemini_api_key = 'Gemini API key must be at least 10 characters';
      }
      // Email validation removed since email field is read-only
    }

    // Password validation
    if (activeTab === 'password') {
      if (hasPassword && !formData.current_password) {
        newErrors.current_password = 'Current password is required';
      }

      if (formData.new_password) {
        if (formData.new_password.length < 8) {
          newErrors.new_password = 'New password must be at least 8 characters';
        }

        if (formData.new_password !== formData.confirm_password) {
          newErrors.confirm_password = 'Passwords do not match';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value || '' }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProfileUpdate = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const data = await profileService.updateProfile({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        gemini_api_key: formData.gemini_api_key?.trim() || undefined
      });

      if (data.success) {
        // Create updated user object with new data
        const updatedUser = {
          ...user,
          full_name: formData.full_name.trim(),
          gemini_api_key: formData.gemini_api_key?.trim() || undefined,
          updated_at: new Date().toISOString()
        };
        
        // Call the callback to update parent component state
        onProfileUpdate(updatedUser);
        
        setSuccessMessage('Profile updated successfully!');
        // Navigate back to home after successful update
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        setErrors({ general: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
      setErrors({ general: errorMessage });
      
      // If authentication error, redirect to home (which will show login)
      if (errorMessage.includes('authenticated') || errorMessage.includes('Session expired')) {
        setTimeout(() => {
          onBack();
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const data = await profileService.changePassword({
        currentPassword: formData.current_password,
        newPassword: formData.new_password
      });

      if (data.success) {
        setSuccessMessage('Password changed successfully!');
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }));
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: data.message || 'Failed to change password' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
      setErrors({ general: errorMessage });
      
      // If authentication error, redirect to home (which will show login)
      if (errorMessage.includes('authenticated') || errorMessage.includes('Session expired')) {
        setTimeout(() => {
          onBack();
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGeminiKey = async () => {
    if (!window.confirm('Are you sure you want to delete your Gemini API key? This will disable your personal API quota usage.')) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const data = await profileService.updateProfile({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        gemini_api_key: null
      });

      if (data.success) {
        // Create updated user object with cleared API key
        const updatedUser = {
          ...user,
          full_name: formData.full_name.trim(),
          gemini_api_key: undefined,
          updated_at: new Date().toISOString()
        };
        
        // Update form data
        setFormData(prev => ({
          ...prev,
          gemini_api_key: ''
        }));
        
        // Remove gemini_api_key from localStorage explicitly
        console.log('EditProfile: Removing gemini_api_key from localStorage...');
        const storedUser = localStorage.getItem('planora_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            const updatedStoredUser = { ...parsedUser, gemini_api_key: undefined };
            localStorage.setItem('planora_user', JSON.stringify(updatedStoredUser));
            console.log('EditProfile: Successfully removed gemini_api_key from localStorage');
          } catch (e) {
            console.error('Failed to update localStorage:', e);
          }
        }
        
        // Call the callback to update parent component state
        onProfileUpdate(updatedUser);
        
        setSuccessMessage('Gemini API key deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: data.message || 'Failed to delete Gemini API key' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'profile') {
      handleProfileUpdate();
    } else if (activeTab === 'password') {
      handlePasswordChange();
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Edit Profile</h1>
                <p className="text-white/80 text-sm">Manage your account settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'password', label: 'Password', icon: Lock },
              { id: 'security', label: 'Security', icon: Lock }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
                    activeTab === tab.id
                      ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                      : 'text-gray-600 hover:text-violet-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">{successMessage}</span>
                </div>
              )}

                             {/* Error Message */}
               {errors.general && (
                 <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
                   <AlertCircle className="w-5 h-5 text-red-600" />
                   <div className="flex-1">
                     <span className="text-red-800 font-medium">{errors.general}</span>
                     {errors.general.includes('authenticated') && (
                       <p className="text-red-600 text-sm mt-1">
                         You will be redirected to the home page to sign in.
                       </p>
                     )}
                   </div>
                 </div>
               )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.full_name} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          user.full_name?.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
                        )}
                      </div>
                      <button
                        type="button"
                        className="absolute bottom-0 right-0 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center hover:bg-violet-700 transition-colors shadow-lg"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">Click to change profile picture</p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors ${
                          errors.full_name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.full_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        readOnly
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                        placeholder="Enter your email address"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Email address cannot be changed</p>
                  </div>

                  {/* Gemini API Key */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gemini API Key
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      {isLoadingGeminiKey ? (
                        <div className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-3"></div>
                          <span className="text-gray-500 text-sm">Loading API key...</span>
                        </div>
                      ) : (
                        <>
                          <input
                            type={showPasswords.gemini ? 'text' : 'password'}
                            value={formData.gemini_api_key}
                            onChange={(e) => handleInputChange('gemini_api_key', e.target.value)}
                            className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors ${
                              errors.gemini_api_key ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Enter your Gemini API key (optional)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, gemini: !prev.gemini }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            title={showPasswords.gemini ? 'Hide API key' : 'Show API key'}
                          >
                            {showPasswords.gemini ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </>
                      )}
                    </div>
                    {errors.gemini_api_key && (
                      <p className="mt-1 text-sm text-red-600">{errors.gemini_api_key}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Add your Gemini API key to use your own quota. Leave empty to use the default service.
                      </p>
                      {!isLoadingGeminiKey && formData.gemini_api_key && formData.gemini_api_key.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={handleDeleteGeminiKey}
                          disabled={isLoading}
                          className="ml-4 px-3 py-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete Key
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Account Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Member since:</span>
                        <p className="font-medium text-gray-900">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Last updated:</span>
                        <p className="font-medium text-gray-900">
                          {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">{hasPassword ? 'Password Requirements' : 'Set a password'}</h4>
                        <p className="text-blue-800 text-sm mt-1">
                          {hasPassword
                            ? 'Your password must be at least 8 characters long.'
                            : 'You signed in with a social account. Set a password to enable email + password login.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Password (only if user already has a password) */}
                  {hasPassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={formData.current_password}
                          onChange={(e) => handleInputChange('current_password', e.target.value)}
                          className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors ${
                            errors.current_password ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.current_password && (
                        <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
                      )}
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={formData.new_password}
                        onChange={(e) => handleInputChange('new_password', e.target.value)}
                        className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors ${
                          errors.new_password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.new_password && (
                      <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={formData.confirm_password}
                        onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                        className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors ${
                          errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900">Security Features</h4>
                        <p className="text-amber-800 text-sm mt-1">
                          Manage your account security and linked social accounts.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Google Account Linking */}
                  {isGoogleLinked && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Google account linked</span>
                      </div>
                    </div>
                  )}

                  {!isGoogleLinked && !hasAnySocialLinked && !isCheckingGoogleStatus && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-900">Link Google account</span>
                        </div>
                        <button
                          onClick={() => profileService.initiateGoogleLinking()}
                          className="px-4 py-2 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        >
                          Link
                        </button>
                      </div>
                    </div>
                  )}

                  {/* If another social is linked and Google is not, show nothing per requirement */}

                  <div className="text-center py-8">
                    <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                    <p className="text-gray-600">Enhanced security features are under development</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>
                      {activeTab === 'profile' ? 'Save Changes' : 
                       activeTab === 'password' ? (hasPassword ? 'Change Password' : 'Set Password') : 'Save'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
