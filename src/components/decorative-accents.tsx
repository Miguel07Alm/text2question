"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function DecorativeAccents() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = theme === "dark";

    return (
        <>
            {/* Top left cloud */}
            <div className="absolute -top-10 -left-10 w-40 h-40 opacity-70 pointer-events-none floating-slow">
                <Cloud color={isDark ? "#3a506b" : "#c6e6fb"} />
            </div>

            {/* Top right cloud */}
            <div className="absolute -top-5 right-10 w-32 h-32 opacity-60 pointer-events-none floating">
                <Cloud color={isDark ? "#2c3e50" : "#d6eeff"} />
            </div>

            {/* Bottom left cloud */}
            <div className="absolute bottom-20 -left-10 w-36 h-36 opacity-50 pointer-events-none floating-delay">
                <Cloud color={isDark ? "#34495e" : "#e1f1ff"} />
            </div>

            {/* Dust sprites - only visible in dark mode */}
            {isDark && (
                <>
                    <div className="absolute top-1/4 right-10 w-6 h-6 opacity-70 pointer-events-none floating">
                        <DustSprite />
                    </div>
                    <div className="absolute top-1/3 left-10 w-4 h-4 opacity-60 pointer-events-none floating-delay">
                        <DustSprite />
                    </div>
                    <div className="absolute bottom-1/4 right-20 w-5 h-5 opacity-50 pointer-events-none floating-slow">
                        <DustSprite />
                    </div>
                </>
            )}

            {/* Leaf decorations - only visible in light mode */}
            {!isDark && (
                <>
                    <div className="absolute top-1/4 right-10 w-8 h-8 opacity-70 pointer-events-none floating rotate-12">
                        <Leaf color="#a8e6cf" />
                    </div>
                    <div className="absolute top-1/3 left-10 w-6 h-6 opacity-60 pointer-events-none floating-delay -rotate-12">
                        <Leaf color="#8ed1b7" />
                    </div>
                    <div className="absolute bottom-1/4 right-20 w-7 h-7 opacity-50 pointer-events-none floating-slow rotate-45">
                        <Leaf color="#b8f2d8" />
                    </div>
                </>
            )}
        </>
    );
}

function Cloud({ color = "#e1f1ff" }) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M25 60 A20 20 0 0 1 5 40 A20 20 0 0 1 25 20 A30 30 0 0 1 85 30 A20 20 0 0 1 95 50 A20 20 0 0 1 75 70 Z"
                fill={color}
            />
        </svg>
    );
}

function DustSprite() {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="50" cy="50" r="40" fill="#333" />
            <circle cx="35" cy="40" r="8" fill="white" fillOpacity="0.8" />
            <circle cx="65" cy="40" r="8" fill="white" fillOpacity="0.8" />
        </svg>
    );
}

function Leaf({ color = "#a8e6cf" }) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M50 10 C70 30 90 50 50 90 C10 50 30 30 50 10 Z"
                fill={color}
            />
            <path
                d="M50 10 C50 50 50 70 50 90"
                stroke={color}
                strokeWidth="2"
                strokeDasharray="2 4"
                strokeOpacity="0.7"
            />
        </svg>
    );
}
