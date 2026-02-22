// LINE Messaging API Endpoint สำหรับส่งข้อความ Push
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/push';

/**
 * ฟังก์ชันสำหรับส่งการแจ้งเตือนผ่าน LINE
 * @param message ข้อความที่ต้องการส่ง
 * @param imageUrl (ตัวเลือก) URL ของรูปภาพที่ต้องการส่งแนบไป
 */
export async function sendLineNotification(message: string, imageUrl?: string) {
  // ดึง Access Token จาก Environment Variable
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  // ดึง User ID เป้าหมายที่จะรับข้อความจาก Environment Variable
  const targetId = process.env.LINE_TARGET_ID;

  // ตรวจสอบว่ามี Token และ Target ID ครบหรือไม่ ถ้าไม่ครบให้ข้ามการส่ง
  if (!token || !targetId) {
    console.warn('LINE Messaging API keys not set. Notification skipped:', message);
    return;
  }

  try {
    // เตรียม array ของข้อความที่จะส่งเริ่มต้นด้วยข้อความ text
    const messages: any[] = [
      {
        type: 'text', // ประเภทเป็นข้อความ
        text: message, // เนื้อหาข้อความ
      },
    ];

    // ถ้ามี URL รูปภาพแนบมาด้วย ให้เพิ่ม object รูปภาพเข้าไปใน messages array
    if (imageUrl) {
      messages.push({
        type: 'image', // ประเภทเป็นรูปภาพ
        originalContentUrl: imageUrl, // URL รูปภาพขนาดจริง
        previewImageUrl: imageUrl, // URL รูปภาพสำหรับแสดงตัวอย่าง
      });
    }

    // ทำการส่ง HTTP POST request ไปยัง LINE API
    const response = await fetch(LINE_MESSAGING_API, {
      method: 'POST', // ใช้ method POST
      headers: {
        Authorization: `Bearer ${token}`, // ยืนยันตัวตนด้วย Bearer Token
        'Content-Type': 'application/json', // เนื้อหาเป็น JSON
      },
      body: JSON.stringify({
        to: targetId, // ระบุผู้รับ (User ID)
        messages, // ส่ง array ของข้อความ/รูปภาพ
      }),
    });

    // ตรวจสอบสถานะการตอบกลับว่าสำเร็จหรือไม่ (200 OK)
    if (!response.ok) {
      // หากไม่สำเร็จ ให้อ่าน error message จาก response และ log แสดงข้อผิดพลาด
      const error = await response.json();
      console.error('Failed to send LINE message:', error);
    }
  } catch (error) {
    // จับ error กรณีเกิดข้อผิดพลาดในการเชื่อมต่อหรืออื่นๆ
    console.error('Error sending LINE message:', error);
  }
}

/**
 * ฟังก์ชันสำหรับส่งอีเมลยืนยันการจอง (โดยใช้ Resend API)
 * @param to อีเมลปลายทางของผู้รับ
 * @param reservation ข้อมูลการจอง (object)
 * @param locale ภาษาที่ใช้ (ค่าเริ่มต้น 'th' สำหรับภาษาไทย)
 */
