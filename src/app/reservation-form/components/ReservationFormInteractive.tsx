'use client'; // ใช้ Client Component เพื่อให้สามารถใช้ Hooks (useState, useEffect) ได้

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FormField from './FormField';
import TextInput from './TextInput';
import GuestNumberInput from './GuestNumberInput';
import CalendarPicker from './CalendarPicker';
import TimeGridPicker from './TimeGridPicker';
import TextArea from './TextArea';
import TableSelection from './TableSelection';
import SubmitButton from './SubmitButton';
import SuccessModal from './SuccessModal';
import Icon from '@/components/ui/AppIcon';
import { Table } from '@/types/tables';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import generatePayload from 'promptpay-qr';
import { QRCodeCanvas } from 'qrcode.react';

// โครงสร้างข้อมูลฟอร์ม
interface FormData {
  fullName: string; // ชื่อผู้จอง
  phone: string; // เบอร์โทรศัพท์
  email: string; // อีเมล (Optional)
  guests: string; // จำนวนแขก
  date: string; // วันที่จอง (YYYY-MM-DD)
  time: string; // เวลาจอง (HH:mm)
  tableId: number | undefined; // ID ของโต๊ะที่เลือก
  specialRequests: string; // คำขอพิเศษ
  paymentSlipUrl?: string; // URL ของสลิปโอนเงิน (ถ้ามี)
}

// โครงสร้างข้อความ Error ของแต่ละ Field
interface FormErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  guests?: string;
  date?: string;
  time?: string;
  tableId?: string;
}

// สถานะว่าแต่ละ Field ถูกแตะต้องหรือยัง (Touched State)
interface FormTouched {
  fullName: boolean;
  phone: boolean;
  email: boolean;
  guests: boolean;
  date: boolean;
  time: boolean;
  tableId: boolean;
}

// ข้อมูลรายละเอียดการจองสำหรับแสดงใน Success Modal
interface ReservationDetails {
  id: string; // ID การจอง
  bookingCode?: string; // รหัสอ้างอิงการจอง
  fullName: string;
  phone: string;
  guests: string;
  date: string;
  time: string;
  specialRequests: string;
}

/**
 * ReservationFormInteractive Component
 * ฟอร์มจองโต๊ะแบบหน้าเดียว (Single Page Form)
 * - แสดงฟิลด์ข้อมูลทั้งหมดในหน้าเดียว
 * - มีการตรวจสอบความถูกต้องของข้อมูล (Validation) แบบ Real-time
 * - แสดงสถานะโต๊ะว่าง/ไม่ว่างตามวันเวลาที่เลือก
 * - รองรับการอัปโหลดสลิปโอนเงิน PromptPay
 */
