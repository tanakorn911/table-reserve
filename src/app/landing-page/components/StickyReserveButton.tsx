'use client'; // ใช้ Client Component เพื่อดักจับ Event Scroll

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

/**
 * StickyReserveButton Component
 * 
 * ปุ่ม "จองโต๊ะ" ลอยตัวที่มุมซ้ายล่าง (Sticky Floating Button)
 * - ออกแบบมาเพื่อให้ลูกค้ากดจองได้ง่ายตลอดเวลา แม้จะเลื่อนหน้าจอลงมาด้านล่างแล้ว
 * - ทำงานสัมพันธ์กับการ Scroll: จะแสดงเมื่อเลื่อนลงมาเกินระยะที่กำหนด (เช่น พ้น Hero Section)
 * - ซ่อนตัวเองเมื่ออยู่บนสุดของหน้า (เพื่อไม่ให้ซ้ำซ้อนกับปุ่มใน Hero)
 */
const StickyReserveButton: React.FC = () => {
  // State: ป้องกัน Hydration Mismatch
  const [isHydrated, setIsHydrated] = useState(false);
  // State: ควบคุมการแสดงผล (Show/Hide)
  const [isVisible, setIsVisible] = useState(false);

  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  // Effect: จัดการ Event Listener สำหรับ Scroll
  useEffect(() => {
    setIsHydrated(true);

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // แสดงปุ่มเมื่อเลื่อนลงมาเกิน 800px (ประมาณความสูง Hero Section)
      setIsVisible(scrollPosition > 800);
    };

    // เพิ่ม Event Listener
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // ตรวจสอบครั้งแรกทันที

    // Cleanup Event Listener เมื่อ Component Unmount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ถ้ายังไม่ Hydrate ไม่ต้อง render อะไร (ป้องกัน error ฝั่ง Server)
  if (!isHydrated) {
    return null;
  }

  return (
    <div
      className={`
        fixed bottom-6 left-6 z-50
        transition-all duration-500 transform
        ${isVisible
          ? 'opacity-100 translate-y-0' // แสดง: เลื่อนขึ้นมาและชัดเจน
          : 'opacity-0 translate-y-10 pointer-events-none' // ซ่อน: เลื่อนลงไปและคลิกไม่ได้
        }
      `}
    >
      <Link
        href="/reservation-form"
        className="
          flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold
          bg-accent text-accent-foreground shadow-warm-xl
          border border-accent/20 backdrop-blur-sm
          transition-smooth
          hover:shadow-warm-2xl hover:scale-105 hover:-translate-y-1 hover:bg-accent/90
          active:scale-95 active:translate-y-0
          min-h-[56px]
        "
        aria-label="Book a table now"
      >
        <Icon name="CalendarIcon" size={24} className="animate-pulse-slow" />
        <span className="hidden sm:inline font-bold">{t('nav.reserve')}</span>
      </Link>
    </div>
  );
};

export default StickyReserveButton;
