'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useNavigation } from '@/contexts/NavigationContext';
import Icon from '@/components/ui/AppIcon';
import { useTranslation } from '@/lib/i18n';
import ThemeToggle from '@/components/common/ThemeToggle';

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  staffOnly?: boolean;
}

const MobileMenu = () => {
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
      label: t('nav.reserve'),
      path: '/reservation-form',
      icon: 'CalendarIcon',
      staffOnly: false,
    },
    {
      label: t('admin.reservations'),
      path: '/admin/dashboard',
      icon: 'ClipboardDocumentListIcon',
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

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  if (!isMobileMenuOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-200 bg-background/80 backdrop-blur-sm md:hidden transition-smooth"
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className="
          fixed top-[80px] left-0 right-0 bottom-0 z-200 bg-card
          md:hidden overflow-y-auto transition-smooth
          animate-in slide-in-from-top-4 duration-250
        "
      >
        <nav className="flex flex-col p-6 gap-2">
          {filteredNavItems.map((item, index) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-6 py-4 rounded-md text-base font-medium
                transition-smooth min-h-[44px]
                ${isActiveRoute(item.path)
                  ? 'bg-primary text-primary-foreground shadow-warm-sm'
                  : 'text-foreground hover:bg-muted active:scale-[0.97]'
                }
              `}
              style={{
                animationDelay: `${index * 150}ms`,
              }}
            >
              <Icon name={item.icon} size={24} />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Theme Toggle for Mobile */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-sm font-medium text-muted-foreground">{locale === 'th' ? 'โหมดสี' : 'Theme'}</p>
              <ThemeToggle size="sm" />
            </div>
          </div>

          {/* Language Switcher for Mobile */}
          <div className="mt-4 pt-6 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-4 px-2">Language / ภาษา</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setLocale('th');
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  flex-1 py-3 rounded-lg text-sm font-bold transition-all border
                  ${locale === 'th'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-muted'
                  }
                `}
              >
                ไทย (TH)
              </button>
              <button
                onClick={() => {
                  setLocale('en');
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  flex-1 py-3 rounded-lg text-sm font-bold transition-all border
                  ${locale === 'en'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-muted'
                  }
                `}
              >
                English (EN)
              </button>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default MobileMenu;
