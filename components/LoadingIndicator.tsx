import React, { useState, useEffect } from 'react';

interface LoadingIndicatorProps {
  messages: { message: string; icon: string }[];
  onCancel: () => void;
  subtext: string;
  accentColor: 'violet' | 'amber' | 'teal' | 'fuchsia';
}

const colorClasses = {
  violet: {
    spinner: 'border-violet-200 border-t-violet-600',
    progress: 'bg-violet-600',
  },
  amber: {
    spinner: 'border-amber-200 border-t-amber-600',
    progress: 'bg-amber-600',
  },
  teal: {
    spinner: 'border-teal-200 border-t-teal-600',
    progress: 'bg-teal-600',
  },
  fuchsia: {
    spinner: 'border-fuchsia-200 border-t-fuchsia-600',
    progress: 'bg-fuchsia-600',
  },
};

const DURATION_TO_95_PERCENT = 35 * 1000; // 35 seconds to reach 95%

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ messages, onCancel, subtext, accentColor }) => {
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingIndex(prev => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  useEffect(() => {
    let startTime: number;
    let frameId: number;

    const animateProgress = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }
      const elapsedTime = timestamp - startTime;
      
      // A non-linear progression: starts faster, slows down near the end (ease-out cubic)
      const t = Math.min(1, elapsedTime / DURATION_TO_95_PERCENT);
      const easedT = 1 - Math.pow(1 - t, 3);
      const currentProgress = Math.min(95, easedT * 95);

      setProgress(currentProgress);

      if (elapsedTime < DURATION_TO_95_PERCENT) {
        frameId = requestAnimationFrame(animateProgress);
      }
    };

    frameId = requestAnimationFrame(animateProgress);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  const { message, icon } = messages[loadingIndex];
  const colors = colorClasses[accentColor];

  return (
    <div className="text-center py-20 fade-in">
      <div className="inline-block relative">
        <div className={`w-20 h-20 border-4 ${colors.spinner} rounded-full animate-spin`}></div>
        <div className="absolute inset-0 flex items-center justify-center text-3xl">{icon}</div>
      </div>
      <p className="mt-6 text-xl font-semibold text-slate-800">{message}</p>
      <p className="text-slate-600 mt-2">{subtext}</p>
      
      <div className="max-w-sm mx-auto mt-8 px-4">
        <div className="relative">
            <div className="absolute top-0 left-0 w-full h-2.5 bg-slate-200/70 rounded-full"></div>
            <div 
              className={`absolute top-0 left-0 h-2.5 ${colors.progress} rounded-full transition-all duration-300 ease-linear`}
              style={{ width: `${progress}%` }}
            ></div>
        </div>
        <p className="text-sm font-semibold text-slate-700 mt-2 tabular-nums">{Math.round(progress)}%</p>
      </div>

      <button
        onClick={onCancel}
        className="mt-8 px-6 py-2 bg-white/60 text-slate-700 font-bold rounded-full hover:bg-white/80 transition-colors"
      >
        Cancel Generation
      </button>
    </div>
  );
};

export default LoadingIndicator;
