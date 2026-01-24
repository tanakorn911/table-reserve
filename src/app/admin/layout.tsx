'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from './components/AdminSidebar';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [roleName, setRoleName] = useState('กำลังตรวจสอบ...');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

          const adminOnlyPages = ['/admin/tables', '/admin/settings'];
          if (currentRole === 'staff' && adminOnlyPages.some((page) => pathname.startsWith(page))) {
            router.push('/admin/dashboard');
            return;
          }

          if (currentRole === 'staff') {
            setRoleName('พนักงาน (Staff)');
          } else if (currentRole === 'admin') {
            setRoleName('ผู้ดูแลระบบ (Admin)');
          } else {
            setRoleName('ยังไม่ระบุสิทธิ์');
          }
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        setRoleName('เกิดข้อผิดพลาด');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRole();
  }, [supabase, pathname, router]);

  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <main className="min-h-screen bg-gray-50">{children}</main>;
  }

  const getTitle = (path: string) => {
    const segments = path.split('/');
    const lastSegment = segments[segments.length - 1];

    switch (lastSegment) {
      case 'dashboard':
        return 'ภาพรวม (Dashboard)';
      case 'reservations':
        return 'รายการจอง';
      case 'tables':
        return 'จัดการข้อมูลโต๊ะ';
      case 'settings':
        return 'ตั้งค่าระบบ';
      case 'floor-plan':
        return 'จัดการผังร้าน';
      default:
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 mr-4 md:hidden text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <h2 className="text-base md:text-lg font-bold text-gray-800">{getTitle(pathname)}</h2>
          </div>
          <div className="flex items-center">
            <span className="text-[10px] md:text-sm font-bold text-gray-500 bg-gray-100 px-2 md:px-3 py-1 rounded-full border border-gray-200 whitespace-nowrap">
              {roleName}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-50 bg-opacity-80 z-50 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-bold text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
              </div>
            </div>
          )}
          {!isLoading && children}
        </main>
      </div>
    </div>
  );
}
