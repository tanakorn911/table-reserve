'use client'; // ใช้ Client Component เพื่อให้สามารถใช้ Hooks (useState, useEffect) สำหรับจัดการ Hydration

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

// โครงสร้างข้อมูลสำหรับลิงก์ Social Media
interface SocialLink {
  name: string; // ชื่อ Platform (เช่น Facebook)
  icon: string; // ชื่อ Icon
  url: string;  // ลิงก์ URL
}

// Proptypes สำหรับ Footer
interface FooterProps {
  restaurantName: string; // ชื่อร้าน
  socialLinks: SocialLink[]; // รายการลิงก์ Social Media
}

/**
 * Footer Component
 * 
 * ส่วนท้ายของเว็บไซต์ (Footer)
 * แสดงข้อมูลที่ปรากฏทุกหน้าด้านล่างสุด
 * ประกอบด้วย:
 * 1. โลโก้และชื่อร้าน (Logo & Branding)
 * 2. ลิงก์ Social Media (Social Links)
 * 3. ข้อความลิขสิทธิ์ (Copyright) และลิงก์ Admin Login
 * 
 * คุณสมบัติ:
 * - จัดการ Hydration Mismatch โดยใช้ isHydrated state
 * - คำนวณปีปัจจุบันอัตโนมัติสำหรับ Copyright
 */
const Footer: React.FC<FooterProps> = ({ restaurantName, socialLinks }) => {
  // State เพื่อตรวจสอบว่า Component ถูก Mount ในฝั่ง Client แล้วหรือยัง
  const [isHydrated, setIsHydrated] = useState(false);
  // State เก็บปีปัจจุบัน
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  // Effect: ทำงานเมื่อ Component Mount ฝั่ง Client
  useEffect(() => {
    setIsHydrated(true); // ตั้งค่าว่า Hydrated แล้ว
    setCurrentYear(new Date().getFullYear()); // ดึงปีปัจจุบัน
  }, []);

  // กรณี Server-Side Rendering หรือยังไม่ Hydrate
  // แสดง Skeleton หรือโครงร่างง่ายๆ เพื่อป้องกัน layout shift และเนื้อหาไม่ตรงกัน
  if (!isHydrated) {
    return (
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex flex-col items-center space-y-6">
            {/* Skeleton Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                <Icon name="BuildingStorefrontIcon" size={24} className="text-primary-foreground" />
              </div>
              <span className="text-xl font-heading font-bold text-foreground">
                {restaurantName}
              </span>
            </div>
            {/* Skeleton Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-muted"
                />
              ))}
            </div>
            {/* Static Copyright */}
            <p className="text-sm text-muted-foreground text-center">
              © {restaurantName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // Render จริงเมื่อ Client Hydrated แล้ว
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex flex-col items-center space-y-6">

          {/* 1. Logo & Name: คลิกเพื่อกลับหน้าแรก */}
          <Link
            href="/landing-page"
            className="flex items-center gap-3 transition-smooth hover:opacity-80 hover:scale-105"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary shadow-sm">
              <Icon name="BuildingStorefrontIcon" size={24} className="text-primary-foreground" />
            </div>
            <span className="text-xl font-heading font-bold text-foreground">{restaurantName}</span>
          </Link>

          {/* 2. Social Media Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer" // ป้องกัน security risk เมื่อเปิด tab ใหม่
                className="
                  group flex items-center justify-center w-[52px] h-[52px] rounded-full
                  bg-muted text-foreground
                  transition-smooth duration-300
                  hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:-translate-y-1
                  active:scale-[0.95]
                "
                aria-label={link.name} // Accessibility Label
              >
                <Icon name={link.icon} size={26} />
              </a>
            ))}
          </div>

          {/* 3. Footer Text Links */}
          <div className="text-center space-y-2">

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © {currentYear} {restaurantName}. {t('footer.rights')}
            </p>

            {/* Security Note */}
            <p className="text-xs text-muted-foreground">{t('footer.security')}</p>

            {/* Admin Login Link (ซ่อนเนียนๆ) */}
            <Link
              href="/admin/login"
              target="_blank"
              className="
                inline-block mt-2 text-xs text-muted-foreground/60 
                hover:text-primary transition-colors underline decoration-dotted
              "
            >
              {t('footer.adminLogin')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
