import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/solid";
import { User, Settings, LogOut } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Toggletheme from "../elements/toggletheme";


import { clearAuth } from "../../api/client";
import { disconnectSocket } from "../../sockets/socketClient";
import { getCurrentUser } from "../../utils/user";
import { getUserProfileAndSync } from "../../api/users";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("isLoggedIn") === "true"
  );
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 1);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keep the login state and user profile live
  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  // Fetch fresh profile on mount if signed in so latest avatar is reflected
  useEffect(() => {
    if (isLoggedIn && localStorage.getItem("token")) {
      getUserProfileAndSync()
        .then(() => setCurrentUser(getCurrentUser()))
        .catch(() => {});
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    clearAuth();
    disconnectSocket();
    setIsLoggedIn(false);
    setProfileMenuOpen(false);
    setIsOpen(false);
    // Client-side only - a reload here would discard the navigation and remount the app.
    navigate("/", { replace: true });
  };


  const linkClasses = ({ isActive }) =>
    `relative inline-block pb-1 transition-colors duration-300
     after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px]
     after:bg-primary after:transition-all after:duration-300 after:ease-in-out
     after:w-0 hover:after:w-full
     ${
       isActive
         ? "text-primary font-semibold after:w-full"
         : "text-text hover:text-primary"
     }`;

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`w-full top-0 left-0 z-50 transition-all duration-300 flex justify-center ${
        scrolled ? "fixed" : "absolute"
      }`}
    >
      <motion.div
        animate={{
          backgroundColor: scrolled 
            ? "rgba(var(--color-background-rgb), 0.8)" 
            : "rgba(var(--color-background-rgb), 0)",
          borderColor: scrolled 
            ? "rgba(var(--color-primary-rgb), 1)" 
            : "rgba(var(--color-primary-rgb), 0)",
          borderWidth: scrolled ? "1px" : "0px",
          marginTop: scrolled ? "16px" : "0px",
          maxWidth: scrolled ? "896px" : "1280px",
          width: scrolled ? "92%" : "100%",
          backdropFilter: scrolled ? "blur(16px)" : "blur(0px)"
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex items-center justify-between px-8 py-3 rounded-full"
        style={{
          boxShadow: scrolled ? "0 10px 25px rgba(var(--color-primary-rgb), 0.15)" : "none"
        }}
      >
        <div className="flex items-center space-x-6">
          <NavLink
            to="/"
            className="text-xl font-bold tracking-wide text-primary"
          >
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              FocusKami
            </motion.span>
          </NavLink>

          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/about" className={linkClasses}>
              About
            </NavLink>
            <NavLink to="/contact" className={linkClasses}>
              Contact Us
            </NavLink>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          <Toggletheme />
          
          {isLoggedIn ? (
            // Show profile menu when logged in
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-text/50 hover:border-text hover:bg-text/10 text-text transition-all duration-200 overflow-hidden"
                title={currentUser?.name || "Profile"}
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name || "User"}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover"
                    onError={() => {
                      setCurrentUser(prev => ({ ...prev, avatarUrl: "" }));
                    }}
                  />
                ) : currentUser?.initials && currentUser.initials !== "?" ? (
                  <span className="text-xs font-bold tracking-tight">{currentUser.initials}</span>
                ) : (
                  <User size={20} />
                )}
              </motion.button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 w-44 rounded-lg border border-text/20 bg-background/90 backdrop-blur-md shadow-xl overflow-hidden"
                  >
                    {[
                      { icon: User, text: "Profile", action: () => navigate("/profile") },
                      { icon: Settings, text: "Settings", action: () => navigate("/settings") },
                      { icon: LogOut, text: "Logout", action: handleLogout, border: true }
                    ].map((item, i) => (
                      <motion.button
                        key={item.text}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                        whileHover={{ 
                          x: 5,
                          backgroundColor: "rgba(var(--color-text-rgb), 0.1)"
                        }}
                        onClick={() => {
                          setProfileMenuOpen(false);
                          item.action();
                        }}
                        className={`flex items-center gap-3 w-full px-4 py-3 text-sm text-text/80 hover:text-text transition-colors ${
                          item.border ? 'border-t border-text/10' : ''
                        }`}
                      >
                        <item.icon size={16} />
                        {item.text}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Show login/signup when not logged in
            <>
              <NavLink to="/login" className={linkClasses}>
                Login
              </NavLink>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <NavLink
                  to="/signup"
                  className="ml-3 px-5 py-2 rounded-full font-medium transition-all duration-300 bg-primary text-alt hover:bg-primary/90"
                  style={{
                    boxShadow: '0 0 15px rgba(var(--color-primary-rgb), 0.6)'
                  }}
                >
                  Get Started
                </NavLink>
              </motion.div>
            </>
          )}
        </div>

        <div className="md:hidden flex gap-5">
          <Toggletheme />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-md hover:bg-background transition-colors"
            onClick={() => setIsOpen(true)}
          >
            <Bars3Icon className="h-7 w-7 text-text" />
          </motion.button>
        </div>
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />
              
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute top-0 right-0 h-full w-72 max-w-full 
                  bg-background/80 backdrop-blur-xl 
                  border-l border-primary/20 shadow-xl flex flex-col"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-text/20">
                  <span className="text-2xl font-bold tracking-wide text-primary">
                    FocusKami
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="hover:text-primary transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-text" />
                  </motion.button>
                </div>

                <nav className="flex flex-col gap-1 px-3 py-5 flex-grow">
                  {/* Mobile menu items based on login status */}
                  {isLoggedIn ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-xl bg-text/5 border border-text/10">
                        {currentUser?.avatarUrl ? (
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.name || "User"}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover"
                            onError={() => setCurrentUser(prev => ({ ...prev, avatarUrl: "" }))}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                            {currentUser?.initials && currentUser.initials !== "?" ? currentUser.initials : <User size={18} />}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-text truncate">{currentUser?.name || "Learner"}</p>
                          <p className="text-xs text-text/60">Signed in</p>
                        </div>
                      </div>
                      {[
                        { to: "/about", text: "About" },
                        { to: "/contact", text: "Contact Us" },
                        { to: "/profile", text: "Profile" },
                        { to: "/settings", text: "Settings" },
                        { action: handleLogout, text: "Logout" }
                      ].map((link, i) => (
                      <motion.div
                        key={link.to || link.text}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                        whileHover={{ x: 5 }}
                      >
                        {link.action ? (
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              link.action();
                            }}
                            className={`${linkClasses({ isActive: false })} block py-3 px-4 rounded-lg hover:bg-background/50 w-full text-left`}
                          >
                            {link.text}
                          </button>
                        ) : (
                          <NavLink
                            to={link.to}
                            className={({ isActive }) =>
                              `${linkClasses({ isActive })} block py-3 px-4 rounded-lg hover:bg-background/50`
                            }
                            onClick={() => setIsOpen(false)}
                          >
                            {link.text}
                          </NavLink>
                        )}
                      </motion.div>
                      ))}
                    </>
                  ) : (
                    [
                      { to: "/about", text: "About" },
                      { to: "/contact", text: "Contact Us" },
                      { to: "/login", text: "Login" },
                      { to: "/signup", text: "Get Started" }
                    ].map((link, i) => (
                      <motion.div
                        key={link.to}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                        whileHover={{ x: 5 }}
                      >
                        <NavLink
                          to={link.to}
                          className={({ isActive }) =>
                            `${linkClasses({ isActive })} block py-3 px-4 rounded-lg hover:bg-background/50`
                          }
                          onClick={() => setIsOpen(false)}
                        >
                          {link.text}
                        </NavLink>
                      </motion.div>
                    ))
                  )}
                </nav>

                <div className="p-4 text-xs text-text/50 border-t border-text/20">
                  © {new Date().getFullYear()} FocusKami
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.header>
  );
}
