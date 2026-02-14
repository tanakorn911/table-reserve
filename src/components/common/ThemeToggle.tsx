'use client'; // ทำงานฝั่ง Client Component

import React from 'react';
import { motion } from 'framer-motion'; // Library สำหรับ Animation
import { useTheme } from '@/contexts/ThemeContext'; // Context ธีม

interface ThemeToggleProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg'; // ขนาดปุ่ม
}

/**
 * Theme Toggle Button
 * ปุ่มสลับโหมด Light/Dark พร้อม Animation
 */
export default function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();

    // กำหนดขนาดสัญลักษณ์และคอนเทนเนอร์
    const sizes = {
        sm: { container: 'p-1 gap-1', button: 'w-8 h-8', icon: 16 },
        md: { container: 'p-1.5 gap-1.5', button: 'w-10 h-10', icon: 20 },
        lg: { container: 'p-2 gap-2', button: 'w-12 h-12', icon: 24 },
    };

    const { container, button, icon } = sizes[size];

    const modes = [
        {
            key: 'light' as const,
            label: 'Light',
            icon: (
                <svg
                    width={icon}
                    height={icon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
            ),
            activeColor: 'text-yellow-500',
        },
        {
            key: 'dark' as const,
            label: 'Dark',
            icon: (
                <svg
                    width={icon}
                    height={icon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            ),
            activeColor: 'text-yellow-400',
        },
        {
            key: 'system' as const,
            label: 'System',
            icon: (
                <svg
                    width={icon}
                    height={icon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
            ),
            activeColor: 'text-primary',
        },
    ];

    return (
        <div
            className={`
                inline-flex items-center bg-muted/40 backdrop-blur-sm border border-border rounded-full
                ${container} ${className}
            `}
        >
            {modes.map((mode) => (
                <motion.button
                    key={mode.key}
                    onClick={() => setTheme(mode.key)}
                    className={`
                        ${button} rounded-full flex items-center justify-center transition-all duration-300 relative
                        ${theme === mode.key
                            ? 'bg-card shadow-sm ' + mode.activeColor
                            : 'text-muted-foreground hover:bg-muted/60'
                        }
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Switch to ${mode.label} mode`}
                    title={mode.label}
                >
                    {/* Background indicator for active state */}
                    {theme === mode.key && (
                        <motion.div
                            layoutId="activeTheme"
                            className="absolute inset-0 bg-card rounded-full shadow-sm -z-10"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    {mode.icon}
                </motion.button>
            ))}
        </div>
    );
}
