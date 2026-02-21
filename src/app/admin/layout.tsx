'use client'; // ใช้ Client Component เพื่อให้สามารถใช้ Hooks (useState, useEffect) และ Context ได้

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from './components/AdminSidebar';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { ArrowRightOnRectangleIcon, Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher, { useAdminLocale, adminT } from './components/LanguageSwitcher';
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext';
import AdminThemeToggle from './components/AdminThemeToggle';

// Inner Component เพื่อใช้ Context ของ AdminTheme ได้ (เพราะต้องอยู่ภายใต้ AdminThemeProvider)
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [roleName, setRoleName] = useState(''); // ชื่อ Role ของผู้ใช้ปัจจุบัน
  const [userName, setUserName] = useState(''); // ชื่อผู้ใช้ปัจจุบัน
  const [isLoading, setIsLoading] = useState(true); // สถานะการโหลดข้อมูล User
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // สถานะเปิด/ปิด Sidebar (Mobile)
  const locale = useAdminLocale(); // ภาษาที่เลือกใช้ใน Admin
  const { resolvedAdminTheme } = useAdminTheme(); // Theme ปัจจุบัน (light/dark)

  // NOTE: เอา Auto-logout เมื่อปิด Tab ออก เพราะทำให้เกิดปัญหาเมื่อ Refresh หน้า
  // การจัดการ Session จะปล่อยให้เป็นหน้าที่ของ Supabase (Token Expiry)

  // Effect: ตรวจสอบสิทธิ์และการเข้าถึง (Role-based Access Control)
  useEffect(() => {
    const fetchRole = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // ดึงข้อมูล Role จากตาราง profiles หรือ user_metadata
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name, email')
            .eq('id', user.id)
            .single();

          // ตั้งค่าชื่อผู้ใช้ (ใช้ full_name, ถ้าไม่มีให้ใช้ email)
          setUserName(profile?.full_name || profile?.email || user.email || '');

          const currentRole = profile?.role || user.user_metadata?.role;

          // หน้าที่อนุญาตเฉพาะ Admin เท่านั้น (Staff เข้าไม่ได้)
          const adminOnlyPages = ['/admin/floor-plan', '/admin/settings'];

          // ถ้าเป็น Staff และพยายามเข้าหน้าที่ห้าม -> ดีดกลับไป Dashboard
          if (currentRole === 'staff' && adminOnlyPages.some((page) => pathname.startsWith(page))) {
            router.push('/admin/dashboard');
            return;
          }

          // ตั้งค่าชื่อ Role สำหรับแสดงผล
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

  // ถ้าเป็นหน้า Login ไม่ต้องแสดง Layout ของ Admin (Sidebar/Header)
  const isLoginPage = pathname === '/admin/login';
  if (isLoginPage) {
    return <main className="min-h-screen bg-gray-900">{children}</main>;
  }


  // กำหนด Class CSS ตาม Theme ที่เลือก (Light/Dark)
  const themeClasses = resolvedAdminTheme === 'dark'
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
      {/* Sidebar: เมนูด้านซ้าย (ซ่อนใน Mobile Application) */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'md:pl-0'}`}>
        {/* Header: แถบด้านบน */}
        <header className={`flex items-center justify-between px-4 md:px-6 h-16 backdrop-blur-sm border-b ${themeClasses.header}`}>
          <div className="flex items-center gap-2 md:gap-4">
            {/* ปุ่ม Hamburger ด้านซ้าย */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg transition-all border ${resolvedAdminTheme === 'dark'
                ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/20'
                : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200'
                }`}
              title={isSidebarOpen ? "ปิดเมนู" : "เปิดเมนู"}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>

          {/* ขวา: Role, Theme, Language, Logout */}
          <div className="flex items-center gap-3">
            {/* ชื่อผู้ใช้ + Role Tag (แสดงเฉพาะ Desktop) */}
            <div className={`hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all ${resolvedAdminTheme === 'dark'
                ? 'bg-gray-700/50 border-gray-600/50'
                : 'bg-gray-50 border-gray-200'
              }`}>
              <UserCircleIcon className={`w-8 h-8 flex-shrink-0 ${resolvedAdminTheme === 'dark' ? 'text-yellow-400/80' : 'text-amber-500/80'
                }`} />
              <div className="flex flex-col leading-tight">
                {userName && (
                  <span className={`text-sm font-semibold whitespace-nowrap ${resolvedAdminTheme === 'dark' ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                    {userName}
                  </span>
                )}
                <span className={`text-[11px] font-medium whitespace-nowrap ${resolvedAdminTheme === 'dark' ? 'text-yellow-400/70' : 'text-amber-600/70'
                  }`}>
                  {roleName || adminT('header.role.checking', locale)}
                </span>
              </div>
            </div>

            {/* Theme & Language Toggle */}
            <AdminThemeToggle size="sm" />
            <LanguageSwitcher />

            {/* ปุ่ม Logout (แสดงเฉพาะ Mobile ตรงนี้ Desktop อยู่ใน Sidebar) */}
            <button
              onClick={async () => {
                if (window.confirm(adminT('logout.confirm', locale))) {
                  await supabase.auth.signOut();
                  router.push('/admin/login');
                  router.refresh();
                }
              }}
              className={`md:hidden p-2 rounded-lg transition-all border ${resolvedAdminTheme === 'dark'
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20'
                : 'bg-red-50 text-red-500 hover:bg-red-100 border-red-200'
                }`}
              title={adminT('sidebar.logout', locale)}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content: พื้นที่แสดงเนื้อหาหลัก */}
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${themeClasses.main} p-4 md:p-6 pb-6 relative`}>
          {/* Loading Overlay */}
          {isLoading && (
            <div className={`absolute inset-0 ${themeClasses.loading} backdrop-blur-sm z-50 flex items-center justify-center`}>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-bold text-yellow-500">{adminT('header.loading', locale)}</p>
              </div>
            </div>
          )}

          {/* เนื้อหา Page */}
          {!isLoading && children}
        </main>
      </div>
    </div>
  );
}

// Wrapper Component หลักสำหรับ Admin Layout
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // ครอบด้วย AdminThemeProvider เพื่อให้ Theme Context ใช้งานได้ทั่วถึง
    <AdminThemeProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminThemeProvider>
  );
}
