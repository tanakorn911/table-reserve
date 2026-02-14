'use client'; // ทำงานฝั่ง Client Component

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useNavigation } from '@/contexts/NavigationContext'; // Context สำหรับจัดการสถานะ Navigation
import Icon from '@/components/ui/AppIcon'; // Components ไอคอน
import { useTranslation } from '@/lib/i18n'; // Hook แปลภาษา
import ThemeToggle from '@/components/common/ThemeToggle'; // ปุ่มสลับธีม

// อินเทอร์เฟซสำหรับรายการเมนู
interface NavigationItem {
  label: string; // ชื่อเมนู
  path: string; // เส้นทาง URL
  icon: string; // ชื่อไอคอน
  staffOnly?: boolean; // สิทธิ์การเข้าถึง (เฉพาะพนักงาน/Admin)
}

/**
 * MobileMenu Component - เมนูนำทางสำหรับหน้าจอขนาดเล็ก (Mobile)
 * แสดงเป็น Overlay เมื่อกดปุ่ม Hamburger menu ใน Header
 */
const MobileMenu = () => {
  // ดึง state และ function จาก NavigationContext
  const { currentRoute, isMobileMenuOpen, setIsMobileMenuOpen, isStaffUser, locale, setLocale } =
    useNavigation();
  const { t } = useTranslation(locale);

  // กำหนดรายการเมนูสำหรับ Mobile (อาจต่างจาก Desktop เล็กน้อย)
  const navigationItems: NavigationItem[] = [
    {
      label: t('nav.home'), // หน้าแรก
      path: '/landing-page',
      icon: 'HomeIcon',
      staffOnly: false,
    },
    {
      label: t('nav.reserve'), // หน้าจอง
      path: '/reservation-form',
      icon: 'CalendarIcon',
      staffOnly: false,
    },
    {
      label: t('admin.reservations'), // หน้าแดชบอร์ด
      path: '/admin/dashboard',
      icon: 'ClipboardDocumentListIcon',
      staffOnly: true, // เฉพาะ Admin/Staff
    },
  ];

  // กรองเมนูตามสิทธิ์ผู้ใช้
  const filteredNavItems = navigationItems.filter(
    (item) => !item.staffOnly || (item.staffOnly && isStaffUser)
  );

  // ตรวจสอบ Route ปัจจุบันเพื่อ Highlight
  const isActiveRoute = (path: string) => {
    if (path === '/landing-page') {
      return currentRoute === path || currentRoute === '/';
    }
    return currentRoute.startsWith(path);
  };

  /**
   * Effect จัดการ Scroll ของ Body
   * ป้องกันการเลื่อนหน้าจอหลักเมื่อ Mobile Menu เปิดอยู่ (Overflow Hidden)
   */
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function: คืนค่า overflow เมื่อ component unmount หรือเมนูปิด
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  /**
   * Effect จัดการปุ่ม Esc
   * ปิดเมนูเมื่อกดปุ่ม Esc
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  // ถ้าเมนูปิดอยู่ ไม่ต้อง Render อะไรเลย
  if (!isMobileMenuOpen) return null;

  return (
    <>
      {/* Overlay พื้นหลังสีดำจางๆ - คลิกเพื่อปิดเมนู */}
      <div
        className="fixed inset-0 z-200 bg-background/80 backdrop-blur-sm md:hidden transition-smooth"
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ตัวเมนู Slide ลงมาจากด้านบน (ใต้ Header) */}
      <div
        className="
          fixed top-[80px] left-0 right-0 bottom-0 z-200 bg-card
          md:hidden overflow-y-auto transition-smooth
          animate-in slide-in-from-top-4 duration-250
        "
      >
        <nav className="flex flex-col p-5 gap-1.5">
          {/* วนลูปแสดงเมนู */}
          {filteredNavItems.map((item, index) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)} // ปิดเมนูเมื่อคลิกลิงก์
              className={`
                flex items-center gap-3 px-5 py-3 rounded-md text-base font-medium
                transition-smooth min-h-[44px]
                ${isActiveRoute(item.path)
                  ? 'bg-primary text-primary-foreground shadow-warm-sm'
                  : 'text-foreground hover:bg-muted active:scale-[0.97]'
                }
              `}
              // เพิ่ม Delay animation ให้แต่ละเมนูค่อยๆ ปรากฏทีละรายการ
              style={{
                animationDelay: `${index * 150}ms`,
              }}
            >
              <Icon name={item.icon} size={24} />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* ส่วนสลับ Theme สำหรับ Mobile */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between px-2">
              <p className="text-sm font-medium text-muted-foreground">{t('theme.mode')}</p>
              <ThemeToggle size="sm" />
            </div>
          </div>

          {/* ส่วนเปลี่ยนภาษา สำหรับ Mobile */}
          <div className="mt-2 pt-4 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-3 px-2">{t('nav.language')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setLocale('th');
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  flex-1 py-3 rounded-lg text-sm font-bold transition-all border
                  ${locale === 'th'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-muted'
                  }
                `}
              >
                ไทย (TH)
              </button>
              <button
                onClick={() => {
                  setLocale('en');
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  flex-1 py-3 rounded-lg text-sm font-bold transition-all border
                  ${locale === 'en'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-muted'
                  }
                `}
              >
                English (EN)
              </button>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default MobileMenu;
