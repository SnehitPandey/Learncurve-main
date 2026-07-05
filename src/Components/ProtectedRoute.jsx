/**
 * Protected Route Component
 * Wraps routes that require authentication
 */

import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

export const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!authService.isAuthenticated()) {
    // Redirect to login page, but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
