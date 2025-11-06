import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackToHomeButton from './BackToHomeButton';

interface BlogPost {
    id: string;
    title: string;
    author: string;
    date: string;
    category: string;
    image?: string;
    content: string[];
    tags: string[];
}

const blogPosts: { [key: string]: BlogPost } = {
    'nomadic-matt-travel-tips': {
        id: 'nomadic-matt-travel-tips',
        title: '10 Essential Travel Tips from a Nomadic Traveler',
        author: 'Travel Expert',
        date: 'November 15, 2025',
        category: 'Travel Tips',
        content: [
            'Traveling the world is a dream for many, but it can seem overwhelming. After years of nomadic travel, I\'ve learned that the key to successful adventures lies in preparation, flexibility, and an open mind.',
            'Here are 10 essential tips that have transformed my travel experiences:',
            '1. **Pack Light, Pack Smart**: The less you carry, the more freedom you have. Invest in quality, versatile clothing that can be layered and mixed. Remember, you can buy most things on the road if needed.',
            '2. **Research, But Don\'t Overplan**: Know the basics about your destination - visa requirements, local customs, and safety tips. But leave room for spontaneity. Some of the best experiences happen when you go with the flow.',
            '3. **Budget Wisely**: Set a daily budget and track your expenses. Use apps to find the best exchange rates and avoid unnecessary fees. Remember, expensive doesn\'t always mean better.',
            '4. **Learn Basic Local Phrases**: Even knowing "hello," "thank you," and "please" in the local language can open doors and hearts. Locals appreciate the effort, no matter how broken your pronunciation.',
            '5. **Stay Connected Safely**: Get a local SIM card or use eSIM services for data. Always share your itinerary with someone back home and check in regularly.',
            '6. **Embrace Local Food**: Food is culture. Try street food (safely), visit local markets, and don\'t be afraid to step out of your comfort zone. Some of my best memories are from food stalls.',
            '7. **Travel Insurance is Non-Negotiable**: Medical emergencies abroad can be financially devastating. Comprehensive travel insurance is one expense you should never skip.',
            '8. **Document Everything**: Take photos of important documents, keep digital copies in the cloud, and have physical backups. Your passport, visa, and insurance details should be accessible even if you lose your phone.',
            '9. **Respect Local Culture**: Research cultural norms before you arrive. Dress appropriately, understand local customs, and be respectful. You\'re a guest in someone else\'s home.',
            '10. **Stay Flexible**: Flights get delayed, weather changes, and plans fall through. The ability to adapt is your greatest travel skill. Sometimes the detours lead to the best adventures.'
        ],
        tags: ['Travel Tips', 'Budget Travel', 'Planning', 'Adventure']
    },
    'solo-female-travel-safety': {
        id: 'solo-female-travel-safety',
        title: 'Solo Female Travel: A Complete Safety Guide',
        author: 'Adventurous Traveler',
        date: 'November 12, 2025',
        category: 'Safety',
        content: [
            'Solo female travel is empowering, liberating, and absolutely achievable. With the right preparation and mindset, women can safely explore the world on their own terms.',
            '**Pre-Trip Preparation**:',
            'Before you leave, research your destination thoroughly. Check travel advisories, understand local customs regarding women, and read reviews from other female travelers. Join online communities like Girls Love Travel or Solo Female Travelers Network for real experiences and advice.',
            '**Accommodation Safety**:',
            'Choose accommodations with good reviews, especially from solo female travelers. Hostels with female-only dorms, well-reviewed hotels, or reputable Airbnb hosts are good options. Always check the location - is it well-lit? Is it in a safe neighborhood? Can you easily get transportation?',
            '**Dressing Appropriately**:',
            'Research local dress codes. In many cultures, modesty is respected and can help you blend in. Pack versatile clothing that covers shoulders and knees when needed. This isn\'t about restrictions - it\'s about respect and safety.',
            '**Daytime Safety Tips**:',
            'Walk confidently, even if you\'re lost. Use maps on your phone discreetly. Avoid walking alone at night in unfamiliar areas. Trust your instincts - if something feels off, leave. Share your location with trusted contacts using apps like Find My Friends.',
            '**Nighttime Safety**:',
            'Plan your evenings. Know how you\'ll get back to your accommodation. Use reputable transportation services. Avoid excessive alcohol consumption, especially when alone. Keep your phone charged and have emergency contacts saved.',
            '**Meeting People Safely**:',
            'Meeting locals and other travelers is one of the joys of solo travel. Do it safely by meeting in public places, telling someone where you\'re going, and trusting your gut. If someone makes you uncomfortable, you don\'t owe them your time.',
            '**Emergency Preparedness**:',
            'Have emergency contacts saved both digitally and physically. Know the local emergency numbers. Keep copies of important documents. Consider carrying a personal safety alarm. Register with your embassy if traveling to high-risk areas.',
            'Remember: Solo female travel isn\'t about being fearless - it\'s about being prepared, aware, and confident in your ability to handle situations. The world is waiting for you!'
        ],
        tags: ['Solo Travel', 'Safety', 'Women Travel', 'Tips']
    },
    'budget-travel-hacks': {
        id: 'budget-travel-hacks',
        title: 'Budget Travel Hacks: See the World Without Breaking the Bank',
        author: 'Budget Travel Expert',
        date: 'November 10, 2025',
        category: 'Budget',
        content: [
            'Travel doesn\'t have to be expensive. With smart planning and these proven hacks, you can explore the world on any budget.',
            '**Flight Booking Strategies**:',
            'Be flexible with dates and destinations. Use flight comparison sites like Skyscanner or Google Flights. Set up price alerts. Consider flying on weekdays, during off-peak seasons, or from alternative airports. Sometimes booking two one-way tickets is cheaper than round-trip.',
            '**Accommodation Savings**:',
            'Mix accommodation types. Hostels aren\'t just for backpackers - many offer private rooms. Consider house-sitting, Couchsurfing (safely), or work-exchange programs. Booking last-minute can sometimes yield great deals, but book early for peak seasons.',
            '**Food on a Budget**:',
            'Eat where locals eat. Street food is often delicious, authentic, and affordable. Visit local markets for fresh produce. Cook your own meals if you have kitchen access. Avoid tourist-trap restaurants near major attractions.',
            '**Transportation Tips**:',
            'Walk when possible - it\'s free and the best way to discover a city. Use public transportation instead of taxis. Consider ride-sharing for longer distances. Many cities offer tourist passes that include transportation and attractions.',
            '**Free Activities**:',
            'Most cities offer free walking tours (tip your guide!). Visit free museums on designated days. Explore parks, beaches, and neighborhoods. Attend free local events and festivals. Nature is always free!',
            '**Money Management**:',
            'Use credit cards with no foreign transaction fees. Avoid currency exchange kiosks at airports - use ATMs instead. Notify your bank of travel plans. Keep emergency cash separate from daily spending money.',
            '**Travel Insurance**:',
            'While it seems like an extra expense, travel insurance can save you thousands in medical emergencies. Compare policies and choose one that fits your needs. Some credit cards offer travel insurance as a benefit.',
            'Remember: The goal isn\'t to travel as cheaply as possible, but to maximize value. Sometimes spending a bit more on the right things (like a good location or a unique experience) is worth it.'
        ],
        tags: ['Budget', 'Money Saving', 'Travel Tips', 'Planning']
    },
    'packing-like-a-pro': {
        id: 'packing-like-a-pro',
        title: 'Packing Like a Pro: The Ultimate Guide to Travel Packing',
        author: 'Packing Expert',
        date: 'November 8, 2025',
        category: 'Packing',
        content: [
            'Mastering the art of packing can transform your travel experience. Here\'s how to pack efficiently, avoid overpacking, and be prepared for anything.',
            '**The Packing Philosophy**:',
            'Pack for your trip, not for every possible scenario. Most items can be purchased or laundered on the road. Focus on versatile pieces that can be mixed and matched.',
            '**Essential Packing List**:',
            'Start with the essentials: passport, tickets, money, and medications. These are non-negotiable. Then add clothing based on your destination\'s climate and culture. Remember: you can always buy something if you forget it.',
            '**Clothing Strategy**:',
            'Choose a color scheme (neutrals work best) so everything matches. Pack layers for versatility. Roll clothes instead of folding to save space. Use packing cubes to organize and compress. Bring quick-dry fabrics when possible.',
            '**Toiletries and Personal Items**:',
            'Use travel-sized containers or buy items at your destination. Many hotels provide basics. Pack only what you can\'t easily replace. Consider solid alternatives (shampoo bars, solid deodorant) to avoid liquid restrictions.',
            '**Electronics and Tech**:',
            'Bring only essential electronics. A smartphone can replace many devices. Don\'t forget chargers, adapters, and power banks. Consider a universal adapter for multiple countries.',
            '**Carry-On Essentials**:',
            'Always pack important items in your carry-on: medications, a change of clothes, important documents, valuables, and anything you can\'t replace. If your checked bag is lost, you\'ll still be able to function.',
            '**Last-Minute Checklist**:',
            'Before you leave: Check the weather forecast. Verify visa and document requirements. Notify your bank. Download offline maps. Charge all devices. Print backup copies of important documents.',
            '**Packing Pro Tips**:',
            'Pack heavier items at the bottom of your suitcase. Use shoes to store small items. Put liquids in sealed bags to prevent leaks. Weigh your bag before leaving to avoid overweight fees. Leave some space for souvenirs!',
            'Remember: The best packing is the packing that lets you focus on your journey, not your luggage.'
        ],
        tags: ['Packing', 'Travel Tips', 'Organization', 'Preparation']
    },
    'local-food-adventures': {
        id: 'local-food-adventures',
        title: 'A Foodie\'s Guide to Authentic Local Cuisine',
        author: 'Food Traveler',
        date: 'November 5, 2025',
        category: 'Food',
        content: [
            'Food is the heart of travel. It tells stories, connects cultures, and creates memories. Here\'s how to discover authentic local cuisine and have unforgettable food adventures.',
            '**Why Food Matters in Travel**:',
            'Food is more than sustenance - it\'s culture, history, and community. Every dish has a story. By exploring local cuisine, you\'re not just eating; you\'re experiencing a destination through its most intimate lens.',
            '**Finding Authentic Eateries**:',
            'Avoid restaurants with menus in multiple languages and photos of food. Look for places filled with locals, especially during lunch hours. Follow your nose - good food smells amazing. Ask locals for recommendations - hotel staff, taxi drivers, and shopkeepers often know the best spots.',
            '**Street Food Safety**:',
            'Street food is often the most authentic and affordable option. To eat safely: Choose vendors with high turnover (fresh food). Watch how food is prepared. Ensure proper cooking temperatures. Avoid raw items in places with questionable hygiene. Trust your instincts.',
            '**Market Adventures**:',
            'Local markets are foodie paradises. Arrive early for the freshest produce. Watch how locals shop and interact. Try samples when offered. Don\'t be afraid to ask questions. Many markets have food stalls where you can try prepared dishes.',
            '**Dining Etiquette**:',
            'Research local dining customs before you arrive. In some cultures, finishing your plate is rude; in others, it\'s expected. Learn basic phrases like "delicious" and "thank you." Tipping customs vary - research beforehand.',
            '**Must-Try Experiences**:',
            'Take a cooking class to learn local recipes. Join a food tour for curated experiences. Visit farms or food producers. Attend food festivals and markets. Try dishes you\'ve never heard of - you might discover a new favorite!',
            '**Dietary Restrictions**:',
            'If you have dietary restrictions, research how to communicate them in the local language. Many cuisines naturally accommodate vegetarian, vegan, or gluten-free diets. Apps like HappyCow can help find suitable restaurants.',
            '**Food Photography Tips**:',
            'Ask permission before photographing food or vendors. Don\'t let photography interfere with your experience. Capture the atmosphere, not just the plate. Share your discoveries with fellow food lovers!',
            'Remember: The best meal might be the one you least expected. Be adventurous, be respectful, and savor every bite!'
        ],
        tags: ['Food', 'Culture', 'Local Experience', 'Adventure']
    },
    'sustainable-travel': {
        id: 'sustainable-travel',
        title: 'Sustainable Travel: How to Explore Responsibly',
        author: 'Eco Traveler',
        date: 'November 3, 2025',
        category: 'Sustainability',
        content: [
            'Travel is a privilege, and with that comes responsibility. Sustainable travel ensures that future generations can enjoy the same beautiful destinations we do today.',
            '**What is Sustainable Travel?**:',
            'Sustainable travel means making choices that minimize negative impacts on the environment, economy, and local communities while maximizing positive contributions. It\'s about traveling thoughtfully and leaving places better than you found them.',
            '**Environmental Impact**:',
            'Choose direct flights when possible to reduce carbon emissions. Pack light - every kilogram matters in fuel consumption. Use public transportation, walk, or bike instead of taxis. Stay in eco-friendly accommodations. Reduce plastic use - bring a reusable water bottle, shopping bag, and utensils.',
            '**Supporting Local Communities**:',
            'Stay in locally-owned accommodations. Eat at local restaurants. Buy from local artisans and markets. Hire local guides. Your money should benefit the communities you visit, not just international corporations.',
            '**Respecting Wildlife**:',
            'Never participate in activities that exploit animals. Avoid elephant rides, tiger selfies, and dolphin shows. Choose ethical wildlife experiences like safaris with responsible operators or visits to legitimate sanctuaries. Keep your distance from wild animals.',
            '**Cultural Respect**:',
            'Learn about local customs and traditions before you arrive. Dress appropriately. Ask permission before photographing people. Support cultural preservation efforts. Be a respectful guest, not an entitled tourist.',
            '**Waste Reduction**:',
            'Follow the "leave no trace" principle. Don\'t litter - ever. Reduce single-use plastics. Recycle when facilities are available. Choose accommodations with environmental policies. Support businesses that prioritize sustainability.',
            '**Carbon Offsetting**:',
            'While not a perfect solution, carbon offsetting can help mitigate your travel footprint. Research reputable offset programs. Consider it as part of a broader sustainability strategy, not a free pass.',
            '**Making a Difference**:',
            'Volunteer with legitimate organizations. Support conservation efforts. Share your sustainable travel experiences to inspire others. Every small action contributes to a larger movement.',
            'Remember: Sustainable travel isn\'t about perfection - it\'s about making better choices, one trip at a time. The future of travel depends on it.'
        ],
        tags: ['Sustainability', 'Eco Travel', 'Responsible Travel', 'Environment']
    }
};

