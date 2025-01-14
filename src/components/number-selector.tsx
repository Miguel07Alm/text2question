import { Minus, Plus, Settings2 } from 'lucide-react'
import { useState } from 'react'

interface NumberSelectorProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    onMaxChange?: (newMax: number) => void
}

export function NumberSelector({ value, onChange, min = 1, max = 20, onMaxChange }: NumberSelectorProps) {
    const [isEditingMax, setIsEditingMax] = useState(false)
    const [localMax, setLocalMax] = useState(max)
    const presets = Array.from(new Set([5, 10, 15, localMax].filter((preset) => preset <= localMax)))

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Math.max(min, Math.min(100, Number(e.target.value)))
        setLocalMax(newMax)
        onMaxChange?.(newMax)
        if (value > newMax) {
            onChange(newMax)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => value > min && onChange(value - 1)}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    disabled={value <= min}
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
                        className="w-32 accent-gray-900 dark:accent-gray-100"
                    />
                    <span className="w-12 text-center font-mono">{value}</span>
                    <button
                        onClick={() => setIsEditingMax(!isEditingMax)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Configure maximum questions"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                </div>
                <button
                    onClick={() => value < localMax && onChange(value + 1)}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    disabled={value >= localMax}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            {isEditingMax && (
                <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                        Max questions:
                    </label>
                    <input
                        type="number"
                        min={min}
                        max={100}
                        value={localMax}
                        onChange={handleMaxChange}
                        className="w-20 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-800"
                    />
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                    <button
                        key={preset}
                        onClick={() => onChange(preset)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            value === preset
                                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        {preset} questions
                    </button>
                ))}
            </div>
        </div>
    )
}
