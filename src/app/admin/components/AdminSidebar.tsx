'use client'; // ใช้ Client Component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  MapIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useAdminLocale, adminT } from './LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

interface AdminSidebarProps {
  isOpen: boolean; // สถานะเปิด/ปิด Sidebar (สำหรับ Mobile)
  onClose: () => void; // ฟังก์ชันปิด Sidebar
}

/**
 * AdminSidebar Component
 * 
 * เมนูแถบด้านซ้ายสำหรับ Admin Panel (Desktop)
 * หรือเป็น Slide-over Menu สำหรับ Mobile
 * แสดงรายการเมนูตาม Role ของผู้ใช้ (Admin/Staff)
 */
export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [role, setRole] = useState<'admin' | 'staff'>('staff'); // เก็บ Role
  const locale = useAdminLocale();
  const { resolvedAdminTheme } = useAdminTheme();

  // Check user role to filter menu items
  // ตรวจสอบ Role ของผู้ใช้เพื่อกรองเมนู (แสดงเฉพาะเมนูที่ผู้ใช้นั้นมีสิทธิ์)
  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Try to get role from 'profiles' table first
        // พยายามดึง Role จากตาราง profiles ก่อน
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setRole(profile.role as 'admin' | 'staff');
        } else {
          // Fallback to user_metadata if profile not found
          // ถ้าไม่เจอใน profiles ให้ใช้จาก user_metadata (กรณีพึ่งสมัคร)
          setRole((user.user_metadata?.role as any) || 'admin');
        }
      }
    };
    checkRole();
  }, [supabase]);

  // ฟังก์ชัน Logout
  const handleLogout = async () => {
    if (window.confirm(adminT('logout.confirm', locale))) {
      await supabase.auth.signOut();
      router.push('/admin/login');
      router.refresh();
    }
  };

  // รายการเมนูทั้งหมด
  const allMenuItems = [
    { name: 'sidebar.dashboard', href: '/admin/dashboard', icon: HomeIcon, roles: ['admin', 'staff'] },
    {
      name: 'sidebar.reservations',
      href: '/admin/reservations',
      icon: CalendarDaysIcon,
      roles: ['admin', 'staff'],
    },
    {
      name: 'sidebar.feedback',
      href: '/admin/feedback',
      icon: ChatBubbleBottomCenterTextIcon,
      roles: ['admin', 'staff'],
    },
    { name: 'sidebar.advertisements', href: '/admin/advertisements', icon: SpeakerWaveIcon, roles: ['admin'] }, // เฉพาะ Admin
    { name: 'sidebar.floorPlan', href: '/admin/floor-plan', icon: MapIcon, roles: ['admin'] }, // เฉพาะ Admin
    { name: 'sidebar.settings', href: '/admin/settings', icon: Cog6ToothIcon, roles: ['admin'] }, // เฉพาะ Admin
  ];

  // กรองเมนูตาม Role
  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  // กำหนด Class ตาม Theme
  const themeClasses = resolvedAdminTheme === 'dark'
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
      sidebar: 'bg-background border-border shadow-xl shadow-stone-200/40',
      header: 'bg-gradient-to-r from-accent/10 to-transparent border-border',
      headerTitle: 'text-primary',
      headerSubtitle: 'text-accent',
      closeBtn: 'text-muted-foreground hover:text-foreground',
      navActive: 'bg-accent/10 text-accent shadow-sm border-accent/20',
      navInactive: 'text-muted-foreground hover:bg-accent/5 hover:text-primary',
      navIcon: 'text-muted-foreground group-hover:text-accent',
      navIconActive: 'text-accent',
      logoutBorder: 'border-border',
      logout: 'text-error hover:bg-error/10 hover:border-error/30',
    };

  return (
    <>
      {/* Mobile Overlay (ฉากหลังดำเมื่อเปิดเมนูในมือถือ) */}
      <div
        className={`fixed inset-0 ${themeClasses.overlay} z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      ></div>

      {/* Sidebar Container */}
      <div
        className={`
                fixed inset-y-0 left-0 w-64 ${themeClasses.sidebar} backdrop-blur-sm border-r z-50 transform transition-transform duration-300 ease-in-out flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
      >
        {/* Header ส่วนบนของ Sidebar */}
        <div className={`relative flex items-center justify-between h-16 px-6 border-b ${themeClasses.header}`}>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-11 h-10 rounded-md object-cover aspect-square" />
            <span className={`text-xl font-black ${themeClasses.headerTitle} leading-tight tracking-tight`}>
              {adminT('login.title', locale)}
            </span>
          </div>
          {/* ปุ่มปิด (เฉพาะ Mobile) */}
          <button onClick={onClose} className={`md:hidden ${themeClasses.closeBtn} transition-colors`}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  // ปิดเมนูอัตโนมัติเมื่อกดเลือก (เฉพาะ Mobile)
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

        {/* Logout Button (ส่วนล่างสุด) */}
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
