'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        setLoading(false);
      } else {
        // success - keep loading true while redirecting
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-blue-900 font-bold animate-pulse">กำลังเข้าสู่ระบบ...</p>
        </div>
      )}

      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">จองโต๊ะออนไลน์</h1>
          <p className="mt-2 text-sm text-gray-600 font-medium">เข้าสู่ระบบจัดการจองโต๊ะออนไลน์</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-sm animate-in fade-in duration-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 font-medium disabled:bg-gray-50 disabled:text-gray-400 transition-all"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">
                รหัสผ่าน
              </label>
              <input
                id="password"
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 font-medium disabled:bg-gray-50 disabled:text-gray-400 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`group relative w-full px-4 py-3 text-base font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm ${
              loading ? 'opacity-50 cursor-wait' : 'hover:-translate-y-0.5 active:scale-[0.98]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
            </span>
          </button>

          <div className="text-center text-xs text-gray-500 mt-4">
            ระบบจัดการร้านอาหาร BookingX Admin Panel
          </div>
        </form>
      </div>
    </div>
  );
}
