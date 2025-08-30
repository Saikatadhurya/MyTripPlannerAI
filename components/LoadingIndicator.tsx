
import React, { useState, useEffect, useMemo } from 'react';

interface Stage {
  key: string;
  text: string;
}

interface StreamingLoadingIndicatorProps {
  streamedText: string;
  stages: Stage[];
  onCancel: () => void;
  title: string;
  accentColor: 'violet' | 'amber' | 'teal' | 'fuchsia';
}

const colorClasses = {
  violet: { text: 'text-violet-600', bg: 'bg-violet-600', ring: 'ring-violet-300' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-600', ring: 'ring-amber-300' },
  teal: { text: 'text-teal-600', bg: 'bg-teal-600', ring: 'ring-teal-300' },
  fuchsia: { text: 'text-fuchsia-600', bg: 'bg-fuchsia-600', ring: 'ring-fuchsia-300' },
};

const StageItem: React.FC<{ text: string, status: 'completed' | 'in_progress' | 'pending', accentColor: string }> = ({ text, status, accentColor }) => {
    const colors = colorClasses[accentColor as keyof typeof colorClasses] || colorClasses.violet;
    
    const getIcon = () => {
        switch(status) {
            case 'completed':
                return (
                    <div className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'in_progress':
                return (
                    <div className={`w-6 h-6 rounded-full border-2 border-slate-300 border-t-${accentColor}-600 animate-spin`}></div>
                );
            case 'pending':
                return <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>;
        }
    };

    const textClass = useMemo(() => {
        switch(status) {
            case 'completed': return 'text-slate-500 line-through';
            case 'in_progress': return `${colors.text} font-semibold`;
            case 'pending': return 'text-slate-400';
        }
    }, [status, colors.text]);

    return (
        <li className="flex items-center space-x-4 transition-all duration-300">
            <div className="flex-shrink-0">{getIcon()}</div>
            <span className={`transition-colors duration-300 ${textClass}`}>{text}</span>
        </li>
    );
};

const StreamingLoadingIndicator: React.FC<StreamingLoadingIndicatorProps> = ({ streamedText, stages, onCancel, title, accentColor }) => {
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    const newCompleted = new Set<string>();
    let firstPendingIndex = stages.length;

    stages.forEach((stage, index) => {
      if (streamedText.includes(stage.key)) {
        newCompleted.add(stage.key);
      } else if (firstPendingIndex === stages.length) {
        firstPendingIndex = index;
      }
    });
    
    setCompletedStages(newCompleted);
    setCurrentStageIndex(firstPendingIndex);

  }, [streamedText, stages]);

  const [visibleText, setVisibleText] = useState('');
  useEffect(() => {
    const slicedText = streamedText.slice(-250);
    let i = 0;
    const interval = setInterval(() => {
      setVisibleText(slicedText.substring(0, i));
      i++;
      if (i > slicedText.length) {
        clearInterval(interval);
      }
    }, 5);
    return () => clearInterval(interval);

  }, [streamedText]);


  return (
    <div className="text-center py-12 px-4 fade-in">
      <div className="max-w-md mx-auto bg-white/40 backdrop-blur-lg p-8 rounded-2xl border border-white/50 shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-600 mt-2">The AI is working its magic. Here's the real-time progress:</p>
        
        <ul className="space-y-4 text-left my-8">
            {stages.map((stage, index) => (
                <StageItem 
                    key={stage.key}
                    text={stage.text}
                    status={
                        completedStages.has(stage.key) ? 'completed' :
                        index === currentStageIndex ? 'in_progress' : 'pending'
                    }
                    accentColor={accentColor}
                />
            ))}
        </ul>

        <div className="bg-slate-800 text-left rounded-lg p-4 font-mono text-xs text-green-400 h-28 overflow-hidden relative">
            <pre className="whitespace-pre-wrap break-all">
                {visibleText}
                <span className="w-2 h-4 bg-green-400 inline-block animate-pulse ml-1"></span>
            </pre>
            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-800 to-transparent"></div>
        </div>

        <button
          onClick={onCancel}
          className="mt-8 px-8 py-3 bg-white/60 text-slate-800 font-bold rounded-full hover:bg-white/90 transition-all duration-300 shadow-md border border-white/50"
        >
          Cancel Generation
        </button>
      </div>
    </div>
  );
};

export default StreamingLoadingIndicator;
