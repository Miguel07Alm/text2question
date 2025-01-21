"use client"

import { useState, useEffect } from "react"
import { XIcon, MinusIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { set } from "zod"

const STORAGE_KEY = 'ai-disclaimer-state'

type DisclaimerState = {
    isVisible: boolean;
    isPermanentlyHidden: boolean;
    isMinimized: boolean;
}

export function AIDisclaimer() {
    const [state, setState] = useState<DisclaimerState>({
        isVisible: true,
        isPermanentlyHidden: false,
        isMinimized: false
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setState(JSON.parse(stored));
            setIsLoading(false);
        }
    }, []);

    const updateState = (newState: Partial<DisclaimerState>) => {
        setState(prev => {
            const updated = { ...prev, ...newState };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    if (state.isPermanentlyHidden || !state.isVisible || isLoading) return null;

    return (
        <div 
            className={cn(
                "transition-all duration-200 ease-in-out",
                state.isMinimized ? "h-8 cursor-pointer" : "h-auto",
                "relative mb-4 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 bg-amber-50/50 dark:bg-amber-950/50 rounded-md border border-amber-200/50 dark:border-amber-800/50"
            )}
            onClick={() => state.isMinimized && updateState({ isMinimized: false })}
        >
            <div className="absolute right-2 top-2 flex gap-1">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        updateState({ isMinimized: true });
                    }}
                    className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-full"
                    title="Minimize"
                >
                    <MinusIcon className="h-3 w-3" />
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        const permanent = window.confirm("Hide this notice permanently?");
                        updateState({ 
                            isVisible: false,
                            isPermanentlyHidden: permanent
                        });
                    }}
                    className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-full"
                    title="Close"
                >
                    <XIcon className="h-3 w-3" />
                </button>
            </div>

            {state.isMinimized ? (
                <p className="text-xs opacity-70">⚠️ AI-generated content notice (click to expand)</p>
            ) : (
                <>
                    <div className="flex items-start gap-2 pr-16">
                        <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                        <div>
                            <p className="font-medium">AI-Generated Content</p>
                            <p className="mt-1 opacity-85">
                                Questions are generated using AI and may occasionally be inaccurate or inappropriate.
                                <button 
                                    onClick={() => updateState({ isMinimized: true })}
                                    className="ml-1 underline underline-offset-2 hover:opacity-70"
                                >
                                    Minimize
                                </button>
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
