import React from 'react';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Thai } from 'next/font/google';
import '../styles/index.css';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ChatWidget from '@/components/common/ChatWidget';
import ServiceWorkerRegistration from '@/components/common/ServiceWorkerRegistration';

const ibmPlexThai = IBM_Plex_Sans_Thai({
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  variable: '--font-ibm-plex-thai',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#1a202c' },
  ],
};

// Metadata ของเว็บไซต์ (SEO)
export const metadata: Metadata = {
  title: 'Savory Bistro',
  description: 'Savory Bistro - Premium Online Table Reservation System',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Savory Bistro',
  },
};

// RootLayout: Layout หลักของทั้งเว็บไซต์
// ครอบคลุมทุกหน้าใน Application
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`dark ${ibmPlexThai.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <NavigationProvider>
            {children}
            {/* Widget แชทไลน์และช่องทางอื่นๆ */}
            <ChatWidget
              lineOAUrl="https://line.me/R/ti/p/@147zaegh" />
            {/* ลงทะเบียน Service Worker สำหรับ PWA */}
            <ServiceWorkerRegistration />
          </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
