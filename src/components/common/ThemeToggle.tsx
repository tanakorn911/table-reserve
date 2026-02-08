'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Theme Toggle Button
 * Animated switch between light and dark modes
 */
export default function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
    const { resolvedTheme, toggleTheme } = useTheme();

    const sizes = {
        sm: { button: 'w-8 h-8', icon: 16 },
        md: { button: 'w-10 h-10', icon: 20 },
        lg: { button: 'w-12 h-12', icon: 24 },
    };

    const { button, icon } = sizes[size];

    return (
        <motion.button
            onClick={toggleTheme}
            className={`
        ${button} rounded-full flex items-center justify-center
        bg-muted/50 hover:bg-muted border border-border
        transition-colors duration-200
        ${className}
      `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <motion.div
                initial={false}
                animate={{ rotate: resolvedTheme === 'dark' ? 0 : 180 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {resolvedTheme === 'dark' ? (
                    // Moon icon
                    <svg
                        width={icon}
                        height={icon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-yellow-400"
                    >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                ) : (
                    // Sun icon
                    <svg
                        width={icon}
                        height={icon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-yellow-500"
                    >
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                )}
            </motion.div>
        </motion.button>
    );
}
