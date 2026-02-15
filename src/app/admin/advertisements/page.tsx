'use client';

import AdminAdvertisements from '@/app/admin/components/AdminAdvertisements';
import { useAdminLocale, adminT } from '@/app/admin/components/LanguageSwitcher';

export default function Page() {
  const locale = useAdminLocale();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{adminT('admin.advertisements.title', locale)}</h1>
        <p className="text-sm text-gray-400">{adminT('admin.advertisements.subtitle', locale)}</p>
      </div>
      <AdminAdvertisements />
    </div>
  );
}
