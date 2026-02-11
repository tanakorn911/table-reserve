/**
 * สถานะของการจอง (Reservation Status)
 * - pending: รอการยืนยัน
 * - confirmed: ยืนยันแล้ว
 * - cancelled: ยกเลิกแล้ว
 * - completed: ลูกค้ามาใช้บริการแล้ว/เสร็จสิ้น
 */
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

/**
 * อินเทอร์เฟซสำหรับข้อมูลการจอง (Reservation)
 * ตรงกับโครงสร้างในฐานข้อมูล Supabase
 */
export interface Reservation {
  id: string; // รหัส UUID ของการจอง
  guest_name: string; // ชื่อลูกค้า
  guest_phone: string; // เบอร์โทรศัพท์ลูกค้า
  guest_email?: string | null; // อีเมลลูกค้า (ไม่บังคับ)
  party_size: number; // จำนวนลูกค้า
  reservation_date: string; // วันที่จอง (Format: YYYY-MM-DD)
  reservation_time: string; // เวลาที่จอง (Format: HH:mm)
  table_number?: number | null; // หมายเลขโต๊ะ (ถ้ามี)
  special_requests?: string | null; // คำขอพิเศษ
  admin_notes?: string | null; // บันทึกสำหรับ Admin (ลูกค้าไม่เห็น)
  payment_slip_url?: string | null; // URL ไฟล์สลิปโอนเงิน (ถ้ามี)
  status: ReservationStatus; // สถานะการจอง
  created_at: string; // เวลาที่สร้างรายการ
  updated_at: string; // เวลาที่แก้ไขล่าสุด
}

/**
 * อินเทอร์เฟซสำหรับข้อมูล Input เมื่อสร้างการจองใหม่
 * (ไม่รวมฟิลด์ที่ Database สร้างให้เอง เช่น id, created_at)
 */
export interface CreateReservationInput {
  guest_name: string; // ชื่อลูกค้า
  guest_phone: string; // เบอร์โทรศัพท์ลูกค้า
  guest_email?: string; // อีเมลลูกค้า
  party_size: number; // จำนวนลูกค้า
  reservation_date: string; // วันที่จอง
  reservation_time: string; // เวลาที่จอง
  table_number?: number; // หมายเลขโต๊ะ
  special_requests?: string; // คำขอพิเศษ
  admin_notes?: string; // บันทึก Admin
  payment_slip_url?: string; // สลิปโอนเงิน
}

/**
 * อินเทอร์เฟซสำหรับข้อมูล Input เมื่อแก้ไขการจอง
 * ทุกฟิลด์เป็น Optional เพราะอาจจะแก้ไขแค่บางค่า
 */
export interface UpdateReservationInput {
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  party_size?: number;
  reservation_date?: string;
  reservation_time?: string;
  table_number?: number;
  special_requests?: string;
  admin_notes?: string;
  payment_slip_url?: string;
  status?: ReservationStatus;
}

// Supabase Database type (สำหรับใช้งานกับ Supabase Client เพื่อให้มี Type support)
export interface Database {
  public: {
    Tables: {
      reservations: {
        Row: Reservation; // ข้อมูลแถวในตาราง
        Insert: CreateReservationInput & { status?: ReservationStatus }; // ข้อมูลสำหรับ Insert
        Update: UpdateReservationInput; // ข้อมูลสำหรับ Update
      };
    };
  };
}
