import AdminAdvertisements from '@/app/admin/components/AdminAdvertisements';
import { useTranslation } from '@/lib/i18n';

export default function Page() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('admin.advertisements.title')}</h1>
        <p className="text-sm text-gray-400">{t('admin.advertisements.subtitle')}</p>
      </div>
      <AdminAdvertisements />
    </div>
  );
}