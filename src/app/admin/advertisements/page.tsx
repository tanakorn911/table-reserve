'use client';

import AdminAdvertisements from '@/app/admin/components/AdminAdvertisements';
import { useAdminLocale, adminT } from '@/app/admin/components/LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';

export default function Page() {
  const locale = useAdminLocale();
  const { resolvedAdminTheme } = useAdminTheme();
  const isDark = resolvedAdminTheme === 'dark';

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* ส่วนหัวของหน้า (Page Header) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl border transition-all duration-300 ${isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-amber-100 border-amber-200'}`}>
            <SpeakerWaveIcon className={`w-8 h-8 ${isDark ? 'text-yellow-400' : 'text-amber-600'}`} />
          </div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-yellow-400' : 'text-amber-700'}`}>
              {adminT('admin.advertisements.title', locale)}
            </h1>
            <p className={`text-sm mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {adminT('admin.advertisements.subtitle', locale)}
            </p>
          </div>
        </div>
      </div>

      <AdminAdvertisements />
    </div>
  );
}
