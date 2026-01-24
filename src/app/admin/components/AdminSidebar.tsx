'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  CalendarDaysIcon,
  TableCellsIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClientSupabaseClient } from '@/lib/supabase/client';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [role, setRole] = useState<'admin' | 'staff'>('staff');

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
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const allMenuItems = [
    { name: 'แดชบอร์ด', href: '/admin/dashboard', icon: HomeIcon, roles: ['admin', 'staff'] },
    {
      name: 'รายการจอง',
      href: '/admin/reservations',
      icon: CalendarDaysIcon,
      roles: ['admin', 'staff'],
    },
    {
      name: 'เช็คสถานะจอง',
      href: '/check-status',
      icon: MagnifyingGlassIcon,
      roles: ['admin', 'staff'],
    },
    { name: ' จัดการโต๊ะ', href: '/admin/tables', icon: TableCellsIcon, roles: ['admin'] },
    { name: 'ตั้งค่าระบบ', href: '/admin/settings', icon: Cog6ToothIcon, roles: ['admin'] },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div
        className={`
                fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-[#3b5998]">
          <span className="text-lg font-bold text-white leading-tight">
            จองโต๊ะออนไลน์{' '}
            <span className="text-blue-200 text-xs block opacity-80 uppercase tracking-tighter">
              ({role === 'admin' ? 'Admin' : 'Staff'})
            </span>
          </span>
          <button onClick={onClose} className="md:hidden text-white/80 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768) onClose();
                }} // Close on click for mobile
                className={`group flex items-center px-4 py-3 text-base font-bold rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`w-6 h-6 mr-3 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-700'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-black text-red-600 rounded-xl hover:bg-red-50 uppercase tracking-widest transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6 mr-3 text-red-500 font-bold" />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </>
  );
}
