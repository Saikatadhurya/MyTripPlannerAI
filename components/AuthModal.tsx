import React, { useState } from 'react';
import { authService } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onSignup: (full_name: string, email: string, password: string, confirmPassword: string) => void; // Changed 'name' to 'full_name'
  onForgotPassword?: () => void;
  isLoading?: boolean;
  error?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onSignup,
  onForgotPassword,
  isLoading = false,
  error
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '', // Changed 'name' to 'full_name'
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { full_name: '', email: '', password: '', confirmPassword: '' };

    if (!isLoginMode) {
      // Signup validations
      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Full Name is required';
        isValid = false;
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }

    // Common validations for both login and signup
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }

    setValidationErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error for the field being edited
    setValidationErrors(prev => ({
        ...prev,
        [name]: ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({ full_name: '', email: '', password: '', confirmPassword: '' }); // Clear previous errors

    if (!validateForm()) {
      return;
    }

    if (isLoginMode) {
      onLogin(formData.email, formData.password);
    } else {
      onSignup(formData.full_name, formData.email, formData.password, formData.confirmPassword);
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({ full_name: '', email: '', password: '', confirmPassword: '' });
    setValidationErrors({ full_name: '', email: '', password: '', confirmPassword: '' }); // Clear validation errors on mode switch
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 max-w-md w-full p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/PlanMyTrip.png" 
              alt="PlanMyTrip AI Logo" 
              className="h-20 w-auto"
              width="512"
              height="512"
              fetchPriority="high"
              decoding="async"
            />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isLoginMode ? 'Welcome Back!' : 'Join the Adventure'}
          </h2>
          <p className="text-slate-600 mt-2">
            {isLoginMode 
              ? 'Sign in to continue planning your next adventure' 
              : 'Create your account and start planning amazing trips'
            }
          </p>
        </div>

        {/* Error Message */}
        {(error || Object.values(validationErrors).some(err => err)) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm font-medium">{error || Object.values(validationErrors).find(err => err) }</span>
            </div>
          </div>
        )}

        {/* Social Login Options - Moved to top */}
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={authService.loginWithGoogle}
              type="button"
              className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors duration-200 font-medium text-slate-700"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
          
          <div className="relative mt-4 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with email</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label htmlFor="full_name" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required={!isLoginMode}
                className={`w-full px-4 py-3 text-sm sm:text-base border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm ${validationErrors.full_name ? 'border-red-500' : 'border-slate-200'}`}
                placeholder="Enter your full name"
              />
              {validationErrors.full_name && <p className="text-red-500 text-xs mt-1">{validationErrors.full_name}</p>}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-3 text-sm sm:text-base border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm ${validationErrors.email ? 'border-red-500' : 'border-slate-200'}`}
              placeholder="Enter your email"
            />
            {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-3 text-sm sm:text-base border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm ${validationErrors.password ? 'border-red-500' : 'border-slate-200'}`}
              placeholder="Enter your password"
            />
            {validationErrors.password && <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
          </div>

          {isLoginMode && onForgotPassword && (
            <div className="text-right">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-violet-600 font-semibold hover:text-violet-700 transition-colors duration-200"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {!isLoginMode && (
            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required={!isLoginMode}
                className={`w-full px-4 py-3 text-sm sm:text-base border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm ${validationErrors.confirmPassword ? 'border-red-500' : 'border-slate-200'}`}
                placeholder="Confirm your password"
              />
              {validationErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 px-6 py-3 bg-violet-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLoginMode ? 'Signing In...' : 'Creating Account...'}
              </div>
            ) : (
              <span className="flex items-center justify-center">
                {isLoginMode ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create Account
                  </>
                )}
              </span>
            )}
          </button>
        </form>

        {/* Mode Switch */}
        <div className="mt-6 text-center">
          <p className="text-slate-600">
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={switchMode}
              className="text-violet-600 font-semibold hover:text-violet-700 transition-colors duration-200"
            >
              {isLoginMode ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
