import { useState, useEffect, useRef } from "react";
import { NavLink, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { resetPassword } from "../api/auth";

// Supabase hands recovery credentials back in different shapes depending on the flow:
//   implicit → #access_token=...&refresh_token=...&type=recovery
//   PKCE     → ?code=...
// and the backend's own non-production link is ?token=<hex>.
// Parse all of them so a real reset email never dead-ends on "missing token".
function readResetToken(searchParams, hash) {
  const fromQuery =
    searchParams.get("token") ||
    searchParams.get("code") ||
    searchParams.get("access_token");
  if (fromQuery) return fromQuery;

  const hashParams = new URLSearchParams((hash || "").replace(/^#/, ""));
  return (
    hashParams.get("token") ||
    hashParams.get("access_token") ||
    hashParams.get("code") ||
    ""
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // The hash fragment is not reactive, so snapshot it once on mount.
  const [hash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash : ""
  );
  const token = readResetToken(searchParams, hash);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const redirectTimerRef = useRef(null);

  // The post-reset redirect is scheduled from the submit handler, so it can
  // outlive the component if the visitor navigates away inside those 2.5s.
  useEffect(() => () => clearTimeout(redirectTimerRef.current), []);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing password reset token. Please request a new link.");
    } else {
      // Clear a stale "missing token" banner once a usable token shows up.
      setError("");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing. Please request a new password reset link.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await resetPassword(token, newPassword);
      if (res?.success) {
        setSuccess(true);
        redirectTimerRef.current = setTimeout(() => {
          navigate("/login");
        }, 2500);
      } else {
        setError(res?.error || "Failed to reset password. The token may be expired or invalid.");
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
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-1">Set New Password</h2>
          <p className="text-sm text-text/70">
            Create a strong, unique password to secure your account.
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
                <p className="font-semibold mb-1">Password reset successfully!</p>
                <p className="text-green-500/80">
                  Your password has been updated. Redirecting you to sign in...
                </p>
              </div>
            </div>

            <NavLink
              to="/login"
              className="block w-full py-3 text-center rounded-xl font-semibold bg-primary text-alt hover:bg-primary/90 transition-colors"
            >
              Sign In Now
            </NavLink>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block mb-2 text-sm font-medium text-text">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                           placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                           transition-colors duration-200"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-text">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                           placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                           transition-colors duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full py-3 rounded-xl font-semibold bg-primary text-alt 
                         hover:bg-primary/90 shadow-lg shadow-primary/25 
                         disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-alt/30 border-t-alt rounded-full animate-spin"></div>
                  Resetting Password...
                </div>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
