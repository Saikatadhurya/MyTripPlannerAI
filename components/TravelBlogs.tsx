import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackToHomeButton from './BackToHomeButton';

interface TravelBlogsProps {
    onBack: () => void;
}

interface TravelBlog {
    id: string;
    title: string;
    author: string;
    description: string;
    date: string;
    category: string;
    topics: string[];
}

const TravelBlogs: React.FC<TravelBlogsProps> = ({ onBack }) => {
    const navigate = useNavigate();
    
    const blogs: TravelBlog[] = [
        {
            id: 'nomadic-matt-travel-tips',
            title: '10 Essential Travel Tips from a Nomadic Traveler',
            author: 'Travel Expert',
            description: 'Learn the secrets of successful travel from years of nomadic experience. Discover practical tips on packing, budgeting, safety, and making the most of your adventures.',
            date: 'November 15, 2025',
            category: 'Travel Tips',
            topics: ['Travel Tips', 'Budget Travel', 'Planning', 'Adventure']
        },
        {
            id: 'solo-female-travel-safety',
            title: 'Solo Female Travel: A Complete Safety Guide',
            author: 'Adventurous Traveler',
            description: 'A comprehensive guide to solo female travel safety. Learn how to prepare, stay safe, and confidently explore the world on your own terms.',
            date: 'November 12, 2025',
            category: 'Safety',
            topics: ['Solo Travel', 'Safety', 'Women Travel', 'Tips']
        },
        {
            id: 'budget-travel-hacks',
            title: 'Budget Travel Hacks: See the World Without Breaking the Bank',
            author: 'Budget Travel Expert',
            description: 'Discover proven strategies to travel on any budget. Learn how to save on flights, accommodation, food, and activities without sacrificing experiences.',
            date: 'November 10, 2025',
            category: 'Budget',
            topics: ['Budget', 'Money Saving', 'Travel Tips', 'Planning']
        },
        {
            id: 'packing-like-a-pro',
            title: 'Packing Like a Pro: The Ultimate Guide to Travel Packing',
            author: 'Packing Expert',
            description: 'Master the art of efficient packing. Learn how to pack light, stay organized, and be prepared for any travel scenario with our comprehensive guide.',
            date: 'November 8, 2025',
            category: 'Packing',
            topics: ['Packing', 'Travel Tips', 'Organization', 'Preparation']
        },
        {
            id: 'local-food-adventures',
            title: 'A Foodie\'s Guide to Authentic Local Cuisine',
            author: 'Food Traveler',
            description: 'Explore the world through its food. Learn how to find authentic local cuisine, navigate food markets, and have unforgettable culinary adventures.',
            date: 'November 5, 2025',
            category: 'Food',
            topics: ['Food', 'Culture', 'Local Experience', 'Adventure']
        },
        {
            id: 'sustainable-travel',
            title: 'Sustainable Travel: How to Explore Responsibly',
            author: 'Eco Traveler',
            description: 'Learn how to travel sustainably and responsibly. Discover ways to minimize your environmental impact while supporting local communities and preserving destinations for future generations.',
            date: 'November 3, 2025',
            category: 'Sustainability',
            topics: ['Sustainability', 'Eco Travel', 'Responsible Travel', 'Environment']
        }
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <BackToHomeButton onClick={onBack} />

            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                    Travel Blog
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Discover inspiring travel stories, expert tips, and comprehensive guides to help you plan your perfect adventure. 
                    Learn from travel experts and get practical advice for your next journey.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {blogs.map((blog, index) => (
                    <div
                        key={blog.id}
                        onClick={() => navigate(`/blog/${blog.id}`)}
                        className="animated-card bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-xl p-6 hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer group"
                        style={{ animationDelay: `${index * 100}ms` }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                navigate(`/blog/${blog.id}`);
                            }
                        }}
                    >
                        <div className="flex-1">
                            <span className="inline-block px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium mb-3">
                                {blog.category}
                            </span>
                            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-violet-600 transition-colors">
                                {blog.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-slate-600 mb-3">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {blog.author}
                                </span>
                            </div>
                            <p className="text-slate-700 text-sm mb-4 leading-relaxed">
                                {blog.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {blog.topics.slice(0, 3).map((topic, topicIndex) => (
                                    <span
                                        key={topicIndex}
                                        className="px-2 py-1 text-xs font-medium bg-violet-100 text-violet-700 rounded-full"
                                    >
                                        {topic}
                                    </span>
                                ))}
                                {blog.topics.length > 3 && (
                                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                                        +{blog.topics.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/blog/${blog.id}`);
                            }}
                            className="inline-flex items-center justify-center w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors duration-200 mt-auto"
                        >
                            Read Article
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 ml-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            <div className="animated-card bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-200/70 shadow-xl p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    More Travel Resources
                </h2>
                <p className="text-slate-700 mb-6 max-w-2xl mx-auto">
                    Explore our comprehensive travel guides and tips to help you plan your perfect adventure. 
                    From budget travel to solo female travel safety, we've got you covered with expert advice and practical tips.
                </p>
                <p className="text-sm text-slate-600">
                    Stay tuned for more travel articles, destination guides, and expert tips coming soon!
                </p>
            </div>
        </div>
    );
};

export default TravelBlogs;

