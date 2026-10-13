import React, { useState, useEffect } from "react";
import LightPillar from "./LightPillar";

const DarkModeBackground = () => {
    const [isDark, setIsDark] = useState(() => {
        if (typeof document !== "undefined") {
            const attr = document.documentElement.getAttribute("data-theme");
            if (attr) return attr === "dark";
            return localStorage.getItem("theme") === "dark";
        }
        return false;
    });

    useEffect(() => {
        const update = () => {
            const attr = document.documentElement.getAttribute("data-theme");
            setIsDark(attr === "dark");
        };

        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === "attributes" && m.attributeName === "data-theme") {
                    update();
                }
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"]
        });

        window.addEventListener("storage", update);
        update();

        return () => {
            observer.disconnect();
            window.removeEventListener("storage", update);
        };
    }, []);

    if (!isDark) return null;

    return (
        <div 
            className="fixed inset-0 pointer-events-none z-0 overflow-hidden" 
            aria-hidden="true"
            style={{ width: "100vw", height: "100vh" }}
        >
            <LightPillar
                topColor="#00e5c9"
                bottomColor="#0c2340"
                intensity={0.7}
                glowAmount={0.001}
                bloom={0.2}
                pillarWidth={1.3}
                pillarHeight={0.2}
                pillarRotation={-90}
                rotationSpeed={0.3}
                interactive
                clickPulse
                intro
                quality="high"
                mixBlendMode="screen"
                twist={0.5}
                detail={3}
                flow={2.65}
                noiseIntensity={0.25}
            />
        </div>
    );
};

export default DarkModeBackground;
