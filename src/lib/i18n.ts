
export type Locale = 'th' | 'en';

export const translations = {
    th: {
        // Common
        'app.title': 'จองโต๊ะออนไลน์',
        'app.tagline': 'สัมผัสประสบการณ์การรับประทานอาหารที่ยอดเยี่ยม',
        'nav.home': 'หน้าหลัก',
        'nav.reserve': 'จองโต๊ะ',
        'nav.checkStatus': 'ตรวจสอบสถานะ',
        'nav.admin': 'ผู้ดูแลระบบ',

        // Landing Page
        'hero.title': 'ยินดีต้อนรับสู่ร้านของเรา',
        'hero.subtitle': 'จองโต๊ะล่วงหน้าเพื่อความสะดวกและรวดเร็ว',
        'hero.cta': 'จองโต๊ะเลย',
        'hours.title': 'เวลาทำการ',
        'hours.subtitle': 'เราพร้อมให้บริการคุณตลอดทั้งสัปดาห์',

        // Reservation Form
        'form.title': 'จองโต๊ะของคุณ',
        'form.subtitle': 'กรอกรายละเอียดด้านล่างเพื่อจองโต๊ะ',
        'form.name': 'ชื่อ-นามสกุล',
        'form.phone': 'เบอร์โทรศัพท์',
        'form.email': 'อีเมล (ไม่บังคับ)',
        'form.guests': 'จำนวนแขก',
        'form.date': 'วันที่จอง',
        'form.time': 'เวลาจอง',
        'form.table': 'เลือกโต๊ะ',
        'form.requests': 'คำขอพิเศษ',
        'form.submit': 'ยืนยันการจอง',

        // Success Modal
        'success.title': 'ยืนยันการจองแล้ว!',
        'success.subtitle': 'โต๊ะของคุณได้รับการจองเรียบร้อยแล้ว',
        'success.code': 'รหัสการจอง',
        'success.backHome': 'กลับสู่หน้าหลัก',

        // Admin
        'admin.dashboard': 'แดชบอร์ด',
        'admin.reservations': 'รายการจอง',
        'admin.tables': 'จัดการโต๊ะ',
        'admin.settings': 'ตั้งค่าระบบ',
        'admin.logout': 'ออกจากระบบ',
    },
    en: {
        // Common
        'app.title': 'Online Booking',
        'app.tagline': 'Experience the finest dining',
        'nav.home': 'Home',
        'nav.reserve': 'Book a Table',
        'nav.checkStatus': 'Check Status',
        'nav.admin': 'Admin',

        // Landing Page
        'hero.title': 'Welcome to Our Restaurant',
        'hero.subtitle': 'Book your table in advance for convenience',
        'hero.cta': 'Book Now',
        'hours.title': 'Opening Hours',
        'hours.subtitle': 'We are ready to serve you all week',

        // Reservation Form
        'form.title': 'Book Your Table',
        'form.subtitle': 'Enter the details below to reserve your table',
        'form.name': 'Full Name',
        'form.phone': 'Phone Number',
        'form.email': 'Email (Optional)',
        'form.guests': 'Number of Guests',
        'form.date': 'Reservation Date',
        'form.time': 'Reservation Time',
        'form.table': 'Select Table',
        'form.requests': 'Special Requests',
        'form.submit': 'Confirm Reservation',

        // Success Modal
        'success.title': 'Booking Confirmed!',
        'success.subtitle': 'Your table has been reserved successfully',
        'success.code': 'Booking Code',
        'success.backHome': 'Back to Home',

        // Admin
        'admin.dashboard': 'Dashboard',
        'admin.reservations': 'Reservations',
        'admin.tables': 'Manage Tables',
        'admin.settings': 'Settings',
        'admin.logout': 'Logout',
    }
};

export const useTranslation = (locale: Locale = 'th') => {
    const t = (key: keyof typeof translations['th']) => {
        return translations[locale][key] || key;
    };
    return { t };
};
