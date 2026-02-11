# เจาะลึกโค้ดทีละบรรทัด (Detailed Code Walkthrough)

## 1. Middleware (`src/middleware.ts`)

**หน้าที่**: ยามเฝ้าประตู ตรวจสอบทุก request

```typescript
export async function middleware(request: NextRequest) {
    // 1. สร้าง Supabase Client พร้อมจัดการ Cookies
    const supabase = createServerClient(...);
    
    // 2. ตรวจสอบว่ามี user login อยู่หรือไม่
    const { data: { user } } = await supabase.auth.getUser();
    
    // 3. ป้องกันหน้า Admin
    if (pathname.startsWith('/admin')) {
        if (!user) return redirect('/admin/login');
        
        // 4. RBAC: Staff ห้ามเข้า /admin/tables, /admin/settings
        const role = user.user_metadata?.role || 'admin';
        if (role === 'staff' && restrictedPaths.includes(pathname)) {
            return redirect('/admin/dashboard');
        }
    }
    
    // 5. ป้องกัน API
    if (isApi && isWriteOperation && !user) {
        return json({ error: 'Unauthorized' }, 401);
    }
}
```

---

## 2. API Reservations (`src/app/api/reservations/route.ts`)

### GET Method
```typescript
export async function GET(request: Request) {
    // 1. ดึง query params (status, date)
    const { searchParams } = new URL(request.url);
    
    // 2. เช็ค role: Admin ดูได้ทุกฟิลด์, Public ดูได้แค่บางฟิลด์
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = !!user;
    
    // 3. Query Supabase
    let query = supabase.from('reservations').select(
        isAdmin ? '*' : 'id,guest_name,reservation_date,...'
    );
    
    // 4. กรองตาม params
    if (status) query = query.eq('status', status);
    if (date) query = query.eq('reservation_date', date);
}
```

### POST Method
```typescript
export async function POST(request: Request) {
    // 1. Validate ข้อมูล
    if (!guest_name || !party_size) return error(400);
    
    // 2. Rate Limiting (ป้องกัน Spam)
    const recentBookings = await supabase
        .from('reservations')
        .select('*')
        .eq('guest_phone', guest_phone)
        .gte('created_at', fiveMinutesAgo);
    if (recentBookings.length >= 3) return error(429);
    
    // 3. เช็คว่าโต๊ะว่างหรือไม่ (Overlap Check)
    const overlapping = await supabase
        .from('reservations')
        .eq('table_number', table_number)
        .eq('reservation_date', reservation_date)
        .filter(/* เวลาทับซ้อน */);
    if (overlapping.length > 0) return error(409);
    
    // 4. สร้าง Booking Code
    const booking_code = `BK${Date.now().toString(36).toUpperCase()}`;
    
    // 5. บันทึกลง Database
    const { data, error } = await supabase
        .from('reservations')
        .insert({ ...formData, booking_code });
}
```

---

## 3. Reservation Wizard (`src/app/reservation-form/components/ReservationWizard.tsx`)

**Flow**: 4 Steps (Date/Time → Table → Confirm → Payment)

```typescript
const ReservationWizard = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({...});
    
    // Step 1-2: เลือกวันที่ + เวลา + โต๊ะ
    const fetchAvailableTables = async () => {
        const response = await fetch(`/api/tables/available?date=${date}&time=${time}`);
        // กรองเฉพาะโต๊ะที่ capacity >= party_size
        const filtered = tables.filter(t => t.capacity >= formData.party_size);
    };
    
    // Step 3: อัปโหลดสลิปโอนเงิน
    const handleFileUpload = async (file) => {
        const fileName = `${Date.now()}_${file.name}`;
        const { data } = await supabase.storage
            .from('payment-slips')
            .upload(fileName, file);
        return data.publicUrl;
    };
    
    // Step 4: Submit
    const handleSubmit = async () => {
        const response = await fetch('/api/reservations', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        // แสดง Success Modal พร้อม Booking Code
    };
};
```

---

## 4. Core Contexts

### NavigationContext (`src/contexts/NavigationContext.tsx`)
```typescript
// Global State สำหรับ UI
export const NavigationProvider = ({ children }) => {
    const pathname = usePathname(); // ติดตาม URL
    const [locale, setLocale] = useState('th');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // โหลด locale จาก localStorage
    useEffect(() => {
        const stored = localStorage.getItem('app-locale');
        if (stored) setLocale(stored);
    }, []);
    
    // ปิด Mobile Menu เมื่อเปลี่ยนหน้า
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);
};
```

### i18n (`src/lib/i18n.ts`)
```typescript
// ระบบแปลภาษาแบบ Custom
export const translations = {
    th: { 'app.title': 'จองโต๊ะออนไลน์', ... },
    en: { 'app.title': 'Savory Bistro', ... }
};

export const useTranslation = (locale = 'th') => {
    const t = useCallback((key, params) => {
        let text = translations[locale][key] || key;
        // แทนที่ {param} ด้วยค่าจริง
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, v);
            });
        }
        return text;
    }, [locale]);
    return { t };
};
```

---

## 5. Admin Features

