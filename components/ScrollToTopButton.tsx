
import React, { useState, useEffect } from 'react';

interface ScrollToTopButtonProps {
    isUnifiedView?: boolean;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ isUnifiedView = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down more than 200px
  const toggleVisibility = () => {
    if (window.scrollY > 200) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);

    // Clean up the listener on component unmount
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // Smooth scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // On mobile, the bottom nav bar is present. We need to raise the button.
  // The nav bar spacer is ~h-16 or h-20, so we use bottom-24 (6rem) to be safely above it.
  const bottomPositionClass = 'bottom-24 sm:bottom-6';

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`fixed ${bottomPositionClass} right-6 z-50 flex items-center justify-center
                  w-10 h-10 md:w-12 md:h-12 
                  rounded-full 
                  bg-gradient-to-br from-indigo-600 to-violet-600 
                  text-white 
                  shadow-lg hover:shadow-xl
                  transition-all duration-300 ease-in-out
                  transform hover:scale-110 
                  focus:outline-none focus:ring-4 focus:ring-violet-300
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}
                  no-print`}
      aria-label="Scroll to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 md:w-6 md:h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
};

export default ScrollToTopButton;