export async function sendEmailConfirmation(to: string, reservation: any, locale: string = 'th') {
  // ตรวจสอบว่ามี API Key ของ Resend หรือไม่
  if (!process.env.RESEND_API_KEY) {
    // หากไม่มี ให้แจ้งเตือนใน Console และจบการทำงาน (ไม่ส่งจริง)
    console.warn('[Email Mock] No RESEND_API_KEY. Logged:', to, reservation.id);
    return;
  }

  // กำหนดหัวข้ออีเมล (Subject) ตามภาษาที่เลือก
  const subject =
    locale === 'en'
      ? `Booking Confirmed - ${reservation.booking_code || reservation.id.slice(0, 8)}` // อังกฤษ
      : `ยืนยันการจองโต๊ะของคุณ - ${reservation.booking_code || reservation.id.slice(0, 8)}`; // ไทย

  // สร้างเนื้อหา HTML ของอีเมล ตามภาษาที่เลือก
  const htmlContent =
    locale === 'en'
      ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #3b82f6;">Your Booking is Confirmed!</h2>
            <p>Dear ${reservation.guest_name}, thank you for booking with us.</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Booking Ref:</strong> #${reservation.booking_code || reservation.id.slice(0, 8)}</p>
                <p><strong>Date:</strong> ${reservation.reservation_date}</p>
                <p><strong>Time:</strong> ${reservation.reservation_time}</p>
                <p><strong>Guests:</strong> ${reservation.party_size}</p>
                <p><strong>Table:</strong> ${reservation.table_number ? 'Table ' + reservation.table_number : 'Assigned at arrival'}</p>
            </div>
            <p style="font-size: 14px; color: #666;">Please arrive 15 minutes early. <br />Contact us: 080-931-7630</p>
        </div>
    `
      : `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #3b82f6;">การจองของคุณได้รับการยืนยันแล้ว!</h2>
            <p>ขอบคุณคุณ ${reservation.guest_name} ที่ไว้วางใจจองโต๊ะกับเรา</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>รหัสการจอง:</strong> #${reservation.booking_code || reservation.id.slice(0, 8)}</p>
                <p><strong>วันที่:</strong> ${reservation.reservation_date}</p>
                <p><strong>เวลา:</strong> ${reservation.reservation_time} น.</p>
                <p><strong>จำนวนแขก:</strong> ${reservation.party_size} ท่าน</p>
                <p><strong>โต๊ะ:</strong> ${reservation.table_number ? 'โต๊ะ ' + reservation.table_number : 'จัดหน้างาน'}</p>
            </div>
            <p style="font-size: 14px; color: #666;">กรุณามาถึงก่อนเวลา 15 นาที <br />หากมีข้อสงสัยโทร: 080-931-7630</p>
        </div>
    `;

  try {
    // ในช่วงพัฒนา (ไม่มี Custom Domain) Resend จะบังคับให้ส่งเข้าอีเมลตัวเองที่สมัครไว้เท่านั้น
    // ทดสอบเปลี่ยนอีเมลเป้าหมายถ้าใช้งานโหมด DEV ไปที่อีเมลทดสอบ
    const isDev = process.env.NODE_ENV === 'development';
    const targetEmail = isDev ? 'tanakorn488@outlook.com' : to;

    // ส่งคำสั่ง POST ไปยัง Resend API เพื่อส่งอีเมล
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`, // ใส่ API Key ใน Header
        'Content-Type': 'application/json', // เนื้อหาเป็น JSON
      },
      body: JSON.stringify({
        from: 'Savory Bistro <onboarding@resend.dev>', // ผู้ส่ง (ต้อง verify domain กับ Resend หรือใช้อีเมลทดสอบ)
        to: [targetEmail], // ผู้รับ (array ของอีเมล)
        subject: isDev && to !== targetEmail ? `[TEST for ${to}] ` + subject : subject, // หัวข้ออีเมล
        html: htmlContent, // เนื้อหา HTML
      }),
    });

    // ตรวจสอบว่าส่งสำเร็จหรือไม่
    if (!response.ok) {
      // หากส่งไม่สำเร็จ ให้ log error
      const err = await response.json();
      if (err.statusCode === 403 && err.message.includes('verify a domain')) {
        console.warn('⚠️ [Resend Alert] ไม่สามารถส่งอีเมลไปยัง', to, 'ได้เนื่องจากยังไม่ได้ยืนยันโดเมน กรุณายืนยันโดเมนในเว็บ Resend หรือทดสอบด้วยอีเมล tanakorn488@outlook.com');
      } else {
        console.error('Resend Error:', err);
      }
    } else {
      console.log(`✅ ส่งอีเมลยืนยันสำเร็จไปยัง ${targetEmail}`);
    }
  } catch (err) {
    // จับ error กรณี network fail หรืออื่นๆ
    console.error('Email failed:', err);
  }
}
