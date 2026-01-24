'use client';

import React from 'react';
import Link from 'next/link';
import { useNavigation } from '@/contexts/NavigationContext';
import Icon from '@/components/ui/AppIcon';
import { useTranslation } from '@/lib/i18n';

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  staffOnly?: boolean;
}

const Header = () => {
  const { currentRoute, isMobileMenuOpen, setIsMobileMenuOpen, isStaffUser, locale, setLocale } =
    useNavigation();
  const { t } = useTranslation(locale);

  const navigationItems: NavigationItem[] = [
    {
      label: t('nav.home'),
      path: '/landing-page',
      icon: 'HomeIcon',
      staffOnly: false,
    },
    {
      label: t('nav.admin'),
      path: '/admin/dashboard',
      icon: 'ChartBarIcon',
      staffOnly: true,
    },
  ];

  const filteredNavItems = navigationItems.filter(
    (item) => !item.staffOnly || (item.staffOnly && isStaffUser)
  );

  const isActiveRoute = (path: string) => {
    if (path === '/landing-page') {
      return currentRoute === path || currentRoute === '/';
    }
    return currentRoute.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-100 bg-card shadow-warm transition-smooth">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-20 px-4 lg:px-6">
          <Link
            href="/landing-page"
            className="flex items-center gap-3 transition-smooth hover:opacity-80"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary">
              <Icon name="BuildingStorefrontIcon" size={28} className="text-primary-foreground" />
            </div>
            <span className="text-2xl font-heading font-bold text-foreground">
              {t('app.title')}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-md text-base font-medium
                  transition-smooth min-h-[44px]
                  ${
                    isActiveRoute(item.path)
                      ? 'bg-primary text-primary-foreground shadow-warm-sm'
                      : 'text-foreground hover:bg-muted hover:scale-[0.97] active:scale-[0.97]'
                  }
                `}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </Link>
            ))}

            <Link
              href="/reservation-form"
              className="
                flex items-center gap-2 px-8 py-3 ml-4 rounded-md text-base font-medium
                bg-accent text-accent-foreground shadow-warm-sm
                transition-smooth hover:shadow-warm-md hover:-translate-y-0.5
                active:scale-[0.97] min-h-[44px]
              "
            >
              <Icon name="CalendarIcon" size={20} />
              <span>{t('nav.reserve')}</span>
            </Link>

            {/* Language Switcher */}
            <div className="flex items-center ml-4 bg-muted rounded-full p-1 border border-border">
              <button
                onClick={() => setLocale('th')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${locale === 'th' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                TH
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${locale === 'en' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                EN
              </button>
            </div>
          </nav>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="
              md:hidden flex items-center justify-center w-11 h-11 rounded-md
              text-foreground hover:bg-muted transition-smooth
              active:scale-[0.97] min-w-[44px] min-h-[44px]
            "
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
