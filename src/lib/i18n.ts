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
    'info.whyChooseUsDesc':
      'สัมผัสประสบการณ์การรับประทานอาหารที่ยอดเยี่ยมด้วยความมุ่งมั่นของเราในด้านคุณภาพ การบริการ และบรรยากาศ',

    'info.premium.title': 'บริการระดับพรีเมียม',
    'info.premium.desc':
      'บริการจองโต๊ะออนไลน์ที่สะดวก รวดเร็ว และมีประสิทธิภาพสูงสุด รองรับทุกความต้องการของคุณ',
    'info.service.title': 'ทีมงานมืออาชีพ',
    'info.service.desc':
      'ทีมงานผู้เชี่ยวชาญพร้อมให้บริการตลอด 24 ชั่วโมง แก้ไขปัญหาได้อย่างรวดเร็วและมีประสิทธิภาพ',
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
    'hours.openNow': 'เปิดให้บริการในขณะนี้',
    'hours.closedNow': 'ขณะนี้ร้านปิดให้บริการ',
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
    'validation.attachSlip': 'กรุณากรอกข้อมูลและแนบสลิปโอนเงิน',

    // Loading
    'loading.uploadTitle': 'กำลังอัปโหลด...',
    'loading.uploadDesc': 'กรุณารอสักครู่ กำลังนำส่งสลิปหลักฐานการโอนเงิน...',
    'loading.confirmTitle': 'กำลังยืนยันการจอง...',
    'loading.confirmDesc': 'กำลังบันทึกข้อมูลและยืนยันโต๊ะที่ท่านเลือก...',

    // Payment
    'payment.title': 'ชำระเงินมัดจำล่วงหน้า',
    'payment.desc': 'เพื่อยืนยันสิทธิ์การเข้าใช้บริการ กรุณาโอนเงินมัดจำจำนวน',
    'payment.deposit': '200 บาท',
    'payment.desc_suffix': '(หักคืนจากยอดรวมค่าอาหาร)',
    'payment.scan': 'สแกนเพื่อจ่าย',
    'payment.ready': 'แนบสลิปเรียบร้อย',
    'payment.amount': 'มัดจำ 200.00 บาท',
    'payment.promptpay': 'พร้อมเพย์ (PromptPay)',
    'payment.prepayment': 'ชำระเงินมัดจำล่วงหน้า',
    'payment.deposit_info':
      'ยอดเงินมัดจำ 200 บาท จะถูกนำไปหักออกจากค่าอาหารทั้งหมด (ไม่มีค่าธรรมเนียมการจอง)',
    'payment.upload': 'แนบสลิปการโอนเงิน',
    'payment.upload.label': 'กดที่นี่เพื่อเลือกรูปสลิป',
    'payment.upload.click': 'คลิกเพื่อเปลี่ยนรูปภาพ',
    'payment.upload.hint': 'รองรับไฟล์ภาพ JPG, PNG (สูงสุด 5MB)',
    'payment.upload.change': 'คลิกเพื่อเปลี่ยนรูปภาพ',

    // Policy
    'policy.title': 'นโยบายการจอง',
    'policy.desc':
      'กรุณามาถึงภายใน 15 นาทีหลังเวลาจองของคุณ สำหรับกลุ่ม 6 คนขึ้นไป กรุณาโทรติดต่อเราโดยตรงที่ 081-222-2222',

    // Alerts
    'alert.tableTaken': 'ขออภัย โต๊ะนี้เพิ่งถูกจองไป กรุณาเลือกโต๊ะใหม่',
    'alert.failed': 'การจองล้มเหลว',
    'alert.uploadFailed': 'ไม่สามารถอัปโหลดสลิปได้ กรุณาลองใหม่อีกครั้ง',
    'alert.connectionError': 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
    'validation.fillAll': 'กรุณากรอกข้อมูลให้ครบถ้วน',

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
    // Admin Floor Plan
    'admin.floorPlan.title': 'จัดการผังร้าน',
    'admin.floorPlan.subtitle': 'จัดการเลย์เอาท์และตำแหน่งโต๊ะ',
    'admin.floorPlan.save': 'บันทึกผังร้าน',
    'admin.floorPlan.saved': 'บันทึกเรียบร้อย!',
    'admin.floorPlan.addTable': 'เพิ่มโต๊ะ',
    'admin.floorPlan.tips': 'คำแนะนำ',
    'admin.floorPlan.tip1': 'ลากโต๊ะเพื่อเปลี่ยนตำแหน่ง',
    'admin.floorPlan.tip2': 'การเปลี่ยนแปลงจะมีผลเมื่อกดบันทึก',
    'admin.floorPlan.tip3': 'ดับเบิ้ลคลิกที่โต๊ะเพื่อแก้ไขรายละเอียด',
    'admin.floorPlan.shapes.rect': 'สี่เหลี่ยม',
    'admin.floorPlan.shapes.circle': 'วงกลม',
    'admin.floorPlan.loading': 'กำลังโหลดผังร้าน...',
    'admin.floorPlan.editModal.title': 'แก้ไขรายละเอียดโต๊ะ',
    'admin.floorPlan.editModal.name': 'ชื่อโต๊ะ',
    'admin.floorPlan.editModal.capacity': 'ความจุ (ท่าน)',
    'admin.floorPlan.editModal.zone': 'โซน',
    'admin.floorPlan.editModal.shape': 'รูปร่าง',
    'admin.floorPlan.editModal.update': 'อัปเดต',
    'admin.floorPlan.editModal.delete': 'ลบโต๊ะ',
    'admin.floorPlan.editModal.confirmDelete': 'คุณแน่ใจหรือไม่ที่จะลบโต๊ะนี้?',
    'admin.floorPlan.selectDate': 'เลือกวันที่',
    'admin.floorPlan.mode.edit': 'แก้ไขผังร้าน',
    'admin.floorPlan.mode.check': 'เช็คสถานะโต๊ะ',
    'admin.floorPlan.configureSettings': 'ตั้งค่ารายละเอียดโต๊ะ',
    'admin.floorPlan.showingBookingsWait': '* แสดงการจองในช่วง 2 ชั่วโมงหลังจากเวลาที่เลือก',
    'admin.floorPlan.tableCount': '{count} โต๊ะ',
    'admin.floorPlan.checkButton': 'ตรวจสอบสถานะ',
    'admin.floorPlan.zone.indoor': 'โซนห้องแอร์',
    'admin.floorPlan.zone.outdoor': 'โซนด้านนอก',
    'admin.floorPlan.zone.vip': 'โซน VIP',
    'admin.floorPlan.cashier': 'เคาน์เตอร์แคชเชียร์',
    'admin.floorPlan.entrance': 'ทางเข้า',
    'admin.floorPlan.allZones': 'ทุกโซน',
    'admin.floorPlan.noTablesInZone': 'ไม่มีโต๊ะในโซนนี้',
    'admin.floorPlan.legend.available': 'ว่าง',
    'admin.floorPlan.legend.selected': 'ที่เลือก',
    'admin.floorPlan.legend.booked': 'จองแล้ว',
    'admin.floorPlan.bookingDetails': 'ข้อมูลการจอง',
    'admin.floorPlan.nextAvailable': 'ว่างอีกครั้ง',
    'admin.floorPlan.timeGridTips': '* สีแดง = มีการจอง, สีขาว = ว่าง',

    // Wizard Steps
    'wizard.step.schedule': 'วันเวลา',
    'wizard.step.table': 'เลือกโต๊ะ',
    'wizard.step.confirm': 'ยืนยัน',
    'wizard.fullBooked': 'เต็มแล้ว',
    'wizard.back': 'ย้อนกลับ',
    'wizard.continue': 'ดำเนินการต่อ',
    'wizard.table': 'เลือกโต๊ะ',
    'wizard.view.map': 'มุมมองแผนผัง',
    'wizard.view.list': 'มุมมองรายการ',

    // Table Status
    'table.status.available': 'ว่าง',
    'table.status.booked': 'จองแล้ว',
    'table.status.selected': 'เลือกอยู่',
    'table.status.unavailable': 'ไม่ว่าง',
    'table.clickToSelect': 'คลิกที่โต๊ะเพื่อเลือก',
    'table.selectedLabel': 'โต๊ะที่เลือก',
    'table.selectFromMap': 'กรุณาเลือกโต๊ะจากแผนผัง',

    // Admin Dashboard
    'admin.dashboard.title': 'ภาพรวมการจองวันนี้',
    'admin.dashboard.subtitle': 'รายการจองวันที่',
    'admin.dashboard.today': 'วันนี้',
    'admin.dashboard.week': 'สัปดาห์นี้',
    'admin.dashboard.stats.guests': 'จำนวนลูกค้า (Pax)',
    'admin.dashboard.stats.waiting': 'รอคอนเฟิร์ม',
    'admin.dashboard.stats.confirmed': 'ยืนยันแล้ว',
    'admin.dashboard.stats.cancelled': 'ยกเลิก',
    'admin.dashboard.stats.completed': 'เสร็จสิ้น',
    'admin.dashboard.peak.title': 'ช่วงเวลาที่คึกคักที่สุดวันนี้ (Peak Hours)',
    'admin.dashboard.tableStatus.title': 'สถานะโต๊ะในร้าน',
    'admin.dashboard.tableStatus.available': 'ว่าง (Available)',
    'admin.dashboard.tableStatus.booked': 'จองแล้ว (Booked)',
    'admin.dashboard.forecast.title': 'คำแนะนำ',

    // Admin Reservations
    'admin.reservations.title': 'รายการจองทั้งหมด',
    'admin.reservations.exportCSV': 'Export CSV',
    'admin.reservations.create': 'สร้างการจอง',
    'admin.reservations.search': 'ค้นหาชื่อ หรือ เบอร์โทร...',
    'admin.reservations.filter.all': 'สถานะทั้งหมด',
    'admin.reservations.filter.pending': 'รอยืนยัน',
    'admin.reservations.filter.confirmed': 'ยืนยันแล้ว',
    'admin.reservations.filter.cancelled': 'ยกเลิก',
    'admin.reservations.filter.completed': 'เสร็จสิ้น',
    'admin.reservations.table.datetime': 'วัน-เวลา',
    'admin.reservations.table.guest': 'ลูกค้า',
    'admin.reservations.table.table': 'โต๊ะ',
    'admin.reservations.table.notes': 'หมายเหตุ (Staff)',
    'admin.reservations.table.status': 'สถานะ',
    'admin.reservations.table.slip': 'สลิป',
    'admin.reservations.table.actions': 'จัดการ',
    'admin.reservations.actions.print': 'พิมพ์ใบยืนยัน',
    'admin.reservations.actions.edit': 'แก้ไขข้อมูล',
    'admin.reservations.actions.approve': 'อนุมัติ',
    'admin.reservations.actions.complete': 'เสร็จสิ้น',
    'admin.reservations.actions.cancel': 'ยกเลิก',
    'admin.reservations.actions.delete': 'ลบถาวร',
    'admin.reservations.loading': 'กำลังโหลดข้อมูล...',
    'admin.reservations.noData': 'ไม่พบข้อมูลการจอง',
    'admin.reservations.viewSlip': 'ดูสลิป',
    'admin.reservations.noSlip': 'ไม่มีสลิป',
    'admin.reservations.guests': 'ท่าน',

    // Admin Settings
    'admin.settings.title': 'ตั้งค่าระบบ',
    'admin.settings.hours.title': 'เวลาทำการ',
    'admin.settings.hours.to': 'ถึง',
    'admin.settings.hours.save': 'บันทึกเวลาทำการ',
    'admin.settings.staff.title': 'จัดการพนักงาน (2)',
    'admin.settings.staff.description': 'ผู้ดูแลระบบสามารถแก้ไขข้อมูลพนักงานและเลื่อนตำแหน่งได้จากที่นี่',
    'admin.settings.staff.edit': 'แก้ไขข้อมูล',
    'admin.settings.staff.delete': 'ลบออก',
    'admin.settings.staff.promote': 'เลื่อนเป็น Admin',

    // Common Admin
    'common.save': 'บันทึก',
    'common.cancel': 'ยกเลิก',
    'common.delete': 'ลบ',
    'common.edit': 'แก้ไข',
    'common.close': 'ปิด',
    'common.loading': 'กำลังโหลด...',
    'common.success': 'สำเร็จ',
    'common.error': 'ข้อผิดพลาด',
    'common.uploading': 'กำลังอัปโหลด...',
    'common.processing': 'กำลังประมวลผล...',

    // Admin Login & Roles
    'admin.login.title': 'ลงชื่อเข้าใช้ระบบ (Admin)',
    'admin.login.email': 'อีเมลสารพัดประโยชน์',
    'admin.login.password': 'รหัสผ่าน',
    'admin.login.button': 'เข้าสู่ระบบ',
    'admin.login.role.admin': 'ผู้ดูแลระบบ',
    'admin.login.role.staff': 'พนักงาน',
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
    'hero.subtitle':
      'Book your table in advance for convenience and experience exceptional atmosphere.',
    'hero.cta': 'Book Now',
    'hero.imageAlt': 'Elegant restaurant atmosphere',

    'info.whyChooseUs': 'Why Choose Us',
    'info.whyChooseUsDesc':
      'Experience exceptional dining with our commitment to quality, service, and atmosphere.',

    'info.premium.title': 'Premium Service',
    'info.premium.desc':
      'Convenient, fast, and highly efficient online table booking service to meet all your needs.',
    'info.service.title': 'Professional Team',
    'info.service.desc':
      'Expert team ready to serve you 24/7, resolving issues quickly and efficiently.',
    'info.modern.title': 'Modern System',
    'info.modern.desc':
      'Latest technology for a smooth, secure, and user-friendly booking experience.',

    'trust.ssl.title': 'SSL Secured',
    'trust.ssl.desc': 'Your data is protected with high-level encryption.',
    'trust.star.title': '5-Star Standard',
    'trust.star.desc': 'Certified quality by the Restaurant Association.',
    'trust.health.title': 'Certified Standard',
    'trust.health.desc': 'Meets safety and hygiene standards.',

    'holiday.title': 'Special Holiday Announcement',
    'holiday.message':
      'We apologize for the inconvenience as we will be closed on the following dates:',

    'contact.visitUs': 'Visit Us',
    'contact.subtitle': 'Find us at our convenient location.',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.address': 'Address',
    'contact.address.full': 'University of Phayao, 19 Moo 2, Maeka, Mueang, Phayao 56000',

    'hours.title': 'Opening Hours',
    'hours.subtitle': 'We are ready to serve you all week.',
    'hours.openNow': 'Open Now',
    'hours.closedNow': 'Currently Closed',
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
    'validation.attachSlip': 'Please fill in details and attach payment slip',

    // Loading
    'loading.uploadTitle': 'Uploading...',
    'loading.uploadDesc': 'Please wait while we upload your payment slip...',
    'loading.confirmTitle': 'Confirming...',
    'loading.confirmDesc': 'Saving your reservation and confirming your table...',

    // Payment
    'payment.title': 'Advance Deposit',
    'payment.desc': 'To confirm your reservation, please transfer a deposit of',
    'payment.deposit': '200 THB',
    'payment.desc_suffix': '(Deducted from total bill)',
    'payment.scan': 'Scan to Pay',
    'payment.ready': 'Slip Attached',
    'payment.amount': 'Deposit 200.00 THB',
    'payment.upload': 'Upload Payment Slip',
    'payment.upload.label': 'Click here to upload slip',
    'payment.upload.click': 'Click to change image',
    'payment.upload.hint': 'Supports JPG, PNG (Max 5MB)',
    'payment.upload.change': 'Click to change image',

    // Policy
    'policy.title': 'Reservation Policy',
    'policy.desc':
      'Please arrive within 15 minutes of your booking time. For groups larger than 6, please call us directly at 081-222-2222',

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
    'notFound.description':
      'The page you are looking for does not exist. Please check the URL or go back to home.',
    'notFound.goBack': 'Go Back',

    'admin.floorPlan.title': 'Floor Plan Management',
    'admin.floorPlan.subtitle': 'Manage restaurant layout and table positions',
    'admin.floorPlan.save': 'Save Layout',
    'admin.floorPlan.saved': 'Details Saved!',
    'admin.floorPlan.addTable': 'Add Table',
    'admin.floorPlan.tips': 'Tips',
    'admin.floorPlan.tip1': 'Drag tables to reposition.',
    'admin.floorPlan.tip2': 'Changes are applied only after saving.',
    'admin.floorPlan.tip3': 'Double-click a table to edit details.',
    'admin.floorPlan.shapes.rect': 'Rectangle',
    'admin.floorPlan.shapes.circle': 'Circle',
    'admin.floorPlan.loading': 'Loading layout...',
    'admin.floorPlan.editModal.title': 'Edit Table Details',
    'admin.floorPlan.editModal.name': 'Table Name',
    'admin.floorPlan.editModal.capacity': 'Capacity (Pax)',
    'admin.floorPlan.editModal.zone': 'Zone',
    'admin.floorPlan.editModal.shape': 'Shape',
    'admin.floorPlan.editModal.update': 'Update',
    'admin.floorPlan.editModal.delete': 'Delete Table',
    'admin.floorPlan.editModal.confirmDelete': 'Are you sure you want to delete this table?',
    'admin.floorPlan.selectDate': 'Select Date',
    'admin.floorPlan.mode.edit': 'Edit Layout',
    'admin.floorPlan.mode.check': 'Check Status',
    'admin.floorPlan.configureSettings': 'Configure Table Details',
    'admin.floorPlan.showingBookingsWait': '* Showing bookings for 2 hours after selected time',
    'admin.floorPlan.tableCount': '{count} Tables',
    'admin.floorPlan.checkButton': 'Check Status',
    'admin.floorPlan.legend.available': 'Available',
    'admin.floorPlan.legend.selected': 'Selected',
    'admin.floorPlan.legend.booked': 'Booked',
    'admin.floorPlan.noTablesInZone': 'No tables in this zone',
    'admin.floorPlan.allZones': 'All Zones',
    'admin.floorPlan.entrance': 'Entrance',
    'admin.floorPlan.zone.indoor': 'Indoor Zone',
    'admin.floorPlan.zone.outdoor': 'Outdoor Zone',
    'admin.floorPlan.zone.vip': 'VIP Zone',
    'admin.floorPlan.cashier': 'Cashier Counter',

    // Wizard Steps
    'wizard.step.schedule': 'Schedule',
    'wizard.step.table': 'Select Table',
    'wizard.step.confirm': 'Confirm',
    'wizard.fullBooked': 'Full Booked',

    // Table Status
    'table.status.available': 'Available',
    'table.status.booked': 'Booked',
    'table.status.selected': 'Selected',
    'table.status.unavailable': 'Unavailable',
    'payment.promptpay': 'PromptPay',
    'payment.prepayment': 'Advance Deposit',
    'payment.deposit_info':
      'Deposit of 200 THB will be deducted from your total bill (No booking fee)',
    'table.clickToSelect': 'Click table to select',
    'table.selectedLabel': 'Selected Table',
    'table.selectFromMap': 'Please select a table from the map',
    'validation.fillAll': 'Please fill in all fields',
    'wizard.back': 'Back',
    'wizard.continue': 'Continue',
    'wizard.table': 'Select Table',
    'wizard.view.map': 'Map View',
    'wizard.view.list': 'List View',

    // Admin Dashboard
    'admin.dashboard.title': 'Today\'s Reservations Overview',
    'admin.dashboard.subtitle': 'Reservations for',
    'admin.dashboard.today': 'Today',
    'admin.dashboard.week': 'This Week',
    'admin.dashboard.stats.guests': 'Total Guests (Pax)',
    'admin.dashboard.stats.waiting': 'Awaiting Confirmation',
    'admin.dashboard.stats.confirmed': 'Confirmed',
    'admin.dashboard.stats.cancelled': 'Cancelled',
    'admin.dashboard.stats.completed': 'Completed',
    'admin.dashboard.peak.title': 'Peak Hours Today',
    'admin.dashboard.tableStatus.title': 'Table Status',
    'admin.dashboard.tableStatus.available': 'Available',
    'admin.dashboard.tableStatus.booked': 'Booked',
    'admin.dashboard.forecast.title': 'Recommendations',

    // Admin Reservations
    'admin.reservations.title': 'All Reservations',
    'admin.reservations.exportCSV': 'Export CSV',
    'admin.reservations.create': 'Create Booking',
    'admin.reservations.search': 'Search name or phone...',
    'admin.reservations.filter.all': 'All Status',
    'admin.reservations.filter.pending': 'Pending',
    'admin.reservations.filter.confirmed': 'Confirmed',
    'admin.reservations.filter.cancelled': 'Cancelled',
    'admin.reservations.filter.completed': 'Completed',
    'admin.reservations.table.datetime': 'Date & Time',
    'admin.reservations.table.guest': 'Guest',
    'admin.reservations.table.table': 'Table',
    'admin.reservations.table.notes': 'Notes (Staff)',
    'admin.reservations.table.status': 'Status',
    'admin.reservations.table.slip': 'Slip',
    'admin.reservations.table.actions': 'Actions',
    'admin.reservations.actions.print': 'Print Confirmation',
    'admin.reservations.actions.edit': 'Edit Details',
    'admin.reservations.actions.approve': 'Approve',
    'admin.reservations.actions.complete': 'Complete',
    'admin.reservations.actions.cancel': 'Cancel',
    'admin.reservations.actions.delete': 'Delete Permanently',
    'admin.reservations.loading': 'Loading data...',
    'admin.reservations.noData': 'No reservations found',
    'admin.reservations.viewSlip': 'View Slip',
    'admin.reservations.noSlip': 'No Slip',
    'admin.reservations.guests': 'guests',

    // Admin Settings
    'admin.settings.title': 'System Settings',
    'admin.settings.hours.title': 'Business Hours',
    'admin.settings.hours.to': 'to',
    'admin.settings.hours.save': 'Save Business Hours',
    'admin.settings.staff.title': 'Staff Management',
    'admin.settings.staff.description': 'Administrators can edit staff info and promote users here',
    'admin.settings.staff.edit': 'Edit Details',
    'admin.settings.staff.delete': 'Remove',
    'admin.settings.staff.promote': 'Promote to Admin',

    // Common Admin
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',

    // Admin Login & Roles
    'admin.login.title': 'Admin Login',
    'admin.login.email': 'Email Address',
    'admin.login.password': 'Password',
    'admin.login.button': 'Login',
    'admin.login.role.admin': 'Administrator',
    'admin.login.role.staff': 'Staff',
  },
};

export const useTranslation = (locale: Locale = 'th') => {
  const t = useCallback(
    (key: keyof (typeof translations)['th'], params?: Record<string, string | number>) => {
      const translation = translations[locale as keyof typeof translations];
      let text = (translation as any)[key] || key;

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          text = text.replace(`{${key}}`, String(value));
        });
      }

      return text;
    },
    [locale]
  );
  return useMemo(() => ({ t }), [t]);
};
