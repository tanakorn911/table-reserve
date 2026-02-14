'use client'; // ใช้ Client Component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    HomeIcon,
    CalendarDaysIcon,
    Cog6ToothIcon,
    MapIcon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useAdminLocale, adminT } from './LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

/**
 * AdminBottomNav Component
 * 
 * เมนูนำทางด้านล่างสำหรับหน้าจอ Mobile (Fixed Bottom Navigation)
 * แสดงเฉพาะเมื่อหน้าจอมีความกว้างน้อยกว่าระดับ md
 * ช่วยให้เข้าถึงเมนูสำคัญได้ง่ายด้วยนิ้วโป้ง
 */
export default function AdminBottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClientSupabaseClient();
    const [role, setRole] = useState<'admin' | 'staff'>('staff');
    const locale = useAdminLocale();
    const { resolvedAdminTheme } = useAdminTheme();

    // ฟังก์ชัน Logout (ไม่ได้ใช้ใน Bottom Nav แต่เตรียมไว้เผื่อจำเป็น)
    const handleLogout = async () => {
        if (window.confirm(adminT('logout.confirm', locale))) {
            await supabase.auth.signOut();
            router.push('/admin/login');
            router.refresh();
        }
    };

    // ตรวจสอบ Role เพื่อแสดงเมนูให้ถูกต้อง
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

    // รายการเมนูทั้งหมด
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

    // กรองเมนูตาม Role
    const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

    // กำหนด Class ตาม Theme
    const themeClasses = resolvedAdminTheme === 'dark'
        ? {
            container: 'bg-gray-900/95 border-yellow-500/20',
            active: 'text-yellow-400',
            inactive: 'text-gray-400 hover:text-white',
            activeRing: 'bg-yellow-500/20 ring-1 ring-yellow-500/40',
        }
        : {
            container: 'bg-white/95 border-amber-200 shadow-lg',
            active: 'text-amber-600',
            inactive: 'text-gray-500 hover:text-amber-700',
            activeRing: 'bg-amber-100 ring-1 ring-amber-300',
        };

    return (
        <div className={`md:hidden fixed bottom-0 left-0 right-0 ${themeClasses.container} backdrop-blur-md border-t z-60 pb-safe`}>
            <nav className="flex items-center justify-around h-16">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${isActive ? themeClasses.active : themeClasses.inactive
                                }`}
                        >
                            <div className={`p-1.5 rounded-lg transition-colors ${isActive ? themeClasses.activeRing : ''}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tighter">
                                {adminT(item.name, locale)}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
