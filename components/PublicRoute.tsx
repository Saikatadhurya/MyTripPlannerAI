import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '../services/authService';

interface PublicRouteProps {
  children: React.ReactNode;
  user: User | null;
  redirectTo?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  user, 
  redirectTo = '/' 
}) => {
  const location = useLocation();

  // If user is authenticated and trying to access auth pages, redirect to home
  if (user && (location.pathname === '/auth' || location.pathname === '/login' || location.pathname === '/signup')) {
    const from = location.state?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
