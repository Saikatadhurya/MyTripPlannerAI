import React, { useState, useRef, useEffect } from 'react';

interface OTPVerificationProps {
  email: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  error?: string;
  resendCooldown?: number; // in seconds
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  onVerify,
  onResend,
  isLoading = false,
  error,
  resendCooldown = 60
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(resendCooldown);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOTP = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOTP.forEach((char, i) => {
        if (index + i < 6 && /^\d$/.test(char)) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus next empty input or last input
      const nextIndex = Math.min(index + pastedOTP.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d$/.test(value) && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (newOtp.every(digit => digit !== '') && value) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (otpValue?: string) => {
    const otpCode = otpValue || otp.join('');
    if (otpCode.length === 6) {
      onVerify(otpCode);
    }
  };

  const handleResend = () => {
    if (resendTimer === 0) {
      setResendTimer(resendCooldown);
      onResend();
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Verify Your Email</h3>
        <p className="text-slate-600 text-sm">
          We've sent a 6-digit verification code to
          <br />
          <span className="font-semibold text-slate-900">{email}</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        <div className="flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading}
              className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200 bg-white/50 backdrop-blur-sm border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading || otp.some(digit => !digit)}
          className="w-full px-6 py-3 bg-violet-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </div>
          ) : (
            'Verify OTP'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-600 text-sm mb-2">
          Didn't receive the code?
        </p>
        <button
          onClick={handleResend}
          disabled={resendTimer > 0 || isLoading}
          className="text-violet-600 font-semibold hover:text-violet-700 transition-colors duration-200 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
};

export default OTPVerification;

