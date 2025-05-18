"use client";

import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

interface NumberSelectorProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    className?: string;
}

export function NumberSelector({
    value,
    onChange,
    min = 1,
    max = 20,
    className,
}: NumberSelectorProps) {
    const [isEditingMax, setIsEditingMax] = useState(false);
    const [localMax, setLocalMax] = useState(max);
    const presets = Array.from(
        new Set([5, 10, 15, localMax].filter((preset) => preset <= localMax))
    );

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => value > min && onChange(value - 1)}
                    className="p-2 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-2">
                    <input
                        type="range"
                        min={min}
                        max={localMax}
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="w-32 accent-[hsl(var(--themed-blue))]"
                    />
                    <span className="w-12 text-center font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                        {value}
                    </span>
                </div>
                <button
                    onClick={() => value < localMax && onChange(value + 1)}
                    className="p-2 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
                    disabled={value >= localMax}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                    <button
                        key={preset}
                        onClick={() => onChange(preset)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            value === preset
                                ? "bg-[hsl(var(--themed-blue))] text-white"
                                : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                        }`}
                    >
                        {preset}
                    </button>
                ))}
            </div>
        </div>
    );
}
