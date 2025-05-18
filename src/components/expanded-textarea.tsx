"use client";

import type React from "react";

import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

interface ExpandedTextareaProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
}

export function ExpandedTextarea({
    value,
    onChange,
    placeholder,
}: ExpandedTextareaProps) {

    return (
        <div className="relative">
            <div
                className="relative"
            >
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full rounded-xl border-2 border-[hsl(var(--themed-cream))] dark:border-gray-700 
                              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                              resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--themed-blue))] 
                              dark:focus:ring-[hsl(var(--themed-blue))] shadow-sm transition-[height] duration-300 ease-in-out will-change-[height]
                                  
                              h-32 p-4
                              `}
                />
            </div>
        </div>
    );
}
