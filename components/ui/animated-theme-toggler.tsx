'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedThemeTogglerProps {
    className?: string
}

/**
 * AnimatedThemeToggler — recreates MagicUI's animated sun/moon toggle.
 * A pill-shaped button with a sliding indicator and animated icon swap.
 */
export function AnimatedThemeToggler({ className }: AnimatedThemeTogglerProps) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return <div className="h-8 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    }

    const isDark = theme === 'dark'

    const toggle = () => setTheme(isDark ? 'light' : 'dark')

    return (
        <button
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn(
                'relative flex h-8 w-16 items-center rounded-full p-1 transition-colors duration-300',
                isDark
                    ? 'bg-gray-800 border border-gray-600'
                    : 'bg-amber-100 border border-amber-300',
                className
            )}
        >
            {/* Sliding circle */}
            <span
                className={cn(
                    'absolute h-6 w-6 rounded-full shadow-md transition-all duration-300 ease-in-out flex items-center justify-center text-sm',
                    isDark
                        ? 'translate-x-8 bg-gray-900'
                        : 'translate-x-0 bg-white'
                )}
            >
                {/* Icon swaps with a tiny scale animation */}
                <span
                    key={isDark ? 'moon' : 'sun'}
                    className="animate-in zoom-in-75 fade-in duration-200"
                >
                    {isDark ? '🌙' : '☀️'}
                </span>
            </span>

            {/* Background icons (static) */}
            <span className="ml-1 text-xs opacity-60 select-none">
                {isDark ? '☀️' : '🌙'}
            </span>
        </button>
    )
}
