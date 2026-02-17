import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * HTML Escape — ป้องกัน HTML Injection ใน email templates
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Email Reminder API
 * Sends reminder emails 2 hours before reservation
 * Also notifies admin about upcoming reservations
 * This endpoint should be called by a cron job every 30 minutes
 * API สำหรับส่งอีเมลแจ้งเตือนล่วงหน้า 2 ชั่วโมง (ทำงานผ่าน Cron Job)
 * 
 * ⚠️ ต้องส่ง Authorization: Bearer <CRON_SECRET> header มาด้วย
 */
export async function GET(request: NextRequest) {
    // ตรวจสอบ CRON_SECRET เพื่อป้องกันการเรียกจากภายนอก
    if (CRON_SECRET) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Calculate time window (reservations happening in 2-2.5 hours)
        // คำนวณช่วงเวลาที่จะค้นหา (การจองที่จะเกิดขึ้นในอีก 2-2.5 ชั่วโมงข้างหน้า)
        const now = new Date();
        const thailandOffset = 7 * 60;
        const localOffset = now.getTimezoneOffset();
        const thailandTime = new Date(now.getTime() + (thailandOffset + localOffset) * 60000);

        const todayStr = thailandTime.toISOString().split('T')[0];
        const currentHour = thailandTime.getHours();
        const currentMinute = thailandTime.getMinutes();

        // Target: Reservations in 2 hours from now
        // เป้าหมาย: การจองในอีก 2 ชั่วโมงข้างหน้า
        const targetHour = currentHour + 2;
        const targetTime = `${String(targetHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

        // Find confirmed reservations that are about to happen
        // ค้นหาการจองสถานะ 'confirmed' ที่กำลังจะถึงเวลา
        const { data: upcomingReservations, error: fetchError } = await supabase
            .from('reservations')
            .select('*')
            .eq('reservation_date', todayStr)
            .eq('status', 'confirmed')
            .gte('reservation_time', targetTime)
            .lte('reservation_time', `${String(targetHour).padStart(2, '0')}:30:00`);

        if (fetchError) {
            throw fetchError;
        }

        if (!upcomingReservations || upcomingReservations.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No upcoming reservations to remind',
                sent: 0,
            });
        }

        // Check if Resend API key is available
        // ตรวจสอบว่ามี API Key ของ Resend หรือไม่
        const resendApiKey = process.env.RESEND_API_KEY;
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@tablereserve.com';

        const reminders: any[] = [];

        for (const reservation of upcomingReservations) {
            // Check if already reminded (using special_requests field as marker)
            // ตรวจสอบว่าเคยแจ้งเตือนไปแล้วหรือยัง
            if (reservation.reminder_sent) {
                continue;
            }

            // If customer has email, send reminder
            // ถ้าลูกค้ามีอีเมล ให้ส่งอีเมลแจ้งเตือน
            if (resendApiKey && reservation.guest_email) {
                try {
                    const response = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${resendApiKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: 'Savory Bistro <noreply@tablereserve.com>',
                            to: reservation.guest_email,
                            subject: `🍽️ อีก 2 ชั่วโมงถึงเวลาจองโต๊ะแล้ว! - ${reservation.booking_code}`,
                            html: generateCustomerReminderEmail(reservation),
                        }),
                    });

                    if (response.ok) {
                        reminders.push({
                            id: reservation.id,
                            type: 'customer',
                            email: reservation.guest_email,
                        });
                    }
                } catch (err) {
                    console.error('Failed to send customer reminder:', err);
                }
            }

            // Send admin notification
            // ส่งอีเมลแจ้งเตือนผู้ดูแลระบบ
            if (resendApiKey && adminEmail) {
                try {
                    const response = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${resendApiKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: 'Savory Bistro <noreply@tablereserve.com>',
                            to: adminEmail,
                            subject: `📋 ลูกค้ากำลังจะมาในอีก 2 ชม. - ${reservation.guest_name}`,
                            html: generateAdminNotificationEmail(reservation),
                        }),
                    });

                    if (response.ok) {
                        reminders.push({
                            id: reservation.id,
                            type: 'admin',
                            email: adminEmail,
                        });
                    }
                } catch (err) {
                    console.error('Failed to send admin notification:', err);
                }
            }

            // Mark as reminded
            // บันทึกสถานะว่าแจ้งเตือนแล้ว
            await supabase
                .from('reservations')
                .update({ reminder_sent: true })
                .eq('id', reservation.id);
        }

        // Also use LINE Notify if available
        // ส่งแจ้งเตือนผ่าน LINE Notify (ถ้าตั้งค่าไว้)
        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        const lineTargetId = process.env.LINE_TARGET_ID;

        if (lineToken && lineTargetId && upcomingReservations.length > 0) {
            const message = `📢 แจ้งเตือน: มีลูกค้า ${upcomingReservations.length} รายกำลังจะมาในอีก 2 ชั่วโมง\n\n` +
                upcomingReservations.map(r =>
                    `• ${r.guest_name} (${r.party_size} คน) - ${r.reservation_time.substring(0, 5)}`
                ).join('\n');

            try {
                await fetch('https://api.line.me/v2/bot/message/push', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${lineToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: lineTargetId,
                        messages: [{ type: 'text', text: message }],
                    }),
                });
                reminders.push({ type: 'line', count: upcomingReservations.length });
            } catch (err) {
                console.error('Failed to send LINE notification:', err);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${reminders.length} reminders`,
            sent: reminders.length,
            details: reminders,
        });

    } catch (error) {
        console.error('Reminder error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process reminders' },
            { status: 500 }
        );
    }
}

