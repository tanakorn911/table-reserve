'use client'; // ระบุว่าไฟล์นี้ทำงานฝั่ง Client Component

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// กำหนดประเภท Theme สำหรับ Admin (Light, Dark หรือ System)
type AdminTheme = 'light' | 'dark' | 'system';

// กำหนดอินเทอร์เฟซสำหรับ Context Value
interface AdminThemeContextType {
    adminTheme: AdminTheme; // ธีมที่ผู้ใช้เลือก
    resolvedAdminTheme: 'light' | 'dark'; // ธีมที่แสดงผลจริง
    setAdminTheme: (theme: AdminTheme) => void; // ฟังก์ชันสำหรับตั้งค่าธีมแบบระบุเอง
    toggleAdminTheme: () => void; // ฟังก์ชันสำหรับสลับธีมไปมา
}

// สร้าง Context Object
const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

// ชื่อ Key ที่ใช้เก็บข้อมูลลงใน LocalStorage
const ADMIN_STORAGE_KEY = 'savory_bistro_admin_theme';

/**
 * Provider Component สำหรับจัดการ Theme ของ Admin
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
    const [adminTheme, setAdminThemeState] = useState<AdminTheme>('system');
    const [resolvedAdminTheme, setResolvedAdminTheme] = useState<'light' | 'dark'>('dark');
    const [mounted, setMounted] = useState(false);

    // ฟังก์ชันตรวจสอบธีมของระบบ
    const getSystemTheme = useCallback((): 'light' | 'dark' => {
        if (typeof window === 'undefined') return 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }, []);

    // ฟังก์ชันสำหรับ Apply Class ธีม
    const applyTheme = useCallback((resolved: 'light' | 'dark') => {
        const root = document.documentElement;
        // หมายเหตุ: เนื่องจาก Admin มีการใช้ธีมแยก เราอาจจะไม่ไปแตะ class หลักของ html 
        // แต่ในฐานะระบบ Admin เราจะ apply class ลงที่ html หรือ body เพื่อให้ Tailwind ใช้งานได้
        root.classList.remove('light', 'dark');
        root.classList.add(resolved);
        setResolvedAdminTheme(resolved);
    }, []);

    // Initial load
    useEffect(() => {
        const stored = localStorage.getItem(ADMIN_STORAGE_KEY) as AdminTheme | null;
        const initial = stored || 'system';
        setAdminThemeState(initial);

        const resolved = initial === 'system' ? getSystemTheme() : initial;
        applyTheme(resolved as 'light' | 'dark');
        setMounted(true);
    }, [getSystemTheme, applyTheme]);

    // Listener สำหรับ System Preference Change
    useEffect(() => {
        if (adminTheme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            applyTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [adminTheme, applyTheme]);

    // ฟังก์ชันสำหรับตั้งค่าธีมใหม่
    const setAdminTheme = useCallback((newTheme: AdminTheme) => {
        setAdminThemeState(newTheme);
        localStorage.setItem(ADMIN_STORAGE_KEY, newTheme);

        const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
        applyTheme(resolved as 'light' | 'dark');
    }, [getSystemTheme, applyTheme]);

    // ฟังก์ชันสำหรับสลับธีม (Toggle)
    const toggleAdminTheme = useCallback(() => {
        const newTheme = resolvedAdminTheme === 'dark' ? 'light' : 'dark';
        setAdminTheme(newTheme);
    }, [resolvedAdminTheme, setAdminTheme]);

    if (!mounted) {
        return null;
    }

    return (
        <AdminThemeContext.Provider value={{ adminTheme, resolvedAdminTheme, setAdminTheme, toggleAdminTheme }}>
            {children}
        </AdminThemeContext.Provider>
    );
}

/**
 * Custom Hook สำหรับเรียกใช้งาน Admin Theme
 * ต้องเรียกใช้ภายใต้ AdminThemeProvider เท่านั้น
 */
export function useAdminTheme() {
    const context = useContext(AdminThemeContext);
    if (context === undefined) {
        throw new Error('useAdminTheme must be used within an AdminThemeProvider');
    }
    return context;
}
