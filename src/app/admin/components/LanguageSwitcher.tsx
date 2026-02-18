'use client'; // ใช้ Client Component

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { useAdminTheme } from '@/contexts/AdminThemeContext';

type Locale = 'th' | 'en'; // กำหนด Type ภาษา (ไทย/อังกฤษ)

interface LanguageSwitcherProps {
    className?: string;
}

/**
 * LanguageSwitcher Component
 * 
 * ปุ่มสลับภาษา (TH/EN) แบบ Pill Toggle สำหรับ Admin Panel
 * มี Animation เมื่อสลับภาษา
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

    // ฟังก์ชันเปลี่ยนภาษา และบันทึกลง localStorage
    const changeLocale = (newLocale: Locale) => {
        setLocale(newLocale);
        localStorage.setItem('admin-locale', newLocale);
        // Dispatch Custom Event เพื่อแจ้งให้ Component อื่นๆ ทราบว่ามีการเปลี่ยนภาษา
        window.dispatchEvent(new CustomEvent('locale-change', { detail: newLocale }));
    };

    const isDark = resolvedAdminTheme === 'dark';

    return (
        <div className={`inline-flex items-center rounded-full p-1 gap-1 backdrop-blur-sm border ${isDark
            ? 'bg-white/5 border-white/10'
            : 'bg-gray-100 border-gray-200'
            } ${className}`}>
            {([{ key: 'th' as const, label: 'TH' }, { key: 'en' as const, label: 'EN' }]).map((lang) => (
                <motion.button
                    key={lang.key}
                    onClick={() => changeLocale(lang.key)}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${locale === lang.key
                        ? isDark ? 'text-yellow-400' : 'text-amber-700'
                        : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={lang.key === 'th' ? 'ภาษาไทย' : 'English'}
                >
                    {locale === lang.key && (
                        <motion.div
                            layoutId="adminActiveLocale"
                            className={`absolute inset-0 rounded-full -z-10 ${isDark ? 'bg-white/10' : 'bg-white shadow-sm'
                                }`}
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    {lang.label}
                </motion.button>
            ))}
        </div>
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
        'login.footer': { th: 'Powered by Savory Bistro', en: 'Powered by Savory Bistro' },

        // Sidebar
        'sidebar.dashboard': { th: 'แดชบอร์ด', en: 'Dashboard' },
        'sidebar.reservations': { th: 'รายการจอง', en: 'Reservations' },
        'sidebar.feedback': { th: 'ความคิดเห็นลูกค้า', en: 'Feedback' },
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
        'header.advertisements': { th: 'จัดการโฆษณา', en: 'Advertisements' },
        'header.checkStatus': { th: 'เช็คสถานะจอง', en: 'Check Booking Status' },
        'header.loading': { th: 'กำลังตรวจสอบสิทธิ์...', en: 'Checking permissions...' },
        'header.role.admin': { th: 'ผู้ดูแลระบบ', en: 'Administrator' },
        'header.role.staff': { th: 'พนักงาน', en: 'Staff Member' },
        'header.role.checking': { th: 'กำลังตรวจสอบ...', en: 'Checking...' },
        'header.role.undefined': { th: 'ยังไม่ระบุสิทธิ์', en: 'Role Undefined' },
        'header.role.error': { th: 'เกิดข้อผิดพลาด', en: 'Error' },
        'admin.reservations.actions.delete': { th: 'ลบข้อมูล', en: 'Delete Record' },
        'admin.feedback.pagination.showing': { th: 'แสดง {start} - {end} จาก {total}', en: 'Showing {start} - {end} of {total}' },
        'admin.feedback.guest': { th: 'ลูกค้า', en: 'Guest' },

        // Dashboardเล
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
        'admin.feedback.delete.confirm': { th: 'คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็นนี้? การกระทำนี้ไม่สามารถย้อนกลับได้', en: 'Are you sure you want to delete this feedback? This action cannot be undone.' },
        'admin.feedback.delete.success': { th: 'ลบความคิดเห็นสำเร็จ', en: 'Feedback deleted successfully' },
        'admin.feedback.delete.error': { th: 'ไม่สามารถลบความคิดเห็นได้ กรุณาลองใหม่', en: 'Failed to delete feedback. Please try again.' },

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

        // Admin Floor Plan (New Standard Keys)
        'admin.floorPlan.title': { th: 'จัดการผังร้าน', en: 'Floor Plan Management' },
        'admin.floorPlan.subtitle': { th: 'ออกแบบและจัดการตำแหน่งโต๊ะในผังร้าน', en: 'Design and manage table layouts' },
        'admin.floorPlan.tableCount': { th: 'จำนวนโต๊ะทั้งหมด: {count}', en: 'Total Tables: {count}' },
        'admin.floorPlan.loading': { th: 'กำลังโหลดผังร้าน...', en: 'Loading floor plan...' },
        'admin.floorPlan.mode.edit': { th: 'แก้ไขตำแหน่ง', en: 'Edit Layout' },
        'admin.floorPlan.mode.check': { th: 'เช็คสถานะ', en: 'Check Status' },
        'admin.floorPlan.selectDate': { th: 'เลือกวันที่ตรวจสอบ', en: 'Select Date' },
        'admin.floorPlan.addTable': { th: 'เพิ่มโต๊ะใหม่', en: 'Add Table' },
        'admin.floorPlan.save': { th: 'บันทึกตำแหน่ง', en: 'Save Layout' },
        'admin.floorPlan.saved': { th: 'บันทึกเรียบร้อย', en: 'Saved' },
        'admin.floorPlan.tips': { th: 'คำแนะนำการใช้งาน', en: 'Tips' },
        'admin.floorPlan.tip1': { th: 'ลากโต๊ะ (Drag) เพื่อย้ายตำแหน่ง', en: 'Drag tables to move them' },
        'admin.floorPlan.tip2': { th: 'คลิกที่โต๊ะเพื่อแก้ไขข้อมูล', en: 'Click on a table to edit details' },
        'admin.floorPlan.tip3': { th: 'กดบันทึกทุกครั้งหลังแก้ไข', en: 'Always save changes after editing' },
        'admin.floorPlan.bookingDetails': { th: 'รายละเอียดการจอง', en: 'Booking Details' },
        'admin.floorPlan.editModal.title': { th: 'แก้ไขข้อมูลโต๊ะ', en: 'Edit Table' },
        'admin.floorPlan.configureSettings': { th: 'จัดการการตั้งค่าโต๊ะ', en: 'Configure table settings' },
        'admin.floorPlan.editModal.name': { th: 'ชื่อโต๊ะ', en: 'Table Name' },
        'admin.floorPlan.editModal.capacity': { th: 'ความจุ (ท่าน)', en: 'Capacity (Pax)' },
        'admin.floorPlan.editModal.zone': { th: 'โซน', en: 'Zone' },
        'admin.floorPlan.editModal.shape': { th: 'รูปร่าง', en: 'Shape' },
        'admin.floorPlan.editModal.confirmDelete': { th: 'คุณแน่ใจหรือไม่ที่จะลบโต๊ะนี้?', en: 'Are you sure you want to delete this table?' },
        'admin.floorPlan.editModal.delete': { th: 'ลบโต๊ะ', en: 'Delete Table' },
        'admin.floorPlan.editModal.update': { th: 'อัพเดทข้อมูล', en: 'Update Table' },
        'admin.floorPlan.zone.indoor': { th: 'ห้องแอร์ (Indoor)', en: 'Indoor' },
        'admin.floorPlan.zone.outdoor': { th: 'โซนด้านนอก (Outdoor)', en: 'Outdoor' },
        'admin.floorPlan.zone.vip': { th: 'ห้อง VIP', en: 'VIP Room' },
        'admin.floorPlan.shapes.rect': { th: 'สี่เหลี่ยม', en: 'Rectangle' },
        'admin.floorPlan.shapes.circle': { th: 'วงกลม', en: 'Circle' },



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
        'admin.advertisements.form.imageHint': { th: 'รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 5MB (แนะนำขนาดที่เหมาะสมคือ 1400 x 300 ถึง 1600 x 400 พิกเซล)', en: 'Supports JPG, PNG, WEBP max 5MB (Recommended size: 1400 x 300 to 1600 x 400 px)' },
        'admin.advertisements.form.previewAlt': { th: 'ตัวอย่าง', en: 'Preview' },
        'admin.advertisements.form.link': { th: 'ลิงก์ (ไม่บังคับ)', en: 'Link (Optional)' },
        'admin.advertisements.form.linkPlaceholder': { th: 'เช่น https://yourpage.com/promo', en: 'e.g. https://yourpage.com/promo' },
        'admin.advertisements.form.linkHint': { th: 'ระบุลิงก์เพื่อให้ลูกค้ากดไปยังหน้าโปรโมชั่น, เมนูอาหาร หรือหน้า Social Media ได้ทันที', en: 'Users will be redirected to this URL when they click the banner (e.g., promo page, menu, or social media).' },
        'admin.advertisements.form.uploading': { th: 'กำลังอัปโหลด...', en: 'Uploading...' },
        'admin.advertisements.form.submit': { th: 'เพิ่มโฆษณา', en: 'Add Advertisement' },
        'admin.advertisements.form.reset': { th: 'ล้างฟอร์ม', en: 'Clear Form' },
        'admin.advertisements.editTitle': { th: 'แก้ไขโฆษณา', en: 'Edit Advertisement' },
        'admin.advertisements.updateSubtitle': { th: 'อัปเดตรายละเอียดแบนเนอร์ของคุณ', en: 'Update your banner details' },
        'admin.advertisements.createSubtitle': { th: 'สร้างแบนเนอร์โปรโมชั่นใหม่', en: 'Create a new promotional banner' },
        'admin.advertisements.cancelEdit': { th: 'ยกเลิกการแก้ไข', en: 'Cancel Edit' },
        'admin.advertisements.form.imageContent': { th: 'เนื้อหารูปภาพ', en: 'Image Content' },
        'admin.advertisements.form.uploadFile': { th: 'อัปโหลดไฟล์', en: 'Upload File' },
        'admin.advertisements.form.directUrl': { th: 'ใช้ลิงก์ URL', en: 'Direct URL' },
        'admin.advertisements.form.urlPlaceholder': { th: 'วางลิงก์รูปภาพโดยตรง (JPEG, PNG, WEBP)...', en: 'Paste direct image link (JPEG, PNG, WEBP)...' },
        'admin.advertisements.form.discard': { th: 'ละทิ้ง', en: 'Discard' },
        'admin.advertisements.form.saveChanges': { th: 'บันทึกการเปลี่ยนแปลง', en: 'Save Changes' },
        'admin.advertisements.form.processing': { th: 'กำลังประมวลผล...', en: 'Processing...' },
        'admin.advertisements.list.title': { th: 'รายการโฆษณา', en: 'Advertisement List' },
        'admin.advertisements.list.itemsCount': { th: 'รายการ', en: 'items' },
        'admin.advertisements.list.cardLabel': { th: 'แบนเนอร์โปรโมชั่น', en: 'Promo Banner' },
        'admin.advertisements.list.noLink': { th: 'ไม่มีลิงก์ปลายทาง', en: 'No target link' },
        'admin.advertisements.list.edit': { th: 'แก้ไข', en: 'Edit' },
        'admin.advertisements.status.live': { th: 'ใช้งานอยู่', en: 'Live' },
        'admin.advertisements.status.inactive': { th: 'ปิดใช้งาน', en: 'Inactive' },
        'admin.advertisements.success.updated': { th: 'อัปเดตข้อมูลสำเร็จ', en: 'Updated successfully' },
        'admin.advertisements.success.created': { th: 'สร้างโฆษณาสำเร็จ', en: 'Created successfully' },
        'admin.advertisements.success.deleted': { th: 'ลบโฆษณาสำเร็จ', en: 'Deleted successfully' },
        'admin.advertisements.error.fill': { th: 'กรุณากรอกหัวข้อ', en: 'Please enter a title' },
        'admin.advertisements.error.file': { th: 'กรุณาเลือกไฟล์รูปภาพสำหรับโฆษณา', en: 'Please select an image file' },
        'admin.advertisements.error.fillURL': { th: 'กรุณากรอกลิงก์รูปภาพ', en: 'Please enter image URL' },
        'admin.advertisements.error.connect': { th: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', en: 'Connection error' },
        'admin.advertisements.confirm.delete': { th: 'ลบโฆษณาชิ้นนี้?', en: 'Delete this advertisement?' },
        'alert.failed': { th: 'เกิดข้อผิดพลาด', en: 'Operation failed' },
        // Feedback
        'admin.feedback.title': { th: 'จัดการความคิดเห็นลูกค้า', en: 'Manage Customer Feedback' },
        'admin.feedback.subtitle': { th: 'ดูความคิดเห็นและคำติชมจากลูกค้าที่ใช้บริการ', en: 'View feedback and suggestions from your customers' },
        'admin.feedback.list.name': { th: 'ชื่อลูกค้า', en: 'Customer Name' },
        'admin.feedback.list.email': { th: 'อีเมล', en: 'Email' },
        'admin.feedback.list.rating': { th: 'คะแนน', en: 'Rating' },
        'admin.feedback.list.comment': { th: 'ความคิดเห็น', en: 'Comment' },
        'admin.feedback.list.date': { th: 'วันที่ส่ง', en: 'Date Submitted' },
        'admin.feedback.list.empty': { th: 'ยังไม่มีความคิดเห็น', en: 'No feedback yet' },
        'admin.feedback.list.error': { th: 'ไม่สามารถโหลดข้อมูลได้', en: 'Failed to load feedback' },
        'admin.feedback.stats.total': { th: 'จำนวนความคิดเห็นทั้งหมด', en: 'Total Feedback' },
        'admin.feedback.stats.rating': { th: 'คะแนนเฉลี่ย', en: 'Average Rating' },
        'admin.feedback.empty.title': { th: 'ยังไม่มีความคิดเห็น', en: 'No feedback yet' },
        'admin.feedback.empty.desc': { th: 'ความคิดเห็นจากลูกค้าจะปรากฏที่นี่', en: 'Customer reviews will appear here.' },
        'admin.dashboard.title': { th: 'ภาพรวมการจองวันนี้', en: 'Today\'s Overview' },
        'admin.dashboard.exportCSV': { th: 'Export CSV', en: 'Export CSV' },
        'admin.dashboard.clearToday': { th: 'เคลียร์วันนี้', en: 'Clear Today' },
        'admin.dashboard.confirmClear': { th: 'ยืนยันการเคลียร์รายการจองวันนี้?\n\n⚠️ แนะนำให้ Export CSV ก่อนลบ!', en: 'Confirm clearing reservations for today?\n\n⚠️ Recommended to Export CSV first!' },
        'admin.dashboard.stats.todayBookings': { th: 'การจองวันนี้', en: 'Today\'s Bookings' },
        'admin.dashboard.stats.pending': { th: 'รอยืนยัน', en: 'Pending' },
        'admin.dashboard.stats.actionNeeded': { th: 'ต้องดำเนินการ', en: 'Action needed' },
        'admin.dashboard.stats.expectedGuests': { th: 'ลูกค้าที่จะมา', en: 'Expected Guests' },
        'admin.dashboard.stats.confirmedLabel': { th: 'คน (ยืนยันแล้ว)', en: 'guests (confirmed)' },
        'admin.dashboard.stats.tablesBooked': { th: 'โต๊ะที่จองแล้ว', en: 'Tables Booked' },
        'admin.dashboard.stats.ofTables': { th: 'จาก {total} โต๊ะ', en: 'of {total} tables' },
        'admin.dashboard.peak.title': { th: 'ความหนาแน่นรายชั่วโมง', en: 'Peak Occupancy' },
        'admin.dashboard.peak.subtitle': { th: 'จำนวนลูกค้าคาดการณ์ในแต่ละช่วงเวลา', en: 'Forecasted guests for today' },
        'admin.dashboard.peak.guestsLabel': { th: 'จำนวนลูกค้า (Pax)', en: 'Guests' },
        'admin.dashboard.peak.noData': { th: 'ไม่มีข้อมูลการจองในวันนี้', en: 'No data for today' },
        'admin.dashboard.tableStatus.title': { th: 'สถานะโต๊ะวันนี้', en: 'Table Status' },
        'admin.dashboard.tableStatus.available': { th: 'ว่าง', en: 'Available' },
        'admin.dashboard.tableStatus.booked': { th: 'จองแล้ว', en: 'Booked' },
        'admin.dashboard.whosNext.title': { th: 'ลำดับการจอง', en: "Who's Next?" },
        'admin.dashboard.whosNext.subtitle': { th: 'ใครจะมาถึงในลำดับถัดไป', en: 'Arrival priority' },
        'admin.dashboard.whosNext.noBookings': { th: 'ยังไม่มีการจองวันนี้', en: 'No bookings' },
        'admin.dashboard.whosNext.paxLabel': { th: 'คน', en: 'pax' },
    };

    return translations[key]?.[locale] || key;
};