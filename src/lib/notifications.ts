const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/push';

export async function sendLineNotification(message: string, imageUrl?: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const targetId = process.env.LINE_TARGET_ID;

  if (!token || !targetId) {
    console.warn('LINE Messaging API keys not set. Notification skipped:', message);
    return;
  }

  try {
    const messages: any[] = [
      {
        type: 'text',
        text: message,
      },
    ];

    if (imageUrl) {
      messages.push({
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl,
      });
    }

    const response = await fetch(LINE_MESSAGING_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: targetId,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send LINE message:', error);
    }
  } catch (error) {
    console.error('Error sending LINE message:', error);
  }
}

export async function sendEmailConfirmation(to: string, reservation: any, locale: string = 'th') {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email Mock] No RESEND_API_KEY. Logged:', to, reservation.id);
    return;
  }

  const subject =
    locale === 'en'
      ? `Booking Confirmed - ${reservation.booking_code || reservation.id.slice(0, 8)}`
      : `ยืนยันการจองโต๊ะของคุณ - ${reservation.booking_code || reservation.id.slice(0, 8)}`;

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
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Savory Bistro <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Resend Error:', err);
    }
  } catch (err) {
    console.error('Email failed:', err);
  }
}
