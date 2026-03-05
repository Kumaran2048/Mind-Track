'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface PixelImageProps {
    src: string
    alt?: string
    customGrid?: { rows: number; cols: number }
    grayscaleAnimation?: boolean
    className?: string
}

/**
 * PixelImage — recreates MagicUI's pixel-reveal animation.
 * When the image mounts, each grid cell animates from a pixelated block
 * down to full resolution in a staggered wave.
 */
export function PixelImage({
    src,
    alt = '',
    customGrid = { rows: 6, cols: 8 },
    grayscaleAnimation = false,
    className,
}: PixelImageProps) {
    const { rows, cols } = customGrid
    const total = rows * cols
    const [revealed, setRevealed] = useState(false)
    const [cells, setCells] = useState<boolean[]>(Array(total).fill(false))
    const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

    // Stagger-reveal cells in a randomised order when the image loads
    const startAnimation = () => {
        // Shuffle indices
        const order = Array.from({ length: total }, (_, i) => i).sort(
            () => Math.random() - 0.5
        )

        order.forEach((cellIdx, i) => {
            const t = setTimeout(() => {
                setCells((prev) => {
                    const next = [...prev]
                    next[cellIdx] = true
                    return next
                })
                if (i === total - 1) setRevealed(true)
            }, i * 18) // 18 ms per cell → ~280 ms total for 6×8=48 cells
            timeoutsRef.current.push(t)
        })
    }

    useEffect(() => {
        return () => timeoutsRef.current.forEach(clearTimeout)
    }, [])

    return (
        <div className={cn('relative w-full overflow-hidden rounded-xl', className)}>
            {/* The real image underneath */}
            <img
                src={src}
                alt={alt}
                onLoad={startAnimation}
                className={cn(
                    'w-full object-cover transition-all duration-700',
                    grayscaleAnimation && !revealed ? 'grayscale' : 'grayscale-0'
                )}
            />

            {/* Pixel overlay grid */}
            {!revealed && (
                <div
                    className="absolute inset-0 grid"
                    style={{
                        gridTemplateRows: `repeat(${rows}, 1fr)`,
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    }}
                >
                    {cells.map((done, i) => (
                        <div
                            key={i}
                            className={cn(
                                'transition-all duration-300 ease-out',
                                done
                                    ? 'opacity-0 scale-100'
                                    : 'opacity-100 bg-gray-200 dark:bg-gray-700 scale-90 rounded-sm'
                            )}
                            style={{ transitionDelay: `${(i % 7) * 10}ms` }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
