import React from 'react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`w-full mt-auto pb-16 sm:pb-8 ${className} no-print`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-t border-slate-200/50 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-sm">Powered by</span>
              <span className="text-lg font-bold tracking-widest">Plan<span className="text-violet-600">My</span>Trip</span>
            </div>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} PlanMyTrip. Your AI-powered travel companion.
            </p>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-sm">Made with ❤️ in India</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

