'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

const StickyReserveButton: React.FC = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  useEffect(() => {
    setIsHydrated(true);

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition > 800);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isHydrated) {
    return null;
  }

  return (
    <div
      className={`
        fixed bottom-6 left-6 z-50
        transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
    >
      <Link
        href="/reservation-form"
        className="
          flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold
          bg-accent text-accent-foreground shadow-warm-xl
          transition-smooth hover:shadow-warm-2xl hover:scale-105
          active:scale-95 min-h-[56px]
        "
      >
        <Icon name="CalendarIcon" size={24} />
        <span className="hidden sm:inline">{t('nav.reserve')}</span>
      </Link>
    </div>
  );
};

export default StickyReserveButton;
