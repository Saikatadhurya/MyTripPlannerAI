import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { User } from '../services/authService';
import { QuestionnaireData, PackingListRequestData, FoodFinderRequestData, AppFinderRequestData, MusicFinderRequestData, LingoFinderRequestData } from '../types';

// Import all page components
import LandingPage from './LandingPage';
import Questionnaire from './Questionnaire';
import PackingAssistantForm from './PackingAssistantForm';
import PackingListPreview from './PackingListPreview';
import FoodFinderForm from './FoodFinderForm';
import FoodFinderResult from './FoodFinderResult';
import AppFinderForm from './AppFinderForm';
import AppFinderResult from './AppFinderResult';
import MusicFinderForm from './MusicFinderForm';
import MusicFinderResult from './MusicFinderResult';
import LingoFinderForm from './LingoFinderForm';
import LingoFinderResult from './LingoFinderResult';
import UnifiedPlannerForm from './UnifiedPlannerForm';
import UnifiedResultPreview from './UnifiedResultPreview';
import ItineraryPreview from './ItineraryPreview';
import ContactUs from './ContactUs';
import EditProfile from './EditProfile';
import History from './History';
import AuthModal from './AuthModal';
import ShareableRecommendation from './ShareableRecommendation';
import TokenUsage from './TokenUsage';
import GetApiKey from './GetApiKey';

// Import route protection components
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

interface AppRouterProps {
  user: User | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (full_name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  onLogout: () => void;
  onEditProfile: () => void;
  isLoading?: boolean;
  authError?: string;
  isAuthModalOpen: boolean;
  onOpenAuthModal: () => void;
  onCloseAuthModal: () => void;
  // Props for different views
  onPlanUnifiedTrip: (destination?: string) => void;
  onPlanItinerary: () => void;
  onStartPacking: () => void;
  onStartFoodFinder: () => void;
  onStartAppFinder: () => void;
  onStartMusicFinder: () => void;
  onStartLingoFinder: () => void;
  onBackToHome: () => void;
  onViewHistory: () => void;
  onNavigateToResult: (type: string, responseData: any, requestData: any, isHistoryView?: boolean) => void;
  onProfileUpdate: (updatedUser: User) => void;
  // Form submission handlers
  onGenerateItinerary: (data: QuestionnaireData) => Promise<void>;
  onGeneratePackingList: (data: PackingListRequestData) => Promise<void>;
  onGenerateFoodRecommendations: (data: FoodFinderRequestData) => Promise<void>;
  onGenerateAppRecommendations: (data: AppFinderRequestData) => Promise<void>;
  onGenerateMusicRecommendations: (data: MusicFinderRequestData) => Promise<void>;
  onGenerateLingoGuide: (data: LingoFinderRequestData) => Promise<void>;
  onGenerateUnifiedPlan: (data: QuestionnaireData) => Promise<void>;
  // State for forms
  initialQuestionnaireData?: QuestionnaireData | null;
  packingRequestData?: PackingListRequestData | null;
  foodRequestData?: FoodFinderRequestData | null;
  appRequestData?: AppFinderRequestData | null;
  musicRequestData?: MusicFinderRequestData | null;
  lingoRequestData?: LingoFinderRequestData | null;
  // Loading and error states
  isFormLoading?: boolean;
  formError?: string | null;
  streamedText?: string;
  // Result data
  itinerary?: any;
  packingList?: any;
  foodRecommendations?: any;
  appRecommendations?: any;
  musicRecommendations?: any;
  lingoRecommendations?: any;
  unifiedPlan?: any;
  unifiedPlanLoadingStatus?: any;
  unifiedStepErrors?: any;
  questionnaireDataForUnifiedPlan?: any;
  itineraryStreamedText?: string;
  isHistoryView?: boolean;
}

const AppRouter: React.FC<AppRouterProps> = ({
  user,
  onLogin,
  onSignup,
  onLogout,
  onEditProfile,
  isLoading = false,
  authError,
  isAuthModalOpen,
  onOpenAuthModal,
  onCloseAuthModal,
  onPlanUnifiedTrip,
  onPlanItinerary,
  onStartPacking,
  onStartFoodFinder,
  onStartAppFinder,
  onStartMusicFinder,
  onStartLingoFinder,
  onBackToHome,
  onViewHistory,
  onNavigateToResult,
  onProfileUpdate,
  onGenerateItinerary,
  onGeneratePackingList,
  onGenerateFoodRecommendations,
  onGenerateAppRecommendations,
  onGenerateMusicRecommendations,
  onGenerateLingoGuide,
  onGenerateUnifiedPlan,
  initialQuestionnaireData,
  packingRequestData,
  foodRequestData,
  appRequestData,
  musicRequestData,
  lingoRequestData,
  isFormLoading = false,
  formError,
  streamedText = '',
  itinerary,
  packingList,
  foodRecommendations,
  appRecommendations,
  musicRecommendations,
  lingoRecommendations,
  unifiedPlan,
  unifiedPlanLoadingStatus,
  unifiedStepErrors,
  questionnaireDataForUnifiedPlan,
  itineraryStreamedText = '',
  isHistoryView = false,
}) => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          <PublicRoute user={user}>
            <LandingPage 
              user={user}
              onPlanUnifiedTrip={onPlanUnifiedTrip}
              onPlanItinerary={onPlanItinerary}
              onStartPacking={onStartPacking}
              onStartFoodFinder={onStartFoodFinder}
              onStartAppFinder={onStartAppFinder}
              onStartMusicFinder={onStartMusicFinder}
              onStartLingoFinder={onStartLingoFinder}
              onOpenAuthModal={onOpenAuthModal}
              onViewHistory={onViewHistory}
            />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/contact" 
        element={
          <ContactUs onBack={onBackToHome} />
        } 
      />
      
