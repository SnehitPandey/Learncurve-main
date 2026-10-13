/* eslint-disable react-refresh/only-export-components --
 * This is the application entry point: it builds the router and calls
 * `createRoot(...)` at module scope, so there are no exports to fast-refresh
 * against. The rule does not apply here by design.
 */
import { Suspense, StrictMode, lazy, useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
    useNavigation,
    useLocation,
    Outlet
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bird } from "lucide-react";

const Dashboard = lazy(() => import("./Pages/App/home.jsx"));
const Profile = lazy(() => import("./Pages/App/profilePage.jsx"));
const Settings = lazy(() => import("./Pages/App/settings.jsx"));
const Users = lazy(() => import("./Pages/App/users.jsx"));
const Room = lazy(() => import("./Pages/App/room.jsx"));
const CreateRoom = lazy(() => import("./Pages/App/createroom.jsx"));
const JoinRoom = lazy(() => import("./Pages/App/joinroom.jsx"));
const Login = lazy(() => import("./Pages/login.jsx"));
const Signup = lazy(() => import("./Pages/signup.jsx"));
const About = lazy(() => import("./Pages/about.jsx"));
const Contact = lazy(() => import("./Pages/contact.jsx"));
const Landing = lazy(() => import("./Pages/focuskami.jsx"));
const AuthCallback = lazy(() => import("./Pages/authCallback.jsx"));
const ForgotPassword = lazy(() => import("./Pages/forgotPassword.jsx"));
const ResetPassword = lazy(() => import("./Pages/resetPassword.jsx"));
const Notfound = lazy(() => import("./Pages/notfound.jsx"));
const DuoConnect = lazy(() => import("./Pages/DuoConnect.jsx"));


import Navigation from "./Components/App/navigation.jsx";
import Navbar from "./Components/landing/navbar.jsx";
import Footer from "./Components/landing/footer.jsx";
import DarkModeBackground from "./Components/elements/DarkModeBackground.jsx";
import { getMe } from "./api/auth";
import { initAccent } from "./theme";

const GlobalLoader = () => {
    // Doubles as the router-navigation loader, the lazy-route Suspense fallback
    // and ProtectedRoute's "checking your session" screen, so the copy stays
    // deliberately generic about which of the three is running.
    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
        >
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className="absolute w-32 h-32 border border-primary/30 rounded-full"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                        scale: [0, 1, 2, 3],
                        opacity: [0, 0.6, 0.3, 0]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                />
                
                <motion.div
                    className="absolute w-24 h-24 border border-primary/40 rounded-full"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                        scale: [0, 1, 2, 3],
                        opacity: [0, 0.7, 0.4, 0]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 0.2
                    }}
                />
                
                <motion.div
                    className="absolute w-16 h-16 border border-primary/50 rounded-full"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                        scale: [0, 1, 2, 3],
                        opacity: [0, 0.8, 0.5, 0]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 0.4
                    }}
                />
            </div>

            <motion.div
                className="relative z-10 flex flex-col items-center gap-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/20 border-2 border-primary shadow-lg">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        <Bird size={24} className="text-primary" />
                    </motion.div>
                </div>
            </motion.div>

            <motion.p
                className="absolute bottom-1/3 text-sm text-text/70 font-medium"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
            >
                Getting things ready…
            </motion.p>
        </motion.div>
    );
};

// The global loader is driven by ONE source: the router's navigation state.
// A minimum display window stops it from flickering on fast navigations, and a
// single timer is (re)armed whenever the router settles.
const MIN_LOADER_DISPLAY_MS = 400;

const RootLayout = () => {
    const navigation = useNavigation();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    // Timestamp of the moment the loader became visible (0 while hidden).
    const shownAtRef = useRef(0);

    useEffect(() => {
        if (navigation.state === "loading") {
            // Keep the original timestamp across chained loads so the minimum
            // window is measured from the first appearance, not each re-show.
            if (!shownAtRef.current) shownAtRef.current = Date.now();
            setIsLoading(true);
            return undefined;
        }

        // Router settled. Nothing to dismiss if the loader was never shown.
        if (!shownAtRef.current) return undefined;

        const remaining = Math.max(
            0,
            MIN_LOADER_DISPLAY_MS - (Date.now() - shownAtRef.current)
        );
        const timer = setTimeout(() => {
            shownAtRef.current = 0;
            setIsLoading(false);
        }, remaining);
        return () => clearTimeout(timer);
    }, [location.pathname, navigation.state]);

    return (
        <div className="relative min-h-screen">
            <DarkModeBackground />
            <div className="relative z-10 min-h-screen">
                <AnimatePresence>
                    {isLoading && <GlobalLoader />}
                </AnimatePresence>
                <Outlet />
            </div>
        </div>
    );
};

const Layout = ({ children }) => (
    <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow min-h-full">
            <Suspense fallback={<GlobalLoader />}>
                {children}
            </Suspense>
        </div>
        <Footer />
    </div>
);

const AppLayout = ({ children }) => (
    <>
        <Navigation />
        <Suspense fallback={<GlobalLoader />}>
            {children}
        </Suspense>
    </>
);

