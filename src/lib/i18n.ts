import { useCallback, useMemo } from 'react';

export type Locale = 'th' | 'en';

export const translations = {
  th: {
    // Common
    'app.title': 'จองโต๊ะออนไลน์',
    'app.tagline': 'สัมผัสประสบการณ์อาหารมื้อพิเศษที่ดีที่สุด',
    'nav.home': 'หน้าหลัก',
    'nav.reserve': 'จองโต๊ะ',
    'nav.checkStatus': 'ตรวจสอบสถานะ',
    'nav.admin': 'ผู้ดูแลระบบ',

    // Landing Page
    'hero.title': 'ยินดีต้อนรับสู่ TableReserve',
    'hero.subtitle': 'จองโต๊ะล่วงหน้าเพื่อความสะดวกและรวดเร็ว สัมผัสบรรยากาศที่ยอดเยี่ยม',
    'hero.cta': 'จองโต๊ะเลย',
    'hero.imageAlt': 'บรรยากาศร้านอาหารสุดหรู',

    'info.whyChooseUs': 'ทำไมต้องเลือกเรา',
    'info.whyChooseUsDesc': 'สัมผัสประสบการณ์การรับประทานอาหารที่ยอดเยี่ยมด้วยความมุ่งมั่นของเราในด้านคุณภาพ การบริการ และบรรยากาศ',

    'info.premium.title': 'บริการระดับพรีเมียม',
    'info.premium.desc': 'บริการจองโต๊ะออนไลน์ที่สะดวก รวดเร็ว และมีประสิทธิภาพสูงสุด รองรับทุกความต้องการของคุณ',
    'info.service.title': 'ทีมงานมืออาชีพ',
    'info.service.desc': 'ทีมงานผู้เชี่ยวชาญพร้อมให้บริการตลอด 24 ชั่วโมง แก้ไขปัญหาได้อย่างรวดเร็วและมีประสิทธิภาพ',
    'info.modern.title': 'ระบบที่ทันสมัย',
    'info.modern.desc': 'เทคโนโลยีล่าสุดเพื่อประสบการณ์การจองที่ราบรื่น ปลอดภัย และใช้งานง่าย',

    'trust.ssl.title': 'ปลอดภัย SSL',
    'trust.ssl.desc': 'ข้อมูลของคุณได้รับการปกป้องด้วยการเข้ารหัสระดับสูง',
    'trust.star.title': 'มาตรฐาน 5 ดาว',
    'trust.star.desc': 'ได้รับการรับรองคุณภาพจากสมาคมร้านอาหาร',
    'trust.health.title': 'รับรองมาตรฐาน',
    'trust.health.desc': 'ผ่านมาตรฐานความปลอดภัยและสุขอนามัย',

    'holiday.title': 'ประกาศวันหยุดพิเศษ',
    'holiday.message': 'ทางร้านขออภัยในความไม่สะดวก เนื่องจากจะมีการปิดทำการในวันดังต่อไปนี้:',

    'contact.visitUs': 'เยี่ยมชมเรา',
    'contact.subtitle': 'พบเราได้ที่สถานที่สะดวกของเรา',
    'contact.phone': 'โทรศัพท์',
    'contact.email': 'อีเมล',
    'contact.address': 'ที่อยู่',
    'contact.address.full': 'มหาวิทยาลัยพะเยา 19 หมู่ 2 ต.แม่กา อ.เมือง จ.พะเยา 56000',

    'hours.title': 'เวลาทำการ',
    'hours.subtitle': 'เราพร้อมให้บริการคุณตลอดทั้งสัปดาห์',
    'day.monday': 'จันทร์',
    'day.tuesday': 'อังคาร',
    'day.wednesday': 'พุธ',
    'day.thursday': 'พฤหัสบดี',
    'day.friday': 'ศุกร์',
    'day.saturday': 'เสาร์',
    'day.sunday': 'อาทิตย์',
    'hours.closed': 'ปิดทำการ',

    'footer.rights': 'สงวนลิขสิทธิ์',
    'footer.security': 'การจองออนไลน์ที่ปลอดภัยด้วยการเข้ารหัส SSL',
    'footer.adminLogin': 'เข้าสู่ระบบผู้ดูแลระบบ (Admin)',

    // Reservation Form
    'form.title': 'จองโต๊ะของคุณ',
    'form.subtitle': 'กรอกรายละเอียดด้านล่างเพื่อจองโต๊ะ',
    'form.name': 'ชื่อ-นามสกุล',
    'form.phone': 'เบอร์โทรศัพท์',
    'form.email': 'อีเมล (ไม่บังคับ)',
    'form.guests': 'จำนวนแขก',
    'form.guests.placeholder': 'เลือกจำนวนแขก',
    'form.guests.label': 'ท่าน',
    'form.date': 'วันที่จอง',
    'form.time': 'เวลาจอง',
    'form.table': 'เลือกโต๊ะ',
    'form.requests': 'คำขอพิเศษ',
    'form.submit': 'ยืนยันการจอง',

    'form.placeholder.name': 'กรุณากรอกชื่อ-นามสกุล',
    'form.placeholder.phone': '081-222-2222',
    'form.placeholder.email': 'your@email.com',
    'form.placeholder.requests': 'มีข้อจำกัดด้านอาหาร อาการแพ้ หรือโอกาสพิเศษหรือไม่? (ไม่บังคับ)',

    // Validation
    'validation.name.required': 'กรุณากรอกชื่อ-นามสกุล',
    'validation.name.invalid': 'กรุณากรอกทั้งชื่อและนามสกุล (เว้นวรรค)',
    'validation.name.short': 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร',
    'validation.phone.required': 'กรุณากรอกเบอร์โทรศัพท์',
    'validation.phone.invalid': 'กรุณากรอกเบอร์โทรศัพท์ 10 หลักที่ถูกต้อง',
    'validation.email.invalid': 'กรุณากรอกอีเมลที่ถูกต้อง',
    'validation.guests.required': 'กรุณาเลือกจำนวนแขก',
    'validation.date.required': 'กรุณาเลือกวันที่',
    'validation.date.past': 'ไม่สามารถเลือกวันที่ย้อนหลังได้',
    'validation.time.required': 'กรุณาเลือกเวลา',
    'validation.table.required': 'กรุณาเลือกโต๊ะ',

    // Payment
    'payment.title': 'ชำระเงินมัดจำล่วงหน้า',
    'payment.desc': 'เพื่อยืนยันสิทธิ์การเข้าใช้บริการ กรุณาโอนเงินมัดจำจำนวน',
    'payment.deposit': '200 บาท',
    'payment.desc_suffix': '(หักคืนจากยอดรวมค่าอาหาร)',
    'payment.scan': 'สแกนเพื่อจ่าย',
    'payment.ready': 'พร้อมรับเงิน',
    'payment.amount': 'มัดจำ 200.00 บาท',
    'payment.upload': 'แนบสลิปการโอนเงิน',
    'payment.upload.label': 'กดที่นี่เพื่อเลือกรูปสลิป',
    'payment.upload.click': 'คลิกเพื่อเปลี่ยนรูปภาพ',
    'payment.upload.hint': 'รองรับไฟล์ภาพ JPG, PNG (สูงสุด 5MB)',
    'payment.upload.change': 'คลิกเพื่อเปลี่ยนรูปภาพ',

    // Policy
    'policy.title': 'นโยบายการจอง',
    'policy.desc': 'กรุณามาถึงภายใน 15 นาทีหลังเวลาจองของคุณ สำหรับกลุ่ม 6 คนขึ้นไป กรุณาโทรติดต่อเราโดยตรงที่ 081-222-2222',

    // Alerts
    'alert.tableTaken': 'ขออภัย โต๊ะนี้เพิ่งถูกจองไป กรุณาเลือกโต๊ะใหม่',
    'alert.failed': 'การจองล้มเหลว',
    'alert.uploadFailed': 'ไม่สามารถอัปโหลดสลิปได้ กรุณาลองใหม่อีกครั้ง',
    'alert.connectionError': 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',

    // Success Modal
    'success.title': 'ยืนยันการจองแล้ว!',
    'success.subtitle': 'โต๊ะของคุณได้รับการจองเรียบร้อยแล้ว',
    'success.code': 'รหัสการจอง',
    'success.backHome': 'กลับสู่หน้าหลัก',
    'success.screenshot': 'กรุณาแคปหน้าจอเพื่อใช้เป็นหลักฐานการจอง',

    // Admin
    'admin.dashboard': 'แดชบอร์ด',
    'admin.reservations': 'รายการจอง',
    'admin.tables': 'จัดการโต๊ะ',
    'admin.settings': 'ตั้งค่าระบบ',
    'admin.logout': 'ออกจากระบบ',

    // Check Status
    'checkStatus.title': 'ตรวจสอบสถานะการจอง',
    'checkStatus.subtitle': 'กรุณากรอกรหัสการจอง BX-XXXXXX เพื่อตรวจสอบสถานะ',
    'checkStatus.placeholder': 'เช่น BX-123456',
    'checkStatus.button': 'ค้นหาข้อมูล',
    'checkStatus.error.notFound': 'ไม่พบข้อมูลการจอง รหัสอาจไม่ถูกต้อง',
    'checkStatus.error.connection': 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่',
    'checkStatus.status.confirmed': 'ยืนยันการจองแล้ว',
    'checkStatus.status.pending': 'รอพนักงานตรวจสอบ',
    'checkStatus.status.cancelled': 'ยกเลิกการจองแล้ว',
    'checkStatus.status.completed': 'ใช้บริการเสร็จสิ้น',
    'checkStatus.label.customer': 'ชื่อลูกค้า',
    'checkStatus.label.code': 'รหัสจอง',
    'checkStatus.label.date': 'วันที่จอง',
    'checkStatus.label.time': 'เวลา',
    'checkStatus.label.table': 'โต๊ะหมายเลข',
    'checkStatus.label.tableNum': 'หมายเลข {num}',
    'checkStatus.help': 'ต้องการความช่วยเหลือ? ติดต่อเบอร์',

    // Not Found
    'notFound.title': 'ไม่พบหน้านี้',
    'notFound.description': 'หน้าที่คุณกำลังค้นหาไม่มีอยู่จริง ลองตรวจสอบ URL หรือกลับไปหน้าหลัก',
    'notFound.goBack': 'ย้อนกลับ',
  },
  en: {
    // Common
    'app.title': 'TableReserve',
    'app.tagline': 'Experience Fine Dining at Its Best',
    'nav.home': 'Home',
    'nav.reserve': 'Book a Table',
    'nav.checkStatus': 'Check Status',
    'nav.admin': 'Admin',

    // Landing Page
    'hero.title': 'Welcome to TableReserve',
    'hero.subtitle': 'Book your table in advance for convenience and experience exceptional atmosphere.',
    'hero.cta': 'Book Now',
    'hero.imageAlt': 'Elegant restaurant atmosphere',

    'info.whyChooseUs': 'Why Choose Us',
    'info.whyChooseUsDesc': 'Experience exceptional dining with our commitment to quality, service, and atmosphere.',

    'info.premium.title': 'Premium Service',
    'info.premium.desc': 'Convenient, fast, and highly efficient online table booking service to meet all your needs.',
    'info.service.title': 'Professional Team',
    'info.service.desc': 'Expert team ready to serve you 24/7, resolving issues quickly and efficiently.',
    'info.modern.title': 'Modern System',
    'info.modern.desc': 'Latest technology for a smooth, secure, and user-friendly booking experience.',

    'trust.ssl.title': 'SSL Secured',
    'trust.ssl.desc': 'Your data is protected with high-level encryption.',
    'trust.star.title': '5-Star Standard',
    'trust.star.desc': 'Certified quality by the Restaurant Association.',
    'trust.health.title': 'Certified Standard',
    'trust.health.desc': 'Meets safety and hygiene standards.',

    'holiday.title': 'Special Holiday Announcement',
    'holiday.message': 'We apologize for the inconvenience as we will be closed on the following dates:',

    'contact.visitUs': 'Visit Us',
    'contact.subtitle': 'Find us at our convenient location.',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.address': 'Address',
    'contact.address.full': 'University of Phayao, 19 Moo 2, Maeka, Mueang, Phayao 56000',

    'hours.title': 'Opening Hours',
    'hours.subtitle': 'We are ready to serve you all week.',
    'day.monday': 'Monday',
    'day.tuesday': 'Tuesday',
    'day.wednesday': 'Wednesday',
    'day.thursday': 'Thursday',
    'day.friday': 'Friday',
    'day.saturday': 'Saturday',
    'day.sunday': 'Sunday',
    'hours.closed': 'Closed',

    'footer.rights': 'All rights reserved.',
    'footer.security': 'Secure online booking with SSL encryption.',
    'footer.adminLogin': 'Admin Login',

    // Reservation Form
    'form.title': 'Book Your Table',
    'form.subtitle': 'Enter the details below to reserve your table',
    'form.name': 'Full Name',
    'form.phone': 'Phone Number',
    'form.email': 'Email (Optional)',
    'form.guests': 'Number of Guests',
    'form.guests.placeholder': 'Select Guests',
    'form.guests.label': 'Guests',
    'form.date': 'Reservation Date',
    'form.time': 'Reservation Time',
    'form.table': 'Select Table',
    'form.requests': 'Special Requests',
    'form.submit': 'Confirm Reservation',

    'form.placeholder.name': 'Enter your full name',
    'form.placeholder.phone': '081-222-2222',
    'form.placeholder.email': 'your@email.com',
    'form.placeholder.requests': 'Any dietary restrictions or special occasion? (Optional)',

    // Validation
    'validation.name.required': 'Please enter full name',
    'validation.name.invalid': 'Please enter both first and last name',
    'validation.name.short': 'Name must be at least 2 characters',
    'validation.phone.required': 'Please enter phone number',
    'validation.phone.invalid': 'Please enter valid 10-digit phone number',
    'validation.email.invalid': 'Please enter valid email',
    'validation.guests.required': 'Please select number of guests',
    'validation.date.required': 'Please select date',
    'validation.date.past': 'Cannot select past date',
    'validation.time.required': 'Please select time',
    'validation.table.required': 'Please select a table',

    // Payment
    'payment.title': 'Advance Deposit',
    'payment.desc': 'To confirm your reservation, please transfer a deposit of',
    'payment.deposit': '200 THB',
    'payment.desc_suffix': '(Deducted from total bill)',
    'payment.scan': 'Scan to Pay',
    'payment.ready': 'Ready to Receive',
    'payment.amount': 'Deposit 200.00 THB',
    'payment.upload': 'Upload Payment Slip',
    'payment.upload.label': 'Click here to upload slip',
    'payment.upload.click': 'Click to change image',
    'payment.upload.hint': 'Supports JPG, PNG (Max 5MB)',
    'payment.upload.change': 'Click to change image',

    // Policy
    'policy.title': 'Reservation Policy',
    'policy.desc': 'Please arrive within 15 minutes of your booking time. For groups larger than 6, please call us directly at 081-222-2222',

    // Alerts
    'alert.tableTaken': 'Sorry, this table has just been booked. Please select another.',
    'alert.failed': 'Booking failed',
    'alert.uploadFailed': 'Failed to upload slip. Please try again.',
    'alert.connectionError': 'Connection error. Please try again.',

    // Success Modal
    'success.title': 'Booking Confirmed!',
    'success.subtitle': 'Your table has been reserved successfully',
    'success.code': 'Booking Code',
    'success.backHome': 'Back to Home',
    'success.screenshot': 'Please take a screenshot for your reference',

    // Admin
    'admin.dashboard': 'Dashboard',
    'admin.reservations': 'Reservations',
    'admin.tables': 'Manage Tables',
    'admin.settings': 'Settings',
    'admin.logout': 'Logout',

    // Check Status
    'checkStatus.title': 'Check Booking Status',
    'checkStatus.subtitle': 'Please enter your booking code (BX-XXXXXX) to check.',
    'checkStatus.placeholder': 'e.g., BX-123456',
    'checkStatus.button': 'Search',
    'checkStatus.error.notFound': 'Booking not found. Please check code.',
    'checkStatus.error.connection': 'Connection error. Please try again.',
    'checkStatus.status.confirmed': 'Confirmed',
    'checkStatus.status.pending': 'Pending Review',
    'checkStatus.status.cancelled': 'Cancelled',
    'checkStatus.status.completed': 'Completed',
    'checkStatus.label.customer': 'Customer Name',
    'checkStatus.label.code': 'Booking Code',
    'checkStatus.label.date': 'Date',
    'checkStatus.label.time': 'Time',
    'checkStatus.label.table': 'Table Number',
    'checkStatus.label.tableNum': 'Number {num}',
    'checkStatus.help': 'Need help? Contact us at',

    // Not Found
    'notFound.title': 'Page Not Found',
    'notFound.description': 'The page you are looking for does not exist. Please check the URL or go back to home.',
    'notFound.goBack': 'Go Back',
  },
};

export const useTranslation = (locale: Locale = 'th') => {
  const t = useCallback(
    (key: keyof (typeof translations)['th']) => {
      const translation = translations[locale as keyof typeof translations];
      return (translation as any)[key] || key;
    },
    [locale]
  );
  return useMemo(() => ({ t }), [t]);
};
