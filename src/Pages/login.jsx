import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { loginUser, getGoogleAuthUrl } from "../api/auth";

// Resolves where to land after a successful auth. ProtectedRoute stores the
// attempted route in location.state.from; fall back to /home.
function resolveRedirectTarget(locationState) {
  const from = locationState?.from;
  if (!from) return "/home";
  const target = `${from.pathname || ""}${from.search || ""}${from.hash || ""}`;
  // Guard against bouncing back into an auth screen.
  if (!target || target.startsWith("/login") || target.startsWith("/signup")) return "/home";
  return target;
}

// Hoisted to module scope: defining it inside Login would give it a new type identity
// on every render, remounting the subtree and restarting its animations.
function GoogleButton({ text, onClick, isLoading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-text/20 rounded-xl 
                 bg-background text-text font-medium shadow-sm 
                 hover:bg-alt/50 transition-colors duration-300"
    >
      <img src="/assets/icons/google.png" alt="Google" className="w-5 h-5" />
      {text}
    </button>
  );
}

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Please fill in all fields");
      }

      await loginUser({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });

      // Client-side redirect back to the page the user originally asked for.
      navigate(resolveRedirectTarget(location.state), { replace: true, state: null });
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      const oauthRes = await getGoogleAuthUrl();
      if (oauthRes?.success && oauthRes?.url) {
        window.location.href = oauthRes.url;
        return;
      }
      throw new Error(oauthRes?.error || "Unable to initiate Google authentication. Please try email sign in.");
    } catch (err) {
      setError(err.message || "Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4  transition-colors duration-300">
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

        <GoogleButton
          text="Continue with Google"
          onClick={handleGoogleLogin}
          isLoading={isLoading}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-text/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-text/60">or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-text">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                         placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                         transition-colors duration-200"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-text">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                         placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                         transition-colors duration-200"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="rounded border-text/30 text-primary focus:ring-primary/50 bg-text/5"
              />
              <span className="ml-2 text-sm text-text/70">Remember me</span>
            </label>
            <NavLink to="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
              Forgot password?
            </NavLink>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold bg-primary text-alt 
                       hover:bg-primary/90 shadow-lg shadow-primary/25 
                       disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-alt/30 border-t-alt rounded-full animate-spin"></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-center">
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
