import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface BlogPreview {
    id: string;
    title: string;
    author: string;
    description: string;
    date: string;
    category: string;
}

interface BlogCarouselProps {
    onViewMore: () => void;
}

const BlogCarousel: React.FC<BlogCarouselProps> = ({ onViewMore }) => {
    const navigate = useNavigate();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const blogs: BlogPreview[] = [
        {
            id: 'nomadic-matt-travel-tips',
            title: '10 Essential Travel Tips from a Nomadic Traveler',
            author: 'Travel Expert',
            description: 'Learn the secrets of successful travel from years of nomadic experience. Discover practical tips on packing, budgeting, safety, and making the most of your adventures.',
            date: 'November 15, 2025',
            category: 'Travel Tips'
        },
        {
            id: 'solo-female-travel-safety',
            title: 'Solo Female Travel: A Complete Safety Guide',
            author: 'Adventurous Traveler',
            description: 'A comprehensive guide to solo female travel safety. Learn how to prepare, stay safe, and confidently explore the world on your own terms.',
            date: 'November 12, 2025',
            category: 'Safety'
        },
        {
            id: 'budget-travel-hacks',
            title: 'Budget Travel Hacks: See the World Without Breaking the Bank',
            author: 'Budget Travel Expert',
            description: 'Discover proven strategies to travel on any budget. Learn how to save on flights, accommodation, food, and activities without sacrificing experiences.',
            date: 'November 10, 2025',
            category: 'Budget'
        },
        {
            id: 'packing-like-a-pro',
            title: 'Packing Like a Pro: The Ultimate Guide to Travel Packing',
            author: 'Packing Expert',
            description: 'Master the art of efficient packing. Learn how to pack light, stay organized, and be prepared for any travel scenario with our comprehensive guide.',
            date: 'November 8, 2025',
            category: 'Packing'
        },
        {
            id: 'local-food-adventures',
            title: 'A Foodie\'s Guide to Authentic Local Cuisine',
            author: 'Food Traveler',
            description: 'Explore the world through its food. Learn how to find authentic local cuisine, navigate food markets, and have unforgettable culinary adventures.',
            date: 'November 5, 2025',
            category: 'Food'
        },
        {
            id: 'sustainable-travel',
            title: 'Sustainable Travel: How to Explore Responsibly',
            author: 'Eco Traveler',
            description: 'Learn how to travel sustainably and responsibly. Discover ways to minimize your environmental impact while supporting local communities.',
            date: 'November 3, 2025',
            category: 'Sustainability'
        }
    ];

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        
        const container = scrollContainerRef.current;
        const cardWidth = container.offsetWidth / 3; // 3 cards visible at a time
        const scrollAmount = cardWidth * 3; // Scroll by 3 cards
        
        if (direction === 'left') {
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleBlogClick = (blogId: string) => {
        navigate(`/blog/${blogId}`);
    };

    return (
        <div className="relative w-full">
            {/* Navigation Buttons */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/70 shadow-lg text-slate-700 hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-violet-300 -translate-x-4"
                aria-label="Scroll left"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            </button>
            
            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/70 shadow-lg text-slate-700 hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-violet-300 translate-x-4"
                aria-label="Scroll right"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
            </button>

            {/* Scrolling Container */}
            <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-2"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                {blogs.map((blog, index) => (
                    <div
                        key={blog.id}
                        onClick={() => handleBlogClick(blog.id)}
                        className="animated-card flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 group"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex flex-col h-full">
                            <span className="inline-block px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium mb-3 w-fit">
                                {blog.category}
                            </span>
                            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-violet-600 transition-colors line-clamp-2">
                                {blog.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {blog.author}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {blog.date}
                                </span>
                            </div>
                            <p className="text-slate-700 text-sm mb-4 leading-relaxed flex-grow line-clamp-3">
                                {blog.description}
                            </p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleBlogClick(blog.id);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors duration-200 w-fit mt-auto"
                            >
                                Read Article
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* View More Button */}
            <div className="mt-8 text-center">
                <button
                    onClick={onViewMore}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                    View More Blogs
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .line-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default BlogCarousel;
