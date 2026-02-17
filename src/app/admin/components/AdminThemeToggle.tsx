'use client'; // ใช้ Client Component

import React from 'react';
import { motion } from 'framer-motion';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

interface AdminThemeToggleProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg'; // ขนาดปุ่ม (เล็ก, กลาง, ใหญ่)
}

/**
 * AdminThemeToggle Component
 * 
 * ปุ่มสลับ Theme (Light/Dark Mode) สำหรับหน้า Admin
 * ทำงานแยกอิสระจาก Theme ของหน้าบ้าน (Frontend)
 * ใช้ SVG icon เดียวกับหน้า Login เพื่อความสอดคล้อง
 */
export default function AdminThemeToggle({ className = '', size = 'md' }: AdminThemeToggleProps) {
    const { adminTheme, setAdminTheme, resolvedAdminTheme } = useAdminTheme();
    const [isMobile, setIsMobile] = React.useState(false);

    // ตรวจสอบขนาดหน้าจอเพื่อปรับไอคอน System
    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const sizes = {
        sm: { container: 'h-8 p-0.5', button: 'w-7 h-7', icon: 14 },
        md: { container: 'h-10 p-1', button: 'w-8 h-8', icon: 16 },
        lg: { container: 'h-12 p-1', button: 'w-10 h-10', icon: 20 },
    };

    const { container, button, icon } = sizes[size];

    // SVG icons เหมือนหน้า Login ทุกประการ (ยกเว้น System ที่ปรับตามอุปกรณ์)
    const modes = [
        {
            id: 'light' as const,
            color: 'text-amber-500',
            svg: (
                <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            ),
        },
        {
            id: 'system' as const,
            color: 'text-blue-500',
            svg: isMobile ? (
                <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
            ) : (
                <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
            ),
        },
        {
            id: 'dark' as const,
            color: resolvedAdminTheme === 'dark' ? 'text-yellow-400' : 'text-indigo-400',
            svg: (
                <svg width={icon} height={icon} viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            ),
        },
    ];

    return (
        <div className={`
            flex items-center gap-0.5 rounded-full border
            ${resolvedAdminTheme === 'dark'
                ? 'bg-gray-800/80 border-gray-700 shadow-inner'
                : 'bg-white border-gray-200 shadow-sm'
            }
            ${container} ${className}
        `}>
            {modes.map((mode) => {
                const isActive = adminTheme === mode.id;
                return (
                    <button
                        key={mode.id}
                        onClick={() => setAdminTheme(mode.id)}
                        className={`
                            relative flex items-center justify-center rounded-full transition-all duration-300
                            ${button}
                            ${isActive
                                ? (resolvedAdminTheme === 'dark' ? 'bg-gray-700 text-white shadow-lg' : 'bg-gray-100 text-gray-900 shadow-inner')
                                : (resolvedAdminTheme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')
                            }
                        `}
                        title={mode.id.charAt(0).toUpperCase() + mode.id.slice(1)}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="adminActiveTheme"
                                className={`absolute inset-0 rounded-full ${resolvedAdminTheme === 'dark' ? 'bg-gray-600/30' : 'bg-white shadow-sm'}`}
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className={`relative z-10 ${isActive ? mode.color : ''} transition-colors duration-300`}>
                            {mode.svg}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
