
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
  accentColor: 'violet' | 'amber' | 'teal' | 'fuchsia';
  funFacts: FunFact[];
}

const colorClasses = {
  violet: { text: 'text-violet-600', bg: 'bg-violet-600', ring: 'ring-violet-300', border: 'border-t-violet-600' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-600', ring: 'ring-amber-300', border: 'border-t-amber-600' },
  teal: { text: 'text-teal-600', bg: 'bg-teal-600', ring: 'ring-teal-300', border: 'border-t-teal-600' },
  fuchsia: { text: 'text-fuchsia-600', bg: 'bg-fuchsia-600', ring: 'ring-fuchsia-300', border: 'border-t-fuchsia-600' },
};

const StreamingLoadingIndicator: React.FC<StreamingLoadingIndicatorProps> = ({ streamedText, stages, onCancel, title, accentColor, funFacts }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  useEffect(() => {
    if (!funFacts || funFacts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % funFacts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [funFacts]);


  const colors = colorClasses[accentColor] || colorClasses.violet;
  
  const currentStageIndex = useMemo(() => {
    if (!stages || stages.length === 0) return -1;
    for (let i = stages.length - 1; i >= 0; i--) {
      if (streamedText.includes(stages[i].key)) {
        return i;
      }
    }
    return -1;
  }, [streamedText, stages]);
  
  const progress = useMemo(() => {
    if (!stages || stages.length === 0) return 10; // Start with a small amount
    if (currentStageIndex === -1) return 10;
    const baseProgress = ((currentStageIndex + 1) / stages.length) * 90; // Go up to 90%
    return 10 + baseProgress;
  }, [currentStageIndex, stages]);


  return (
    <div className="flex items-center justify-center py-12 px-4 fade-in">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-2xl text-center">
        <h2 className="text-3xl font-bold text-slate-900">{title}</h2>

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
        
        <div className="flex justify-center items-center my-10">
            <div className={`w-24 h-24 rounded-full border-4 border-slate-200/80 ${colors.border} animate-spin`}></div>
        </div>

        <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
            <div className={`${colors.bg} h-2.5 rounded-full transition-all duration-500 ease-out`} style={{width: `${progress}%`}}></div>
        </div>
        <p className={`text-md font-semibold mt-4 ${colors.text}`}>
          Hold tight, magic in progress...
        </p>

        <button
          onClick={onCancel}
          className="mt-8 px-8 py-3 bg-white text-slate-700 font-bold rounded-full hover:bg-slate-100 transition-all duration-300 shadow-md border border-slate-200/90 focus:outline-none focus:ring-4 ${colors.ring}"
        >
          Cancel Generation
        </button>
      </div>
    </div>
  );
};

export default StreamingLoadingIndicator;
