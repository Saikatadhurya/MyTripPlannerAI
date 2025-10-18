import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: User | null;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  user, 
  redirectTo = '/auth' 
}) => {
  const location = useLocation();

  if (!user) {
    // Redirect to auth page with the attempted location
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
