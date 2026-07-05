import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Login() {
  const [error, setError] = useState("");

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    const backendUrl = import.meta.env.VITE_API_BASE_URL;
    console.log('🔍 VITE_API_BASE_URL:', backendUrl);
    console.log('🔍 Redirecting to relative Vite proxy URL: /auth/google');
    // We use a relative path so Vite's proxy (port 3000) handles the request
    // and forwards it to localhost:5000 securely, bypassing Dev Tunnels port 5000 issues.
    window.location.href = import.meta.env.DEV
      ? `/auth/google`
      : (import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/auth/google` : `/auth/google`);
  };

  const GoogleButton = ({ text }) => {
    return (
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-text/20 rounded-xl 
                   bg-background text-text font-medium shadow-sm 
                   hover:bg-alt/50 transition-colors duration-300"
      >
        <img src="/assets/icons/google.png" alt="Google" className="w-5 h-5" />
        {text}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-background/60 backdrop-blur-lg border border-text/20 space-y-6">

        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-2">
            Welcome Back
          </h2>
          <p className="text-text/70">
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <GoogleButton text="Continue with Google" />

        <div className="text-center mt-6">
          <p className="text-sm text-text/60">
            Don't have an account?{" "}
            <NavLink
              to="/signup"
              className="text-primary font-medium hover:text-primary/80 transition-colors"
            >
              Sign Up
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