// ✅ FIXED: Dynamic authentication check
const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // `isLoggedIn` in localStorage is only a HINT: it survives an expired or
        // revoked token, so trusting it rendered the app shell for signed-out
        // users. The session is confirmed against the backend instead.
        let cancelled = false;

        const applyResult = (loggedIn) => {
            // Unmount race: getMe() may resolve after this route is gone.
            if (cancelled) return;
            setIsLoggedIn(loggedIn);
            setIsChecking(false);
        };

        const verifySession = async () => {
            if (!localStorage.getItem("token")) {
                applyResult(false);
                return;
            }
            try {
                // getMe() throws on 401/404/500; on success it resolves to
                // { success: true, user: {...} }.
                const res = await getMe();
                applyResult(Boolean(res?.user));
            } catch {
                // Expired/revoked token or an unreachable backend — sign out.
                applyResult(false);
            }
        };

        verifySession();

        // Listen for localStorage changes (for cross-tab login/logout). The event
        // only says "auth may have changed", so re-verify rather than read the flag.
        const handleStorageChange = () => {
            verifySession();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            cancelled = true;
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    if (isChecking) {
        return <GlobalLoader />;
    }

    if (!isLoggedIn) {
        // Carry the attempted location so login/signup can restore it after auth.
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
};

const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            // ✅ Protected routes (app pages)
            {
                path: "home",
                element: (
                    <ProtectedRoute>
                        <AppLayout>
                            <Dashboard />
                        </AppLayout>
                    </ProtectedRoute>
                ),
            },
            {
                // NOTE: the room route param is `roomname` and nothing else — Room.jsx reads
                // it directly, so renaming it here would break every room link.
                path: "room/:roomname",
                element: (
                    <ProtectedRoute>
                        <AppLayout>
                            <Room />
                        </AppLayout>
                    </ProtectedRoute>
                ),
            },
            {
                path: "profile",
                element: (
                    <ProtectedRoute>
                        <AppLayout>
                            <Profile />
                        </AppLayout>
                    </ProtectedRoute>
                ),
            },
            {
                path: "createroom",
                element: (
                    <ProtectedRoute>
                        <AppLayout>
                            <CreateRoom />
                        </AppLayout>
                    </ProtectedRoute>
                ),
            },
            {
                path: "joinroom",
                element: (
                    <ProtectedRoute>
                        <AppLayout>
                            <JoinRoom />
                        </AppLayout>
                    </ProtectedRoute>
                ),
            },
            {
                path: "settings",
                element: (
                    <ProtectedRoute>
                        <AppLayout>
                            <Settings />
                        </AppLayout>
                    </ProtectedRoute>
                ),
            },
            {
                // Public profile page: the backend exposes GET /users/:username/public
                // behind optionalAuth, so no ProtectedRoute is needed - only the public
                // Layout (Navbar/Footer + Suspense).
                path: "user/:username",
                element: (
                    <Layout>
                        <Users />
                    </Layout>
                ),
            },

            // ✅ Public routes (landing pages)
            {
                index: true, 
                element: (
                    <Layout>
                        <Landing />
                    </Layout>
                ),
            },
            {
                path: "about",
                element: (
                    <Layout>
                        <About />
                    </Layout>
                ),
            },
            {
                path: "contact",
                element: (
                    <Layout>
                        <Contact />
                    </Layout>
                ),
            },
            {
                path: "login",
                element: (
                    <Layout>
                        <Login />
                    </Layout>
                ),
            },
            {
                path: "signup",
                element: (
                    <Layout>
                        <Signup />
                    </Layout>
                ),
            },
            {
                path: "forgot-password",
                element: (
                    <Layout>
                        <ForgotPassword />
                    </Layout>
                ),
            },
            {
                path: "reset-password",
                element: (
                    <Layout>
                        <ResetPassword />
                    </Layout>
                ),
            },

            {
                path: "auth/callback",
                // AuthCallback is lazy too — without a boundary it suspends into
                // a blank screen (RootLayout provides no Suspense of its own).
                element: (
                    <Suspense fallback={<GlobalLoader />}>
                        <AuthCallback />
                    </Suspense>
                ),
            },
            {
                // Backend-minted Study Duo invite link. Requires a session, so an
                // unauthenticated invitee is sent to login and returned here.
                path: "connect/:code",
                element: (
                    <ProtectedRoute>
                        {/* DuoConnect is lazy and RootLayout has no Suspense
                            boundary above it, so it needs its own fallback or a
                            client-side nav here suspends with nothing to render. */}
                        <Suspense fallback={<GlobalLoader />}>
                            <DuoConnect />
                        </Suspense>
                    </ProtectedRoute>
                ),
            },
            {
                path: "*", // ✅ Fixed the escape character
                element: (
                    <Layout>
                        <Notfound />
                    </Layout>
                ),
            },
        ]
    }
]);

// Apply the stored accent BEFORE the first render, so the app never paints once
// with the default and then jumps to the user's colour on mount.
initAccent();

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
