'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  MapIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useAdminLocale, adminT } from './LanguageSwitcher';

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

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div
        className={`
                fixed inset-y-0 left-0 w-64 bg-card/95 backdrop-blur-sm border-r border-primary/20 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between h-16 px-6 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-transparent">
          <div>
            <span className="text-lg font-bold text-yellow-400 leading-tight">
              {adminT('login.title', locale)}
            </span>
            <span className="text-yellow-300 text-xs block uppercase tracking-wider font-bold">
              ({adminT(role === 'admin' ? 'sidebar.admin' : 'sidebar.staff', locale)})
            </span>
          </div>
          <button onClick={onClose} className="md:hidden text-foreground/60 hover:text-foreground transition-colors">
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
                className={`group flex items-center px-4 py-3 text-base font-bold rounded-xl transition-all ${isActive
                  ? 'bg-primary/20 text-yellow-400 shadow-lg shadow-primary/10 border border-primary/30'
                  : 'text-gray-200 hover:bg-primary/5 hover:text-white border border-transparent'
                  }`}
              >
                <item.icon
                  className={`w-6 h-6 mr-3 transition-colors ${isActive ? 'text-yellow-400' : 'text-gray-400 group-hover:text-white'
                    }`}
                  aria-hidden="true"
                />
                {adminT(item.name, locale)}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-primary/20">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-black text-red-400 rounded-xl hover:bg-error/10 uppercase tracking-widest transition-all border border-transparent hover:border-error/30"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6 mr-3" />
            {adminT('sidebar.logout', locale)}
          </button>
        </div>
      </div>
    </>
  );
}
