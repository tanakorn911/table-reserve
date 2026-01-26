# 🎫 TableReserve - ระบบจองโต๊ะร้านอาหารออนไลน์

> ระบบจัดการจองโต๊ะแบบครบวงจร พร้อมหน้าจอ Admin และ Customer ที่ใช้งานง่าย

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.0-green)](https://supabase.com/)

---

## ✨ ฟีเจอร์หลัก

### 👤 สำหรับลูกค้า

- **จองโต๊ะออนไลน์** - เลือกวัน เวลา และโต๊ะที่ต้องการผ่านผังร้านแบบ Interactive
- **รองรับ 2 ภาษา** - สลับระหว่างไทย/อังกฤษได้ทันที
- **ชำระเงินมัดจำ** - สแกน QR PromptPay และอัปโหลดสลิป
- **ตรวจสอบสถานะ** - เช็คการจองผ่านรหัส BX-XXXXXX หรือเบอร์โทร
- **Rate Limiting** - ป้องกัน Spam การจองด้วย Upstash Redis
- **Fail-safe System** - ระบบสำรองข้อมูล หาก Rate Limit มีปัญหา ลูกค้ายังจองได้ต่อเนื่อง

### 🔐 สำหรับพนักงาน/Admin

- **Dashboard** - ภาพรวมการจองรายวัน แสดงสถิติและกราฟ
- **จัดการรายการจอง** - อนุมัติ/ยกเลิก/แก้ไข ดูสลิปการโอนเงิน
- **จัดการผังร้าน** - ลาก-วางโต๊ะ ปรับตำแหน่งแบบ Real-time
- **ตั้งค่าระบบ** - เวลาเปิด-ปิดร้าน จัดการพนักงาน
- **Bilingual Admin** - รองรับภาษาไทย/อังกฤษทั้งระบบ
- **Role-Based Access** - แยกสิทธิ์ Admin และ Staff ชัดเจน

---

## 🚀 การติดตั้ง

### ข้อกำหนดระบบ

- Node.js 18+ 
- Supabase Account
- Upstash Redis Account (สำหรับ Rate Limiting)
- LINE Notify Token (สำหรับแจ้งเตือน, ไม่บังคับ)

### ขั้นตอนการติดตั้ง

1. **Clone โปรเจค**
   ```bash
   git clone <repository-url>
   cd table-reserve
   ```

2. **ติดตั้ง Dependencies**
   ```bash
   npm install
   ```

3. **ตั้งค่า Environment Variables**
   
   สร้างไฟล์ `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   UPSTASH_REDIS_REST_URL=your_upstash_url # For Rate Limiting
   UPSTASH_REDIS_REST_TOKEN=your_upstash_token
   LINE_CHANNEL_ACCESS_TOKEN=your_line_token
   LINE_TARGET_ID=your_line_id
   ```

4. **Setup Database**
   - สร้างตาราง `reservations`, `tables`, `settings`, `profiles` ใน Supabase
   - เปิดใช้งาน Row Level Security (RLS)
   - Import schema จาก `/supabase` (ถ้ามี)

5. **รันโปรเจค**
   ```bash
   npm run dev
   ```
   เปิด [http://localhost:4028](http://localhost:4028)

---

## 📦 Deploy ขึ้น Production

### Deploy ด้วย Vercel (แนะนำ)

1. Push โค้ดขึ้น GitHub
2. เข้า [Vercel](https://vercel.com) → Import Project
3. เลือก Repository
4. ตั้งค่า Environment Variables ใน Settings
5. Deploy!

### Environment Variables สำหรับ Production

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_TARGET_ID=
```

---

## 🎯 การใช้งาน

### สำหรับลูกค้า

1. เข้า Homepage
2. กดปุ่ม "จองโต๊ะเดี๋ยวนี้"
3. เลือกจำนวนคน → เลือกวันเวลา → เลือกโต๊ะ
4. กรอกข้อมูลและอัปโหลดสลิป
5. รับรหัสจอง BX-XXXXXX

### สำหรับ Admin/Staff

1. เข้า `/admin/login`
2. เข้าสู่ระบบด้วย Email/Password (Supabase Auth)
3. ดู Dashboard, จัดการจอง, แก้ไขผังร้าน
4. สลับภาษา TH/EN ได้ตลอดเวลา

**Default Admin:**
- ตั้งค่าใน Supabase Auth และเพิ่ม role ใน `profiles` table

---

## 🔒 ความปลอดภัย

- ✅ Authentication ด้วย Supabase Auth
- ✅ Protected API Routes (ต้อง login)
- ✅ Row Level Security (RLS) ในฐานข้อมูล
- ✅ Input Validation ทุก endpoint
- ✅ SQL Injection Prevention

---

## 🛠️ เทคโนโลยีที่ใช้

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React Framework (App Router) |
| **TypeScript** | Type Safety |
| **Tailwind CSS** | Styling |
| **Supabase** | Database + Auth + Storage |
| **React Context** | State Management |
| **Heroicons** | Icon Library |

---

## 📚 โครงสร้างโปรเจค

```
table-reserve/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin Panel (Dashboard, Settings, etc.)
│   │   ├── api/            # API Routes
│   │   ├── reservation-form/  # Customer Booking Flow
│   │   └── page.tsx        # Homepage
│   ├── components/         # Reusable Components
│   ├── lib/               # Utilities (Supabase, i18n, notifications)
│   └── types/             # TypeScript Types
└── public/                # Static Assets
```

---

## 🤝 สนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:
- 📧 Email: tanakorn488@outlook.com
- 🐛 Issues: [GitHub Issues](https://github.com/tanakorn911/table-reserve/issues)

---

## 📄 License

MIT License - ใช้งานได้อย่างอิสระ

---

**สร้างด้วย ❤️ สำหรับประสบการณ์การจองโต๊ะที่ยอดเยี่ยม**
