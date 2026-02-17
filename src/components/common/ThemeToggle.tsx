'use client'; // ทำงานฝั่ง Client Component

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // Library สำหรับ Animation
import { useTheme } from '@/contexts/ThemeContext'; // Context ธีม
import { useTranslation } from '@/lib/i18n'; // i18n
import Icon from '@/components/ui/AppIcon';

interface ThemeToggleProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg'; // ขนาดปุ่ม
}

/**
 * Theme Toggle Component
 * ปุ่มเลือกโหมด Light, Dark, System พร้อม Adaptive Icon สำหรับโหมดระบบ
 */
export default function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(false);

    // ตรวจสอบว่าเป็นหน้าจอ Mobile หรือไม่เพื่อปรับไอคอนโหมด System
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
            label: t('theme.light'),
            iconName: 'SunIcon',
            activeColor: 'text-yellow-500',
        },
        {
            key: 'system' as const,
            label: t('theme.system'),
            iconName: isMobile ? 'DevicePhoneMobileIcon' : 'ComputerDesktopIcon',
            activeColor: 'text-blue-500',
        },
        {
            key: 'dark' as const,
            label: t('theme.dark'),
            iconName: 'MoonIcon',
            activeColor: resolvedTheme === 'dark' ? 'text-yellow-400' : 'text-slate-400',
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
                    aria-label={`Switch to ${mode.label}`}
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
                    <Icon name={mode.iconName} size={icon} />
                </motion.button>
            ))}
        </div>
    );
}
