'use client'; // ระบุว่าไฟล์นี้ทำงานฝั่ง Client Component

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// กำหนดประเภท Theme สำหรับ Admin (Light หรือ Dark เท่านั้น)
type AdminTheme = 'light' | 'dark';

// กำหนดอินเทอร์เฟซสำหรับ Context Value
interface AdminThemeContextType {
    adminTheme: AdminTheme; // ธีมปัจจุบัน
    setAdminTheme: (theme: AdminTheme) => void; // ฟังก์ชันสำหรับตั้งค่าธีมแบบระบุเอง
    toggleAdminTheme: () => void; // ฟังก์ชันสำหรับสลับธีมไปมา
}

// สร้าง Context Object
const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

// ชื่อ Key ที่ใช้เก็บข้อมูลลงใน LocalStorage
const ADMIN_STORAGE_KEY = 'savory_bistro_admin_theme';

/**
 * Provider Component สำหรับจัดการ Theme ของ Admin
 * ทำหน้าที่เก็บ State และส่งต่อฟังก์ชันต่างๆ ให้กับ Child Components
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
    // State สำหรับเก็บค่าธีมปัจจุบัน (ค่าเริ่มต้นเป็น 'dark')
    const [adminTheme, setAdminThemeState] = useState<AdminTheme>('dark');
    // State สำหรับตรวจสอบว่า Component โหลดเสร็จแล้วหรือยัง (แก้ปัญหา Hydration Mismatch)
    const [mounted, setMounted] = useState(false);

    // Effect ทำงานครั้งเดียวเมื่อโหลดหน้าเว็บ
    useEffect(() => {
        // อ่านค่าธีมจาก LocalStorage
        const stored = localStorage.getItem(ADMIN_STORAGE_KEY) as AdminTheme | null;
        const initial = stored || 'dark'; // ถ้าไม่มีให้ใช้ 'dark' เป็นค่าเริ่มต้น
        setAdminThemeState(initial);
        setMounted(true); // ระบุว่าโหลดเสร็จแล้ว
    }, []);

    // ฟังก์ชันสำหรับตั้งค่าธีมใหม่
    const setAdminTheme = useCallback((newTheme: AdminTheme) => {
        setAdminThemeState(newTheme); // อัปเดต State
        localStorage.setItem(ADMIN_STORAGE_KEY, newTheme); // บันทึกลง LocalStorage
    }, []);

    // ฟังก์ชันสำหรับสลับธีม (Toggle)
    const toggleAdminTheme = useCallback(() => {
        // เช็คว่าถ้าเป็น dark ให้เปลี่ยนเป็น light, ถ้าไม่ใช่ให้เปลี่ยนเป็น dark
        const newTheme = adminTheme === 'dark' ? 'light' : 'dark';
        setAdminTheme(newTheme);
    }, [adminTheme, setAdminTheme]);

    // ถ้ายังไม่ Mount ให้ return null ไปก่อนเพื่อป้องกันการแสดงผลผิดเพี้ยน
    if (!mounted) {
        return null;
    }

    // ส่ง Context Provider ครอบส่วนของ Children
    return (
        <AdminThemeContext.Provider value={{ adminTheme, setAdminTheme, toggleAdminTheme }}>
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
