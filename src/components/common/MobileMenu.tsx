'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useNavigation } from '@/contexts/NavigationContext';
import Icon from '@/components/ui/AppIcon';

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  staffOnly?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'หน้าหลัก',
    path: '/landing-page',
    icon: 'HomeIcon',
    staffOnly: false,
  },
  {
    label: 'รายการจอง',
    path: '/reservation-list',
    icon: 'ClipboardDocumentListIcon',
    staffOnly: true,
  },
];

const MobileMenu = () => {
  const { currentRoute, isMobileMenuOpen, setIsMobileMenuOpen, isStaffUser } = useNavigation();

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
        className="fixed inset-0 z-200 bg-background md:hidden transition-smooth"
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className="
          fixed top-20 left-0 right-0 bottom-0 z-200 bg-card
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
                ${
                  isActiveRoute(item.path)
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

          <Link
            href="/reservation-form"
            onClick={() => setIsMobileMenuOpen(false)}
            className="
              flex items-center gap-3 px-6 py-4 mt-4 rounded-md text-base font-medium
              bg-accent text-accent-foreground shadow-warm-sm
              transition-smooth hover:shadow-warm-md
              active:scale-[0.97] min-h-[44px]
            "
            style={{
              animationDelay: `${filteredNavItems.length * 150}ms`,
            }}
          >
            <Icon name="CalendarIcon" size={24} />
            <span>จองโต๊ะ</span>
          </Link>
        </nav>
      </div>
    </>
  );
};

export default MobileMenu;
