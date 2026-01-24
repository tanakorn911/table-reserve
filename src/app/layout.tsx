import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/index.css';
import { NavigationProvider } from '@/contexts/NavigationContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'TableReserve - ระบบจองโต๊ะร้านอาหารออนไลน์',
  description: 'จองโต๊ะร้านอาหารง่ายๆ สะดวก รวดเร็ว พร้อมแผนที่ 3D และระบบแจ้งเตือนผ่าน LINE',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
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
