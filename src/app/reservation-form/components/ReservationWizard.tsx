'use client'; // ใช้ Client Component เพื่อให้สามารถใช้ Hooks และ Interactive Features ได้

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import FormField from './FormField';
import TextInput from './TextInput';
import GuestNumberInput from './GuestNumberInput';
import CalendarPicker from './CalendarPicker';
import TimeGridPicker from './TimeGridPicker';
import TextArea from './TextArea';
import FloorPlan from '@/components/floor-plan/FloorPlan';
import TableListView from './TableListView';
import SubmitButton from './SubmitButton'; // Note: SubmitButton อาจไม่ได้ถูกใช้โดยตรงใน Footer แต่ import ไว้
import SuccessModal from './SuccessModal';
import AIRecommendationModal from './AIRecommendationModal';
import Icon from '@/components/ui/AppIcon';
import { Table } from '@/types/tables';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/lib/i18n';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import generatePayload from 'promptpay-qr';
import { QRCodeCanvas } from 'qrcode.react';

// โครงสร้างข้อมูลฟอร์ม
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

// โครงสร้างข้อมูล Error ของฟอร์ม
interface FormErrors {
    fullName?: string;
    phone?: string;
    email?: string;
    guests?: string;
    date?: string;
    time?: string;
    tableId?: string;
}

// รายละเอียดการจองที่สำเร็จ
interface ReservationDetails {
    id: string;
    bookingCode?: string;
    fullName: string;
    phone: string;
    guests: string;
    tableName?: string;
    date: string;
    time: string;
    specialRequests: string;
}

/**
 * ReservationWizard Component
 * ฟอร์มการจองแบบหลายขั้นตอน (Multi-step Wizard)
 * ประกอบด้วย 3 ขั้นตอน:
 * 1. เลือกวัน เวลา และจำนวนคน (Schedule)
 * 2. เลือกโต๊ะ (Table Selection)
 * 3. กรอกข้อมูลและชำระเงิน (Confirmation & Payment)
 */
