'use client'; // ใช้ Client Component

import React from 'react';
import { motion } from 'framer-motion';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import Icon from '@/components/ui/AppIcon';

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
    const { adminTheme, setAdminTheme, resolvedAdminTheme } = useAdminTheme();
    const [isMobile, setIsMobile] = React.useState(false);

    // ตรวจสอบขนาดหน้าจอเพื่อปรับไอคอน System
    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const modes = [
        { id: 'light', icon: 'SunIcon', color: 'text-amber-500' },
        { id: 'system', icon: isMobile ? 'SmartphoneIcon' : 'ComputerDesktopIcon', color: 'text-blue-500' },
        { id: 'dark', icon: 'MoonIcon', color: 'text-indigo-400' }
    ] as const;

    const sizes = {
        sm: { container: 'h-8 p-0.5', button: 'w-7 h-7', icon: 14 },
        md: { container: 'h-10 p-1', button: 'w-8 h-8', icon: 16 },
        lg: { container: 'h-12 p-1', button: 'w-10 h-10', icon: 20 },
    };

    const { container, button, icon } = sizes[size];

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
                        <Icon 
                            name={mode.icon} 
                            size={icon} 
                            className={`relative z-10 ${isActive ? mode.color : ''} transition-colors duration-300`} 
                        />
                    </button>
                );
            })}
        </div>
    );
}
