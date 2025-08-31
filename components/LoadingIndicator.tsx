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

const StreamingLoadingIndicator: React.FC<StreamingLoadingIndicatorProps> = ({ streamedText, stages, onCancel, title, accentColor, funFacts }) => {
  const connectingStage: Stage = useMemo(() => ({ key: 'connecting', text: 'Connecting to AI...' }), []);
  const finalizingStage: Stage = useMemo(() => ({ key: 'finalizing', text: 'Finalizing your results...' }), []);
  
  const allStages = useMemo(() => [connectingStage, ...stages, finalizingStage], [stages, connectingStage, finalizingStage]);

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const hasStreamStarted = useMemo(() => streamedText.length > 0, [streamedText]);

  useEffect(() => {
    if (!funFacts || funFacts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % funFacts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [funFacts]);

  useEffect(() => {
    let newStageIndex = 0; // Default to 'Connecting'
    if (hasStreamStarted) {
        newStageIndex = 1; // At least 'Connecting' is done
        const cleanedStream = streamedText.replace(/\s/g, '');

        // Find the index of the LAST stage key present in the stream to correctly handle skipped optional stages
        let lastFoundIndex = -1;
        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            if (cleanedStream.includes(stage.key.replace(/\s/g, ''))) {
                lastFoundIndex = i + 1; // +1 to account for the 'Connecting' stage
            }
        }
        
        if (lastFoundIndex !== -1) {
            newStageIndex = lastFoundIndex;
        }
    }
    
    // Check if the stream is likely finished to move to the finalizing stage
    const isStreamLikelyFinished = streamedText.trim().endsWith('}');
    if (isStreamLikelyFinished) {
        // Set to the 'finalizing' stage index
        newStageIndex = allStages.length - 1;
    }

    setCurrentStageIndex(newStageIndex);

  }, [streamedText, hasStreamStarted, allStages, stages]);

  const colors = colorClasses[accentColor] || colorClasses.violet;
  
  const progress = useMemo(() => {
    if (currentStageIndex === 0 && !hasStreamStarted) {
        return 0; // Represents the indeterminate state
    }
    const totalSteps = allStages.length;
    if (totalSteps <= 1) return 100;

    // If finalizing, show 99%
    if (currentStageIndex >= totalSteps - 1) {
        return 99;
    }

    // Calculate progress based on which stage is active.
    // -1 because we don't count "finalizing" in the main progress percentage.
    const progressPercentage = (currentStageIndex / (totalSteps - 1)) * 100;
    
    return Math.min(99, Math.floor(progressPercentage));
  }, [currentStageIndex, allStages.length, hasStreamStarted]);

  return (
    <div className="text-center py-12 px-4 fade-in">
      <div className="max-w-md mx-auto bg-white/40 backdrop-blur-lg p-8 rounded-2xl border border-white/50 shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>

        {funFacts && funFacts.length > 0 && (
          <div className="mt-4 h-12 flex items-center justify-center">
            <div key={currentFactIndex} style={{ animation: 'fun-fact-fade-in 4s ease-in-out' }}>
                <p className="text-slate-600 flex items-center justify-center space-x-2">
                    <span className="text-xl">{funFacts[currentFactIndex].icon}</span>
                    <span>{funFacts[currentFactIndex].text}</span>
                </p>
            </div>
          </div>
        )}
        
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
            { currentStageIndex === 0 && !hasStreamStarted ? (
              <div className={`${colors.bg} h-2.5 rounded-full progress-bar-indeterminate`}></div>
            ) : (
              <div
                  className={`${colors.bg} h-2.5 rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${progress}%` }}
              ></div>
            )}
        </div>
        <p className={`text-sm font-semibold mt-2 ${colors.text}`}>
          { currentStageIndex === 0 && !hasStreamStarted ? 'Connecting...' : `${progress}% Complete` }
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