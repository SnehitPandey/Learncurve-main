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

        <div className="space-y-4 pt-2">
          <GoogleButton
            text="Continue with Google"
            onClick={handleGoogleLogin}
            isLoading={isLoading}
          />
        </div>

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
