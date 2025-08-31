
import React from 'react';

interface ContactUsButtonProps {
  onClick: () => void;
}

const ContactUsButton: React.FC<ContactUsButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-900/30 backdrop-blur-lg border-2 border-white/20 shadow-lg shadow-violet-500/30 flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-4 focus:ring-white/50 no-print"
      aria-label="Contact Us"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 md:w-7 md:h-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    </button>
  );
};

export default ContactUsButton;
