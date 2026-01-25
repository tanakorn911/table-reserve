'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    CalendarDaysIcon,
    Cog6ToothIcon,
    MapIcon,
} from '@heroicons/react/24/outline';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useAdminLocale, adminT } from './LanguageSwitcher';

export default function AdminBottomNav() {
    const pathname = usePathname();
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A]/95 backdrop-blur-md border-t border-primary/20 z-[60] pb-safe">
            <nav className="flex items-center justify-around h-16">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${isActive ? 'text-yellow-400' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-primary/20 ring-1 ring-primary/40' : ''}`}>
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
