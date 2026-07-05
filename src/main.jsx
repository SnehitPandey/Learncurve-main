import React, { Suspense, lazy, useState, useEffect } from "react";
import { StrictMode } from "react";
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
const AuthCallback = lazy(() => import("./Pages/AuthCallback.jsx"));
const About = lazy(() => import("./Pages/about.jsx"));
const Contact = lazy(() => import("./Pages/contact.jsx"));
const Landing = lazy(() => import("./Pages/focuskami.jsx"));
const Notfound = lazy(() => import("./Pages/notfound.jsx"));
const ConnectPage = lazy(() => import("./Pages/connect.jsx"));

import Navigation from "./Components/App/navigation.jsx";
import Navbar from "./Components/landing/navbar.jsx";
import Footer from "./Components/landing/footer.jsx";
import Particles from "./Components/Backgrounds/Particles/Particles.jsx";
import { ProtectedRoute } from "./Components/ProtectedRoute.jsx";
import { authService } from "./services/authService.js";
import { UserProvider } from "./contexts/UserContext.jsx";

const GlobalLoader = () => {
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
            >
                Focusing..
            </motion.p>
        </motion.div>
    );
};

const RootLayout = () => {
    const navigation = useNavigation();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (navigation.state === "loading") {
            setIsLoading(true);
        } else {
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 500); // Reduced from 2000ms
            return () => clearTimeout(timer);
        }
    }, [navigation.state]);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            if (navigation.state !== "loading") {
                setIsLoading(false);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <>
            <AnimatePresence>
                {isLoading && <GlobalLoader />}
            </AnimatePresence>
            <Outlet />
        </>
    );
};

const Layout = ({ children }) => (
    <div className="min-h-screen flex flex-col relative z-0">
        <div className="fixed inset-0 z-[-1] pointer-events-none w-full h-full bg-[#060010]">
            <Particles
                particleColors={['#ffffff', '#ffffff']}
                particleCount={200}
                particleSpread={10}
                speed={0.1}
                particleBaseSize={100}
                moveParticlesOnHover={true}
                alphaParticles={true}
                disableRotation={false}
            />
        </div>
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
    <div className="min-h-screen flex flex-col relative z-0">
        <div className="fixed inset-0 z-[-1] pointer-events-none w-full h-full bg-[#060010]">
            <Particles
                particleColors={['#ffffff', '#ffffff', '#ffffff']}
                particleCount={200}
                particleSpread={10}
                speed={0.1}
                particleBaseSize={100}
                moveParticlesOnHover={true}
                alphaParticles={true}
                disableRotation={false}
            />
        </div>
        <Navigation />
        <div className="flex-grow min-h-full">
            <Suspense fallback={<GlobalLoader />}>
                {children}
            </Suspense>
        </div>
    </div>
);

// ProtectedRoute is imported from "./Components/ProtectedRoute.jsx" at the top

const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            // ✅ Protected routes (app pages) - using ProtectedRoute component
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
                path: "room/:roomId",
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
                path: "user/:username",
                element: (
                    <ProtectedRoute>
                        <AppLayout>
                            <Users />
                        </AppLayout>
                    </ProtectedRoute>
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
                path: "connect/:linkId",
                element: (
                    <Layout>
                        <React.Suspense fallback={<div />}>
                            <ConnectPage />
                        </React.Suspense>
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
                path: "login/callback",
                element: <AuthCallback />,
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

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <UserProvider>
            <RouterProvider router={router} />
        </UserProvider>
    </StrictMode>
);
