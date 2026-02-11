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
 */
export default function AdminThemeToggle({ className = '', size = 'md' }: AdminThemeToggleProps) {
    const { adminTheme, toggleAdminTheme } = useAdminTheme();

    // กำหนดขนาดปุ่มและไอคอนตาม Props size
    const sizes = {
        sm: { button: 'w-8 h-8', icon: 16 },
        md: { button: 'w-10 h-10', icon: 20 },
        lg: { button: 'w-12 h-12', icon: 24 },
    };

    const { button, icon } = sizes[size];

    return (
        <motion.button
            onClick={toggleAdminTheme}
            className={`
                ${button} rounded-full flex items-center justify-center
                ${adminTheme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' // Dark Mode Style
                    : 'bg-gray-200 hover:bg-gray-300 border border-gray-300' // Light Mode Style
                }
                transition-colors duration-200
                ${className}
            `}
            whileHover={{ scale: 1.05 }} // Animation ตอนเอาเมาส์จี้
            whileTap={{ scale: 0.95 }}   // Animation ตอนกด
            aria-label={`Switch to ${adminTheme === 'dark' ? 'light' : 'dark'} mode`}
            title={adminTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {/* Rotating Icon Animation */}
            <motion.div
                initial={false}
                animate={{ rotate: adminTheme === 'dark' ? 0 : 180 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {adminTheme === 'dark' ? (
                    // Moon icon (สำหรับ Dark Mode -> กดแล้วเปลี่ยนเป็น Light)
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
                    // Sun icon (สำหรับ Light Mode -> กดแล้วเปลี่ยนเป็น Dark)
                    <svg
                        width={icon}
                        height={icon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-amber-600"
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
