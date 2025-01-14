'use client'

import { useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'

interface ExpandedTextareaProps {
    value: string
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    placeholder?: string
}

export function ExpandedTextarea({ value, onChange, placeholder }: ExpandedTextareaProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="relative">
            <div
                className={`transition-all duration-300 ease-in-out ${
                    isExpanded
                        ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4'
                        : 'relative'
                }`}
            >
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full p-4 rounded-lg border border-gray-200 dark:border-gray-800 
                              bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                              resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 
                              dark:focus:ring-gray-800 transition-all duration-300 ${
                                  isExpanded ? 'h-[calc(100vh-8rem)]' : 'h-32'
                              }`}
                />
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="absolute top-2 right-2 p-2 rounded-full 
                             bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 
                             dark:hover:bg-gray-600 transition-colors"
                    aria-label={isExpanded ? 'Minimize' : 'Maximize'}
                >
                    {isExpanded ? (
                        <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    ) : (
                        <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    )}
                </button>
            </div>
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </div>
    )
}
