'use client'

import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

interface AnimatedListProps {
    children: React.ReactNode[]
    className?: string
    /** Delay between each item appearing (ms). Default 400 */
    delay?: number
}

/**
 * AnimatedList — recreates MagicUI's staggered list reveal.
 * Children slide + fade in one at a time from the bottom.
 */
export function AnimatedList({ children, className, delay = 400 }: AnimatedListProps) {
    const [visibleCount, setVisibleCount] = useState(1)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setVisibleCount((prev) => {
                if (prev >= children.length) {
                    clearInterval(timerRef.current!)
                    return prev
                }
                return prev + 1
            })
        }, delay)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [children.length, delay])

    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {children.slice(0, visibleCount).map((child, i) => (
                <div
                    key={i}
                    className="animate-in slide-in-from-bottom-4 fade-in duration-500 ease-out"
                    style={{ animationFillMode: 'both', animationDelay: `${i * 60}ms` }}
                >
                    {child}
                </div>
            ))}
        </div>
    )
}
