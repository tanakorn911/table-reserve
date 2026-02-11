'use client'; // ทำงานฝั่ง Client Component

import React from 'react';
// นำเข้าไอคอนจาก HeroIcons (ทั้งแบบเส้น Outline และแบบทึบ Solid)
import * as HeroIcons from '@heroicons/react/24/outline';
import * as HeroIconsSolid from '@heroicons/react/24/solid';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

// ประเภทของไอคอน: outline (เส้น) หรือ solid (ทึบ)
type IconVariant = 'outline' | 'solid';

// อินเทอร์เฟซสำหรับ Props ของ Icon
interface IconProps {
  name: string; // ชื่อไอคอน (ต้องตรงกับชื่อใน HeroIcons หรือ Brand Icons)
  variant?: IconVariant; // รูปแบบไอคอน
  size?: number; // ขนาด (กว้าง/สูง เป็น px)
  className?: string; // Class CSS เพิ่มเติม
  onClick?: () => void; // ฟังก์ชันเมื่อคลิก
  disabled?: boolean; // สถานะปิดการใช้งาน
  [key: string]: unknown; // Props อื่นๆ
}

/**
 * Component สำหรับแสดงไอคอน
 * รองรับทั้ง HeroIcons และ Brand Icons (Facebook, Instagram, Line)
 */
function Icon({
  name,
  variant = 'outline',
  size = 24,
  className = '',
  onClick,
  disabled = false,
  ...props
}: IconProps) {
  // --- ส่วนจัดการ Brand Icons (ไอคอนแบรนด์ต่างๆ ที่ไม่มีใน HeroIcons) ---

  // 1. Facebook Icon
  if (name === 'Facebook') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor" // ใช้สีตาม Text Color ปัจจุบัน
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        // กำหนด Class ตามสถานะ (disabled หรือ clickable)
        className={`${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  }

  // 2. Instagram Icon
  if (name === 'Instagram') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }

  // 3. Line Icon
  if (name === 'Line') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        <path d="M12 3c-6.627 0-12 4.03-12 9s5.373 9 12 9c.844 0 1.666-.065 2.453-.189l4.547 2.189-1-4.508c3.676-1.63 6-4.108 6-6.492 0-4.97-5.373-9-12-9z" />
        <path d="M9 10v4h2" />
      </svg>
    );
  }


  // --- ส่วนจัดการ HeroIcons ---

  // เลือกชุดไอคอนตาม variant (Solid หรือ Outline)
  const iconSet = variant === 'solid' ? HeroIconsSolid : HeroIcons;
  // ดึง Component ไอคอนตามชื่อ
  const IconComponent = iconSet[name as keyof typeof iconSet] as React.ComponentType<{
    width?: number;
    height?: number;
    className?: string;
    onClick?: React.MouseEventHandler;
  }>;

  // หากหาไอคอนไม่เจอ ให้แสดงเครื่องหมายคำถามแทน (Fallback)
  if (!IconComponent) {
    return (
      <QuestionMarkCircleIcon
        width={size}
        height={size}
        className={`text-gray-400 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        onClick={disabled ? undefined : onClick}
        {...props}
      />
    );
  }

  // แสดงผลไอคอน HeroIcons ที่ถูกต้อง
  return (
    <IconComponent
      width={size}
      height={size}
      className={`${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
      {...props}
    />
  );
}

export default Icon;
