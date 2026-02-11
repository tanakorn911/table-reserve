'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import LanguageSwitcher, { useAdminLocale, adminT } from '../components/LanguageSwitcher';

// Login page has its own theme state since it's outside the AdminThemeProvider
type LoginTheme = 'light' | 'dark';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<LoginTheme>('dark');
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const locale = useAdminLocale();

  // Initialize theme from storage
  useEffect(() => {
    const stored = localStorage.getItem('savory_bistro_admin_theme') as LoginTheme | null;
    if (stored) setTheme(stored);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('savory_bistro_admin_theme', newTheme);
  };

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
        setError(adminT('login.error.invalid', locale));
        setLoading(false);
      } else {
        // success - keep loading true while redirecting
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError(adminT('login.error.unexpected', locale));
      console.error(err);
      setLoading(false);
    }
  };

  // Theme-aware colors
  const themeColors = theme === 'dark' ? {
    bg: 'bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-800',
    card: 'bg-gray-800/80 border-yellow-500/20',
    title: 'text-yellow-400',
    subtitle: 'text-gray-300',
    label: 'text-gray-200',
    input: 'text-white bg-slate-800/90 border-yellow-500/20 focus:ring-yellow-500/50 focus:border-yellow-500 placeholder-gray-500',
    footer: 'text-gray-500',
    loading: 'bg-gray-900/90',
    loadingSpinner: 'border-yellow-500/30 border-t-yellow-500',
    loadingText: 'text-yellow-500',
    toggleBtn: 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-yellow-400',
  } : {
    bg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100',
    card: 'bg-white/90 border-amber-200',
    title: 'text-amber-700',
    subtitle: 'text-gray-600',
    label: 'text-gray-700',
    input: 'text-gray-900 bg-gray-50 border-amber-200 focus:ring-amber-500/50 focus:border-amber-500 placeholder-gray-400',
    footer: 'text-gray-500',
    loading: 'bg-white/90',
    loadingSpinner: 'border-amber-500/30 border-t-amber-500',
    loadingText: 'text-amber-600',
    toggleBtn: 'bg-gray-200 hover:bg-gray-300 border-gray-300 text-amber-600',
  };

  return (
    <div className={`relative flex items-center justify-center min-h-screen ${themeColors.bg}`}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNEREFGMzciIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDEzNGg1MHYxSAzNnptMC0zMGg1MHYxSDM2em0wLTMwaDUwdjFIMzZ6bTAtMzBoNTB2MUgzNnptMC0zMGg1MHYxSDM2em0wLTMwaDUwdjFIMzZ6TTYgMjRoNTB2MUg2em0wLTMwaDUwdjFINnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

      {/* Top right controls */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${themeColors.toggleBtn}`}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            // Moon icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            // Sun icon  
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
        <LanguageSwitcher />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${themeColors.loading} backdrop-blur-sm transition-all duration-300`}>
          <div className={`w-12 h-12 border-4 ${themeColors.loadingSpinner} rounded-full animate-spin mb-4`}></div>
          <p className={`${themeColors.loadingText} font-bold animate-pulse`}>{adminT('login.loading', locale)}</p>
        </div>
      )}

      <div className={`relative w-full max-w-md p-8 space-y-8 backdrop-blur-sm rounded-2xl shadow-2xl border ${themeColors.card}`}>
        <div className="relative">
          <div className="text-center space-y-2">
            <h1 className={`text-3xl font-extrabold tracking-tight drop-shadow-lg ${themeColors.title}`}>
              {adminT('login.title', locale)}
            </h1>
            <p className={`text-sm font-medium ${themeColors.subtitle}`}>
              {adminT('login.subtitle', locale)}
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-500 bg-red-500/10 border-l-4 border-red-500 rounded-lg animate-in fade-in duration-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className={`block text-sm font-bold mb-2 ${themeColors.label}`}>
                  {adminT('login.email', locale)}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 font-medium disabled:opacity-50 transition-all ${themeColors.input}`}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className={`block text-sm font-bold mb-2 ${themeColors.label}`}>
                  {adminT('login.password', locale)}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 font-medium disabled:opacity-50 transition-all ${themeColors.input}`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full px-4 py-3 text-base font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-lg overflow-hidden
                ${theme === 'dark'
                  ? 'text-gray-900 bg-yellow-500 hover:bg-yellow-400 focus:ring-yellow-500 shadow-yellow-500/20'
                  : 'text-white bg-amber-700 hover:bg-amber-800 focus:ring-amber-700 shadow-amber-700/20'
                }
                ${loading ? 'opacity-50 cursor-wait' : 'hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]'}
              `}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer rounded-xl"></div>

              <span className="relative flex items-center justify-center gap-2">
                {loading && (
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                )}
                {loading ? adminT('login.processing', locale) : adminT('login.submit', locale)}
              </span>
            </button>

            <div className={`text-center text-xs mt-4 ${themeColors.footer}`}>
              {adminT('login.footer', locale)}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
