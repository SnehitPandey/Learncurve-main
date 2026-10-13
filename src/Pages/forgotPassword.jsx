import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { forgotPassword } from "../api/auth";

// The backend returns `devToken` (not `devResetUrl`) in non-production. Build a
// router-safe path so the dev link stays a client-side navigation, and normalise a
// provided absolute URL down to its path if the backend ever returns one.
function toRouterPath(rawUrl) {
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return rawUrl;
  }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [devResetPath, setDevResetPath] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await forgotPassword(email);
      if (res?.success) {
        setSuccess(true);
        // Backend contract: `{ success, message, devToken? }` outside production.
        const devToken = res.devToken || "";
        const rawLink = res.devResetUrl || (devToken ? `/reset-password?token=${encodeURIComponent(devToken)}` : "");
        setDevResetPath(rawLink ? toRouterPath(rawLink) : "");
      } else {
        setError(res?.error || "Failed to request password reset. Please try again.");
      }
    } catch (err) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-background/60 backdrop-blur-lg border border-text/20 space-y-6">
        
        <NavLink
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-text/70 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </NavLink>

        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-3">
            <Mail size={24} />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-1">Forgot Password?</h2>
          <p className="text-sm text-text/70">
            Enter your email and we'll send you instructions to reset your password.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500">
              <CheckCircle2 size={22} className="shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Check your inbox!</p>
                <p className="text-green-500/80">
                  If an account exists for <span className="font-medium text-text">{email}</span>, password reset instructions have been sent.
                </p>
              </div>
            </div>

            {devResetPath && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Development Mode Reset Link:
                </p>
                <NavLink
                  to={devResetPath}
                  className="block text-xs font-mono text-primary underline break-all hover:opacity-80"
                >
                  {window.location.origin}
                  {devResetPath}
                </NavLink>
              </div>
            )}

            <NavLink
              to="/login"
              className="block w-full py-3 text-center rounded-xl font-semibold bg-primary text-alt hover:bg-primary/90 transition-colors"
            >
              Return to Login
            </NavLink>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-text">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                           placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                           transition-colors duration-200"
              />
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
                  Sending Instructions...
                </div>
              ) : (
                "Send Reset Instructions"
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
