'use client'

import { cn } from '@/lib/utils'

interface ProgressiveBlurProps {
    /** Which edge to apply the blur from */
    position?: 'top' | 'bottom'
    /** Height of the blur region, e.g. "40%" or "120px" */
    height?: string
    className?: string
}

/**
 * Overlays a progressive (feathered) blur that fades content into the
 * background, creating a soft "scroll fade" effect.
 *
 * Place it as the *last child* inside a `relative overflow-hidden` container.
 */
export function ProgressiveBlur({
    position = 'bottom',
    height = '35%',
    className,
}: ProgressiveBlurProps) {
    const isBottom = position === 'bottom'

    return (
        <div
            aria-hidden
            className={cn(
                'pointer-events-none absolute inset-x-0 z-10',
                isBottom ? 'bottom-0' : 'top-0',
                className,
            )}
            style={{ height }}
        >
            {/* Layer 1 – lightest blur */}
            <div
                className="absolute inset-0"
                style={{
                    backdropFilter: 'blur(1px)',
                    WebkitBackdropFilter: 'blur(1px)',
                    maskImage: isBottom
                        ? 'linear-gradient(to bottom, transparent 0%, black 100%)'
                        : 'linear-gradient(to top, transparent 0%, black 100%)',
                    WebkitMaskImage: isBottom
                        ? 'linear-gradient(to bottom, transparent 0%, black 100%)'
                        : 'linear-gradient(to top, transparent 0%, black 100%)',
                }}
            />
            {/* Layer 2 – medium blur */}
            <div
                className="absolute inset-0"
                style={{
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
                    maskImage: isBottom
                        ? 'linear-gradient(to bottom, transparent 25%, black 100%)'
                        : 'linear-gradient(to top, transparent 25%, black 100%)',
                    WebkitMaskImage: isBottom
                        ? 'linear-gradient(to bottom, transparent 25%, black 100%)'
                        : 'linear-gradient(to top, transparent 25%, black 100%)',
                }}
            />
            {/* Layer 3 – heavier blur */}
            <div
                className="absolute inset-0"
                style={{
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    maskImage: isBottom
                        ? 'linear-gradient(to bottom, transparent 50%, black 100%)'
                        : 'linear-gradient(to top, transparent 50%, black 100%)',
                    WebkitMaskImage: isBottom
                        ? 'linear-gradient(to bottom, transparent 50%, black 100%)'
                        : 'linear-gradient(to top, transparent 50%, black 100%)',
                }}
            />
            {/* Layer 4 – heaviest blur */}
            <div
                className="absolute inset-0"
                style={{
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    maskImage: isBottom
                        ? 'linear-gradient(to bottom, transparent 70%, black 100%)'
                        : 'linear-gradient(to top, transparent 70%, black 100%)',
                    WebkitMaskImage: isBottom
                        ? 'linear-gradient(to bottom, transparent 70%, black 100%)'
                        : 'linear-gradient(to top, transparent 70%, black 100%)',
                }}
            />
        </div>
    )
}
