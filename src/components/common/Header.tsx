'use client'; // ทำงานฝั่ง Client Component

import React from 'react';
import Link from 'next/link';
import { useNavigation } from '@/contexts/NavigationContext'; // Context สำหรับจัดการสถานะ Navigation
import Icon from '@/components/ui/AppIcon'; // Component ไอคอนของแอป
import { useTranslation } from '@/lib/i18n'; // Hook สำหรับการแปลภาษา
import ThemeToggle from '@/components/common/ThemeToggle'; // ปุ่มสลับธีม

// อินเทอร์เฟซสำหรับรายการเมนูนำทาง
interface NavigationItem {
  label: string; // ชื่อเมนูที่จะแสดง
  path: string; // เส้นทาง URL
  icon: string; // ชื่อไอคอน
  staffOnly?: boolean; // จำกัดสิทธิ์เฉพาะพนักงาน/Admin หรือไม่
}

/**
 * Header Component - ส่วนหัวของเว็บไซต์
 * แสดงแถบนำทาง โลโก้ และเมนูต่างๆ (รองรับ Responsive)
 */
const Header = () => {
  // ดึง state และ function จาก NavigationContext
  const { currentRoute, isMobileMenuOpen, setIsMobileMenuOpen, isStaffUser, locale, setLocale } =
    useNavigation();
  // ดึงฟังก์ชันแปลภาษาตาม Locale ปัจจุบัน
  const { t } = useTranslation(locale);

  // กำหนดรายการเมนูนำทาง
  const navigationItems: NavigationItem[] = [
    {
      label: t('nav.home'), // หน้าแรก
      path: '/landing-page',
      icon: 'HomeIcon',
      staffOnly: false, // ทุกคนเข้าถึงได้
    },
    {
      label: t('nav.admin'), // หน้า Admin/Dashboard
      path: '/admin/dashboard',
      icon: 'ChartBarIcon',
      staffOnly: true, // เฉพาะพนักงาน/Admin เท่านั้น
    },
  ];

  // กรองรายการเมนูตามสิทธิ์ของผู้ใช้ (Staff/Admin เห็นเมนูเพิ่ม)
  const filteredNavItems = navigationItems.filter(
    (item) => !item.staffOnly || (item.staffOnly && isStaffUser)
  );

  // ฟังก์ชันตรวจสอบว่า Route ปัจจุบันตรงกับเมนูใด (เพื่อ Highlight)
  const isActiveRoute = (path: string) => {
    if (path === '/landing-page') {
      return currentRoute === path || currentRoute === '/';
    }
    return currentRoute.startsWith(path);
  };

  return (
    // Header แบบ Fixed ด้านบน
    <header className="fixed top-0 left-0 right-0 z-100 bg-card shadow-warm transition-smooth">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-20 px-4 lg:px-6">
          {/* Logo และชื่อร้าน - ลิงก์ไปหน้าแรก */}
          <Link
            href="/landing-page"
            className="flex items-center gap-3 transition-smooth hover:opacity-80"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary">
              <Icon name="BuildingStorefrontIcon" size={28} className="text-primary-foreground" />
            </div>
            <span className="text-2xl font-heading font-bold text-foreground">
              {t('app.title')}
            </span>
          </Link>

          {/* Desktop Navigation - ซ่อนบนมือถือ (hidden md:flex) */}
          <nav className="hidden md:flex items-center gap-2">
            {/* วนลูปแสดงเมนูหลัก */}
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-md text-base font-medium
                  transition-smooth min-h-[44px]
                  ${isActiveRoute(item.path)
                    ? 'bg-primary text-primary-foreground shadow-warm-sm border border-primary' // Active State
                    : 'text-foreground hover:bg-muted hover:scale-[0.97] active:scale-[0.97] border border-border' // Normal State
                  }
                `}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </Link>
            ))}

            {/* ปุ่มจองโต๊ะ (แยกออกมาเพื่อความเด่นชัด) */}
            <Link
              href="/reservation-form"
              className={`
                flex items-center gap-2 px-8 py-3 ml-4 rounded-md text-base font-medium
                transition-smooth min-h-[44px]
                ${currentRoute.startsWith('/reservation-form')
                  ? 'bg-primary text-primary-foreground shadow-warm-sm border border-primary'
                  : 'text-foreground hover:bg-muted hover:scale-[0.97] active:scale-[0.97] border border-border'
                }
              `}
            >
              <Icon name="CalendarIcon" size={20} />
              <span>{t('nav.reserve')}</span>
            </Link>

            {/* ปุ่มสลับธีม (Light/Dark) */}
            <ThemeToggle size="sm" className="ml-2" />

            {/* ปุ่มเปลี่ยนภาษา (TH/EN) */}
            <div className="flex items-center ml-2 bg-muted rounded-full p-1 border border-border">
              <button
                onClick={() => setLocale('th')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${locale === 'th' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                TH
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${locale === 'en' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                EN
              </button>
            </div>
          </nav>

          {/* ปุ่มเปิด Mobile Menu - แสดงเฉพาะบนมือถือ (md:hidden) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="
              md:hidden flex items-center justify-center w-11 h-11 rounded-md
              text-foreground hover:bg-muted transition-smooth
              active:scale-[0.97] min-w-[44px] min-h-[44px]
            "
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {/* เปลี่ยนไอคอนตามสถานะเปิด/ปิด */}
            <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
