import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * OAuth Callback Handler
 * This page handles the redirect from OAuth providers (Google)
 * It extracts the token from URL and completes the authentication
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const error = searchParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          navigate('/login?error=' + error);
          return;
        }

        // Fetch user data using the HttpOnly cookies set by backend
        const response = await authService.getCurrentUser();

        if (response.success && response.data) {
          console.log('✅ User data loaded:', response.data.email);
          localStorage.setItem('isLoggedIn', 'true');
          // Force reload to home page so contexts re-initialize
          window.location.href = window.location.origin + '/home';
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mb-4"></div>
        <p className="text-[var(--color-text)] text-lg">Completing sign in...</p>
      </div>
    </div>
  );
}
