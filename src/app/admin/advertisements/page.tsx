'use client';

import React from 'react';
import AdminAdvertisements from '@/app/admin/components/AdminAdvertisements';
import { useAdminLocale, adminT } from '@/app/admin/components/LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { MegaphoneIcon } from '@heroicons/react/24/outline';

export default function Page() {
  const locale = useAdminLocale();
  // แก้ไขตรงนี้เช่นกัน: ใช้ resolvedAdminTheme
  const { adminTheme, resolvedAdminTheme } = useAdminTheme();
  
  // ใช้ค่า resolved ก่อน ถ้าไม่มีให้ใช้ adminTheme (fallback)
  const currentTheme = resolvedAdminTheme || adminTheme;
  const isDark = currentTheme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        
        <div className={`flex flex-col md:flex-row md:items-center gap-4 mb-8 pb-6 border-b transition-colors ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className={`p-3 rounded-2xl w-fit shadow-sm transition-colors ${
            isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'
          }`}>
            <MegaphoneIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold tracking-tight transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {adminT('admin.advertisements.title', locale)}
            </h1>
            <p className={`mt-1 text-sm md:text-base transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {adminT('admin.advertisements.subtitle', locale)}
            </p>
          </div>
        </div>

        <div className="animate-fade-in-up">
          <AdminAdvertisements />
        </div>
        
      </div>
    </div>
  );
}