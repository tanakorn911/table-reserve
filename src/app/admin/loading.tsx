'use client';

import React from 'react';
import { useAdminLocale } from './components/LanguageSwitcher';

/**
 * AdminLoading Component
 * แสดงหน้าจอ Loading ระหว่างรอโหลดข้อมูลในส่วน Admin
 * - แสดง Spinner หมุนๆ
 * - แสดงข้อความ "กำลังโหลดข้อมูลระบบ..." (รองรับ 2 ภาษา)
 */
export default function AdminLoading() {
  const locale = useAdminLocale();
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-blue-900 font-bold animate-pulse">
          {locale === 'th' ? 'กำลังโหลดข้อมูลระบบ...' : 'Loading system data...'}
        </p>
      </div>
    </div>
  );
}