function generateCustomerReminderEmail(reservation: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Sarabun', sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #3b5998 0%, #1e3a5f 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .detail { display: flex; margin-bottom: 12px; }
    .label { color: #666; width: 100px; }
    .value { font-weight: bold; color: #333; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🍽️ เตือนความจำ</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">อีก 2 ชั่วโมงถึงเวลาจองโต๊ะแล้ว!</p>
    </div>
    <div class="content">
      <p>สวัสดีครับ/ค่ะ คุณ${escapeHtml(reservation.guest_name)}</p>
      <p>นี่คือการเตือนความจำสำหรับการจองโต๊ะของคุณ:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <div class="detail"><span class="label">รหัสจอง:</span><span class="value">${escapeHtml(reservation.booking_code)}</span></div>
        <div class="detail"><span class="label">วันที่:</span><span class="value">${escapeHtml(reservation.reservation_date)}</span></div>
        <div class="detail"><span class="label">เวลา:</span><span class="value">${escapeHtml(reservation.reservation_time)}</span></div>
        <div class="detail"><span class="label">จำนวน:</span><span class="value">${reservation.party_size} คน</span></div>
      </div>
      
      <p style="color: #666;">กรุณามาถึงก่อนเวลานัดหมาย 10 นาที</p>
    </div>
    <div class="footer">
      Savory Bistro - ระบบจองโต๊ะออนไลน์
    </div>
  </div>
</body>
</html>
  `;
}

function generateAdminNotificationEmail(reservation: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Sarabun', sans-serif; padding: 20px; }
    .alert { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
    .detail { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="alert">
    <strong>📋 ลูกค้ากำลังจะมาในอีก 2 ชั่วโมง</strong>
  </div>
  
  <div class="detail"><strong>ชื่อ:</strong> ${escapeHtml(reservation.guest_name)}</div>
  <div class="detail"><strong>เบอร์โทร:</strong> ${escapeHtml(reservation.guest_phone || '')}</div>
  <div class="detail"><strong>เวลา:</strong> ${escapeHtml(reservation.reservation_time)}</div>
  <div class="detail"><strong>จำนวน:</strong> ${reservation.party_size} คน</div>
  <div class="detail"><strong>โต๊ะ:</strong> ${escapeHtml(reservation.table_name || 'ยังไม่ระบุ')}</div>
  ${reservation.special_requests ? `<div class="detail"><strong>หมายเหตุ:</strong> ${escapeHtml(reservation.special_requests)}</div>` : ''}
  
  <p style="margin-top: 20px; color: #666;">
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/reservations/${reservation.id}">ดูรายละเอียด</a>
  </p>
</body>
</html>
  `;
}