### Dashboard (`src/app/admin/dashboard/page.tsx`)
```typescript
// Real-time Dashboard with Auto-refresh
const fetchDashboardData = async () => {
    // 1. ดึงข้อมูลการจองทั้งหมด
    const { data } = await fetch('/api/reservations');
    
    // 2. คำนวณ Stats
    const todayTotal = data.filter(r => r.reservation_date === today).length;
    const todayPending = data.filter(r => r.status === 'pending').length;
    
    // 3. สร้างข้อมูลกราฟ (Hourly Pax)
    const hoursMap = new Map();
    data.forEach(r => {
        const hour = r.reservation_time.split(':')[0];
        hoursMap.set(hour, (hoursMap.get(hour) || 0) + r.party_size);
    });
};

// Auto-refresh ทุก 30 วินาที
useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
}, []);
```

### Reservations Page (`src/app/admin/reservations/page.tsx`)
```typescript
// ฟีเจอร์หลัก:
// - Filter (status, date)
// - Search (name, phone, booking code)
// - Quick Actions (Approve, Cancel, Complete)
// - Print Booking Slip
// - Export CSV

const updateStatus = async (id, newStatus) => {
    await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
    });
    // Optimistic UI Update
    setReservations(prev => prev.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
    ));
};
```

### Settings (`src/app/admin/settings/page.tsx`)
```typescript
// 3 ส่วนหลัก:

// 1. Business Hours
const handleSaveHours = async () => {
    await fetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify({
            key: 'business_hours',
            value: { '0': { open: '10:00', close: '21:00' }, ... }
        })
    });
};

// 2. Staff Management
const toggleRole = async (profileId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'staff' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
};

// 3. Holiday Management
const handleAddHoliday = async () => {
    // รองรับการเพิ่มทีละหลายวัน (Range)
    for (let d = startDate; d <= endDate; d++) {
        datesToInsert.push({ holiday_date: d, description });
    }
    await supabase.from('holidays').insert(datesToInsert);
};
```

### Floor Plan (`src/app/admin/floor-plan/page.tsx`)
```typescript
// 2 Modes: Edit และ Check

// Edit Mode: ลากวางโต๊ะ + แก้ไขรายละเอียด
const handleTableUpdate = async (updatedTable) => {
    await fetch(`/api/tables/${updatedTable.id}`, {
        method: 'PUT',
        body: JSON.stringify({ x, y, name, capacity, shape, zone })
    });
};

// Check Mode: ดูว่าโต๊ะไหนถูกจองในวัน/เวลาที่เลือก
const fetchBookedTables = async () => {
    const response = await fetch(`/api/reservations?date=${checkDate}`);
    // กรองเฉพาะการจองที่เวลาทับซ้อน
    const booked = data.filter(r => {
        const bookingTime = parseInt(r.reservation_time);
        const checkHour = parseInt(checkTime);
        return (bookingTime + 2 > checkHour) && (checkHour + 2 > bookingTime);
    });
    setBookedTables(booked); // ส่งไปให้ FloorPlan แสดงสีแดง
};
```

---

## 6. Public Pages

### Landing Page (`src/app/landing-page/components/LandingPageInteractive.tsx`)
```typescript
// ใช้ Framer Motion สำหรับ Animation
import { motion, useScroll, useTransform } from 'framer-motion';

// Parallax Effect
const { scrollY } = useScroll();
const y1 = useTransform(scrollY, [0, 500], [0, 200]);

// Sticky Booking Button
const [showStickyButton, setShowStickyButton] = useState(false);
useEffect(() => {
    const handleScroll = () => {
        setShowStickyButton(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
}, []);
```

### Check Status (`src/app/check-status/page.tsx`)
```typescript
// ค้นหาการจองด้วย Booking Code
const handleSearch = async (e) => {
    e.preventDefault();
    const response = await fetch(`/api/public/check-booking?code=${bookingCode}`);
    const { data } = await response.json();
    
    // แสดงผลด้วยสีที่แตกต่างตาม status
    const statusConfig = {
        confirmed: { color: 'green', icon: CheckCircleIcon },
        pending: { color: 'amber', icon: ClockIcon },
        cancelled: { color: 'red', icon: XCircleIcon }
    };
};
```

---

## 7. Support APIs

### Tables API (`src/app/api/tables/route.ts`)
- **GET**: ดึงข้อมูลโต๊ะทั้งหมด (รวม x, y, shape)
- **POST**: สร้างโต๊ะใหม่ (Admin only)
- **PUT**: อัปเดตข้อมูลโต๊ะ (Admin only)
- **DELETE**: ลบโต๊ะ (Admin only)

### Settings API (`src/app/api/settings/route.ts`)
```typescript
// เก็บ/ดึง config แบบ Key-Value
export async function GET(request: Request) {
    const key = searchParams.get('key');
    const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .single();
    return json({ data: data?.value });
}

---

**สรุป**: โปรเจกต์นี้ใช้ Next.js 16 (App Router) + Supabase + TypeScript สร้างระบบจองโต๊ะที่มีทั้งหน้าสาธารณะและระบบ Admin ที่สมบูรณ์ พร้อม RBAC, Real-time updates, และ i18n (ไทย/อังกฤษ)
