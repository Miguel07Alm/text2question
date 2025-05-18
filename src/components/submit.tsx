"use client";

import type React from "react";

import { cn } from "@/lib/utils";

interface SubmitProps {
    children: React.ReactNode;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    primaryColor?: "black" | "green-600" | "red-600" | "white" | "yellow";
    foregroundColor?: "white" | "black";
    className?: string;
}

export function Submit({
    children,
    onClick,
    loading,
    disabled,
    primaryColor,
    foregroundColor,
    className,
}: SubmitProps) {
    const getButtonClasses = () => {
        if (children === "Stop Generation") {
            return "bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800";
        }

        const colorMap = {
            black: "bg-black hover:bg-black/90 dark:bg-black dark:hover:bg-black/90",
            "green-600":
                "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800",
            "red-600":
                "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800",
            white: "bg-white hover:bg-white/90 dark:bg-white dark:hover:bg-white/90",
            yellow: "bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600",
        };

        const textColorMap = {
            white: "text-white",
            black: "text-black",
        };

        return primaryColor && foregroundColor
            ? `${colorMap[primaryColor]} ${textColorMap[foregroundColor]}`
            : "";
    };

    return (
        <button
            onClick={onClick}
            disabled={loading || disabled}
            className={cn(
                `w-full rounded-full py-3 font-medium transition-all disabled:opacity-50`,
                getButtonClasses(),
                className
            )}
        >
            {loading ? "Loading..." : children}
        </button>
    );
}
