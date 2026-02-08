'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  MapIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useAdminLocale, adminT } from './LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const locale = useAdminLocale();
  const { adminTheme } = useAdminTheme();

  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setRole(profile.role as 'admin' | 'staff');
        } else {
          setRole((user.user_metadata?.role as any) || 'admin');
        }
      }
    };
    checkRole();
  }, [supabase]);

  const handleLogout = async () => {
    if (window.confirm(adminT('logout.confirm', locale))) {
      await supabase.auth.signOut();
      router.push('/admin/login');
      router.refresh();
    }
  };

  const allMenuItems = [
    { name: 'sidebar.dashboard', href: '/admin/dashboard', icon: HomeIcon, roles: ['admin', 'staff'] },
    {
      name: 'sidebar.reservations',
      href: '/admin/reservations',
      icon: CalendarDaysIcon,
      roles: ['admin', 'staff'],
    },
    { name: 'sidebar.floorPlan', href: '/admin/floor-plan', icon: MapIcon, roles: ['admin'] },
    { name: 'sidebar.settings', href: '/admin/settings', icon: Cog6ToothIcon, roles: ['admin'] },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  // Theme-aware classes
  const themeClasses = adminTheme === 'dark'
    ? {
      overlay: 'bg-black/70',
      sidebar: 'bg-gray-800/95 border-yellow-500/20',
      header: 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20',
      headerTitle: 'text-yellow-400',
      headerSubtitle: 'text-yellow-300',
      closeBtn: 'text-gray-400 hover:text-white',
      navActive: 'bg-yellow-500/20 text-yellow-400 shadow-lg shadow-yellow-500/10 border-yellow-500/30',
      navInactive: 'text-gray-200 hover:bg-yellow-500/5 hover:text-white',
      navIcon: 'text-gray-400 group-hover:text-white',
      navIconActive: 'text-yellow-400',
      logoutBorder: 'border-yellow-500/20',
      logout: 'text-red-400 hover:bg-red-500/10 hover:border-red-500/30',
    }
    : {
      overlay: 'bg-black/50',
      sidebar: 'bg-white border-gray-200 shadow-xl shadow-gray-200/50',
      header: 'bg-white border-gray-200',
      headerTitle: 'text-gray-900',
      headerSubtitle: 'text-gray-500',
      closeBtn: 'text-gray-400 hover:text-gray-600',
      navActive: 'bg-gray-100 text-gray-900 shadow-sm border-gray-200',
      navInactive: 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
      navIcon: 'text-gray-400 group-hover:text-gray-600',
      navIconActive: 'text-gray-900',
      logoutBorder: 'border-gray-100',
      logout: 'text-red-600 hover:bg-red-50 hover:border-red-100',
    };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 ${themeClasses.overlay} z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div
        className={`
                fixed inset-y-0 left-0 w-64 ${themeClasses.sidebar} backdrop-blur-sm border-r z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
      >
        {/* Header */}
        <div className={`relative flex items-center justify-between h-16 px-6 border-b ${themeClasses.header}`}>
          <div>
            <span className={`text-lg font-bold ${themeClasses.headerTitle} leading-tight`}>
              {adminT('login.title', locale)}
            </span>
            <span className={`${themeClasses.headerSubtitle} text-xs block uppercase tracking-wider font-bold`}>
              ({adminT(role === 'admin' ? 'sidebar.admin' : 'sidebar.staff', locale)})
            </span>
          </div>
          <button onClick={onClose} className={`md:hidden ${themeClasses.closeBtn} transition-colors`}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768) onClose();
                }}
                className={`group flex items-center px-4 py-3 text-base font-bold rounded-xl transition-all border ${isActive
                  ? themeClasses.navActive
                  : `${themeClasses.navInactive} border-transparent`
                  }`}
              >
                <item.icon
                  className={`w-6 h-6 mr-3 transition-colors ${isActive ? themeClasses.navIconActive : themeClasses.navIcon
                    }`}
                  aria-hidden="true"
                />
                {adminT(item.name, locale)}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className={`p-4 border-t ${themeClasses.logoutBorder}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-4 py-3 text-sm font-black rounded-xl uppercase tracking-widest transition-all border border-transparent ${themeClasses.logout}`}
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6 mr-3" />
            {adminT('sidebar.logout', locale)}
          </button>
        </div>
      </div>
    </>
  );
}
