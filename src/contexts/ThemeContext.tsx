'use client'; // ทำงานฝั่ง Client Component

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ประเภท Theme: Light, Dark, หรือ System (ตามอุปกรณ์)
type Theme = 'light' | 'dark' | 'system';

// อินเทอร์เฟซ Context
interface ThemeContextType {
    theme: Theme; // ค่าที่ผู้ใช้เลือก (อาจเป็น system)
    resolvedTheme: 'light' | 'dark'; // ค่าธีมที่แสดงผลจริง (light หรือ dark)
    setTheme: (theme: Theme) => void; // ฟังก์ชันตั้งค่าธีม
    toggleTheme: () => void; // ฟังก์ชันสลับธีม
}

// สร้าง Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Key สำหรับเก็บลง LocalStorage
const STORAGE_KEY = 'savory_bistro_theme';

/**
 * Provider สำหรับจัด Theme หลักของเว็บไซต์
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark'); // State ค่าที่เลือก
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark'); // State ค่าที่แสดงผลจริง
    const [mounted, setMounted] = useState(false); // State รอการ Mount

    // ฟังก์ชันตรวจสอบธีมของระบบ (System Preference)
    const getSystemTheme = useCallback((): 'light' | 'dark' => {
        // ถ้าไม่มี window (รันบน Server) ให้คืนค่า dark ไว้ก่อน
        if (typeof window === 'undefined') return 'dark';
        // ตรวจสอบ media query prefers-color-scheme
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }, []);

    // ฟังก์ชันสำหรับ Apply Class ธีมลงใน HTML Element
    const applyTheme = useCallback((resolved: 'light' | 'dark') => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark'); // ลบ class เก่าออก
        root.classList.add(resolved); // เพิ่ม class ใหม่เข้าไป
        setResolvedTheme(resolved); // อัปเดต State
    }, []);

    // Initial load: อ่านค่าจาก LocalStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        const initial = stored || 'dark'; // ค่าเริ่มต้นเป็น dark
        setThemeState(initial);

        // คำนวณค่าที่จะแสดงผลจริง
        const resolved = initial === 'system' ? getSystemTheme() : initial;
        applyTheme(resolved);
        setMounted(true); // โหลดเสร็จแล้ว
    }, [getSystemTheme, applyTheme]);

    // Listener สำหรับ System Preference Change
    useEffect(() => {
        // ถ้าผู้ใช้ไม่ได้เลือก 'system' ก็ไม่ต้องทำอะไร
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        // ฟังก์ชันจัดการเมื่อการตั้งค่าระบบเปลี่ยน
        const handleChange = (e: MediaQueryListEvent) => {
            applyTheme(e.matches ? 'dark' : 'light');
        };

        // เพิ่ม Listener
        mediaQuery.addEventListener('change', handleChange);
        // ลบ Listener เมื่อ Component Unmount หรือ theme เปลี่ยน
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, applyTheme]);

    // ฟังก์ชันตั้งค่าธีม (เรียกใช้เมื่อผู้ใช้กดปุ่มเปลี่ยนธีม)
    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme); // บันทึกถาวร

        // คำนวณและ Apply ทันที
        const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
        applyTheme(resolved);
    }, [getSystemTheme, applyTheme]);

    // ฟังก์ชันสลับธีม (Toggle Button)
    const toggleTheme = useCallback(() => {
        // สลับค่าระหว่าง light/dark โดยอิงจากค่าปัจจุบันที่แสดงผล
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }, [resolvedTheme, setTheme]);

    // ป้องกัน Flash of Unstyled Content
    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// Hook
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
