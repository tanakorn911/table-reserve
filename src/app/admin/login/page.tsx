'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import LanguageSwitcher, { useAdminLocale, adminT } from '../components/LanguageSwitcher';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const locale = useAdminLocale();

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

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNEREFGMzciIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDEzNGg1MHYxSAzNnptMC0zMGg1MHYxSDM2em0wLTMwaDUwdjFIMzZ6bTAtMzBoNTB2MUgzNnptMC0zMGg1MHYxSDM2em0wLTMwaDUwdjFIMzZ6TTYgMjRoNTB2MUg2em0wLTMwaDUwdjFINnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

      {/* Language switcher - top right */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm transition-all duration-300">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-primary font-bold animate-pulse">{adminT('login.loading', locale)}</p>
        </div>
      )}

      <div className="relative w-full max-w-md p-8 space-y-8 bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-primary/20">
        <div className="relative">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-yellow-400 tracking-tight drop-shadow-lg">
              {adminT('login.title', locale)}
            </h1>
            <p className="text-sm text-gray-300 font-medium">
              {adminT('login.subtitle', locale)}
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            {error && (
              <div className="p-4 text-sm text-error bg-error/10 border-l-4 border-error rounded-lg animate-in fade-in duration-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-200 mb-2">
                  {adminT('login.email', locale)}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-white bg-slate-800/90 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-gray-500 font-medium disabled:bg-muted/20 disabled:text-gray-400 transition-all"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-200 mb-2">
                  {adminT('login.password', locale)}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 text-white bg-slate-800/90 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-gray-500 font-medium disabled:bg-muted/20 disabled:text-gray-400 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full px-4 py-3 text-base font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-lg shadow-primary/20 overflow-hidden ${loading ? 'opacity-50 cursor-wait' : 'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]'
                }`}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer rounded-xl"></div>

              <span className="relative flex items-center justify-center gap-2">
                {loading && (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                )}
                {loading ? adminT('login.processing', locale) : adminT('login.submit', locale)}
              </span>
            </button>

            <div className="text-center text-xs text-muted-foreground mt-4">
              {adminT('login.footer', locale)}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
