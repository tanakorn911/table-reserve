'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from './components/AdminSidebar';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { Bars3Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher, { useAdminLocale, adminT } from './components/LanguageSwitcher';
import AdminBottomNav from './components/AdminBottomNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [roleName, setRoleName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const locale = useAdminLocale();

  useEffect(() => {
    const fetchRole = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          const currentRole = profile?.role || user.user_metadata?.role;

          const adminOnlyPages = ['/admin/floor-plan', '/admin/settings'];
          if (currentRole === 'staff' && adminOnlyPages.some((page) => pathname.startsWith(page))) {
            router.push('/admin/dashboard');
            return;
          }

          if (currentRole === 'staff') {
            setRoleName(adminT('header.role.staff', locale));
          } else if (currentRole === 'admin') {
            setRoleName(adminT('header.role.admin', locale));
          } else {
            setRoleName(adminT('header.role.undefined', locale));
          }
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        setRoleName(adminT('header.role.error', locale));
      } finally {
        setIsLoading(false);
      }
    };
    fetchRole();
  }, [supabase, pathname, router, locale]);

  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  const getTitle = (path: string) => {
    const segments = path.split('/');
    const lastSegment = segments[segments.length - 1];

    const titleMap: Record<string, string> = {
      dashboard: 'header.dashboard',
      reservations: 'header.reservations',
      tables: 'header.tables',
      settings: 'header.settings',
      'floor-plan': 'header.floorPlan',
    };

    return adminT(titleMap[lastSegment] || lastSegment, locale);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-card/50 backdrop-blur-sm border-b border-primary/20">
          <div className="flex items-center gap-4">
            {/* Remove Hamburger button for mobile as we have bottom nav now */}
            {/* <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 md:hidden text-foreground/60 hover:text-foreground hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Bars3Icon className="w-6 h-6" />
            </button> */}
            <h2 className="text-base md:text-lg font-bold text-yellow-400">{getTitle(pathname)}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[10px] md:text-sm font-bold text-gray-200 bg-primary/10 px-2 md:px-3 py-1 rounded-full border border-primary/20 whitespace-nowrap">
              {roleName || adminT('header.role.checking', locale)}
            </span>
            <LanguageSwitcher className="hidden sm:flex" />
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/admin/login');
                router.refresh();
              }}
              className="p-2 md:p-2.5 text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all border border-red-500/20"
              title={adminT('sidebar.logout', locale)}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6 pb-24 md:pb-6 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-bold text-primary">{adminT('header.loading', locale)}</p>
              </div>
            </div>
          )}
          {!isLoading && children}
        </main>

        <AdminBottomNav />
      </div>
    </div>
  );
}
