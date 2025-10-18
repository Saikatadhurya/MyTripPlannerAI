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
          <LingoFinderForm 
            onSubmit={onGenerateLingoGuide}
            isLoading={isFormLoading}
            error={formError}
            onBack={onBackToHome}
            onCancel={() => {}}
            streamedText={streamedText}
            initialData={lingoRequestData}
            user={user}
          />
        } 
      />

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute user={user}>
            <EditProfile 
              user={user!}
              onBack={onBackToHome}
              onUpdate={onProfileUpdate}
              error={authError}
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

      {/* Result Routes - These will be handled dynamically based on state */}
      <Route 
        path="/results/itinerary" 
        element={
          <ProtectedRoute user={user}>
            <ItineraryPreview 
              itinerary={itinerary}
              onRegenerate={() => {}}
              requestData={initialQuestionnaireData}
              isHistoryView={isHistoryView}
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
              onRegenerate={() => {}}
              requestData={packingRequestData}
              isHistoryView={isHistoryView}
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
              onRegenerate={() => {}}
              requestData={foodRequestData}
              isHistoryView={isHistoryView}
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
              onRegenerate={() => {}}
              requestData={appRequestData}
              isHistoryView={isHistoryView}
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
              onRegenerate={() => {}}
              requestData={musicRequestData}
              isHistoryView={isHistoryView}
            />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/results/lingo" 
        element={
          <LingoFinderResult 
            recommendations={lingoRecommendations}
            onRegenerate={() => {}}
            requestData={lingoRequestData}
            isHistoryView={isHistoryView}
          />
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

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
