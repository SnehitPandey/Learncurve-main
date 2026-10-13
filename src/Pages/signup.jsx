import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser, verifyOtp, completeUserProfile, resendOtp, getGoogleAuthUrl } from "../api/auth";

// Resolves where to land after signup. ProtectedRoute stores the attempted route in
// location.state.from; fall back to /home.
function resolveRedirectTarget(locationState) {
  const from = locationState?.from;
  if (!from) return "/home";
  const target = `${from.pathname || ""}${from.search || ""}${from.hash || ""}`;
  // Guard against bouncing back into an auth screen.
  if (!target || target.startsWith("/login") || target.startsWith("/signup")) return "/home";
  return target;
}

// Hoisted to module scope: defining it inside Signup would give it a new type identity
// on every render, remounting the subtree and restarting framer-motion animations.
function GoogleButton({ text, onClick, isLoading }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-text/20 rounded-xl 
                 bg-background text-text font-medium shadow-sm 
                 hover:bg-alt/50 transition-colors duration-300"
    >
      <img src="/assets/icons/google.png" alt="Google" className="w-5 h-5" />
      {text}
    </motion.button>
  );
}

export default function Signup() {
  const [step, setStep] = useState(1); // 1: signup form, 2: verification, 3: profile
  const [formData, setFormData] = useState({
    username: "",
    emailOrPhone: "",
    password: "",
    verifyCode: "",
    name: "",
    age: "",
    education: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoNotice, setInfoNotice] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  // Step 1: Initial signup
  const handleInitialSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfoNotice("");

    try {
      if (!formData.username || !formData.emailOrPhone || !formData.password) {
        throw new Error("Please fill in all fields");
      }

      const res = await registerUser({
        username: formData.username,
        emailOrPhone: formData.emailOrPhone,
        password: formData.password
      });

      if (res.devCode) {
        setInfoNotice(`Verification code sent! (Dev OTP: ${res.devCode})`);
        setFormData(prev => ({ ...prev, verifyCode: res.devCode }));
      } else {
        setInfoNotice(res.message || "Verification code sent to your email!");
      }

      // Move to verification step
      setStep(2);
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verification
  const handleVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfoNotice("");

    try {
      if (!formData.verifyCode) {
        throw new Error("Please enter verification code");
      }
      
      await verifyOtp({
        emailOrPhone: formData.emailOrPhone,
        code: formData.verifyCode
      });

      setInfoNotice("Account verified! Complete your profile.");
      setStep(3);
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Profile completion
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!formData.name || !formData.age || !formData.education) {
        throw new Error("Please fill in all profile fields");
      }

      await completeUserProfile({
        emailOrPhone: formData.emailOrPhone,
        name: formData.name,
        age: parseInt(formData.age, 10),
        education: formData.education
      });

      // Client-side redirect back to the page the user originally asked for.
      navigate(resolveRedirectTarget(location.state), { replace: true, state: null });
    } catch (err) {
      setError(err.message || "Failed to complete profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError("");
    try {
      const oauthRes = await getGoogleAuthUrl();
      if (oauthRes?.success && oauthRes?.url) {
        window.location.href = oauthRes.url;
        return;
      }
      throw new Error(oauthRes?.error || "Unable to initiate Google signup. Please register with email.");
    } catch (err) {
      setError(err.message || "Google signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await resendOtp({ emailOrPhone: formData.emailOrPhone });
      if (res.devCode) {
        setInfoNotice(`New code sent! (Dev OTP: ${res.devCode})`);
        setFormData(prev => ({ ...prev, verifyCode: res.devCode }));
      } else {
        setInfoNotice("Verification code resent!");
      }
    } catch (err) {
      setError(err.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 transition-colors duration-300">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <div className="p-8 rounded-2xl shadow-lg bg-background/60 backdrop-blur-lg border border-text/20 space-y-6">
          
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary mb-2">
              {step === 1 && "Join LearnCurve"}
              {step === 2 && "Verify Your Account"}
              {step === 3 && "Complete Your Profile"}
            </h2>
            <p className="text-text/70">
              {step === 1 && "Create your account to start learning"}
              {step === 2 && "Enter the verification code we sent"}
              {step === 3 && "Tell us a bit about yourself"}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
            {infoNotice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium"
              >
                {infoNotice}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1: Initial Signup */}
          {step === 1 && (
            <>
              <GoogleButton
                text="Sign up with Google"
                onClick={handleGoogleSignup}
                isLoading={isLoading}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-text/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-text/60">or sign up with email/phone</span>
                </div>
              </div>

              <form onSubmit={handleInitialSignup} className="space-y-5">
                <div>
                  <label htmlFor="username" className="block mb-2 text-sm font-medium text-text">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                               placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                               transition-colors duration-200"
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <label htmlFor="emailOrPhone" className="block mb-2 text-sm font-medium text-text">
                    Email or Phone
                  </label>
                  <input
                    id="emailOrPhone"
                    name="emailOrPhone"
                    type="text"
                    required
                    value={formData.emailOrPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                               placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                               transition-colors duration-200"
                    placeholder="you@example.com or +1234567890"
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

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full py-3 rounded-xl font-semibold bg-primary text-alt 
                             hover:bg-primary/90 shadow-lg shadow-primary/25 
                             disabled:opacity-50 disabled:cursor-not-allowed 
                             transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-alt/30 border-t-alt rounded-full animate-spin"></div>
                      Sending Code...
                    </div>
                  ) : (
                    "Sign Up"
                  )}
                </motion.button>
              </form>
            </>
          )}

          {/* Step 2: Verification */}
          {step === 2 && (
            <form onSubmit={handleVerification} className="space-y-5">
              <div className="text-center text-sm text-text/70 bg-alt/20 p-3 rounded-lg">
                We sent a verification code to <strong>{formData.emailOrPhone}</strong>
              </div>

              <div>
                <label htmlFor="verifyCode" className="block mb-2 text-sm font-medium text-text">
                  Verification Code
                </label>
                <input
                  id="verifyCode"
                  name="verifyCode"
                  type="text"
                  required
                  value={formData.verifyCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                             placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                             transition-colors duration-200"
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={isLoading}
                  className="text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  Didn't receive code? Resend
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full py-3 rounded-xl font-semibold bg-primary text-alt 
                           hover:bg-primary/90 shadow-lg shadow-primary/25 
                           disabled:opacity-50 disabled:cursor-not-allowed 
                           transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-alt/30 border-t-alt rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify"
                )}
              </motion.button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-text/60 hover:text-text transition-colors"
                >
                  ← Back to signup
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Profile */}
          {step === 3 && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-text">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                             placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                             transition-colors duration-200"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="age" className="block mb-2 text-sm font-medium text-text">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  required
                  min="13"
                  max="120"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                             placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                             transition-colors duration-200"
                  placeholder="Your age"
                />
              </div>

              <div>
                <label htmlFor="education" className="block mb-2 text-sm font-medium text-text">
                  Education
                </label>
                <input
                  id="education"
                  name="education"
                  type="text"
                  required
                  value={formData.education}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-text/20 bg-text/5 text-text 
                             placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary 
                             transition-colors duration-200"
                  placeholder="e.g., High School, Bachelor's in CS"
                />
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full py-3 rounded-xl font-semibold bg-primary text-alt 
                           hover:bg-primary/90 shadow-lg shadow-primary/25 
                           disabled:opacity-50 disabled:cursor-not-allowed 
                           transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-alt/30 border-t-alt rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Complete Registration"
                )}
              </motion.button>
            </form>
          )}

          {/* Footer Links */}
          {step === 1 && (
            <div className="text-center">
              <p className="text-sm text-text/60">
                Already have an account?{" "}
                <NavLink 
                  to="/login" 
                  className="text-primary font-medium hover:text-primary/80 transition-colors"
                >
                  Sign In
                </NavLink>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
