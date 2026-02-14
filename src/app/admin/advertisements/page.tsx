'use client'; // จำเป็นต้องใช้เพราะมีการดึง State ภาษา

import React from 'react';
import AdminAdvertisements from '@/app/admin/components/AdminAdvertisements';
// เรียกใช้ Hook ภาษาที่เราเพิ่งทำไป เพื่อให้เปลี่ยนภาษาได้ทันที (Real-time)
import { useAdminLocale, adminT } from '@/app/admin/components/LanguageSwitcher';
import { MegaphoneIcon } from '@heroicons/react/24/outline';

export default function Page() {
  const locale = useAdminLocale(); // ดึงค่าภาษาปัจจุบัน (th/en)

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        
        {/* Header Section: จัดหัวข้อให้ดูมีมิติ มีไอคอน และเส้นแบ่ง */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl w-fit shadow-sm">
            <MegaphoneIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {adminT('admin.advertisements.title', locale)}
            </h1>
            <p className="mt-1 text-sm md:text-base text-gray-500 dark:text-gray-400">
              {adminT('admin.advertisements.subtitle', locale)}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="animate-fade-in-up">
          <AdminAdvertisements />
        </div>
        
      </div>
    </div>
  );
}