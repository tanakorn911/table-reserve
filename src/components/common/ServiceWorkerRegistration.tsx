'use client'; // ทำงานฝั่ง Client Component

import { useEffect } from 'react';

/**
 * Service Worker Registration Component
 * ทำหน้าที่ลงทะเบียน Service Worker เมื่อโหลดหน้าเว็บเสร็จ
 * เพื่อรองรับฟีเจอร์ Progressive Web App (PWA) เช่น Offline mode, Install app
 */
export default function ServiceWorkerRegistration() {
    useEffect(() => {
        // ตรวจสอบว่า Browser รองรับ Service Worker หรือไม่
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // ลงทะเบียน Service Worker เมื่อโหลดหน้าเสร็จ (Load Event)
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js') // ไฟล์ Service Worker หลัก
                    .then((registration) => {
                        console.log('SW registered: ', registration);
                    })
                    .catch((error) => {
                        console.log('SW registration failed: ', error);
                    });
            });
        }
    }, []);

    // Component นี้ไม่มี UI
    return null;
}
