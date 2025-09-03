



import React, { useState, useEffect, useMemo } from 'react';

interface Stage {
  key: string;
  text: string;
}

interface FunFact {
  icon: string;
  text: string;
}

interface StreamingLoadingIndicatorProps {
  streamedText: string;
  stages: Stage[];
  onCancel: () => void;
  title: string;
  accentColor: 'violet' | 'amber' | 'teal' | 'fuchsia' | 'sky';
  funFacts: FunFact[];
  attemptCount?: number;
  maxAttempts?: number;
}

const colorClasses = {
  violet: { text: 'text-violet-600', bg: 'bg-violet-600', ring: 'ring-violet-300', border: 'border-violet-600' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-600', ring: 'ring-amber-300', border: 'border-amber-600' },
  teal: { text: 'text-teal-600', bg: 'bg-teal-600', ring: 'ring-teal-300', border: 'border-teal-600' },
  fuchsia: { text: 'text-fuchsia-600', bg: 'bg-fuchsia-600', ring: 'ring-fuchsia-300', border: 'border-fuchsia-600' },
  sky: { text: 'text-sky-600', bg: 'bg-sky-600', ring: 'ring-sky-300', border: 'border-sky-600' },
};

const CheckmarkIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
    </div>
);

const SpinnerIcon: React.FC<{ colorClass: string }> = ({ colorClass }) => (
    <div className={`w-8 h-8 border-4 ${colorClass} rounded-full border-t-transparent animate-spin`}></div>
);

const PendingIcon: React.FC = () => (
    <div className="w-8 h-8 border-2 border-slate-300 rounded-full bg-slate-100"></div>
);


const StreamingLoadingIndicator: React.FC<StreamingLoadingIndicatorProps> = ({ streamedText, stages, onCancel, title, accentColor, funFacts, attemptCount, maxAttempts }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  useEffect(() => {
    if (!funFacts || funFacts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % funFacts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [funFacts]);


  const colors = colorClasses[accentColor] || colorClasses.violet;
  
  const lastCompletedStageIndex = useMemo(() => {
    if (!stages || stages.length === 0) return -1;
    let lastFoundIndex = -1;
    for (let i = 0; i < stages.length; i++) {
        if (streamedText.includes(stages[i].key)) {
            lastFoundIndex = i;
        }
    }
    return lastFoundIndex;
  }, [streamedText, stages]);

  const progress = useMemo(() => {
    if (!stages || stages.length === 0) return 10;
    const completionRatio = (lastCompletedStageIndex + 1) / stages.length;
    return 10 + (completionRatio * 90);
  }, [lastCompletedStageIndex, stages]);

  const inProgressIndex = lastCompletedStageIndex + 1;


  return (
    <div className="flex items-center justify-center py-12 px-4 fade-in">
      <div className="max-w-lg w-full bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-2xl text-center">
        <h2 className="text-3xl font-bold text-slate-900">{title}</h2>

        {attemptCount && maxAttempts && attemptCount > 1 && (
            <div className="mt-4 p-2 bg-amber-100/70 text-amber-800 rounded-lg text-sm font-semibold border border-amber-200/80" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                Generation failed, retrying... (Attempt {attemptCount} of {maxAttempts})
            </div>
        )}
        
        {funFacts && funFacts.length > 0 && (
          <div className="mt-6 h-8 flex items-center justify-center">
            <div key={currentFactIndex} className="w-full" style={{ animation: 'fun-fact-fade-in 4s ease-in-out' }}>
                <p className={`flex items-center justify-center space-x-3 font-medium ${colors.text}`}>
                    <span className="text-2xl">{funFacts[currentFactIndex].icon}</span>
                    <span className="text-lg">{funFacts[currentFactIndex].text}</span>
                </p>
            </div>
          </div>
        )}
        
        <div className="mt-10 mb-8 text-left relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" aria-hidden="true"></div>
            <div className="space-y-6">
                {stages.map((stage, index) => {
                    let status: 'done' | 'in_progress' | 'pending' = 'pending';
                    if (index < inProgressIndex) {
                        status = 'done';
                    } else if (index === inProgressIndex && index < stages.length) {
                        status = 'in_progress';
                    }
                    
                    return (
                        <div key={stage.key} className={`relative flex items-center space-x-4 transition-all duration-500`}>
                            <div className={`z-10 flex-shrink-0 transition-transform duration-300 ${status === 'in_progress' ? 'scale-110' : ''}`}>
                                {status === 'done' && <CheckmarkIcon />}
                                {status === 'in_progress' && <SpinnerIcon colorClass={colors.border} />}
                                {status === 'pending' && <PendingIcon />}
                            </div>
                            <span className={`font-semibold transition-colors duration-300 ${status === 'done' ? 'text-slate-800' : status === 'in_progress' ? `${colors.text} text-lg` : 'text-slate-500'}`}>
                                {stage.text}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden">
            <div className={`${colors.bg} h-3 rounded-full transition-all duration-500 ease-out`} style={{width: `${progress}%`}}></div>
        </div>
        <p className={`text-md font-semibold mt-4 ${colors.text}`}>
          {progress.toFixed(0)}% Complete
        </p>

        <button
          onClick={onCancel}
          className={`mt-8 px-8 py-3 bg-white text-slate-700 font-bold rounded-full hover:bg-slate-100 transition-all duration-300 shadow-md border border-slate-200/90 focus:outline-none focus:ring-4 ${colors.ring}`}
        >
          Cancel Generation
        </button>
      </div>
    </div>
  );
};

export default StreamingLoadingIndicator;