const ReservationWizard = () => {
    const router = useRouter();
    const { locale } = useNavigation(); // ดึง locale ปัจจุบัน
    const { resolvedTheme } = useTheme(); // ดึง Theme ปัจจุบัน (light/dark)
    const { t } = useTranslation(locale); // Hook สำหรับแปลภาษา

    // State สำหรับจัดการขั้นตอนปัจจุบัน (1, 2, 3)
    const [step, setStep] = useState(1);

    // State เก็บข้อมูลฟอร์มทั้งหมด
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        phone: '',
        email: '',
        guests: '1',
        date: '',
        time: '',
        tableId: undefined,
        specialRequests: '',
    });

    // State เก็บ Error ของฟอร์ม (ยังไม่ได้ใช้ validate แบบละเอียดใน code เดิม แต่เตรียมไว้)
    const [errors, setErrors] = useState<FormErrors>({});

    const [isLoading, setIsLoading] = useState(false); // สถานะกำลังโหลด/ส่งข้อมูล
    const [showSuccess, setShowSuccess] = useState(false); // แสดง Modal สำเร็จ
    const [reservationDetails, setReservationDetails] = useState<ReservationDetails | null>(null); // ข้อมูลการจองที่สำเร็จ
    const [minDate, setMinDate] = useState(''); // วันที่ต่ำสุดที่เลือกได้ (วันนี้)
    const [slipFile, setSlipFile] = useState<File | null>(null); // ไฟล์สลิปโอนเงิน
    const [uploading, setUploading] = useState(false); // สถานะกำลังอัปโหลดไฟล์
    const [tables, setTables] = useState<Table[]>([]); // ข้อมูลโต๊ะทั้งหมด
    const [bookedTables, setBookedTables] = useState<{ id: number; time: string }[]>([]); // รายการโต๊ะที่ถูกจองแล้ว
    const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null); // URL พรีวิวรูปสลิป
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map'); // โหมดแสดงผลโต๊ะ (แผนที่/รายการ)
    const [showAIModal, setShowAIModal] = useState(false); // แสดง Modal AI แนะนำโต๊ะ

    // Effect: เลื่อนหน้าจอไปบนสุดเมื่อโหลด component (Reset Scroll)
    useEffect(() => {
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }, 10);

        // ตรวจสอบขนาดหน้าจอเพื่อปรับ viewMode อัตโนมัติ (มือถือ -> List, Desktop -> Map)
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setViewMode('list');
        } else {
            setViewMode('map');
        }

        return () => clearTimeout(timer);
    }, []);

    const supabase = useMemo(() => createClientSupabaseClient(), []);

    // Effect: ตั้งค่าวันที่เริ่มต้น (minDate) เป็นวันปัจจุบันตามเวลาประเทศไทย
    useEffect(() => {
        const today = new Date();
        const thailandOffset = 7 * 60; // UTC+7
        const localOffset = today.getTimezoneOffset();
        const thailandTime = new Date(today.getTime() + (thailandOffset + localOffset) * 60000);
        const year = thailandTime.getFullYear();
        const month = String(thailandTime.getMonth() + 1).padStart(2, '0');
        const day = String(thailandTime.getDate()).padStart(2, '0');
        setMinDate(`${year}-${month}-${day}`);
    }, []);

    // Effect: ดึงข้อมูลโต๊ะทั้งหมดจาก API
    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await fetch('/api/tables');
                const result = await response.json();
                if (result.data) {
                    // จัดรูปแบบข้อมูลโต๊ะและเพิ่มค่า default สำหรับ Layout
                    const tablesWithLayout = result.data.map((t: any) => ({
                        ...t,
                        x: t.x ?? 0,
                        y: t.y ?? 0,
                        width: t.width || 80,
                        height: t.height || 60,
                        shape: t.shape || 'rectangle',
                        zone: t.zone || 'Indoor',
                    }));
                    setTables(tablesWithLayout);
                }
            } catch (error) {
                console.error('Failed to fetch tables:', error);
            }
        };
        fetchTables();
    }, []);

    // ฟังก์ชันดึงข้อมูลโต๊ะที่ถูกจองตามวันและเวลาที่เลือก
    const fetchBookedTables = useCallback(async () => {
        if (!formData.date) {
            setBookedTables([]);
            return;
        }

        try {
            const response = await fetch(`/api/reservations?date=${formData.date}`);
            const result = await response.json();

            if (result.data) {
                const booked = result.data
                    .filter((r: any) => {
                        // 1. ตรวจสอบสถานะการจอง (เฉพาะ confirmed หรือ pending)
                        if (r.status !== 'confirmed' && r.status !== 'pending') return false;
                        if (r.table_number === null) return false;

                        // 2. ตรวจสอบช่วงเวลาที่ทับซ้อน (Overlap Check)
                        // สมมติระยะเวลาทานอาหาร 2 ชั่วโมง (120 นาที)
                        if (formData.time) {
                            try {
                                const bookingHour = parseInt(r.reservation_time.substring(0, 2));
                                const bookingMin = parseInt(r.reservation_time.substring(3, 5));
                                const bookingTotalMins = bookingHour * 60 + bookingMin;

                                const selectedHour = parseInt(formData.time.substring(0, 2));
                                const selectedMin = parseInt(formData.time.substring(3, 5));
                                const selectedTotalMins = selectedHour * 60 + selectedMin;

                                const slotDuration = 120; // 2 hours in minutes

                                const bookingEnd = bookingTotalMins + slotDuration;
                                const selectedEnd = selectedTotalMins + slotDuration;

                                // ช่วงเวลาทับซ้อนกันเมื่อ: เริ่มก่อนจบ และ จบหลังเริ่ม
                                return selectedTotalMins < bookingEnd && selectedEnd > bookingTotalMins;
                            } catch (e) {
                                return true; // ถ้าแปลงเวลาไม่ได้ ให้ถือว่าจองไว้ก่อนเพื่อความปลอดภัย
                            }
                        }

                        return true; // ถ้ายังไม่เลือกเวลา
                    })
                    .map((r: any) => ({
                        id: Number(r.table_number),
                        time: r.reservation_time.substring(0, 5), // HH:mm
                    }));

                setBookedTables(booked);
            }
        } catch (error) {
            console.error('Failed to fetch booked tables:', error);
        }
    }, [formData.date, formData.time]); // Dependency: date และ time เปลี่ยนต้องเช็คใหม่

    // Effect: โหลดข้อมูลการจองเมื่ออยู่ในขั้นตอนที่ 2 (เลือกโต๊ะ) และ Poll ทุก 10 วินาที
    useEffect(() => {
        if (step === 2) {
            fetchBookedTables();
            const interval = setInterval(fetchBookedTables, 10000);
            return () => clearInterval(interval);
        }
    }, [step, fetchBookedTables]);

    // Effect: สร้าง URL สำหรับ Preview รูปสลิป
    useEffect(() => {
        if (slipFile) {
            const url = URL.createObjectURL(slipFile);
            setPreviewSlipUrl(url);
            return () => URL.revokeObjectURL(url); // Cleanup URL เพื่อป้องกัน Memory Leak
        } else {
            setPreviewSlipUrl(null);
        }
    }, [slipFile]);

    // จัดการการเปลี่ยนแปลงข้อมูลใน Input
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // ฟังก์ชันไปขั้นตอนถัดไป
    const nextStep = () => {
        if (step === 1) {
            // ตรวจสอบว่ากรอกข้อมูลครบถ้วนสำหรับขั้นตอนที่ 1
            if (!formData.guests || !formData.date || !formData.time) {
                alert(t('validation.fillAll'));
                return;
            }
            if (parseInt(formData.guests) > 10) {
                alert(t('validation.guests.invalid'));
                return;
            }
            setStep(2);
        } else if (step === 2) {
            // ตรวจสอบว่าเลือกโต๊ะแล้วหรือยังสำหรับขั้นตอนที่ 2
            if (!formData.tableId) {
                alert(t('validation.table.required'));
                return;
            }
            setStep(3);
        }
    };

    // ฟังก์ชันย้อนกลับขั้นตอน
    const prevStep = () => setStep((s) => Math.max(1, s - 1));

    // ฟังก์ชันส่งข้อมูลการจอง (Submit)
    const handleSubmit = async () => {
        // ตรวจสอบข้อมูลจำเป็น
        if (!formData.fullName || !formData.phone || !slipFile) {
            alert(t('validation.attachSlip'));
            return;
        }

        setIsLoading(true);

        try {
            let payment_slip_url = '';
            // อัปโหลดสลิป
            if (slipFile) {
                setUploading(true);
                const fileName = `${Date.now()}_${slipFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('payment-slips')
                    .upload(fileName, slipFile);

                if (uploadError) throw uploadError;

                const {
                    data: { publicUrl },
                } = supabase.storage.from('payment-slips').getPublicUrl(fileName);
                payment_slip_url = publicUrl;
            }

            // ส่งข้อมูลไปยัง API
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guest_name: formData.fullName,
                    guest_phone: formData.phone,
                    guest_email: formData.email,
                    party_size: parseInt(formData.guests),
                    reservation_date: formData.date,
                    reservation_time: formData.time,
                    table_number: formData.tableId,
                    special_requests: formData.specialRequests,
                    payment_slip_url: payment_slip_url,
                    locale: locale, // ส่งภาษาไปด้วยเผื่อใช้ใน Backend
                }),
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error);

            // บันทึกรายละเอียดการจองเพื่อแสดงผล
            setReservationDetails({
                id: result.data.id,
                bookingCode: result.data.booking_code,
                fullName: formData.fullName,
                phone: formData.phone,
                guests: formData.guests,
                tableName: tables.find((t) => t.id === formData.tableId)?.name,
                date: formData.date,
                time: formData.time,
                specialRequests: formData.specialRequests,
            });
            setShowSuccess(true);
        } catch (error: any) {
            console.error(error);
            alert(error.message || t('alert.failed'));
        } finally {
            setIsLoading(false);
            setUploading(false);
        }
    };

    // Animation Variants สำหรับขั้นตอนต่างๆ
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
            },
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: {
                duration: 0.3,
            },
        },
    };

    return (
        <div className="min-h-screen bg-background pt-24 md:pt-32 pb-10 md:pb-20 relative text-foreground overflow-x-hidden">
            {/* Background Effects (แสง Ambient และ Pattern) */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none mix-blend-screen opacity-40" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none mix-blend-screen opacity-40" />

            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }}
            />

            <div className="container mx-auto px-2 md:px-4 max-w-7xl relative z-10">
                {/* Stepper (ตัวแสดงขั้นตอน) */}
                <div className="mb-4 md:mb-12">
                    <div className="flex justify-between relative px-1 md:px-4 max-w-2xl mx-auto">
                        {/* Connecting Line (เส้นเชื่อม) */}
                        <div className="absolute top-6 left-0 w-full -translate-y-1/2 px-8 md:px-10 pointer-events-none z-0">
                            <div className="relative w-full h-1 bg-muted rounded-full">
                                <div
                                    className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
                                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Steps Icons */}
                        {[1, 2, 3].map((s) => {
                            const isActive = step >= s;
                            const isCurrent = step === s;
                            const label =
                                s === 1
                                    ? t('wizard.step.schedule')
                                    : s === 2
                                        ? t('wizard.step.table')
                                        : t('wizard.step.confirm');
                            const icon = s === 1 ? 'CalendarIcon' : s === 2 ? 'MapIcon' : 'CreditCardIcon';

                            return (
                                <div
                                    key={s}
                                    className="flex flex-col items-center cursor-default bg-transparent z-10"
                                >
                                    <div
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border-4 transition-all duration-300 relative bg-card
                                            ${isActive ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'border-muted text-muted-foreground'}
                                            ${isCurrent ? 'scale-110 ring-4 ring-primary/20' : ''}
                                        `}
                                    >
                                        <Icon
                                            name={icon as any}
                                            size={16}
                                            className={`md:w-5 md:h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                                        />
                                    </div>
                                    <span
                                        className={`text-[10px] md:text-xs font-bold mt-2 md:mt-3 transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                                    >
                                        {label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Wizard Content Container */}
                <div className="bg-card/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-visible outline-none ring-0 border border-border">
                    <AnimatePresence mode="wait">

                        {/* Step 1: Select Schedule (วัน เวลา จำนวนคน) */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="p-4 md:p-10"
                            >
                                <div className="text-center mb-8 md:mb-10">
                                    <h2 className="text-2xl md:text-4xl font-black mb-2 text-foreground tracking-tight">
                                        {t('form.title')}
                                    </h2>
                                    <p className="text-sm md:text-lg text-muted-foreground font-medium">
                                        {t('form.subtitle')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 auto-rows-min">
                                    {/* จำนวนแขก */}
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
                                            {t('form.guests')}
                                            <span className="text-error font-normal text-[10px] lowercase">{t('form.guests.limit')}</span>
                                        </label>
                                        <GuestNumberInput
                                            value={formData.guests}
                                            onChange={handleChange}
                                            min={1}
                                            max={10}
                                            name="guests"
                                            id="guests"
                                        />
                                    </div>

                                    {/* เลือกวันที่ */}
                                    <div className="space-y-2 md:col-start-2 md:row-start-1 md:row-span-2">
                                        <label className="text-xs md:text-sm font-bold uppercase tracking-wide text-foreground">
                                            {t('form.date')}
                                        </label>
                                        <CalendarPicker
                                            value={formData.date}
                                            onChange={(d) => setFormData((p) => ({ ...p, date: d, time: '' }))} // Reset เวลาเมื่อเปลี่ยนวันที่
                                            minDate={minDate}
                                            id="date"
                                            name="date"
                                        />
                                    </div>

                                    {/* เลือกเวลา */}
                                    <div className="space-y-2 md:col-start-1 md:row-start-2">
                                        <label className="text-xs md:text-sm font-bold uppercase tracking-wide text-foreground">
                                            {t('form.time')}
                                        </label>
                                        <TimeGridPicker
                                            value={formData.time}
                                            selectedDate={formData.date}
                                            onChange={(t) => setFormData((p) => ({ ...p, time: t }))}
                                            id="time"
                                            name="time"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Select Table (เลือกโต๊ะ) */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="p-4 md:p-10"
                            >
                                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                    <div className="text-center md:text-left">
                                        <h2 className="text-2xl md:text-3xl font-black mb-2 text-foreground tracking-tight">
                                            {t('wizard.step.table')}
                                        </h2>
                                        <p className="text-muted-foreground font-medium text-xs md:text-sm">
                                            {t('checkStatus.label.date')} {formData.date} | {t('checkStatus.label.time')}{' '}
                                            {formData.time} | {formData.guests} {t('form.guests.label')}
                                        </p>
                                    </div>

                                    {/* ปุ่มเลือกโหมด (AI, List, Map) */}
                                    <div className="flex gap-2 w-full md:w-auto flex-col md:flex-row">
                                        {/* ปุ่ม AI Recommendation */}
                                        <button
                                            onClick={() => setShowAIModal(true)}
                                            className="px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-muted border border-border hover:bg-muted/80 text-foreground"
                                        >
                                            <Icon name="SparklesIcon" size={18} />
                                            {t('wizard.ai.magic')}
                                        </button>

                                        {/* Toggle Map/List */}
                                        <div className="flex bg-muted p-1 rounded-2xl border border-border">
                                            <button
                                                onClick={() => setViewMode('list')}
                                                className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                                                    ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}
                                                `}
                                            >
                                                <Icon name="ListBulletIcon" size={18} />
                                                {t('wizard.view.list')}
                                            </button>
                                            <button
                                                onClick={() => setViewMode('map')}
                                                className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                                                    ${viewMode === 'map' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}
                                                `}
                                            >
                                                <Icon name="MapIcon" size={18} />
                                                {t('wizard.view.map')}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* พื้นที่แสดงผลโต๊ะ (Map หรือ List) */}
                                <div className="relative mt-2">
                                    {viewMode === 'map' ? (
                                        <>
                                            <div className="hidden md:flex absolute -top-4 right-6 z-30 pointer-events-none">
                                                <div className="px-6 py-2 bg-primary text-white font-bold rounded-full shadow-[0_0_15px_rgba(var(--primary),0.4)] border-4 border-[#1E1E2E] text-xs flex items-center gap-2 whitespace-nowrap">
                                                    <Icon name="CursorArrowRaysIcon" size={16} />
                                                    {t('table.clickToSelect')}
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto pb-4 -mx-4 md:mx-0 scrollbar-hide relative touch-pan-x">
                                                <div className="min-w-[800px] md:min-w-0 px-4 md:px-0">
                                                    <FloorPlan
                                                        mode="select"
                                                        tables={tables}
                                                        selectedTableId={formData.tableId}
                                                        bookedTables={bookedTables}
                                                        partySize={parseInt(formData.guests)}
                                                        onTableSelect={(id) => setFormData((p) => ({ ...p, tableId: p.tableId === id ? undefined : id }))}
                                                        height={typeof window !== 'undefined' && window.innerWidth < 768 ? 600 : 850}
                                                        locale={locale}
                                                        theme={resolvedTheme}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <TableListView
                                            tables={tables}
                                            selectedTableId={formData.tableId}
                                            onSelect={(id) => setFormData((p) => ({ ...p, tableId: p.tableId === id ? undefined : id }))}
                                            bookedTables={bookedTables}
                                            partySize={parseInt(formData.guests)}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Information & Payment (กรอกข้อมูลและชำระเงิน) */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="p-3 md:p-12"
                            >
                                <div className="text-center mb-10">
                                    <h2 className="text-xl md:text-4xl font-black mb-3 text-foreground tracking-tight">
                                        {t('wizard.step.confirm')}
                                    </h2>
                                    <p className="text-base md:text-lg text-muted-foreground font-medium mb-1">
                                        {t('form.subtitle')}
                                    </p>
                                    <p className="text-primary/80 text-xs md:text-sm font-medium flex items-center justify-center gap-2">
                                        <Icon name="CurrencyDollarIcon" size={16} />
                                        {t('payment.deposit_info')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* ฟอร์มข้อมูลส่วนตัว */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <TextInput
                                                label={t('form.name')}
                                                placeholder={t('form.placeholder.name')}
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                required
                                                id="fullName"
                                            />
                                            <TextInput
                                                label={t('form.phone')}
                                                placeholder={t('form.placeholder.phone')}
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                                id="phone"
                                            />
                                        </div>
                                        <TextInput
                                            label={t('form.email')}
                                            placeholder={t('form.placeholder.email')}
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            id="email"
                                        />
                                        <TextArea
                                            label={t('form.requests')}
                                            placeholder={t('form.placeholder.requests')}
                                            name="specialRequests"
                                            value={formData.specialRequests}
                                            onChange={handleChange}
                                            id="specialRequests"
                                        />
                                    </div>

                                    {/* ส่วนชำระเงิน (QR Code & Upload) */}
                                    <div className="lg:col-span-1">
                                        <div className="bg-muted/20 backdrop-blur-md rounded-3xl p-4 md:p-6 border border-border h-full flex flex-col shadow-xl">
                                            <h3 className="font-bold uppercase tracking-widest text-xs mb-6 text-muted-foreground border-b border-border pb-4">
                                                {t('payment.title')}
                                            </h3>

                                            <div className="flex-1 flex flex-col items-center justify-center mb-8">
                                                <div className="bg-white p-4 rounded-2xl shadow-lg shadow-black/20 mb-4 transform hover:scale-105 transition-transform duration-300 dark:bg-white">
                                                    <QRCodeCanvas
                                                        value={generatePayload('0809317630', { amount: 200 })}
                                                        size={160}
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-foreground mb-1">{t('payment.scan')}</p>
                                                    <p className="text-3xl font-black text-primary">
                                                        ฿200.00
                                                    </p>
                                                    <div className="mt-2 flex flex-col items-center gap-1">
                                                        <p className="text-sm text-foreground flex items-center justify-center gap-2 font-bold">
                                                            <Icon name="SparklesIcon" size={16} className="text-yellow-500" />
                                                            {t('payment.promptpay')}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground mt-1">{t('payment.prepayment')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ปุ่ม Upload Slip */}
                                            <div className="relative group">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) setSlipFile(e.target.files[0]);
                                                    }}
                                                />
                                                <div
                                                    className={`
                                                    border-2 border-dashed rounded-2xl p-6 transition-all text-center relative overflow-hidden
                                                    ${previewSlipUrl
                                                            ? 'border-green-500/50 bg-green-500/10'
                                                            : 'border-border hover:border-accent/50 hover:bg-accent/5 shadow-glow-sm'
                                                        }
                                                `}
                                                >
                                                    {/* Hover glow */}
                                                    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                                    {previewSlipUrl ? (
                                                        <div className="text-green-500 font-bold text-sm flex flex-col items-center justify-center gap-2 relative z-10">
                                                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-1">
                                                                <Icon name="CheckIcon" size={20} />
                                                            </div>
                                                            {t('payment.ready')}
                                                            <span className="text-xs font-normal text-muted-foreground">
                                                                คลิกเพื่อเปลี่ยนรูป
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-muted-foreground text-xs relative z-10">
                                                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:border-accent/30 group-hover:shadow-glow-sm transition-all duration-300">
                                                                <Icon
                                                                    name="ArrowUpTrayIcon"
                                                                    size={24}
                                                                    className="text-foreground group-hover:text-accent transition-colors"
                                                                />
                                                            </div>
                                                            <span className="font-bold text-foreground block mb-1 text-sm group-hover:text-accent transition-colors">
                                                                {t('payment.upload')}
                                                            </span>
                                                            {t('payment.upload.label')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Navigation (ปุ่มย้อนกลับ / ถัดไป) */}
                    <div className="mt-4 md:mt-8 pt-4 md:pt-6 pb-6 md:pb-8 border-t border-border px-4 md:px-12 flex flex-col gap-4 relative">
                        <div className="flex items-center justify-between w-full gap-3">
                            {/* Back Button */}
                            <div className="flex-1">
                                {step > 1 && (
                                    <button
                                        onClick={prevStep}
                                        type="button"
                                        className="w-full md:w-auto bg-muted hover:bg-muted/80 text-foreground font-bold text-sm flex items-center justify-center gap-2 px-4 md:px-6 py-3.5 rounded-xl transition-all active:scale-95 border border-border shadow-lg"
                                    >
                                        <Icon name="ArrowLeftIcon" size={20} />
                                        <span className="hidden sm:inline">{t('wizard.back')}</span>
                                    </button>
                                )}
                            </div>

                            {/* 1. Selected Table Info (Step 2 Only) - แสดงตรงกลาง */}
                            {step === 2 && (
                                <div className="flex-1 flex justify-center">
                                    <div
                                        className={`
                       flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl transition-all duration-300 w-auto justify-center
                       ${formData.tableId
                                                ? 'bg-primary border border-primary/20 text-primary-foreground shadow-lg'
                                                : 'bg-muted border border-border text-muted-foreground'
                                            }
                     `}
                                    >
                                        {formData.tableId ? (
                                            <>
                                                <Icon name="CheckCircleIcon" size={16} className="text-primary-foreground" />
                                                <span className="font-bold text-sm md:text-base">
                                                    {tables.find((t) => t.id === formData.tableId)?.name}
                                                    <span className="ml-1 opacity-80 text-xs">
                                                        ({tables.find((t) => t.id === formData.tableId)?.capacity} {t('form.guests.label')})
                                                    </span>
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-[10px] md:text-xs font-medium uppercase tracking-widest opacity-60">
                                                {t('table.selectFromMap')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Next/Submit Button */}
                            <div className="flex-1 flex justify-end">
                                {step < 3 ? (
                                    <button
                                        onClick={nextStep}
                                        type="button"
                                        disabled={step === 2 && !formData.tableId}
                                        className={`
                       w-full md:w-auto px-4 md:px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                       ${step === 2 && !formData.tableId
                                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                                                : 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95'
                                            }
                     `}
                                    >
                                        <span className="whitespace-nowrap">
                                            {step === 1 ? t('wizard.table') : t('wizard.continue')}
                                        </span>
                                        <Icon name="ArrowRightIcon" size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        type="button"
                                        disabled={isLoading}
                                        className="w-full md:w-auto bg-primary text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        <span className="whitespace-nowrap">
                                            {isLoading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    {uploading ? t('common.uploading') : t('common.processing')}
                                                </div>
                                            ) : (
                                                t('form.submit')
                                            )}
                                        </span>
                                        {!isLoading && (
                                            <Icon
                                                name="CheckIcon"
                                                size={18}
                                                className="group-hover:translate-x-1 transition-transform"
                                            />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
                    >
                        <div className="relative">
                            {/* Animated Rings */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-2 border-4 border-yellow-500/20 border-b-yellow-500 rounded-full"
                            />
                            {/* Inner Logo/Icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <Icon name="CalendarIcon" size={32} className="text-white" />
                                </motion.div>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-8 text-center"
                        >
                            <h3 className="text-xl font-black text-white tracking-widest uppercase">
                                {uploading ? t('loading.uploadTitle') : t('loading.confirmTitle')}
                            </h3>
                            <p className="mt-2 text-gray-400 font-medium max-w-xs mx-auto text-sm">
                                {uploading
                                    ? t('loading.uploadDesc')
                                    : t('loading.confirmDesc')}
                            </p>
                        </motion.div>

                        {/* Progress Bar (Visual Only) */}
                        <div className="w-48 h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "0%" }}
                                transition={{ duration: uploading ? 2 : 1.5, repeat: Infinity }}
                                className="h-full bg-gradient-to-r from-transparent via-primary to-transparent"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AIRecommendationModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                onSelectTable={(id) => setFormData(prev => ({ ...prev, tableId: id }))}
                date={formData.date}
                time={formData.time}
                guests={parseInt(formData.guests)}
                locale={locale}
            />

            {showSuccess && reservationDetails && (
                <SuccessModal
                    isOpen={showSuccess}
                    onClose={() => {
                        setShowSuccess(false);
                        router.push('/landing-page');
                    }}
                    reservation={reservationDetails}
                />
            )}
        </div>
    );
};

export default ReservationWizard;
