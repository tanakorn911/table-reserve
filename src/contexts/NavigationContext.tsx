'use client'; // ทำงานฝั่ง Client Component

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// อินเทอร์เฟซสำหรับข้อมูลใน Navigation Context
interface NavigationContextType {
  currentRoute: string; // เส้นทาง URL ปัจจุบัน
  isMobileMenuOpen: boolean; // สถานะเปิด/ปิดเมนูมือถือ
  setIsMobileMenuOpen: (isOpen: boolean) => void; // ฟังก์ชันตั้งค่าเมนูมือถือ
  isStaffUser: boolean; // สถานะว่าเป็น Staff หรือไม่
  setIsStaffUser: (isStaff: boolean) => void; // ฟังก์ชันตั้งค่าสถานะ Staff
  locale: 'th' | 'en'; // ภาษาปัจจุบันของแอป
  setLocale: (locale: 'th' | 'en') => void; // ฟังก์ชันเปลี่ยนภาษา
}

// สร้าง Context
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

/**
 * Navigation Provider
 * จัดการ State ส่วนกลางเกี่ยวกับการนำทาง เมนู และภาษา
 */
export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname(); // Hook ดึง URL Path ปัจจุบัน
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State เมนูมือถือ
  const [isStaffUser, setIsStaffUser] = useState(false); // State สถานะ Staff
  const [currentRoute, setCurrentRoute] = useState(pathname); // State Route ปัจจุบัน
  const [locale, setLocale] = useState<'th' | 'en'>('th'); // State ภาษา (เริ่มต้นไทย)

  // Effect ทำงานครั้งเดียวเมื่อโหลด: อ่านค่าภาษาจาก LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('app-locale');
    if (stored === 'en' || stored === 'th') {
      setLocale(stored);
    }
  }, []);

  // ฟังก์ชันเปลี่ยนภาษาและบันทึกลง LocalStorage
  const changeLocale = (newLocale: 'th' | 'en') => {
    setLocale(newLocale);
    localStorage.setItem('app-locale', newLocale);
  };

  // Effect สังเกตการเปลี่ยน Pathname
  useEffect(() => {
    setCurrentRoute(pathname); // อัปเดต Route ปัจจุบัน
    setIsMobileMenuOpen(false); // ปิดเมนูมือถืออัตโนมัติเมื่อเปลี่ยนหน้า
  }, [pathname]);

  // สร้าง value object สำหรับส่งให้ Provider (ใช้ useMemo เพื่อ Performance)
  const value = React.useMemo(
    () => ({
      currentRoute,
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      isStaffUser,
      setIsStaffUser,
      locale,
      setLocale: changeLocale,
    }),
    [currentRoute, isMobileMenuOpen, isStaffUser, locale] // Dependencies ที่จะทำให้ value เปลี่ยน
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

/**
 * Custom Hook สำหรับเรียกใช้ Navigation Context
 */
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
