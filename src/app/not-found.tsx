'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

// NotFound Page: หน้าที่แสดงเมื่อไม่พบหน้าที่ต้องการ (404)
export default function NotFound() {
  const router = useRouter();
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  // ฟังก์ชันกลับไปหน้าแรก
  const handleGoHome = () => {
    router?.push('/');
  };

  // ฟังก์ชันย้อนกลับไปหน้าก่อนหน้า
  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history?.back();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <h1 className="text-9xl font-bold text-primary opacity-20">404</h1>
          </div>
        </div>

        <h2 className="text-2xl font-medium text-onBackground mb-2">{t('notFound.title')}</h2>
        <p className="text-onBackground/70 mb-8">{t('notFound.description')}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200"
          >
            <Icon name="ArrowLeftIcon" size={16} />
            {t('notFound.goBack')}
          </button>

          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
          >
            <Icon name="HomeIcon" size={16} />
            {t('success.backHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
