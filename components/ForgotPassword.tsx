import React, { useState } from 'react';
import OTPVerification from './OTPVerification';
import { authService } from '../services/authService';

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccessMessage('Password reset OTP sent! Please check your email.');
      setStep('otp');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send password reset OTP';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async (otp: string) => {
    setError('');
    setIsLoading(true);
    setOtpCode(otp);

    try {
      await authService.verifyResetOTP(email, otp);
      setStep('reset');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid OTP code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    try {
      await authService.forgotPassword(email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP';
      setError(errorMessage);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(email, otpCode, newPassword);
      setSuccessMessage('Password reset successfully! You can now sign in.');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Step 1: Enter Email */}
      {step === 'email' && (
        <>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reset Your Password</h3>
            <p className="text-slate-600 text-sm">
              Enter your email address and we'll send you a verification code
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm border-slate-200 disabled:opacity-50"
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full px-6 py-3 bg-violet-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={onBack}
              className="text-violet-600 font-semibold hover:text-violet-700 transition-colors duration-200 text-sm"
            >
              ← Back to Sign In
            </button>
          </div>
        </>
      )}

      {/* Step 2: Verify OTP */}
      {step === 'otp' && (
        <>
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          <OTPVerification
            email={email}
            onVerify={handleOTPVerify}
            onResend={handleResendOTP}
            isLoading={isLoading}
            error={error}
            resendCooldown={60}
          />

          <div className="mt-4 text-center">
            <button
              onClick={() => setStep('email')}
              className="text-violet-600 font-semibold hover:text-violet-700 transition-colors duration-200 text-sm"
            >
              ← Back
            </button>
          </div>
        </>
      )}

      {/* Step 3: Reset Password */}
      {step === 'reset' && (
        <>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Create New Password</h3>
            <p className="text-slate-600 text-sm">
              Enter your new password below
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm border-slate-200 disabled:opacity-50"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm border-slate-200 disabled:opacity-50"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="w-full px-6 py-3 bg-violet-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;

