'use client';

import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage'; // Component แสดงรูปภาพที่ Optimized โดย Next.js
import Icon from '@/components/ui/AppIcon'; // ไอคอนสำหรับ UI
import { useNavigation } from '@/contexts/NavigationContext'; // Context สำหรับจัดการ Navigation (ภาษา)
import { useTranslation } from '@/lib/i18n';

// Proptypes สำหรับ HeroSection
interface HeroSectionProps {
  restaurantName: React.ReactNode; // ชื่อร้าน (รองรับ JSX เพื่อปรับแต่งรูปแบบได้)
  tagline: string; // สโลแกนร้าน
  heroImage: string; // URL รูปภาพพื้นหลัง (Banner)
  heroImageAlt: string; // คำอธิบายรูปภาพ (Alt Text) เพื่อการเข้าถึง (Accessibility)
}

/**
 * HeroSection Component
 * 
 * ส่วนหัวข้อหลัก (Banner) ของหน้าแรก
 * ทำหน้าที่สร้างความประทับใจแรกให้กับผู้เข้าชม
 * ประกอบด้วย:
 * 1. พื้นหลังรูปภาพขนาดใหญ่เต็มจอ (Full-screen background image)
 * 2. ชื่อร้านและสโลแกน (Title & Tagline)
 * 3. ปุ่ม Call to Action (CTA) หลักและรอง
 * 
 * คุณสมบัติ:
 * - ใช้ AppImage เพื่อ Optimization รูปภาพ (LCP)
 * - มี Overlay เพื่อให้อ่านตัวหนังสือได้ชัดเจนบนพื้นหลังรูปภาพ
 * - รองรับ Responsive Design (ปรับขนาดตามหน้าจอ)
 */
const HeroSection: React.FC<HeroSectionProps> = ({
  restaurantName,
  tagline,
  heroImage,
  heroImageAlt,
}) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  return (
    <section className="relative w-full h-[600px] lg:h-[700px] overflow-hidden">
      {/* 1. Background Image Wrapper */}
      <div className="absolute inset-0">
        <AppImage
          src={heroImage}
          alt={heroImageAlt}
          fill // ให้รูปขยายเต็มพื้นที่ Container
          className="object-cover" // ปรับขนาดรูปให้พอดีโดยไม่เสียสัดส่วน (Crop ส่วนเกิน)
          priority // โหลดรูปนี้เป็นลำดับแรก (Priority High) เพื่อลด LCP (Largest Contentful Paint)
        />

        {/* Overlay Gradient: ไล่เฉดสีดำจางๆ เพื่อให้ตัวหนังสือสีขาวอ่านง่ายขึ้น */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-800/20 via-amber-900/30 to-amber-950/40 dark:from-black/50 dark:via-black/60 dark:to-black/80" />
      </div>

      {/* 2. Content Container: เนื้อหาตรงกลาง */}
      <div className="relative container mx-auto px-4 lg:px-6 h-full flex flex-col justify-center items-center text-center">
        <div className="max-w-4xl space-y-6">

          {/* ชื่อร้าน (Title) */}
          {/* ใช้สีขาวเสมอเพราะวางบนพื้นหลังรูปภาพ */}
          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white drop-shadow-lg leading-snug">
            {restaurantName}
          </h1>

          {/* สโลแกน (Tagline) */}
          <p className="text-xl lg:text-2xl text-white/90 font-medium drop-shadow-md">
            {tagline}
          </p>

          {/* 3. Call to Action Buttons (ปุ่มกด) */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">

            {/* ปุ่มหลัก: จองโต๊ะ (Primary CTA) */}
            <Link
              href="/reservation-form"
              className="
                inline-flex items-center gap-3 px-10 py-5 rounded-lg text-lg font-bold
                bg-accent text-accent-foreground shadow-warm-lg
                transition-all duration-300
                hover:shadow-warm-xl hover:-translate-y-1 hover:brightness-110
                active:scale-[0.97]
              "
            >
              <Icon name="CalendarIcon" size={24} />
              <span>{t('hero.cta')}</span>
            </Link>

            {/* ปุ่มรอง: ตรวจสอบสถานะการจอง (Secondary CTA) */}
            <Link
              href="/check-status"
              className="
                inline-flex items-center gap-3 px-10 py-5 rounded-lg text-lg font-bold
                bg-white/20 backdrop-blur-md text-white border border-white/30
                transition-all duration-300
                hover:bg-white/30 hover:-translate-y-1
                active:scale-[0.97]
              "
            >
              <Icon name="MagnifyingGlassIcon" size={24} />
              <span>{t('nav.checkStatus')}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
