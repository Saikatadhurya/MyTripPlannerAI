import React from 'react';

interface BackToHomeButtonProps {
    onClick: () => void;
}

const BackToHomeButton: React.FC<BackToHomeButtonProps> = ({ onClick }) => {
    return (
        <div className="mb-6">
            <button 
                onClick={onClick} 
                className="inline-flex items-center px-6 py-2 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/80 transition-all duration-300 shadow-md border border-white/50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Back to Home</span>
            </button>
        </div>
    );
};

export default BackToHomeButton;
