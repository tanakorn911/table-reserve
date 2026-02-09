import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/index.css';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ChatWidget from '@/components/common/ChatWidget';
import ServiceWorkerRegistration from '@/components/common/ServiceWorkerRegistration';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#1a202c' },
  ],
};

export const metadata: Metadata = {
  title: 'Savory Bistro',
  description: 'Premium Online Table Reservation System',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <NavigationProvider>
            {children}
            <ChatWidget
              lineOAUrl="https://line.me/R/ti/p/@147zaegh" />
            <ServiceWorkerRegistration />
          </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
