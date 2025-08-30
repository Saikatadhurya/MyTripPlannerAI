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
  violet: { text: 'text-violet-600', bg: 'bg-violet-600', ring: 'ring-violet-300', border: 'border-t-violet-600' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-600', ring: 'ring-amber-300', border: 'border-t-amber-600' },
  teal: { text: 'text-teal-600', bg: 'bg-teal-600', ring: 'ring-teal-300', border: 'border-t-teal-600' },
  fuchsia: { text: 'text-fuchsia-600', bg: 'bg-fuchsia-600', ring: 'ring-fuchsia-300', border: 'border-t-fuchsia-600' },
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
                    <div className={`w-6 h-6 rounded-full border-2 border-slate-300 ${colors.border} animate-spin`}></div>
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
  const connectingStage: Stage = useMemo(() => ({ key: 'connecting', text: 'Connecting to AI...' }), []);
  const finalizingStage: Stage = useMemo(() => ({ key: 'finalizing', text: 'Finalizing your results...' }), []);
  
  const allStages = useMemo(() => [connectingStage, ...stages, finalizingStage], [stages, connectingStage, finalizingStage]);

  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const hasStreamStarted = useMemo(() => streamedText.length > 0, [streamedText]);

  useEffect(() => {
    const newCompleted = new Set<string>();
    
    if (hasStreamStarted) {
      newCompleted.add(connectingStage.key);
    }
    
    stages.forEach((stage) => {
      if (streamedText.includes(stage.key)) {
        newCompleted.add(stage.key);
      }
    });

    let firstPendingIndex = allStages.findIndex(stage => !newCompleted.has(stage.key));
    
    if (newCompleted.size === stages.length + 1) {
       firstPendingIndex = allStages.length - 1;
    } else if (firstPendingIndex === -1) {
       firstPendingIndex = allStages.length;
    }
    
    setCurrentStageIndex(firstPendingIndex);

  }, [streamedText, stages, allStages, connectingStage.key, hasStreamStarted]);

  const colors = colorClasses[accentColor] || colorClasses.violet;
  
  const progress = useMemo(() => {
    if (!hasStreamStarted) {
      return 0;
    }

    const totalSteps = allStages.length;
    if (totalSteps <= 1) return 100;

    if (currentStageIndex >= totalSteps - 1) {
      return 99;
    }

    const progressPercentage = (currentStageIndex / (totalSteps - 1)) * 100;
    
    return Math.min(99, Math.floor(progressPercentage));
  }, [currentStageIndex, allStages.length, hasStreamStarted]);

  return (
    <div className="text-center py-12 px-4 fade-in">
      <div className="max-w-md mx-auto bg-white/40 backdrop-blur-lg p-8 rounded-2xl border border-white/50 shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-600 mt-2">The AI is working its magic. Here's the real-time progress:</p>
        
        <ul className="space-y-4 text-left my-8">
            {allStages.map((stage, index) => (
                <StageItem 
                    key={stage.key}
                    text={stage.text}
                    status={
                        index < currentStageIndex ? 'completed' :
                        index === currentStageIndex ? 'in_progress' : 'pending'
                    }
                    accentColor={accentColor}
                />
            ))}
        </ul>

        <div className="w-full bg-slate-200/70 rounded-full h-2.5 overflow-hidden">
            { !hasStreamStarted ? (
              <div className={`${colors.bg} h-2.5 rounded-full progress-bar-indeterminate`}></div>
            ) : (
              <div
                  className={`${colors.bg} h-2.5 rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${progress}%` }}
              ></div>
            )}
        </div>
        <p className={`text-sm font-semibold mt-2 ${colors.text}`}>
          { !hasStreamStarted ? 'Connecting...' : `${progress}% Complete` }
        </p>

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