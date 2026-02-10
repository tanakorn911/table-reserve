'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from './components/AdminSidebar';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher, { useAdminLocale, adminT } from './components/LanguageSwitcher';
import AdminBottomNav from './components/AdminBottomNav';
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext';
import AdminThemeToggle from './components/AdminThemeToggle';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [roleName, setRoleName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const locale = useAdminLocale();
  const { adminTheme } = useAdminTheme();

  // Auto-logout on tab close removed - was causing issues with page refresh
  // Users will remain logged in and session will expire based on Supabase settings

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
    return <main className="min-h-screen bg-gray-900">{children}</main>;
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

  // Theme classes based on admin theme
  const themeClasses = adminTheme === 'dark'
    ? {
      container: 'bg-gray-900',
      header: 'bg-gray-800/50 border-yellow-500/20',
      title: 'text-yellow-400',
      roleTag: 'text-gray-200 bg-yellow-500/10 border-yellow-500/20',
      main: 'bg-gray-900',
      loading: 'bg-gray-900/90',
    }
    : {
      container: 'bg-gray-100',
      header: 'bg-white/80 border-amber-500/20 shadow-sm',
      title: 'text-amber-600',
      roleTag: 'text-gray-700 bg-amber-100 border-amber-200',
      main: 'bg-gray-50',
      loading: 'bg-white/90',
    };

  return (
    <div className={`flex h-screen overflow-hidden ${themeClasses.container}`}>
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className={`flex items-center justify-between px-4 md:px-6 h-16 backdrop-blur-sm border-b ${themeClasses.header}`}>
          <div className="flex items-center gap-4">
            <h2 className={`text-base md:text-lg font-bold ${themeClasses.title}`}>{getTitle(pathname)}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`hidden sm:inline-block text-[10px] md:text-sm font-bold px-2 md:px-3 py-1 rounded-full border whitespace-nowrap ${themeClasses.roleTag}`}>
              {roleName || adminT('header.role.checking', locale)}
            </span>
            <AdminThemeToggle size="sm" />
            <LanguageSwitcher />
            <button
              onClick={async () => {
                if (window.confirm(adminT('logout.confirm', locale))) {
                  await supabase.auth.signOut();
                  router.push('/admin/login');
                  router.refresh();
                }
              }}
              className={`md:hidden p-2 rounded-lg transition-all border ${adminTheme === 'dark'
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20'
                : 'bg-red-50 text-red-500 hover:bg-red-100 border-red-200'
                }`}
              title={adminT('sidebar.logout', locale)}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${themeClasses.main} p-4 md:p-6 pb-24 md:pb-6 relative`}>
          {isLoading && (
            <div className={`absolute inset-0 ${themeClasses.loading} backdrop-blur-sm z-50 flex items-center justify-center`}>
              <div className="flex flex-col items-center">
                {/* Loading spinner - fixed colors that don't change with theme */}
                <div className="w-10 h-10 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-bold text-yellow-500">{adminT('header.loading', locale)}</p>
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminThemeProvider>
  );
}
