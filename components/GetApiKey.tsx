import React from 'react';
import { ArrowLeft, Key, ExternalLink, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GetApiKeyProps {
  onBack: () => void;
}

const GetApiKey: React.FC<GetApiKeyProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const steps = [
    {
      number: 1,
      title: 'Go to Google AI Studio',
      description: 'Navigate to Google AI Studio to create your Gemini API key',
      link: 'https://aistudio.google.com/api-keys',
      linkText: 'Open Google AI Studio'
    },
    {
      number: 2,
      title: 'Click Create API Key',
      description: 'On the API Keys page, click the "Create API Key" button'
    },
    {
      number: 3,
      title: 'Add Name for Your Key',
      description: 'Give your API key a recognizable name (e.g., "My Trip Planner API Key")'
    },
    {
      number: 4,
      title: 'Create a New Project',
      description: 'Select "Create project" option and name it (e.g., "My Planner")',
      note: 'Projects help you organize and manage your API keys'
    },
    {
      number: 5,
      title: 'Click Create Key',
      description: 'Finally, click the "Create" button to generate your API key'
    },
    {
      number: 6,
      title: 'Copy and Save Your Key',
      description: 'Copy your generated API key, then navigate to Edit Profile in your account settings',
      note: 'Paste the key in the Gemini API Key field and click Save Changes'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Get Your Gemini API Key</h1>
                <p className="text-white/80 text-sm">Follow these simple steps to create your API key</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Why Use Your Own API Key?</h3>
              <p className="text-blue-800 text-sm">
                By adding your own Gemini API key, you'll use your personal Google quota for AI requests. 
                This ensures you have full control over your usage and can avoid any service limitations.
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Step-by-Step Guide</h2>
            
            {steps.map((step, index) => (
              <div key={step.number} className="mb-8 last:mb-0">
                <div className="flex items-start space-x-4">
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {step.number}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {step.description}
                    </p>
                    {step.note && (
                      <p className="text-sm text-gray-500 italic mb-3">
                        {step.note}
                      </p>
                    )}

                    {/* Link Button */}
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm"
                      >
                        <span>{step.linkText}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div className="mt-4 flex justify-center">
                        <div className="w-0.5 h-8 bg-gradient-to-b from-violet-500 to-purple-600"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Success Message */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Next Steps</h3>
                  <p className="text-green-800 text-sm mb-2">
                    Once you have created your API key:
                  </p>
                  <ol className="list-decimal list-inside text-green-800 text-sm space-y-1">
                    <li>Copy your generated API key from Google AI Studio</li>
                    <li>Go to <button onClick={() => navigate('/profile')} className="font-semibold text-violet-600 hover:text-violet-700 underline">Edit Profile</button> in your account menu</li>
                    <li>Paste the key in the <span className="font-semibold">Gemini API Key</span> field</li>
                    <li>Click <span className="font-semibold">Save Changes</span></li>
                  </ol>
                  <p className="text-green-700 text-sm mt-3">
                    Your key will be securely stored and used for all future AI requests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <a
            href="https://aistudio.google.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all font-medium flex items-center space-x-2"
          >
            <span>Open Google AI Studio</span>
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default GetApiKey;

