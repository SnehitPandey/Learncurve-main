// AppNavigation.jsx
import { useState, useEffect } from "react";
import AppSidebar from "./navigation/sidebar";
import AppBottomBar from "./navigation/bottombar";

export default function AppNavigation() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 720);
        };

        // Check on mount
        checkMobile();

        // Add event listener
        window.addEventListener('resize', checkMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <>
            {isMobile ? <AppBottomBar /> : <AppSidebar />}
        </>
    );
}