const BlogPost: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const post = id ? blogPosts[id] : null;

    // Update page title
    useEffect(() => {
        if (post) {
            document.title = `${post.title} | Plan My Trip AI`;
        } else {
            document.title = 'Blog Post Not Found | Plan My Trip AI';
        }
        
        return () => {
            document.title = 'Plan My Trip | Free AI Trip Planner - Create Perfect Travel Itinerary in Minutes';
        };
    }, [post]);

    if (!post) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <BackToHomeButton onClick={() => navigate('/blog')} />
                <div className="text-center py-12">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">Blog Post Not Found</h1>
                    <p className="text-slate-600 mb-6">The blog post you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/blog')}
                        className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                    >
                        Back to Blogs
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <BackToHomeButton onClick={() => navigate('/blog')} />

            <article className="animated-card bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-xl p-6 md:p-8 lg:p-10">
                <div className="mb-6">
                    <span className="inline-block px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-4">
                        {post.category}
                    </span>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
                        {post.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-slate-600 text-sm md:text-base">
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {post.author}
                        </span>
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {post.date}
                        </span>
                    </div>
                </div>

                <div className="prose prose-slate max-w-none">
                    {post.content.map((paragraph, index) => {
                        // Check if paragraph is a heading (starts with **)
                        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                            const headingText = paragraph.slice(2, -2);
                            return (
                                <h2 key={index} className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                                    {headingText}
                                </h2>
                            );
                        }
                        // Check if paragraph is a numbered list item
                        if (/^\d+\.\s\*\*/.test(paragraph)) {
                            const match = paragraph.match(/^\d+\.\s\*\*(.+?)\*\*:\s*(.+)/);
                            if (match) {
                                return (
                                    <div key={index} className="mb-4 pl-4 border-l-4 border-violet-200">
                                        <strong className="text-violet-700">{match[1]}:</strong>
                                        <p className="mt-1 text-slate-700">{match[2]}</p>
                                    </div>
                                );
                            }
                        }
                        return (
                            <p key={index} className="text-slate-700 leading-relaxed mb-4 text-base md:text-lg">
                                {paragraph}
                            </p>
                        );
                    })}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                    <button
                        onClick={() => navigate('/blog')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to All Blogs
                    </button>
                </div>
            </article>
        </div>
    );
};

export default BlogPost;