      <Route 
        path="/get-api-key" 
        element={
          <ProtectedRoute user={user}>
            <GetApiKey onBack={onBackToHome} />
          </ProtectedRoute>
        } 
      />

      {/* Auth Routes */}
      <Route 
        path="/auth" 
        element={
          <PublicRoute user={user}>
            <AuthModal
              isOpen={true}
              onClose={onCloseAuthModal}
              onLogin={onLogin}
              onSignup={onSignup}
              isLoading={isLoading}
              error={authError}
            />
          </PublicRoute>
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/plan" 
        element={
          <ProtectedRoute user={user}>
            <UnifiedPlannerForm 
              key={`unified-${user?.id}-${user?.gemini_api_key ? 'has-key' : 'no-key'}`}
              onSubmit={onGenerateUnifiedPlan}
              initialData={initialQuestionnaireData}
              onBack={onBackToHome}
              error={formError}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/itinerary" 
        element={
          <ProtectedRoute user={user}>
            <Questionnaire 
              key={`questionnaire-${user?.id}-${user?.gemini_api_key ? 'has-key' : 'no-key'}`}
              onSubmit={onGenerateItinerary}
              isLoading={isFormLoading}
              error={formError}
              initialData={initialQuestionnaireData}
              onBack={onBackToHome}
              onCancel={() => {}}
              streamedText={streamedText}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/packing" 
        element={
          <ProtectedRoute user={user}>
            <PackingAssistantForm 
              key={`packing-${user?.id}-${user?.gemini_api_key ? 'has-key' : 'no-key'}`}
              onSubmit={onGeneratePackingList}
              isLoading={isFormLoading}
              error={formError}
              onBack={onBackToHome}
              onCancel={() => {}}
              streamedText={streamedText}
              initialData={packingRequestData}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/food" 
        element={
          <ProtectedRoute user={user}>
            <FoodFinderForm 
              key={`food-${user?.id}-${user?.gemini_api_key ? 'has-key' : 'no-key'}`}
              onSubmit={onGenerateFoodRecommendations}
              isLoading={isFormLoading}
              error={formError}
              onBack={onBackToHome}
              onCancel={() => {}}
              streamedText={streamedText}
              initialData={foodRequestData}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/apps" 
        element={
          <ProtectedRoute user={user}>
            <AppFinderForm 
              key={`app-${user?.id}-${user?.gemini_api_key ? 'has-key' : 'no-key'}`}
              onSubmit={onGenerateAppRecommendations}
              isLoading={isFormLoading}
              error={formError}
              onBack={onBackToHome}
              onCancel={() => {}}
              streamedText={streamedText}
              initialData={appRequestData}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/music" 
        element={
          <ProtectedRoute user={user}>
            <MusicFinderForm 
              key={`music-${user?.id}-${user?.gemini_api_key ? 'has-key' : 'no-key'}`}
              onSubmit={onGenerateMusicRecommendations}
              isLoading={isFormLoading}
              error={formError}
              onBack={onBackToHome}
              onCancel={() => {}}
              streamedText={streamedText}
              initialData={musicRequestData}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/lingo" 
        element={
          <ProtectedRoute user={user}>
            <LingoFinderForm 
              key={`lingo-${user?.id}-${user?.gemini_api_key ? 'has-key' : 'no-key'}`}
              onSubmit={onGenerateLingoGuide}
              isLoading={isFormLoading}
              error={formError}
              onBack={onBackToHome}
              onCancel={() => {}}
              streamedText={streamedText}
              initialData={lingoRequestData}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute user={user}>
            <EditProfile 
              key={`profile-${user?.id}-${user?.gemini_api_key ? 'has-key' : 'no-key'}`}
              user={user!}
              onBack={onBackToHome}
              onProfileUpdate={onProfileUpdate}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/history" 
        element={
          <ProtectedRoute user={user}>
            <History 
              onBack={onBackToHome}
              onNavigateToResult={onNavigateToResult}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/token-usage" 
        element={
          <ProtectedRoute user={user}>
            <TokenUsage 
              onBack={onBackToHome}
            />
          </ProtectedRoute>
        } 
      />

      {/* Result Routes - These will be handled dynamically based on state */}
      <Route 
        path="/results/itinerary" 
        element={
          <ProtectedRoute user={user}>
            <ItineraryPreview 
              itinerary={itinerary}
              onRegenerate={onPlanItinerary}
              requestData={initialQuestionnaireData}
              isHistoryView={isHistoryView}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/results/packing" 
        element={
          <ProtectedRoute user={user}>
            <PackingListPreview 
              packingList={packingList}
              onRegenerate={onStartPacking}
              requestData={packingRequestData}
              isHistoryView={isHistoryView}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/results/food" 
        element={
          <ProtectedRoute user={user}>
            <FoodFinderResult 
              recommendations={foodRecommendations}
              onRegenerate={onStartFoodFinder}
              requestData={foodRequestData}
              isHistoryView={isHistoryView}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/results/apps" 
        element={
          <ProtectedRoute user={user}>
            <AppFinderResult 
              recommendations={appRecommendations}
              onRegenerate={onStartAppFinder}
              requestData={appRequestData}
              isHistoryView={isHistoryView}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/results/music" 
        element={
          <ProtectedRoute user={user}>
            <MusicFinderResult 
              recommendations={musicRecommendations}
              onRegenerate={onStartMusicFinder}
              requestData={musicRequestData}
              isHistoryView={isHistoryView}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/results/lingo" 
        element={
          <ProtectedRoute user={user}>
            <LingoFinderResult 
              recommendations={lingoRecommendations}
              onRegenerate={onStartLingoFinder}
              requestData={lingoRequestData}
              isHistoryView={isHistoryView}
              user={user}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/results/unified" 
        element={
          <ProtectedRoute user={user}>
            <UnifiedResultPreview 
              plan={unifiedPlan}
              loadingStatus={unifiedPlanLoadingStatus}
              stepErrors={unifiedStepErrors}
              onPlanNew={onBackToHome}
              onRegenerate={() => {}}
              onRegenerateStep={() => {}}
              onCancel={() => {}}
              onCancelStep={() => {}}
              onTabChangeScrollToTop={() => {}}
              itineraryStreamedText={itineraryStreamedText}
              questionnaireData={questionnaireDataForUnifiedPlan}
              isHistoryView={isHistoryView}
            />
          </ProtectedRoute>
        } 
      />

      {/* Shareable recommendation routes - Public access */}
      <Route 
        path="/share/:id" 
        element={<ShareableRecommendation />}
      />

      {/* Test route to verify React Router is working */}
      <Route 
        path="/test-router" 
        element={
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-white/60 max-w-md mx-4">
              <h1 className="text-2xl font-bold text-slate-800 mb-4">React Router Test</h1>
              <p className="text-slate-600">If you can see this, React Router is working!</p>
              <p className="text-sm text-slate-500 mt-2">URL: {window.location.href}</p>
            </div>
          </div>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
