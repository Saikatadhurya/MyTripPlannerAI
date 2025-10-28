import React, { useState, useEffect } from 'react';
import { historyService } from '../services/historyService';
import { authService } from '../services/authService';

interface TokenUsageProps {
  onBack: () => void;
}

interface TokenStats {
  overall: {
    total_plans: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
  };
  breakdown: Array<{
    recommendation_type: string;
    count: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  }>;
  recentPlans: Array<{
    id: string;
    recommendation_type: string;
    destination: string;
    title?: string;
    input_token: number;
    output_token: number;
    total_token: number;
    created_at: string;
    trip_id?: string;
    trip_name?: string;
  }>;
}

const TokenUsage: React.FC<TokenUsageProps> = ({ onBack }) => {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated before making API calls
    if (!authService.isAuthenticated()) {
      console.log('User not authenticated, skipping token usage fetch');
      setError('Your session has expired. Please sign in again.');
      setLoading(false);
      return;
    }
    fetchTokenUsage();
  }, []);

  const fetchTokenUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await historyService.getTokenUsageStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch token usage:', err);
      setError('Failed to load token usage statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | string) => {
    const numValue = typeof num === 'string' ? parseInt(num, 10) : num;
    return numValue.toLocaleString();
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      itinerary: '🗺️',
      packing: '🎒',
      food: '🍽️',
      apps: '📱',
      music: '🎵',
      lingo: '🗣️',
      unified: '✨',
    };
    return icons[type] || '📋';
  };

  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      itinerary: 'Itinerary',
      packing: 'Packing',
      food: 'Food Guide',
      apps: 'App Finder',
      music: 'Music Finder',
      lingo: 'Lingo Guide',
      unified: 'Unified Planner',
    };
    return names[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 pt-10 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animated-card bg-white/60 backdrop-blur-lg rounded-3xl border border-slate-200/70 shadow-xl p-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg text-slate-600">Loading token usage statistics...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 pt-10 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animated-card bg-white/60 backdrop-blur-lg rounded-3xl border border-slate-200/70 shadow-xl p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Oops!</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <button
                onClick={fetchTokenUsage}
                className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 pt-10 pb-20 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="animated-card bg-white/60 backdrop-blur-lg rounded-3xl border border-slate-200/70 shadow-xl p-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 transition-colors mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
              💎
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Token Usage</h1>
              <p className="text-slate-600 mt-1">Track your AI usage and token consumption</p>
            </div>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="animated-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200/70 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Plans</p>
                <p className="text-2xl font-bold text-blue-900">{formatNumber(stats.overall.total_plans)}</p>
              </div>
            </div>
          </div>

          <div className="animated-card bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200/70 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-2xl">
                ➡️
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Input Tokens</p>
                <p className="text-2xl font-bold text-purple-900">{formatNumber(stats.overall.total_input_tokens)}</p>
              </div>
            </div>
          </div>

          <div className="animated-card bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl border border-pink-200/70 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center text-2xl">
                ⬅️
              </div>
              <div>
                <p className="text-sm text-pink-700 font-medium">Output Tokens</p>
                <p className="text-2xl font-bold text-pink-900">{formatNumber(stats.overall.total_output_tokens)}</p>
              </div>
            </div>
          </div>

          <div className="animated-card bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl border border-violet-200/70 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center text-2xl">
                🔢
              </div>
              <div>
                <p className="text-sm text-violet-700 font-medium">Total Tokens</p>
                <p className="text-2xl font-bold text-violet-900">{formatNumber(stats.overall.total_tokens)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown by Type */}
        {stats.breakdown && stats.breakdown.length > 0 && (
          <div className="animated-card bg-white/60 backdrop-blur-lg rounded-3xl border border-slate-200/70 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Usage by Feature</h2>
              <p className="text-slate-600 mt-1">Token consumption breakdown by feature type</p>
            </div>
            <div className="divide-y divide-slate-100">
              {stats.breakdown.map((item, index) => (
                <div key={index} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        {getTypeIcon(item.recommendation_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{getTypeName(item.recommendation_type)}</h3>
                        <p className="text-sm text-slate-600">{item.count} plan{item.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-6 flex-shrink-0 overflow-x-auto">
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs text-slate-600 mb-1">Input</p>
                        <p className="font-bold text-purple-600 text-sm">{formatNumber(item.input_tokens)}</p>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs text-slate-600 mb-1">Output</p>
                        <p className="font-bold text-pink-600 text-sm">{formatNumber(item.output_tokens)}</p>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs text-slate-600 mb-1">Total</p>
                        <p className="font-bold text-violet-600 text-sm">{formatNumber(item.total_tokens)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Plans */}
        {stats.recentPlans && stats.recentPlans.length > 0 && (
          <div className="animated-card bg-white/60 backdrop-blur-lg rounded-3xl border border-slate-200/70 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Recent Plans</h2>
              <p className="text-slate-600 mt-1">Your most recent AI-generated plans</p>
            </div>
            <div className="divide-y divide-slate-100">
              {stats.recentPlans.map((plan, index) => (
                <div key={index} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                        {getTypeIcon(plan.recommendation_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {plan.title || getTypeName(plan.recommendation_type)}
                        </h3>
                        <p className="text-sm text-slate-600">{plan.destination}</p>
                        {plan.trip_name && (
                          <p className="text-xs text-violet-600 mt-1">Part of: {plan.trip_name}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(plan.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 overflow-x-auto">
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs text-slate-600 mb-1">Input</p>
                        <p className="font-bold text-purple-600 text-sm">{formatNumber(plan.input_token)}</p>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs text-slate-600 mb-1">Output</p>
                        <p className="font-bold text-pink-600 text-sm">{formatNumber(plan.output_token)}</p>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs text-slate-600 mb-1">Total</p>
                        <p className="font-bold text-violet-600 text-sm">{formatNumber(plan.total_token)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenUsage;

