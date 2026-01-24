'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
  currentRoute: string;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isStaffUser: boolean;
  setIsStaffUser: (isStaff: boolean) => void;
  locale: 'th' | 'en';
  setLocale: (locale: 'th' | 'en') => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStaffUser, setIsStaffUser] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(pathname);
  const [locale, setLocale] = useState<'th' | 'en'>('th');

  useEffect(() => {
    setCurrentRoute(pathname);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <NavigationContext.Provider
      value={{
        currentRoute,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isStaffUser,
        setIsStaffUser,
        locale,
        setLocale,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
