'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type AdminTheme = 'light' | 'dark';

interface AdminThemeContextType {
    adminTheme: AdminTheme;
    setAdminTheme: (theme: AdminTheme) => void;
    toggleAdminTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'savory_bistro_admin_theme';

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
    const [adminTheme, setAdminThemeState] = useState<AdminTheme>('dark');
    const [mounted, setMounted] = useState(false);

    // Initialize theme from storage
    useEffect(() => {
        const stored = localStorage.getItem(ADMIN_STORAGE_KEY) as AdminTheme | null;
        const initial = stored || 'dark';
        setAdminThemeState(initial);
        setMounted(true);
    }, []);

    // Set theme
    const setAdminTheme = useCallback((newTheme: AdminTheme) => {
        setAdminThemeState(newTheme);
        localStorage.setItem(ADMIN_STORAGE_KEY, newTheme);
    }, []);

    // Toggle between light and dark
    const toggleAdminTheme = useCallback(() => {
        const newTheme = adminTheme === 'dark' ? 'light' : 'dark';
        setAdminTheme(newTheme);
    }, [adminTheme, setAdminTheme]);

    // Prevent flash of unstyled content
    if (!mounted) {
        return null;
    }

    return (
        <AdminThemeContext.Provider value={{ adminTheme, setAdminTheme, toggleAdminTheme }}>
            {children}
        </AdminThemeContext.Provider>
    );
}

export function useAdminTheme() {
    const context = useContext(AdminThemeContext);
    if (context === undefined) {
        throw new Error('useAdminTheme must be used within an AdminThemeProvider');
    }
    return context;
}
