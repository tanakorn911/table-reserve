'use client';

import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
    trigger?: boolean;
    duration?: number;
}

/**
 * Confetti Component - Shows celebratory confetti animation
 * Used when reservation is successful
 */
export default function Confetti({ trigger = true, duration = 3000 }: ConfettiProps) {
    const fireConfetti = useCallback(() => {
        const end = Date.now() + duration;

        // Colors matching the theme
        const colors = ['#3b5998', '#d4af37', '#48bb78', '#ed8936', '#f56565'];

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.7 },
                colors: colors,
            });

            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.7 },
                colors: colors,
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        // Initial burst
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: colors,
        });

        // Continuous stream
        frame();
    }, [duration]);

    useEffect(() => {
        if (trigger) {
            // Small delay for better UX
            const timer = setTimeout(fireConfetti, 200);
            return () => clearTimeout(timer);
        }
    }, [trigger, fireConfetti]);

    return null; // This component doesn't render anything visible
}

/**
 * Hook for triggering confetti programmatically
 */
export function useConfetti() {
    const fire = useCallback((options?: confetti.Options) => {
        const defaults: confetti.Options = {
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b5998', '#d4af37', '#48bb78', '#ed8936', '#f56565'],
        };

        confetti({ ...defaults, ...options });
    }, []);

    const fireBurst = useCallback(() => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            colors: ['#3b5998', '#d4af37', '#48bb78', '#ed8936', '#f56565'],
        };

        function fire(particleRatio: number, opts: confetti.Options) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }, []);

    return { fire, fireBurst };
}
