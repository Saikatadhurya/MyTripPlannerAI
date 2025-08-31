import React from 'react';
import TestimonialsCarousel from './TestimonialsCarousel';
import BackToHomeButton from './BackToHomeButton';

interface ContactUsProps {
    onBack: () => void;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="animated-card bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg">
        <div className="flex items-center space-x-3 text-2xl font-bold text-slate-800 border-b border-violet-200/50 pb-3 mb-4">
            <div className="flex-shrink-0 bg-violet-100 text-violet-600 rounded-lg p-2">
                {icon}
            </div>
            <span>{title}</span>
        </div>
        <div className="space-y-3 text-slate-700">
            {children}
        </div>
    </div>
);

const ContactUs: React.FC<ContactUsProps> = ({ onBack }) => {
    const iconClass = "h-7 w-7";
    return (
        <div className="max-w-4xl mx-auto">
            <BackToHomeButton onClick={onBack} />

            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Contact Us</h1>
                <p className="mt-2 text-lg text-slate-600">We'd love to hear from you!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <InfoCard title="Get in Touch" icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}>
                    <p className="flex items-center space-x-3"><strong className="w-16">Email:</strong> <a href="mailto:contact@planora.ai" className="text-violet-700 hover:underline">contact@planora.ai</a></p>
                    <p className="flex items-center space-x-3"><strong className="w-16">Phone:</strong> <span>+1 (555) 123-4567</span></p>
                    <p className="flex items-start space-x-3"><strong className="w-16 flex-shrink-0">Address:</strong> <span>123 Travel Lane, Wanderlust City, World</span></p>
                </InfoCard>

                <InfoCard title="About Planora" icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
                    <p>Planora is your ultimate AI-powered travel companion, designed to make your adventures seamless and unforgettable. We specialize in creating personalized itineraries that blend your interests in food, music, and culture with smart, practical travel tools like our AI packing assistant.</p>
                </InfoCard>

                <div className="md:col-span-2">
                    <InfoCard title="Our Motivation" icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}>
                        <p>We believe travel is about more than just visiting a new place; it’s about experiencing its soul. Our motivation is to remove the stress of planning so you can fully immerse yourself in the culture, savor the local flavors, and discover the soundtrack of your destination. We're here to help you create memories that last a lifetime.</p>
                    </InfoCard>
                </div>
            </div>
            
            <section className="animated-card">
                <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
                    What Our Travelers Say
                </h2>
                <TestimonialsCarousel />
            </section>
        </div>
    );
};

export default ContactUs;
