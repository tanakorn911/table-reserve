import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/index.css';
import { NavigationProvider } from '@/contexts/NavigationContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'TableReserve',
  description: 'Premium Online Table Reservation System',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <NavigationProvider>{children}</NavigationProvider>
      </body>
    </html>
  );
}
