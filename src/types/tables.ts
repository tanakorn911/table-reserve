/**
 * รูปร่างของโต๊ะ (Table Shape)
 * - rectangle: สี่เหลี่ยมผืนผ้า
 * - circle: วงกลม
 * - round-rect: สี่เหลี่ยมมุมมน
 */
export type TableShape = 'rectangle' | 'circle' | 'round-rect';

/**
 * อินเทอร์เฟซข้อมูลโต๊ะ (Table)
 * ใช้สำหรับจัดการ Layout แผนผังร้าน
 */
export interface Table {
  id: number; // รหัสโต๊ะ (Unique ID)
  name: string; // ชื่อเรียกโต๊ะ (เช่น T1, A1, VIP)
  description: string; // รายละเอียดเพิ่มเติม
  capacity: number; // จำนวนที่นั่ง
  is_active?: boolean; // สถานะใช้งาน (true = เปิดจอง, false = ปิด)

  // คุณสมบัติทางกายภาพสำหรับการวาดแผนผัง (Visual properties)
  x: number; // ตำแหน่งแนวนอน (แกน X) เป็นเปอร์เซ็นต์ (0-100)
  y: number; // ตำแหน่งแนวตั้ง (แกน Y) เป็นเปอร์เซ็นต์ (0-100)
  width: number; // ความกว้าง (Pixel หรือ Relative)
  height: number; // ความสูง (Pixel หรือ Relative)
  shape: TableShape; // รูปทรงของโต๊ะ
  zone: string; // โซนที่ตั้ง (เช่น 'indoor', 'outdoor', 'zone1')
}

/**
 * อินเทอร์เฟซสำหรับสร้างโต๊ะใหม่ (Create Table)
 */
export interface CreateTableInput {
  name: string; // ชื่อโต๊ะ
  description: string; // รายละเอียด
  capacity: number; // จำนวนที่นั่ง
  x: number; // ตำแหน่ง X
  y: number; // ตำแหน่ง Y
  width?: number; // ความกว้าง (มีค่า default)
  height?: number; // ความสูง (มีค่า default)
  shape?: TableShape; // รูปทรง (มีค่า default)
  zone?: string; // โซน (Optional)
}

/**
 * อินเทอร์เฟซสำหรับแก้ไขข้อมูลโต๊ะ (Update Table)
 * ทุกค่าเป็น Optional เพราะเลือกแก้ได้บางส่วน
 */
export interface UpdateTableInput {
  name?: string;
  description?: string;
  capacity?: number;
  is_active?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  shape?: TableShape;
  zone?: string;
}
