'use client';

import React, { useState, useEffect } from 'react';
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

interface FormData {
    fullName: string;
    phone: string;
    email: string;
    guests: string;
    date: string;
    time: string;
    tableId: number | undefined;
    specialRequests: string;
    paymentSlipUrl?: string;
}

interface FormErrors {
    fullName?: string;
    phone?: string;
    email?: string;
    guests?: string;
    date?: string;
    time?: string;
    tableId?: string;
}

interface FormTouched {
    fullName: boolean;
    phone: boolean;
    email: boolean;
    guests: boolean;
    date: boolean;
    time: boolean;
    tableId: boolean;
}

interface ReservationDetails {
    id: string;
    bookingCode?: string;
    fullName: string;
    phone: string;
    guests: string;
    date: string;
    time: string;
    specialRequests: string;
}

const ReservationFormInteractive = () => {
    const router = useRouter();
    const { locale } = useNavigation();
    const { t } = useTranslation(locale);
    const [isHydrated, setIsHydrated] = useState(false);
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
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [reservationDetails, setReservationDetails] = useState<ReservationDetails | null>(null);
    const [minDate, setMinDate] = useState('');
    const [slipFile, setSlipFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const supabase = createClientSupabaseClient();

    useEffect(() => {
        setIsHydrated(true);
        // Set minimum date to today in Thailand timezone (UTC+7)
        const today = new Date();
        const thailandOffset = 7 * 60; // UTC+7 in minutes
        const localOffset = today.getTimezoneOffset();
        const thailandTime = new Date(today.getTime() + (thailandOffset + localOffset) * 60000);
        const year = thailandTime.getFullYear();
        const month = String(thailandTime.getMonth() + 1).padStart(2, '0');
        const day = String(thailandTime.getDate()).padStart(2, '0');
        setMinDate(`${year}-${month}-${day}`);
    }, []);

    const [tables, setTables] = useState<Table[]>([]);

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

    const [bookedTableIds, setBookedTableIds] = useState<number[]>([]);

    useEffect(() => {
        const fetchBookedTables = async () => {
            if (!formData.date || !formData.time) {
                setBookedTableIds([]);
                return;
            }

            try {
                // Fetch bookings for this specific date and time (confirmed AND pending)
                const response = await fetch(`/api/reservations?date=${formData.date}`);
                const result = await response.json();

                if (result.data) {
                    console.log('Fetching bookings:', {
                        selectedTime: formData.time,
                        reservations: result.data.map((r: any) => ({ t: r.reservation_time, s: r.status, tbl: r.table_number }))
                    });

                    // Filter reservations that match the selected time and have a table assigned
                    // Include both 'confirmed' and 'pending' status
                    const booked = result.data
                        .filter((r: any) => {
                            // 90 mins dining + 15 mins buffer = 105 mins total block
                            const totalDuration = 90 + 15;

                            // Handle time format mismatch (HH:mm:ss vs HH:mm)
                            const dbTime = r.reservation_time.substring(0, 5);
                            const [dbHour, dbMinute] = dbTime.split(':').map(Number);
                            const dbMinutes = dbHour * 60 + dbMinute;

                            const [selectedHour, selectedMinute] = formData.time.split(':').map(Number);
                            const selectedMinutes = selectedHour * 60 + selectedMinute;

                            // Check for overlap: |TimeA - TimeB| < 105 mins
                            const diff = Math.abs(dbMinutes - selectedMinutes);

                            return diff < totalDuration &&
                                r.table_number &&
                                (r.status === 'confirmed' || r.status === 'pending');
                        })
                        .map((r: any) => r.table_number);

                    console.log('Booked Table IDs:', booked);
                    setBookedTableIds(booked);
                }
            } catch (error) {
                console.error('Failed to fetch booked tables:', error);
            }
        };

        fetchBookedTables(); // Initial fetch

        // Poll every 3 seconds for real-time updates
        const interval = setInterval(fetchBookedTables, 3000);

        return () => clearInterval(interval);
    }, [formData.date, formData.time]);

    const guestOptions = [
        { value: '', label: 'เลือกจำนวนแขก' },
        ...Array.from({ length: 10 }, (_, i) => ({
            value: String(i + 1),
            label: `${i + 1} แขก`,
        })),
    ];



    const validateField = (name: keyof FormData, value: string): string | undefined => {
        switch (name) {
            case 'fullName':
                if (!value.trim()) return 'กรุณากรอกชื่อ-นามสกุล';
                if (!value.trim().includes(' ')) return 'กรุณากรอกทั้งชื่อและนามสกุล (เว้นวรรค)';
                if (value.trim().length < 2) return 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
                return undefined;

            case 'phone':
                if (!value.trim()) return 'กรุณากรอกเบอร์โทรศัพท์';
                const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
                if (!phoneRegex.test(value.replace(/\s/g, '')))
                    return 'กรุณากรอกเบอร์โทรศัพท์ 10 หลักที่ถูกต้อง';
                return undefined;

            case 'email':
                if (value.trim() && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value))
                    return 'กรุณากรอกอีเมลที่ถูกต้อง';
                return undefined;

            case 'guests':
                if (!value) return 'กรุณาเลือกจำนวนแขก';
                return undefined;

            case 'date':
                if (!value) return 'กรุณาเลือกวันที่';
                if (isHydrated) {
                    const selectedDate = new Date(value + 'T00:00:00');
                    const today = new Date();
                    const thailandOffset = 7 * 60;
                    const localOffset = today.getTimezoneOffset();
                    const thailandTime = new Date(today.getTime() + (thailandOffset + localOffset) * 60000);
                    thailandTime.setHours(0, 0, 0, 0);
                    if (selectedDate < thailandTime) return 'ไม่สามารถเลือกวันที่ย้อนหลังได้';
                }
                return undefined;

            case 'time':
                if (!value) return 'กรุณาเลือกเวลา';
                return undefined;

            case 'tableId':
                if (!value) return 'กรุณาเลือกโต๊ะ';
                return undefined;

            default:
                return undefined;
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (touched[name as keyof FormTouched]) {
            const error = validateField(name as keyof FormData, value);
            setErrors((prev) => ({ ...prev, [name]: error }));
        }
    };

    const handleBlur = (
        e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        const error = validateField(name as keyof FormData, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        let isValid = true;

        (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
            if (key !== 'specialRequests') {
                const value = formData[key];
                // Convert non-string values to string for validation helper if needed
                // or update validateField to accept any
                const stringValue = value === undefined ? '' : String(value);
                const error = validateField(key, stringValue);
                if (error) {
                    newErrors[key as keyof FormErrors] = error;
                    isValid = false;
                }
            }
        });

        setErrors(newErrors);
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

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);

        // 1. Upload Slip if exists
        let payment_slip_url = '';
        if (slipFile) {
            setUploading(true);
            const fileName = `${Date.now()}_${slipFile.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('payment-slips')
                .upload(fileName, slipFile);

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                alert('ไม่สามารถอัปโหลดสลิปได้ กรุณาลองใหม่อีกครั้ง');
                setIsLoading(false);
                setUploading(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('payment-slips')
                .getPublicUrl(fileName);

            payment_slip_url = publicUrl;
        }

        try {
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
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                // const result = await response.json(); // REMOVE: Already parsed above at line 293
                console.error('Reservation failed:', result.error);

                if (response.status === 409) {
                    alert('ขออภัย โต๊ะนี้เพิ่งถูกจองไป กรุณาเลือกโต๊ะใหม่');
                    // Force refresh booked tables immediately
                    const fetchBookedTables = async () => {
                        try {
                            const res = await fetch(`/api/reservations?date=${formData.date}`);
                            const data = await res.json();
                            if (data.data) {
                                const booked = data.data
                                    .filter((r: any) => {
                                        // 90 mins dining + 15 mins buffer = 105 mins total block
                                        const totalDuration = 90 + 15;

                                        const dbTime = r.reservation_time.substring(0, 5);
                                        const [dbHour, dbMinute] = dbTime.split(':').map(Number);
                                        const dbMinutes = dbHour * 60 + dbMinute;

                                        const [selectedHour, selectedMinute] = formData.time.split(':').map(Number);
                                        const selectedMinutes = selectedHour * 60 + selectedMinute;

                                        // Check for overlap: |TimeA - TimeB| < 105 mins
                                        const diff = Math.abs(dbMinutes - selectedMinutes);

                                        return diff < totalDuration &&
                                            r.table_number &&
                                            (r.status === 'confirmed' || r.status === 'pending');
                                    })
                                    .map((r: any) => r.table_number);
                                setBookedTableIds(booked);
                            }
                        } catch (e) {
                            console.error('Failed to refresh tables', e);
                        }
                    };
                    fetchBookedTables();
                    setIsLoading(false);
                    return;
                }

                alert(`การจองล้มเหลว: ${result.error || 'เกิดข้อผิดพลาด'}`);
                setIsLoading(false);
                return;
            }

            // const result = await response.json(); // REMOVED: Already declared/parsed at start

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
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseSuccess = () => {
        setShowSuccess(false);
        router.push('/landing-page');
    };

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
                            <div className="mb-8">
                                <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-3">
                                    {t('form.title')}
                                </h1>
                                <p className="text-base text-muted-foreground">
                                    {t('form.subtitle')}
                                </p>
                            </div>

                            <form className="space-y-6">
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
                                        placeholder="กรุณากรอกชื่อ-นามสกุล"
                                        error={touched.fullName && !!errors.fullName}
                                        success={
                                            touched.fullName && !errors.fullName && formData.fullName.trim() !== ''
                                        }
                                        maxLength={50}
                                    />
                                </FormField>

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
                                        placeholder="081-222-2222"
                                        error={touched.phone && !!errors.phone}
                                        success={touched.phone && !errors.phone && formData.phone.trim() !== ''}
                                        pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                                    />
                                </FormField>

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
                                        placeholder="your@email.com"
                                        error={touched.email && !!errors.email}
                                        success={touched.email && !errors.email && formData.email?.trim() !== ''}
                                    />
                                </FormField>

                                <FormField
                                    label={t('form.guests')}
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
                                        max={50}
                                        error={touched.guests && !!errors.guests}
                                        success={touched.guests && !errors.guests && formData.guests !== ''}
                                    />
                                </FormField>

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
                                            console.log('Date changed to:', value);
                                            setFormData((prev) => ({ ...prev, date: value, time: '', tableId: undefined }));
                                            setTouched((prev) => ({ ...prev, date: true }));
                                            const error = validateField('date', value);
                                            setErrors((prev) => ({ ...prev, date: error }));
                                        }}
                                        onBlur={() => {
                                            console.log('Date Picker blurred');
                                            setTouched((prev) => ({ ...prev, date: true }));
                                            // The validation is already handled in onChange with the correct value
                                            // Calling it here with formData.date might use a stale value
                                        }}
                                        minDate={minDate}
                                        error={touched.date && !!errors.date}
                                        success={touched.date && !errors.date && formData.date !== ''}
                                    />
                                </FormField>

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

                                <FormField label={t('form.requests')} htmlFor="specialRequests">
                                    <TextArea
                                        id="specialRequests"
                                        name="specialRequests"
                                        value={formData.specialRequests}
                                        onChange={handleChange}
                                        placeholder="มีข้อจำกัดด้านอาหาร อาการแพ้ หรือโอกาสพิเศษหรือไม่? (ไม่บังคับ)"
                                        rows={4}
                                        maxLength={500}
                                    />
                                </FormField>

                                {/* 💰 Theme-Matched Payment Section */}
                                <div className="space-y-6 pt-6 border-t border-muted">
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight">ชำระเงินมัดจำล่วงหน้า</h3>
                                        <p className="text-sm text-muted-foreground">เพื่อยืนยันสิทธิ์การเข้าใช้บริการ กรุณาโอนเงินมัดจำจำนวน <span className="text-primary font-black">200 บาท</span> (หักคืนจากยอดรวมค่าอาหาร)</p>
                                    </div>

                                    <div className="bg-card rounded-2xl p-6 border border-border shadow-md flex flex-col items-center">
                                        <div className="flex justify-between items-center w-full mb-4 px-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Thai QR Payment</span>
                                            <span className="text-[10px] font-medium text-success flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                                                พร้อมรับเงิน
                                            </span>
                                        </div>

                                        <div className="p-4 bg-white rounded-xl shadow-inner mb-4">
                                            <img
                                                src="/images/qr.jpeg"
                                                alt="Payment QR"
                                                className="w-48 h-48 md:w-56 md:h-56 object-contain"
                                                onError={(e) => {
                                                    (e.target as any).src = 'https://placehold.co/400x400/ffffff/334155?text=200+THB+QR';
                                                }}
                                            />
                                        </div>

                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-xs text-muted-foreground uppercase tracking-tighter">Scan to Pay</span>
                                            <div className="px-4 py-1.5 bg-muted/30 border border-border rounded-full">
                                                <span className="text-sm font-bold text-foreground">มัดจำ 200.00 บาท</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-base font-semibold text-foreground flex items-center gap-2">
                                            <Icon name="PhotoIcon" size={18} className="text-primary" />
                                            แนบสลิปการโอนเงิน <span className="text-error">*</span>
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
                                                    rounded-2xl border-2 border-dashed transition-all cursor-pointer
                                                    ${slipFile
                                                        ? 'bg-primary/10 border-primary shadow-glow-sm'
                                                        : 'bg-muted/20 border-border hover:border-primary/50 hover:bg-muted/40'
                                                    }
                                                `}
                                            >
                                                {slipFile ? (
                                                    <div className="flex flex-col items-center text-center">
                                                        <div className="p-3 bg-primary rounded-full mb-3 shadow-warm">
                                                            <Icon name="CheckIcon" size={24} className="text-white" />
                                                        </div>
                                                        <p className="text-sm font-bold text-primary truncate max-w-[250px]">{slipFile.name}</p>
                                                        <p className="text-[10px] text-primary/60 font-medium uppercase mt-2 bg-primary/10 px-3 py-1 rounded-full">คลิกเพื่อเปลี่ยนรูปภาพ</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-center">
                                                        <div className="p-4 bg-card rounded-full mb-3 border border-border shadow-sm group-hover:scale-110 transition-transform">
                                                            <Icon name="ArrowUpTrayIcon" size={24} className="text-muted-foreground" />
                                                        </div>
                                                        <p className="text-base font-bold text-foreground">กดที่นี่เพื่อเลือกรูปสลิป</p>
                                                        <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">รองรับไฟล์ภาพ JPG, PNG (สูงสุด 5MB)</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <SubmitButton
                                        disabled={!isFormValid}
                                        loading={isLoading}
                                        onClick={handleSubmit}
                                    />
                                </div>
                            </form>
                        </div>

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
                                    <h3 className="text-sm font-medium text-foreground mb-1">นโยบายการจอง</h3>
                                    <p className="text-sm text-muted-foreground">
                                        กรุณามาถึงภายใน 15 นาทีหลังเวลาจองของคุณ สำหรับกลุ่ม 6 คนขึ้นไป
                                        <br />กรุณาโทรติดต่อเราโดยตรงที่ 081-222-2222
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {reservationDetails && (
                <SuccessModal
                    isOpen={showSuccess}
                    onClose={handleCloseSuccess}
                    reservationDetails={reservationDetails}
                />
            )}
        </>
    );
};

export default ReservationFormInteractive;
