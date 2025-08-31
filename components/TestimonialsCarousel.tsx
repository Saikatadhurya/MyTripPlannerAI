import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Testimonial {
    name: string;
    location: string;
    rating: number;
    text: string;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const avatarColors = [
  'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500',
  'bg-green-500', 'bg-yellow-600', 'bg-orange-500', 'bg-red-500', 'bg-pink-500'
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % avatarColors.length);
  return avatarColors[index];
};

const Star: React.FC<{ type: 'full' | 'half' | 'empty' }> = ({ type }) => {
    if (type === 'half') {
        return (
            <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                <defs><path id="star-half" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></defs>
                <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" fill="currentColor" opacity="0.3"/>
                <use xlinkHref="#star-half" />
            </svg>
        );
    }
    if (type === 'empty') {
        return (
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24" opacity="0.3">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
        );
    }
    return (
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
    );
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(<Star key={i} type="full" />);
    } else if (i - 0.5 <= rating) {
      stars.push(<Star key={i} type="half" />);
    } else {
      stars.push(<Star key={i} type="empty" />);
    }
  }
  return <div className="flex items-center space-x-0.5">{stars}</div>;
};

const TestimonialsCarousel: React.FC = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    // Fix: Replaced `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` for browser compatibility. The `NodeJS` namespace is not available in a standard browser environment, and this change makes the type portable.
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const response = await fetch('/data/testimonials.json');
                const data: Testimonial[] = await response.json();
                setTestimonials(data);
            } catch (error) {
                console.error("Failed to fetch testimonials:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTestimonials();
    }, []);

    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    const nextSlide = useCallback(() => {
        if (testimonials.length === 0) return;
        setCurrentIndex((prevIndex) => (prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1));
    }, [testimonials.length]);

    const prevSlide = () => {
        if (testimonials.length === 0) return;
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1));
    };

    useEffect(() => {
        if (testimonials.length === 0 || isLoading) return;
        resetTimeout();
        timeoutRef.current = setTimeout(nextSlide, 5000);
        return () => {
            resetTimeout();
        };
    }, [currentIndex, nextSlide, resetTimeout, testimonials.length, isLoading]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current - touchEndX.current > 75) {
            nextSlide();
        } else if (touchStartX.current - touchEndX.current < -75) {
            prevSlide();
        }
        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    if (isLoading) {
        return (
            <div className="relative w-full max-w-lg mx-auto h-[420px] sm:h-[350px] bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-3xl p-6 animate-pulse">
                <div className="bg-white/50 w-full h-full rounded-2xl"></div>
            </div>
        );
    }
    
    if (testimonials.length === 0) {
        return null;
    }

    const activeTestimonial = testimonials[currentIndex];

    return (
        <div 
            className="relative w-full max-w-lg mx-auto bg-gradient-to-br from-violet-200/80 via-white to-fuchsia-100/80 rounded-3xl p-4 sm:p-6 shadow-lg"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div key={currentIndex} className="fade-in">
                <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-inner min-h-[300px] sm:min-h-[280px] flex flex-col">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-serif shadow-lg">
                            "
                        </div>
                    </div>
                    <div className="flex-grow my-4 space-y-4">
                        <StarRating rating={activeTestimonial.rating} />
                        <blockquote className="text-slate-700 text-base sm:text-lg leading-relaxed">
                            {activeTestimonial.text}
                        </blockquote>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-md ${getAvatarColor(activeTestimonial.name)}`}>
                            {getInitials(activeTestimonial.name)}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">{activeTestimonial.name}</p>
                            <p className="text-sm text-slate-600">{activeTestimonial.location}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="px-2 sm:px-4 pt-4">
                <div className="flex justify-between items-center">
                    <button
                        onClick={prevSlide}
                        className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 shadow-md text-slate-700 hover:bg-white/80 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-violet-300"
                        aria-label="Previous testimonial"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </button>
                    <div className="flex space-x-2">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-violet-600 scale-125' : 'bg-slate-300 hover:bg-slate-400'}`}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={nextSlide}
                        className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 shadow-md text-slate-700 hover:bg-white/80 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-violet-300"
                        aria-label="Next testimonial"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </button>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-1 mt-4 overflow-hidden">
                    <div
                        key={currentIndex} 
                        className="h-1 bg-violet-500 rounded-full"
                        style={{ animation: 'progress-bar-fill 5s linear' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default TestimonialsCarousel;