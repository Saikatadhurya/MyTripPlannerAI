
import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Set to true if scrolled more than a small threshold (e.g., 10px)
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    // Cleanup the event listener on component unmount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`w-full left-0 z-40 transition-all duration-300 ease-in-out no-print h-16 fixed top-0 bg-white/90 backdrop-blur-md shadow-md`}
      aria-label="Application Header"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-start">
        <div className="flex items-center space-x-3 text-slate-800">
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
      </div>
    </header>
  );
};

export default Header;
