import React, { useState, useEffect } from 'react';

interface ScrollToTopButtonProps {
    isUnifiedView?: boolean;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ isUnifiedView = false, scrollContainerRef }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down more than 200px
  const toggleVisibility = () => {
    const scrollElement = scrollContainerRef?.current || window;
    const scrollY = scrollContainerRef?.current ? scrollContainerRef.current.scrollTop : window.scrollY;
    
    if (scrollY > 200) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const scrollElement = scrollContainerRef?.current || window;
    
    scrollElement.addEventListener('scroll', toggleVisibility);

    // Clean up the listener on component unmount
    return () => {
      scrollElement.removeEventListener('scroll', toggleVisibility);
    };
  }, [scrollContainerRef]);

  // Smooth scroll to top
  const scrollToTop = () => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // On mobile, the bottom nav bar is present. We need to raise the button.
  // The nav bar spacer is ~h-16 or h-20, so we use bottom-24 (6rem) to be safely above it.
  const bottomPositionClass = 'bottom-24 sm:bottom-6';

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`fixed ${bottomPositionClass} right-6 z-40 flex items-center justify-center
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