'use client'; // ใช้ Client Component

import React, { useState, useEffect } from 'react';
import { LanguageIcon } from '@heroicons/react/24/outline';

import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

type Locale = 'th' | 'en'; // กำหนด Type ภาษา (ไทย/อังกฤษ)

interface LanguageSwitcherProps {
    className?: string;
}

/**
 * LanguageSwitcher Component
 * 
 * ปุ่มสลับภาษา (TH/EN) เฉพาะส่วนของ Admin Panel
 * เก็บค่าภาษาลงใน localStorage แยกกับหน้าบ้าน (Frontend)
 */
export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
    const [locale, setLocale] = useState<Locale>('th');
    const { resolvedAdminTheme } = useAdminTheme();

    // โหลดภาษาที่บันทึกไว้เมื่อ Component Mount
    useEffect(() => {
        const savedLocale = localStorage.getItem('admin-locale') as Locale;
        if (savedLocale && (savedLocale === 'th' || savedLocale === 'en')) {
            setLocale(savedLocale);
        }
    }, []);

    // ฟังก์ชันสลับภาษา และบันทึกลง localStorage
    const toggleLanguage = () => {
        const newLocale: Locale = locale === 'th' ? 'en' : 'th';
        setLocale(newLocale);
        localStorage.setItem('admin-locale', newLocale);
        // Dispatch Custom Event เพื่อแจ้งให้ Component อื่นๆ ทราบว่ามีการเปลี่ยนภาษา
        window.dispatchEvent(new CustomEvent('locale-change', { detail: newLocale }));
    };

    return (
        <button
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-all border ${resolvedAdminTheme === 'dark'
                ? 'bg-primary/10 text-yellow-400 hover:bg-primary/20 border-primary/20'
                : 'bg-gray-100 text-slate-700 hover:bg-gray-200 border-gray-200'
                } ${className}`}
            title={locale === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
        >
            <LanguageIcon className="w-5 h-5" />
            <span className="uppercase tracking-wider">{locale}</span>
        </button>
    );
}

// Hook: สำหรับดึงค่า Locale ปัจจุบันไปใช้ใน Component อื่น
export function useAdminLocale() {
    const [locale, setLocale] = useState<Locale>('th');

    useEffect(() => {
        // Load initial locale
        const savedLocale = localStorage.getItem('admin-locale') as Locale;
        if (savedLocale && (savedLocale === 'th' || savedLocale === 'en')) {
            setLocale(savedLocale);
        }

        // Event Listener: รอรับ event 'locale-change'
        const handleLocaleChange = (e: CustomEvent<Locale>) => {
            setLocale(e.detail);
        };

        window.addEventListener('locale-change', handleLocaleChange as EventListener);
        return () => {
            window.removeEventListener('locale-change', handleLocaleChange as EventListener);
        };
    }, []);

    return locale;
}

// Helper Function: สำหรับดึงข้อความแปล (Translation) ในส่วน Admin
// ทำงานคล้าย i18next แต่เขียนเองแบบง่ายๆ (Lightweight)
export const adminT = (key: string, locale: Locale): string => {
    const translations: Record<string, Record<Locale, string>> = {
        // Login page
        'login.title': { th: 'ซาโวรี่ บิสโทร', en: 'Savory Bistro' },
        'login.subtitle': { th: 'เข้าสู่ระบบจัดการจองโต๊ะออนไลน์', en: 'Admin Panel Login' },
        'login.email': { th: 'อีเมล', en: 'Email' },
        'login.password': { th: 'รหัสผ่าน', en: 'Password' },
        'login.submit': { th: 'เข้าสู่ระบบ', en: 'Sign In' },
        'login.loading': { th: 'กำลังเข้าสู่ระบบ...', en: 'Signing in...' },
        'login.processing': { th: 'กำลังดำเนินการ...', en: 'Processing...' },
        'login.error.invalid': { th: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', en: 'Invalid email or password' },
        'login.error.unexpected': { th: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่', en: 'Unexpected error occurred. Please try again' },
        'login.footer': { th: 'ระบบจัดการร้านอาหาร BookingX Admin Panel', en: 'BookingX Restaurant Management System' },

        // Sidebar
        'sidebar.dashboard': { th: 'แดชบอร์ด', en: 'Dashboard' },
        'sidebar.reservations': { th: 'รายการจอง', en: 'Reservations' },
        'sidebar.advertisements': { th: 'จัดการโฆษณา', en: 'Advertisements' },
        'sidebar.checkStatus': { th: 'เช็คสถานะจอง', en: 'Check Status' },
        'sidebar.floorPlan': { th: 'จัดการผังร้าน', en: 'Floor Plan' },
        'sidebar.settings': { th: 'ตั้งค่าระบบ', en: 'Settings' },
        'sidebar.logout': { th: 'ออกจากระบบ', en: 'Logout' },
        'logout.confirm': { th: 'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?', en: 'Are you sure you want to log out?' },
        'sidebar.admin': { th: 'Admin', en: 'Admin' },
        'sidebar.staff': { th: 'Staff', en: 'Staff' },

        // Layout/Header
        'header.dashboard': { th: 'ภาพรวม', en: 'Dashboard' },
        'header.reservations': { th: 'รายการจอง', en: 'Reservations' },
        'header.tables': { th: 'จัดการข้อมูลโต๊ะ', en: 'Table Management' },
        'header.settings': { th: 'ตั้งค่าระบบ', en: 'Settings' },
        'header.floorPlan': { th: 'จัดการผังร้าน', en: 'Floor Plan Management' },
        'header.checkStatus': { th: 'เช็คสถานะจอง', en: 'Check Booking Status' },
        'header.loading': { th: 'กำลังตรวจสอบสิทธิ์...', en: 'Checking permissions...' },
        'header.role.admin': { th: 'ผู้ดูแลระบบ', en: 'Administrator' },
        'header.role.staff': { th: 'พนักงาน', en: 'Staff Member' },
        'header.role.checking': { th: 'กำลังตรวจสอบ...', en: 'Checking...' },
        'header.role.undefined': { th: 'ยังไม่ระบุสิทธิ์', en: 'Role Undefined' },
        'header.role.error': { th: 'เกิดข้อผิดพลาด', en: 'Error' },

        // Dashboard
        'dashboard.title': { th: 'ภาพรวมการจองวันนี้', en: 'Today\'s Reservations Overview' },
        'dashboard.subtitle': { th: 'รายการจองวันที่', en: 'Reservations for' },
        'dashboard.stats.pending': { th: 'รอยืนยัน', en: 'Pending' },
        'dashboard.stats.confirmed': { th: 'ยืนยันแล้ว', en: 'Confirmed' },
        'dashboard.stats.cancelled': { th: 'ยกเลิก', en: 'Cancelled' },
        'dashboard.stats.completed': { th: 'เสร็จสิ้น', en: 'Completed' },
        'dashboard.stats.waiting': { th: 'รอคอนเฟิร์ม', en: 'Awaiting Confirmation' },
        'dashboard.stats.guests': { th: 'จำนวนแขก (Pax)', en: 'Total Guests (Pax)' },
        'dashboard.stats.tables': { th: 'โต๊ะที่จอง', en: 'Tables Booked' },
        'dashboard.peak.title': { th: 'ช่วงเวลาที่คึกคักที่สุดวันนี้ (Peak Hours)', en: 'Peak Hours Today' },
        'dashboard.tableStatus.title': { th: 'สถานะโต๊ะในร้าน', en: 'Table Status' },
        'dashboard.tableStatus.available': { th: 'ว่าง (Available)', en: 'Available' },
        'dashboard.tableStatus.booked': { th: 'จองแล้ว (Booked)', en: 'Booked' },
        'dashboard.forecast.title': { th: 'คำแนะนำ', en: 'Recommendations' },
        'dashboard.today': { th: 'วันนี้', en: 'Today' },
        'dashboard.tomorrow': { th: 'พรุ่งนี้', en: 'Tomorrow' },

        // Reservations Page
        'reservations.title': { th: 'รายการจองทั้งหมด', en: 'All Reservations' },
        'reservations.exportCSV': { th: 'Export CSV', en: 'Export CSV' },
        'reservations.create': { th: 'สร้างการจอง', en: 'Create Booking' },
        'reservations.search': { th: 'ค้นหาชื่อ หรือ เบอร์โทร...', en: 'Search name or phone...' },
        'reservations.filter.all': { th: 'สถานะทั้งหมด', en: 'All Status' },
        'reservations.filter.pending': { th: 'รอยืนยัน', en: 'Pending' },
        'reservations.filter.confirmed': { th: 'ยืนยันแล้ว', en: 'Confirmed' },
        'reservations.filter.cancelled': { th: 'ยกเลิก', en: 'Cancelled' },
        'reservations.filter.completed': { th: 'เสร็จสิ้น', en: 'Completed' },
        'reservations.table.datetime': { th: 'วัน-เวลา', en: 'Date & Time' },
        'reservations.table.guest': { th: 'ลูกค้า', en: 'Guest' },
        'reservations.table.table': { th: 'โต๊ะ', en: 'Table' },
        'reservations.table.notes': { th: 'หมายเหตุ (Staff)', en: 'Notes (Staff)' },
        'reservations.table.status': { th: 'สถานะ', en: 'Status' },
        'reservations.table.slip': { th: 'สลิป', en: 'Slip' },
        'reservations.table.actions': { th: 'จัดการ', en: 'Actions' },
        'reservations.actions.print': { th: 'พิมพ์ใบยืนยัน', en: 'Print Confirmation' },
        'reservations.actions.edit': { th: 'แก้ไขข้อมูล', en: 'Edit Details' },
        'reservations.actions.approve': { th: 'อนุมัติ', en: 'Approve' },
        'reservations.actions.complete': { th: 'เสร็จสิ้น', en: 'Complete' },
        'reservations.actions.cancel': { th: 'ยกเลิก', en: 'Cancel' },
        'reservations.actions.delete': { th: 'ลบถาวร', en: 'Delete Permanently' },
        'reservations.loading': { th: 'กำลังโหลดข้อมูล...', en: 'Loading data...' },
        'reservations.noData': { th: 'ไม่พบข้อมูลการจอง', en: 'No reservations found' },
        'reservations.viewSlip': { th: 'ดูสลิป', en: 'View Slip' },
        'reservations.noSlip': { th: 'ไม่มีสลิป', en: 'No Slip' },
        'reservations.guests': { th: 'ท่าน', en: 'guests' },
        'reservations.timeAt': { th: 'เวลา', en: 'Time' },

        // Floor Plan
        'floorplan.title': { th: 'จัดการผังร้าน', en: 'Floor Plan Management' },
        'floorplan.description': { th: 'ออกแบบและจัดการตำแหน่งโต๊ะในผังร้าน', en: 'Design and manage table positions in floor plan' },
        'floorplan.addTable': { th: 'เพิ่มโต๊ะใหม่', en: 'Add New Table' },
        'floorplan.zones.all': { th: 'ทุกโซน', en: 'All Zones' },
        'floorplan.zones.main': { th: 'ห้องหลัก', en: 'Main Hall' },
        'floorplan.zones.outdoor': { th: 'โซนกลางแจ้ง', en: 'Outdoor' },
        'floorplan.zones.vip': { th: 'ห้อง VIP', en: 'VIP Room' },
        'floorplan.shape.rectangle': { th: 'สี่เหลี่ยม', en: 'Rectangle' },
        'floorplan.shape.circle': { th: 'กลม', en: 'Circle' },
        'floorplan.instructions.drag': { th: '* ลากโต๊ะเพื่อย้ายตำแหน่ง', en: '* Drag to move tables' },
        'floorplan.instructions.delete': { th: '* กดปุ่มลบที่โต๊ะเพื่อลบโต๊ะออก', en: '* Click delete button to remove' },
        'floorplan.instructions.entrance': { th: '* คลิกที่ตำแหน่งเพื่อปักหมุดประตูทางเข้าหรือ VIP', en: '* Click to mark entrance or VIP' },
        'floorplan.entrance.label': { th: 'ทางเข้า', en: 'Entrance' },

        // Settings
        'settings.title': { th: 'ตั้งค่าระบบ', en: 'System Settings' },
        'settings.hours.title': { th: 'เวลาทำการ', en: 'Business Hours' },
        'settings.hours.to': { th: 'ถึง', en: 'to' },
        'settings.hours.save': { th: 'บันทึกเวลาทำการ', en: 'Save Business Hours' },
        'settings.staff.title': { th: 'จัดการพนักงาน', en: 'Staff Management' },
        'settings.staff.description': { th: 'ผู้ดูแลระบบสามารถแก้ไขข้อมูลพนักงานและเลื่อนตำแหน่งได้จากที่นี่', en: 'Administrators can edit staff info and promote users here' },
        'settings.staff.edit': { th: 'แก้ไขข้อมูล', en: 'Edit Details' },
        'settings.staff.delete': { th: 'ลบออก', en: 'Remove' },
        'settings.staff.promote': { th: 'เลื่อนเป็น Admin', en: 'Promote to Admin' },

        // Days of week
        'day.monday': { th: 'จันทร์', en: 'Monday' },
        'day.tuesday': { th: 'อังคาร', en: 'Tuesday' },
        'day.wednesday': { th: 'พุธ', en: 'Wednesday' },
        'day.thursday': { th: 'พฤหัสบดี', en: 'Thursday' },
        'day.friday': { th: 'ศุกร์', en: 'Friday' },
        'day.saturday': { th: 'เสาร์', en: 'Saturday' },
        'day.sunday': { th: 'อาทิตย์', en: 'Sunday' },

        // Common
        'common.save': { th: 'บันทึก', en: 'Save' },
        'common.cancel': { th: 'ยกเลิก', en: 'Cancel' },
        'common.delete': { th: 'ลบ', en: 'Delete' },
        'common.edit': { th: 'แก้ไข', en: 'Edit' },
        'common.close': { th: 'ปิด', en: 'Close' },
        'common.loading': { th: 'กำลังโหลด...', en: 'Loading...' },
        'common.success': { th: 'สำเร็จ', en: 'Success' },
        'common.error': { th: 'ข้อผิดพลาด', en: 'Error' },

        // Advertisements
        'admin.advertisements.title': { th: 'จัดการโฆษณา', en: 'Manage Advertisements' },
        'admin.advertisements.subtitle': { th: 'เพิ่ม แก้ไข และลบโฆษณาที่แสดงบนเว็บไซต์', en: 'Add, edit, and remove advertisements displayed on the website' },
        'admin.advertisements.form.addNew': { th: 'เพิ่มโฆษณาใหม่', en: 'Add New Advertisement' },
        'admin.advertisements.form.title': { th: 'หัวข้อ', en: 'Title' },
        'admin.advertisements.form.titlePlaceholder': { th: 'ระบุหัวข้อโฆษณา', en: 'Enter advertisement title' },
        'admin.advertisements.form.image': { th: 'รูปภาพ', en: 'Image' },
        'admin.advertisements.form.selectFile': { th: 'คลิกเพื่อเลือกรูปภาพโฆษณา', en: 'Click to select advertisement image' },
        'admin.advertisements.form.imageHint': { th: 'รองรับไฟล์รูปภาพ ขนาดไม่เกิน 5MB', en: 'Supports image files, maximum size 5MB' },
        'admin.advertisements.form.previewAlt': { th: 'ตัวอย่าง', en: 'Preview' },
        'admin.advertisements.form.link': { th: 'ลิงก์ (ไม่บังคับ)', en: 'Link (Optional)' },
        'admin.advertisements.form.uploading': { th: 'กำลังอัปโหลด...', en: 'Uploading...' },
        'admin.advertisements.form.submit': { th: 'เพิ่มโฆษณา', en: 'Add Advertisement' },
        'admin.advertisements.form.reset': { th: 'ล้างฟอร์ม', en: 'Clear Form' },
        'admin.advertisements.list.title': { th: 'รายการโฆษณา', en: 'Advertisement List' },
        'admin.advertisements.list.loading': { th: 'กำลังโหลด...', en: 'Loading...' },
        'admin.advertisements.list.empty': { th: 'ยังไม่มีโฆษณา', en: 'No advertisements yet' },
        'admin.advertisements.list.createdAt': { th: 'สร้างเมื่อ', en: 'Created at' },
        'admin.advertisements.list.delete': { th: 'ลบ', en: 'Delete' },
        'admin.advertisements.errors.errorOccurred': { th: 'เกิดข้อผิดพลาด:', en: 'An error occurred:' },
        'admin.advertisements.errors.connectionError': { th: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', en: 'Connection error occurred' },
        'admin.advertisements.errors.titleRequired': { th: 'กรุณากรอกหัวข้อ', en: 'Please enter a title' },
        'admin.advertisements.errors.imageRequired': { th: 'กรุณาเลือกไฟล์รูปภาพสำหรับโฆษณา', en: 'Please select an image file for the advertisement' },
        'admin.advertisements.errors.imageTypeInvalid': { th: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น', en: 'Please select image files only' },
        'admin.advertisements.errors.imageSizeLimit': { th: 'ขนาดไฟล์ต้องไม่เกิน 5MB', en: 'File size must not exceed 5MB' },
        'admin.advertisements.errors.uploadFailed': { th: 'ไม่สามารถอัปโหลดรูปได้', en: 'Failed to upload image' },
        'admin.advertisements.errors.publicUrlFailed': { th: 'ไม่สามารถสร้าง URL สาธารณะสำหรับรูปได้', en: 'Failed to create public URL for image' },
        'admin.advertisements.errors.createFailed': { th: 'ไม่สามารถเพิ่มโฆษณาได้', en: 'Failed to add advertisement' },
        'admin.advertisements.errors.deleteFailed': { th: 'ไม่สามารถลบโฆษณาได้', en: 'Failed to delete advertisement' },
        'admin.advertisements.errors.tableNotFound.hint': { th: 'คำแนะนำ:', en: 'Hint:' },
        'admin.advertisements.errors.tableNotFound.message': { th: 'ตาราง public.advertisements ยังไม่มีในฐานข้อมูล', en: 'The table public.advertisements does not exist in the database' },
        'admin.advertisements.errors.tableNotFound.createTable': { th: 'สร้างตารางด้วย SQL นี้:', en: 'Create the table with this SQL:' },
        'admin.advertisements.confirmDelete': { th: 'คุณแน่ใจหรือไม่ที่จะลบโฆษณาชิ้นนี้?', en: 'Are you sure you want to delete this advertisement?' },
    };

    return translations[key]?.[locale] || key;
};