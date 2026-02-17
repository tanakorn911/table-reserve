'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import LanguageSwitcher, { useAdminLocale, adminT } from '../components/LanguageSwitcher';

// Login page has its own theme state since it's outside the AdminThemeProvider
// หน้า Login มี state ของ theme แยกต่างหาก เนื่องจากอยู่นอก AdminThemeProvider
type LoginTheme = 'light' | 'dark' | 'system';

export default function AdminLoginPage() {
  // State สำหรับเก็บข้อมูลการเข้าสู่ระบบ
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<LoginTheme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const locale = useAdminLocale();
  const [isMobile, setIsMobile] = useState(false);

  // ตรวจสอบขนาดหน้าจอเพื่อปรับไอคอน System
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize theme from storage
  // ดึงค่า theme ที่บันทึกไว้ใน localStorage มาใช้งาน
  useEffect(() => {
    const stored = localStorage.getItem('savory_bistro_admin_theme') as LoginTheme | null;
    if (stored) setTheme(stored);
  }, []);

  // Resolve system theme
  // ตรวจสอบ theme ของระบบ (system preference)
  useEffect(() => {
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  // เปลี่ยน Theme
  const changeTheme = (newTheme: LoginTheme) => {
    setTheme(newTheme);
    localStorage.setItem('savory_bistro_admin_theme', newTheme);
  };

  // ฟังก์ชันจัดการการเข้าสู่ระบบ
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // เรียกใช้ Supabase Auth เพื่อตรวจสอบอีเมลและรหัสผ่าน
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // แสดงข้อความผิดพลาดถ้า Login ไม่สำเร็จ
        setError(adminT('login.error.invalid', locale));
        setLoading(false);
      } else {
        // success - keep loading true while redirecting
        // Login สำเร็จ ให้คงสถานะ loading ไว้ระหว่างเปลี่ยนหน้าไปยัง Dashboard
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError(adminT('login.error.unexpected', locale));
      console.error(err);
      setLoading(false);
    }
  };

  // Theme-aware colors — clean & premium
  // กำหนดสีต่างๆ ตาม Theme ที่เลือก (ปรับให้ดูหรูและคลีนขึ้น)
  const themeColors = resolvedTheme === 'dark' ? {
    bg: 'from-[#0f1115] via-[#141820] to-[#0f1115]',
    card: 'bg-[#1a1e27]/90 border-yellow-500/10 shadow-2xl shadow-black/40',
    logoGlow: 'shadow-[0_0_40px_rgba(234,179,8,0.15)]',
    title: 'text-yellow-400',
    subtitle: 'text-gray-400',
    label: 'text-gray-300',
    input: 'text-white bg-white/5 border-white/10 focus:ring-yellow-500/40 focus:border-yellow-500/50 placeholder-gray-600',
    divider: 'border-white/5',
    footer: 'text-gray-600',
    loading: 'bg-[#0f1115]/95',
    loadingSpinner: 'border-yellow-500/20 border-t-yellow-500',
    loadingText: 'text-yellow-500',
    toggleBtn: 'bg-white/5 hover:bg-white/10 border-white/10 text-yellow-400',
    button: 'text-[#0f1115] bg-yellow-500 hover:bg-yellow-400 focus:ring-yellow-500 shadow-yellow-500/15',
  } : {
    bg: 'from-amber-50 via-orange-50 to-amber-100',
    card: 'bg-white/90 border-amber-200 shadow-2xl shadow-amber-200/30',
    logoGlow: 'shadow-[0_0_40px_rgba(180,83,9,0.1)]',
    title: 'text-amber-700',
    subtitle: 'text-gray-600',
    label: 'text-gray-700',
    input: 'text-gray-900 bg-gray-50 border-amber-200 focus:ring-amber-500/50 focus:border-amber-500 placeholder-gray-400',
    divider: 'border-amber-100',
    footer: 'text-gray-500',
    loading: 'bg-white/90',
    loadingSpinner: 'border-amber-500/30 border-t-amber-500',
    loadingText: 'text-amber-600',
    toggleBtn: 'bg-gray-200 hover:bg-gray-300 border-gray-300 text-amber-600',
    button: 'text-white bg-amber-700 hover:bg-amber-800 focus:ring-amber-700 shadow-amber-700/20',
  };

  return (
    <div className={`relative flex items-center justify-center min-h-screen bg-gradient-to-br ${themeColors.bg}`}>

      {/* Top right controls */}
      {/* ปุ่มควบคุมมุมขวาบน (Theme Toggle และ Language Switcher) */}
      <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
        {/* Theme Toggle - 3 modes: Light / System / Dark */}
        <div className={`inline-flex items-center rounded-full p-1 gap-1 backdrop-blur-sm border ${resolvedTheme === 'dark'
          ? 'bg-white/5 border-white/10'
          : 'bg-gray-100 border-gray-200'
          }`}>
          {[
            {
              key: 'light' as const, label: 'Light', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ), activeColor: 'text-amber-700'
            },
            {
              key: 'system' as const, label: 'System', icon: isMobile ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              ), activeColor: 'text-blue-500'
            },
            {
              key: 'dark' as const, label: 'Dark', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ), activeColor: resolvedTheme === 'dark' ? 'text-yellow-400' : 'text-slate-600'
            },
          ].map((mode) => (
            <motion.button
              key={mode.key}
              onClick={() => changeTheme(mode.key)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 relative ${theme === mode.key
                ? mode.activeColor
                : resolvedTheme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={mode.label}
            >
              {theme === mode.key && (
                <motion.div
                  layoutId="loginActiveTheme"
                  className={`absolute inset-0 rounded-full -z-10 ${resolvedTheme === 'dark' ? 'bg-white/10' : 'bg-white shadow-sm'
                    }`}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              {mode.icon}
            </motion.button>
          ))}
        </div>
        <LanguageSwitcher />
      </div>

      {/* Loading Overlay */}
      {/* หน้าจอ Loading ระหว่างรอการ Login */}
      {loading && (
        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${themeColors.loading} backdrop-blur-sm transition-all duration-300`}>
          <div className={`w-10 h-10 border-[3px] ${themeColors.loadingSpinner} rounded-full animate-spin mb-4`}></div>
          <p className={`${themeColors.loadingText} text-sm font-medium animate-pulse`}>{adminT('login.loading', locale)}</p>
        </div>
      )}

      {/* Login Card */}
      {/* การ์ด Login — ดีไซน์คลีนและพรีเมียม */}
      <div className={`relative w-full max-w-sm mx-4 p-8 backdrop-blur-xl rounded-2xl border ${themeColors.card}`}>

        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className={`w-20 h-20 rounded-2xl overflow-hidden mb-5 ${themeColors.logoGlow}`}>
            <Image
              src="/logo.png"
              alt="Logo"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <h1 className={`text-2xl font-bold tracking-tight ${themeColors.title}`}>
            {adminT('login.title', locale)}
          </h1>
          <p className={`text-xs mt-1 ${themeColors.subtitle}`}>
            {adminT('login.subtitle', locale)}
          </p>
        </div>

        {/* Divider */}
        <div className={`border-t mb-6 ${themeColors.divider}`} />

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-xs font-semibold mb-1.5 uppercase tracking-wider ${themeColors.label}`}>
                {adminT('login.email', locale)}
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-medium disabled:opacity-50 transition-all ${themeColors.input}`}
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-xs font-semibold mb-1.5 uppercase tracking-wider ${themeColors.label}`}>
                {adminT('login.password', locale)}
              </label>
              <input
                id="password"
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-medium disabled:opacity-50 transition-all ${themeColors.input}`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`group relative w-full px-4 py-2.5 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-lg overflow-hidden
              ${themeColors.button}
              ${loading ? 'opacity-50 cursor-wait' : 'hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]'}
            `}
          >
            <span className="relative flex items-center justify-center gap-2">
              {loading && (
                <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              )}
              {loading ? adminT('login.processing', locale) : adminT('login.submit', locale)}
            </span>
          </button>

          <p className={`text-center text-[11px] mt-3 ${themeColors.footer}`}>
            {adminT('login.footer', locale)}
          </p>
        </form>
      </div>
    </div>
  );
}