const ReservationFormInteractive = () => {
  const router = useRouter();
  const { locale } = useNavigation(); // ดึงภาษาปัจจุบัน
  const { t } = useTranslation(locale); // ฟังก์ชันแปลภาษา
  const [isHydrated, setIsHydrated] = useState(false); // เช็คว่า Client Load เสร็จหรือยัง

  // State เก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    email: '',
    guests: '',
    date: '',
    time: '',
    tableId: undefined,
    specialRequests: '',
  });

  // State เก็บ Error และ Touched ของฟอร์ม
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({
    fullName: false,
    phone: false,
    email: false,
    guests: false,
    date: false,
    time: false,
    tableId: false,
  });

  const [isLoading, setIsLoading] = useState(false); // สถานะกำลังส่งข้อมูล
  const [showSuccess, setShowSuccess] = useState(false); // แสดง Success Modal
  const [reservationDetails, setReservationDetails] = useState<ReservationDetails | null>(null); // ข้อมูลการจองที่สำเร็จ
  const [minDate, setMinDate] = useState(''); // วันที่ต่ำสุดที่จองได้ (วันนี้)
  const [slipFile, setSlipFile] = useState<File | null>(null); // ไฟล์สลิปโอนเงิน
  const [uploading, setUploading] = useState(false); // สถานะกำลังอัปโหลดรูป
  const supabase = useMemo(() => createClientSupabaseClient(), []); // Supabase Client

  // Effect: ตั้งค่า minDate เป็นวันปัจจุบัน
  useEffect(() => {
    setIsHydrated(true);
    // ตั้งค่า minDate เป็นวันนี้ตามเวลาไทย (UTC+7)
    const today = new Date();
    const thailandOffset = 7 * 60; // UTC+7 in minutes
    const localOffset = today.getTimezoneOffset();
    const thailandTime = new Date(today.getTime() + (thailandOffset + localOffset) * 60000);
    const year = thailandTime.getFullYear();
    const month = String(thailandTime.getMonth() + 1).padStart(2, '0');
    const day = String(thailandTime.getDate()).padStart(2, '0');
    setMinDate(`${year}-${month}-${day}`);
  }, []);

  // State เก็บข้อมูลโต๊ะทั้งหมด
  const [tables, setTables] = useState<Table[]>([]);

  // Effect: ดึงข้อมูลโต๊ะ และ Poll ทุก 10 วินาที
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch('/api/tables');
        const result = await response.json();
        if (result.data) {
          setTables(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch tables:', error);
      }
    };
    fetchTables();

    // Poll for table configuration changes (new tables, edits) every 10 seconds
    const interval = setInterval(fetchTables, 10000);
    return () => clearInterval(interval);
  }, []);

  // State เก็บ ID ของโต๊ะที่ถูกจองแล้ว
  const [bookedTableIds, setBookedTableIds] = useState<number[]>([]);

  // ฟังก์ชันดึงข้อมูลโต๊ะที่ถูกจองตามวันและเวลาที่เลือก
  const fetchBookedTables = useCallback(async () => {
    if (!formData.date || !formData.time) {
      setBookedTableIds([]);
      return;
    }

    try {
      // ดึงข้อมูลการจองทั้งหมดของวันที่เลือก (รวมทั้ง confirmed และ pending)
      const response = await fetch(`/api/reservations?date=${formData.date}`);
      const result = await response.json();

      if (result.data) {
        // กรองเฉพาะการจองที่ชนกับเวลาที่เลือก และมีโต๊ะระบุไว้
        const booked = result.data
          .filter((r: any) => {
            // ระยะเวลาทานอาหาร 90 นาที + Buffer 15 นาที = 105 นาที
            const totalDuration = 90 + 15;

            // แปลงเวลาใน DB เป็นนาที (HH:mm:ss -> minutes)
            const dbTime = r.reservation_time.substring(0, 5);
            const [dbHour, dbMinute] = dbTime.split(':').map(Number);
            const dbMinutes = dbHour * 60 + dbMinute;

            // แปลงเวลาที่เลือกเป็นนาที
            const [selectedHour, selectedMinute] = formData.time.split(':').map(Number);
            const selectedMinutes = selectedHour * 60 + selectedMinute;

            // ตรวจสอบการทับซ้อนของเวลา: |TimeA - TimeB| < 105 นาที
            const diff = Math.abs(dbMinutes - selectedMinutes);

            return (
              diff < totalDuration &&
              r.table_number !== null &&
              (r.status === 'confirmed' || r.status === 'pending')
            );
          })
          .map((r: any) => Number(r.table_number));

        setBookedTableIds(booked);
      }
    } catch (error) {
      console.error('Failed to fetch booked tables:', error);
    }
  }, [formData.date, formData.time]);

  // Effect: ดึงข้อมูลโต๊ะที่ถูกจองเมื่อวัน/เวลาเปลี่ยน และ Poll ทุก 3 วินาที
  useEffect(() => {
    fetchBookedTables(); // Initial fetch

    // Poll every 3 seconds for real-time updates
    const interval = setInterval(fetchBookedTables, 3000);

    return () => clearInterval(interval);
  }, [fetchBookedTables]);

  const guestOptions = [
    { value: '', label: t('form.guests.placeholder') },
    ...Array.from({ length: 6 }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1} ${t('form.guests.label')}`,
    })),
  ];

  // ฟังก์ชันตรวจสอบความถูกต้องของแต่ละ Field (Validation Logic)
  // ตรวจสอบข้อมูลนำเข้าตามกฎทางธุรกิจ (Business Rules)
  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'fullName': {
        const trimmed = value.trim();
        if (!trimmed) return t('validation.name.required');

        // ตรวจสอบความยาว
        if (trimmed.length < 3) return t('validation.name.short');
        if (trimmed.length > 60) return locale === 'th' ? 'ชื่อยาวเกินไป (สูงสุด 60 ตัวอักษร)' : 'Name too long (max 60 characters)';

        // ต้องมีทั้งชื่อและนามสกุล (ตรวจสอบจากการเว้นวรรค)
        if (!trimmed.includes(' ')) return t('validation.name.invalid');

        // ตรวจสอบอักขระที่ไม่ได้รับอนุญาต
        const nameRegex = /^[a-zA-Z\u0e00-\u0e7f\s.-]+$/;
        if (!nameRegex.test(trimmed)) return locale === 'th' ? 'ชื่อมีตัวอักษรที่ไม่ได้รับอนุญาต' : 'Name contains invalid characters';

        return undefined;
      }

      case 'phone': {
        if (!value.trim()) return t('validation.phone.required');
        // ต้องมี 10 หลัก
        if (value.replace(/\D/g, '').length !== 10) return t('validation.phone.invalid');
        return undefined;
      }

      case 'email':
        // อีเมลเป็น Optional แต่ถ้ากรอกต้องถูกต้องตามรูปแบบ
        if (value.trim() && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value))
          return t('validation.email.invalid');
        return undefined;

      case 'guests':
        if (!value) return t('validation.guests.required');
        // จำกัดจำนวนแขกสูงสุด 6 ท่านต่อการจองผ่านเว็บ
        if (parseInt(value) > 6) return t('validation.guests.invalid');
        return undefined;

      case 'date':
        if (!value) return t('validation.date.required');
        if (isHydrated) {
          // ตรวจสอบห้ามเลือกวันที่ผ่านมาแล้ว (Past Date Check)
          const selectedDate = new Date(value + 'T00:00:00');
          const today = new Date();
          const thailandOffset = 7 * 60;
          const localOffset = today.getTimezoneOffset();
          const thailandTime = new Date(today.getTime() + (thailandOffset + localOffset) * 60000);
          thailandTime.setHours(0, 0, 0, 0);
          if (selectedDate < thailandTime) return t('validation.date.past');
        }
        return undefined;

      case 'time':
        if (!value) return t('validation.time.required');
        return undefined;

      case 'tableId':
        if (!value) return t('validation.table.required');
        return undefined;

      default:
        return undefined;
    }
  };

  // จัดการเมื่อมีการเปลี่ยนแปลงข้อมูลใน Input (On Change)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // ล็อคเบอร์โทรให้กรอกได้แค่ตัวเลขและไม่เกิน 10 ตัว
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));

      if (touched.phone) {
        const error = validateField('phone', numericValue);
        setErrors((prev) => ({ ...prev, phone: error }));
      }
      return;
    }

    // ล็อคชื่อ-นามสกุล ให้กรอกได้เฉพาะตัวอักษรไทย อังกฤษ ช่องว่าง . -
    if (name === 'fullName') {
      const filteredValue = value.replace(/[^a-zA-Z\u0e00-\u0e7f\s.-]/g, '');
      setFormData((prev) => ({ ...prev, [name]: filteredValue }));

      if (touched.fullName) {
        const error = validateField('fullName', filteredValue);
        setErrors((prev) => ({ ...prev, fullName: error }));
      }
      return;
    }
  };

  // จัดการเมื่อ Input เสีย Focus (On Blur)
  // เริ่มนับว่า field นี้ถูกใช้งานแล้ว (Touched) และทำการตรวจสอบความถูกต้อง
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof FormData, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // ตรวจสอบความถูกต้องของฟอร์มทั้งหมดก่อน Submit (Final Validation)
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // วนลูปตรวจสอบทุก field
    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      if (key !== 'specialRequests') {
        const value = formData[key];
        const stringValue = value === undefined ? '' : String(value);
        const error = validateField(key, stringValue);
        if (error) {
          newErrors[key as keyof FormErrors] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    // Mark fields as touched to show errors under inputs
    setTouched({
      fullName: true,
      phone: true,
      email: true,
      guests: true,
      date: true,
      time: true,
      tableId: true,
    });

    return isValid;
  };

  // ฟังก์ชันส่งข้อมูลการจอง (Submit Handler)
  // 1. ตรวจสอบความถูกต้อง
  // 2. อัปโหลดสลิป (ถ้ามี)
  // 3. ส่งข้อมูลการจองไปยัง API
  // 4. จัดการผลลัพธ์ (Success/Error)
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    let payment_slip_url = '';
    // ตรวจสอบและอัปโหลดสลิปโอนเงิน (Image Upload)
    if (slipFile) {
      setUploading(true);
      const fileName = `${Date.now()}_${slipFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(fileName, slipFile);

      if (uploadError) {
        console.error('Upload Error:', uploadError);
        alert(t('alert.uploadFailed'));
        setIsLoading(false);
        setUploading(false);
        return;
      }

      // ดึง Public URL สำหรับไฟล์ที่อัปโหลด
      const {
        data: { publicUrl },
      } = supabase.storage.from('payment-slips').getPublicUrl(fileName);

      payment_slip_url = publicUrl;
    }

    try {
      // เรียกใช้ API เพื่อสร้างการจองใหม่
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guest_name: formData.fullName,
          guest_phone: formData.phone,
          guest_email: formData.email || undefined,
          party_size: parseInt(formData.guests),
          reservation_date: formData.date,
          reservation_time: formData.time,
          table_number: formData.tableId,
          special_requests: formData.specialRequests,
          payment_slip_url: payment_slip_url,
          locale: locale,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Reservation failed:', result.error);

        // กรณีโต๊ะถูกแย่งจองตัดหน้า (Conflict Error 409)
        if (response.status === 409) {
          alert(result.error || t('alert.tableTaken'));
          fetchBookedTables(); // รีเฟรชข้อมูลโต๊ะทันที
          setIsLoading(false);
          return;
        }

        alert(`${t('alert.failed')}: ${result.error || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }

      // เตรียมข้อมูลสำหรับแสดงใน Modal ยืนยันผล (Success State)
      const reservationId = result.data?.id || `RES${Date.now().toString().slice(-8)}`;
      const details: ReservationDetails = {
        id: result.data?.id,
        bookingCode: result.data?.booking_code,
        fullName: formData.fullName,
        phone: formData.phone,
        guests: formData.guests,
        date: formData.date,
        time: formData.time,
        specialRequests: formData.specialRequests,
      };

      setReservationDetails(details);
      setShowSuccess(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert(t('alert.connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    router.push('/landing-page'); // กลับไปหน้าแรกหลังจากจองเสร็จ
  };

  // ตรวจสอบสถานะ Form Valid เพื่อเปิด/ปิดปุ่ม Submit (Button State)
  const isFormValid =
    !errors.fullName &&
    !errors.phone &&
    !errors.guests &&
    !errors.date &&
    !errors.time &&
    formData.fullName.trim() !== '' &&
    formData.guests !== '' &&
    formData.date !== '' &&
    formData.time !== '' &&
    formData.tableId !== undefined &&
    slipFile !== null;

  // Placeholder ตอน Loading Scripts (Skeleton UI)
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg shadow-warm p-8">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="space-y-4">
                  <div className="h-12 bg-muted rounded" />
                  <div className="h-12 bg-muted rounded" />
                  <div className="h-12 bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg shadow-warm p-6 lg:p-8">
              {/* Header: ส่วนหัวของฟอร์ม */}
              <div className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-3">
                  {t('form.title')}
                </h1>
                <p className="text-base text-muted-foreground">{t('form.subtitle')}</p>
              </div>

              {/* Form Content: ส่วนกรอกข้อมูลหลัก */}
              <form className="space-y-6">
                {/* 1. Name Input */}
                <FormField
                  label={t('form.name')}
                  required
                  error={touched.fullName ? errors.fullName : undefined}
                  success={touched.fullName && !errors.fullName && formData.fullName.trim() !== ''}
                  htmlFor="fullName"
                >
                  <TextInput
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t('form.placeholder.name')}
                    error={touched.fullName && !!errors.fullName}
                    success={
                      touched.fullName && !errors.fullName && formData.fullName.trim() !== ''
                    }
                    maxLength={60}
                  />
                </FormField>

                {/* 2. Phone Input */}
                <FormField
                  label={t('form.phone')}
                  required
                  error={touched.phone ? errors.phone : undefined}
                  success={touched.phone && !errors.phone && formData.phone.trim() !== ''}
                  htmlFor="phone"
                >
                  <TextInput
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t('form.placeholder.phone')}
                    error={touched.phone && !!errors.phone}
                    success={touched.phone && !errors.phone && formData.phone.trim() !== ''}
                    maxLength={10}
                  />
                </FormField>

                {/* 3. Email Input (Optional) */}
                <FormField
                  label={t('form.email')}
                  error={touched.email ? errors.email : undefined}
                  success={touched.email && !errors.email && formData.email?.trim() !== ''}
                  htmlFor="email"
                >
                  <TextInput
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t('form.placeholder.email')}
                    error={touched.email && !!errors.email}
                    success={touched.email && !errors.email && formData.email?.trim() !== ''}
                  />
                </FormField>

                {/* 4. Guests Selection */}
                <FormField
                  label={
                    <span className="flex items-center gap-2">
                      {t('form.guests')}
                      <span className="text-error font-normal text-base">{t('form.guests.limit')}</span>
                    </span>
                  }
                  required
                  error={touched.guests ? errors.guests : undefined}
                  success={touched.guests && !errors.guests && formData.guests !== ''}
                  htmlFor="guests"
                >
                  <GuestNumberInput
                    id="guests"
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min={1}
                    max={6}
                    error={touched.guests && !!errors.guests}
                    success={touched.guests && !errors.guests && formData.guests !== ''}
                  />
                </FormField>

                {/* 5. Date Selection */}
                <FormField
                  label={t('form.date')}
                  required
                  error={touched.date ? errors.date : undefined}
                  success={touched.date && !errors.date && formData.date !== ''}
                  htmlFor="date"
                >
                  <CalendarPicker
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={(value) => {
                      // Reset เวลาและโต๊ะเมื่อเปลี่ยนวัน
                      setFormData((prev) => ({
                        ...prev,
                        date: value,
                        time: '', // Reset Time
                        tableId: undefined, // Reset Table
                      }));
                      setTouched((prev) => ({ ...prev, date: true }));
                      const error = validateField('date', value);
                      setErrors((prev) => ({ ...prev, date: error }));
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, date: true }));
                    }}
                    minDate={minDate}
                    error={touched.date && !!errors.date}
                    success={touched.date && !errors.date && formData.date !== ''}
                  />
                </FormField>

                {/* 6. Time Selection */}
                <FormField
                  label={t('form.time')}
                  required
                  error={touched.time ? errors.time : undefined}
                  success={touched.time && !errors.time && formData.time !== ''}
                  htmlFor="time"
                >
                  <TimeGridPicker
                    id="time"
                    name="time"
                    value={formData.time}
                    selectedDate={formData.date}
                    onChange={(value) => {
                      // Reset โต๊ะเมื่อเปลี่ยนเวลา
                      setFormData((prev) => ({ ...prev, time: value, tableId: undefined }));
                      setTouched((prev) => ({ ...prev, time: true }));
                      const error = validateField('time', value);
                      setErrors((prev) => ({ ...prev, time: error }));
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, time: true }));
                      const error = validateField('time', formData.time);
                      setErrors((prev) => ({ ...prev, time: error }));
                    }}
                    error={touched.time && !!errors.time}
                    success={touched.time && !errors.time && formData.time !== ''}
                  />
                </FormField>

                {/* 7. Table Selection (เชื่อมต่อกับ AI Recommendation) */}
                <FormField
                  label={t('form.table')}
                  required
                  error={touched.tableId ? errors.tableId : undefined}
                  success={touched.tableId && !errors.tableId && formData.tableId !== undefined}
                  htmlFor="tableId"
                >
                  <TableSelection
                    tables={tables}
                    selectedTableId={formData.tableId}
                    onSelect={(id) => {
                      setFormData((prev) => ({ ...prev, tableId: id }));
                      setTouched((prev) => ({ ...prev, tableId: true }));
                      setErrors((prev) => ({ ...prev, tableId: undefined }));
                    }}
                    bookedTableIds={bookedTableIds}
                    partySize={parseInt(formData.guests) || 0}
                    error={touched.tableId && !!errors.tableId}
                  />
                </FormField>

                {/* 8. Special Requests */}
                <FormField label={t('form.requests')} htmlFor="specialRequests">
                  <TextArea
                    id="specialRequests"
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleChange}
                    placeholder={t('form.placeholder.requests')}
                    rows={4}
                    maxLength={500}
                  />
                </FormField>

                {/* 9. Payment Section */}
                <div className="space-y-6 pt-6 border-t border-muted">
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
                      {t('payment.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('payment.desc')}{' '}
                      <span className="text-primary font-black">{t('payment.deposit')}</span>{' '}
                      {t('payment.desc_suffix')}
                    </p>
                  </div>

                  {/* QR Code Card */}
                  <div className="bg-card rounded-2xl p-6 border border-border shadow-md flex flex-col items-center">
                    <div className="flex justify-between items-center w-full mb-4 px-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {t('payment.scan')}
                      </span>
                      <span className="text-[10px] font-medium text-success flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                        {t('payment.ready')}
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-xl shadow-inner mb-4 flex justify-center">
                      <QRCodeCanvas
                        value={generatePayload('0809317630', { amount: 200 })}
                        size={200}
                        level="M"
                        className="w-48 h-48 md:w-56 md:h-56"
                      />
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-tighter">
                        {t('payment.scan')}
                      </span>
                      <div className="px-4 py-1.5 bg-muted/30 border border-border rounded-full">
                        <span className="text-sm font-bold text-foreground">
                          {t('payment.amount')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Slip Upload Area */}
                  <div className="space-y-3">
                    <label className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Icon name="PhotoIcon" size={18} className="text-primary" />
                      {t('payment.upload')} <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="slip_upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSlipFile(e.target.files[0]);
                          }
                        }}
                      />
                      <label
                        htmlFor="slip_upload"
                        className={`
                            flex flex-col items-center justify-center w-full min-h-[160px] px-6 py-6
                            rounded-2xl border-2 border-dashed transition-all cursor-pointer group
                            ${slipFile
                            ? 'bg-primary/10 border-primary shadow-glow-sm'
                            : 'bg-muted/20 border-border hover:border-accent/50 hover:bg-accent/5'
                          }
                        `}
                      >
                        {slipFile ? (
                          <div className="flex flex-col items-center text-center">
                            <div className="p-3 bg-primary rounded-full mb-3 shadow-warm">
                              <Icon name="CheckIcon" size={24} className="text-white" />
                            </div>
                            <p className="text-sm font-bold text-primary truncate max-w-[250px]">
                              {slipFile.name}
                            </p>
                            <p className="text-[10px] text-primary/60 font-medium uppercase mt-2 bg-primary/10 px-3 py-1 rounded-full">
                              {t('payment.upload.click')}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <div className="p-4 bg-card rounded-full mb-3 border border-border shadow-sm group-hover:scale-110 group-hover:border-accent/50 group-hover:shadow-glow-sm transition-all duration-300">
                              <Icon
                                name="ArrowUpTrayIcon"
                                size={24}
                                className="text-muted-foreground group-hover:text-accent transition-colors"
                              />
                            </div>
                            <p className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
                              {t('payment.upload.label')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
                              {t('payment.upload.hint')}
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <SubmitButton
                    disabled={!isFormValid}
                    loading={isLoading}
                    onClick={handleSubmit}
                  />
                </div>
              </form>
            </div>

            {/* Policy Note */}
            <div className="mt-6 bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-foreground mb-1">{t('policy.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('policy.desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && reservationDetails && (
        <SuccessModal
          isOpen={showSuccess}
          onClose={handleCloseSuccess}
          reservation={reservationDetails}
        />
      )}
    </>
  );
};

export default ReservationFormInteractive;
