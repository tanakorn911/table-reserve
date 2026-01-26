'use client';

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
import SubmitButton from './SubmitButton';
import SuccessModal from './SuccessModal';
import Icon from '@/components/ui/AppIcon';
import { Table } from '@/types/tables';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import generatePayload from 'promptpay-qr';
import { QRCodeCanvas } from 'qrcode.react';

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

const ReservationWizard = () => {
    const router = useRouter();
    const { locale } = useNavigation();
    const { t } = useTranslation(locale);
    const [step, setStep] = useState(1);
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
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [reservationDetails, setReservationDetails] = useState<ReservationDetails | null>(null);
    const [minDate, setMinDate] = useState('');
    const [slipFile, setSlipFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [tables, setTables] = useState<Table[]>([]);
    const [bookedTables, setBookedTables] = useState<{ id: number; time: string }[]>([]); // Changed state
    const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

    useEffect(() => {
        // Simple client-side check to default to list on mobile
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setViewMode('list');
        } else {
            setViewMode('map');
        }
    }, []);


    const supabase = useMemo(() => createClientSupabaseClient(), []);

    // Initial Date Setup
    useEffect(() => {
        const today = new Date();
        const thailandOffset = 7 * 60;
        const localOffset = today.getTimezoneOffset();
        const thailandTime = new Date(today.getTime() + (thailandOffset + localOffset) * 60000);
        const year = thailandTime.getFullYear();
        const month = String(thailandTime.getMonth() + 1).padStart(2, '0');
        const day = String(thailandTime.getDate()).padStart(2, '0');
        setMinDate(`${year}-${month}-${day}`);
        // Removed auto-set date to force user selection as requested
    }, []);

    // Fetch Tables
    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await fetch('/api/tables');
                const result = await response.json();
                if (result.data) {
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

    // Fetch Availability
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
                        // 1. Status Check
                        if (r.status !== 'confirmed' && r.status !== 'pending') return false;
                        if (r.table_number === null) return false;

                        // 2. Time Overlap Check (Assuming 2 Hour Slots)
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

                                // Overlap if: starts before other ends range
                                return selectedTotalMins < bookingEnd && selectedEnd > bookingTotalMins;
                            } catch (e) {
                                return true; // Fallback to blocked if time parse fails
                            }
                        }

                        return true; // If no time selected yet, maybe show all? Or usually shouldn't happen as Step 1 requires time.
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
    }, [formData.date]);

    useEffect(() => {
        if (step === 2) {
            fetchBookedTables();
            const interval = setInterval(fetchBookedTables, 10000);
            return () => clearInterval(interval);
        }
    }, [step, fetchBookedTables]);

    // File Preview
    useEffect(() => {
        if (slipFile) {
            const url = URL.createObjectURL(slipFile);
            setPreviewSlipUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewSlipUrl(null);
        }
    }, [slipFile]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.guests || !formData.date || !formData.time) {
                alert(t('validation.fillAll'));
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!formData.tableId) {
                alert(t('validation.table.required'));
                return;
            }
            setStep(3);
        }
    };

    const prevStep = () => setStep((s) => Math.max(1, s - 1));

    const handleSubmit = async () => {
        if (!formData.fullName || !formData.phone || !slipFile) {
            alert(t('validation.attachSlip'));
            return;
        }

        setIsLoading(true);

        try {
            let payment_slip_url = '';
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
                }),
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error);

            setReservationDetails({
                id: result.data.id,
                bookingCode: result.data.booking_code,
                fullName: formData.fullName,
                phone: formData.phone,
                guests: formData.guests,
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
        <div className="min-h-screen bg-gradient-to-br from-[#2D3748] to-[#1A202C] pt-24 md:pt-32 pb-10 md:pb-20 relative text-white overflow-x-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none mix-blend-screen opacity-60" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] pointer-events-none mix-blend-screen opacity-60" />

            {/* Pattern Overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.05]"
                style={{
                    backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }}
            />

            <div className="container mx-auto px-2 md:px-4 max-w-7xl relative z-10">
                {/* Stepper */}
                <div className="mb-4 md:mb-12">
                    <div className="flex justify-between relative px-1 md:px-4 max-w-2xl mx-auto">
                        {/* Connecting Line Container */}
                        <div className="absolute top-6 left-0 w-full -translate-y-1/2 px-8 md:px-10 pointer-events-none z-0">
                            <div className="relative w-full h-1 bg-gray-700 rounded-full">
                                {' '}
                                {/* Darker track */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
                                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                                />
                            </div>
                        </div>

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
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border-4 transition-all duration-300 relative bg-[#2D3748]
                                            ${isActive ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-gray-600 text-gray-400'}
                                            ${isCurrent ? 'scale-110 ring-4 ring-primary/20' : ''}
                                        `}
                                    >
                                        <Icon
                                            name={icon as any}
                                            size={16}
                                            className={`md:w-5 md:h-5 ${isActive ? 'text-white' : 'text-gray-400'}`}
                                        />
                                    </div>
                                    <span
                                        className={`text-[10px] md:text-xs font-bold mt-2 md:mt-3 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'}`}
                                    >
                                        {label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-2xl md:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-visible">
                    <AnimatePresence mode="wait">
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
                                    <h2 className="text-2xl md:text-4xl font-black mb-2 text-white tracking-tight">
                                        {t('form.title')}
                                    </h2>
                                    <p className="text-sm md:text-lg text-gray-400 font-medium">
                                        {t('form.subtitle')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 auto-rows-min">
                                    {/* 1. Guest Number (Mobile: 1, Desktop: Top-Left) */}
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold uppercase tracking-wide text-white">
                                            {t('form.guests')}
                                        </label>
                                        <GuestNumberInput
                                            value={formData.guests}
                                            onChange={handleChange}
                                            min={1}
                                            max={50}
                                            name="guests"
                                            id="guests"
                                        />
                                    </div>

                                    {/* 2. Date Selection (Mobile: 2, Desktop: Right-Column Spanning) */}
                                    <div className="space-y-2 md:col-start-2 md:row-start-1 md:row-span-2">
                                        <label className="text-xs md:text-sm font-bold uppercase tracking-wide text-white">
                                            {t('form.date')}
                                        </label>
                                        <CalendarPicker
                                            value={formData.date}
                                            onChange={(d) => setFormData((p) => ({ ...p, date: d, time: '' }))}
                                            minDate={minDate}
                                            id="date"
                                            name="date"
                                        />
                                    </div>

                                    {/* 3. Time Selection (Mobile: 3, Desktop: Bottom-Left) */}
                                    <div className="space-y-2 md:col-start-1 md:row-start-2">
                                        <label className="text-xs md:text-sm font-bold uppercase tracking-wide text-white">
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
                                        <h2 className="text-2xl md:text-3xl font-black mb-2 text-white tracking-tight">
                                            {t('wizard.step.table')}
                                        </h2>
                                        <p className="text-gray-400 font-medium text-xs md:text-sm">
                                            {t('checkStatus.label.date')} {formData.date} | {t('checkStatus.label.time')}{' '}
                                            {formData.time} | {formData.guests} {t('form.guests.label')}
                                        </p>
                                    </div>

                                    {/* View Toggle */}
                                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-full md:w-auto">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                                                ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}
                                            `}
                                        >
                                            <Icon name="ListBulletIcon" size={18} />
                                            {t('wizard.view.list')}
                                        </button>
                                        <button
                                            onClick={() => setViewMode('map')}
                                            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                                                ${viewMode === 'map' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}
                                            `}
                                        >
                                            <Icon name="MapIcon" size={18} />
                                            {t('wizard.view.map')}
                                        </button>
                                    </div>
                                </div>

                                {/* Map/List View */}
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
                                                        onTableSelect={(id) => setFormData((p) => ({ ...p, tableId: id }))}
                                                        height={typeof window !== 'undefined' && window.innerWidth < 768 ? 600 : 850}
                                                        locale={locale}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <TableListView
                                            tables={tables}
                                            selectedTableId={formData.tableId}
                                            onSelect={(id) => setFormData((p) => ({ ...p, tableId: id }))}
                                            bookedTables={bookedTables}
                                            partySize={parseInt(formData.guests)}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        )}

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
                                    <h2 className="text-xl md:text-4xl font-black mb-3 text-white tracking-tight">
                                        {t('wizard.step.confirm')}
                                    </h2>
                                    <p className="text-base md:text-lg text-white/90 font-medium mb-1">
                                        {t('form.subtitle')}
                                    </p>
                                    <p className="text-blue-200/90 text-xs md:text-sm font-medium flex items-center justify-center gap-2">
                                        <Icon name="CurrencyDollarIcon" size={16} />
                                        {t('payment.deposit_info')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

                                    <div className="lg:col-span-1">
                                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 md:p-6 border border-white/10 h-full flex flex-col shadow-xl">
                                            <h3 className="font-bold uppercase tracking-widest text-xs mb-6 text-white/80 border-b border-white/5 pb-4">
                                                {t('payment.title')}
                                            </h3>

                                            <div className="flex-1 flex flex-col items-center justify-center mb-8">
                                                <div className="bg-white p-4 rounded-2xl shadow-lg shadow-black/20 mb-4 transform hover:scale-105 transition-transform duration-300">
                                                    <QRCodeCanvas
                                                        value={generatePayload('0809317630', { amount: 200 })}
                                                        size={160}
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-white mb-1">{t('payment.scan')}</p>
                                                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                                                        ฿200.00
                                                    </p>
                                                    <div className="mt-2 flex flex-col items-center gap-1">
                                                        <p className="text-sm text-white flex items-center justify-center gap-2 font-bold">
                                                            <Icon name="SparklesIcon" size={16} className="text-yellow-300" />
                                                            {t('payment.promptpay')}
                                                        </p>
                                                        <p className="text-sm text-white/80 mt-1">{t('payment.prepayment')}</p>
                                                    </div>
                                                </div>
                                            </div>

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
                                                            : 'border-white/20 hover:border-accent/50 hover:bg-accent/5 shadow-glow-sm'
                                                        }
                                                `}
                                                >
                                                    {/* Hover glow */}
                                                    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                                    {previewSlipUrl ? (
                                                        <div className="text-green-400 font-bold text-sm flex flex-col items-center justify-center gap-2 relative z-10">
                                                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-1">
                                                                <Icon name="CheckIcon" size={20} />
                                                            </div>
                                                            {t('payment.ready')}
                                                            <span className="text-xs font-normal text-white/50">
                                                                คลิกเพื่อเปลี่ยนรูป
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-white/80 text-xs relative z-10">
                                                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:border-accent/30 group-hover:shadow-glow-sm transition-all duration-300">
                                                                <Icon
                                                                    name="ArrowUpTrayIcon"
                                                                    size={24}
                                                                    className="text-white group-hover:text-accent transition-colors"
                                                                />
                                                            </div>
                                                            <span className="font-bold text-white block mb-1 text-sm group-hover:text-accent transition-colors">
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
                    {/* Footer Navigation */}
                    <div className="mt-4 md:mt-8 pt-4 md:pt-6 pb-6 md:pb-8 border-t border-white/10 px-4 md:px-12 flex flex-col gap-4 relative">
                        <div className="flex items-center justify-between w-full gap-3">
                            {/* Back Button */}
                            <div className="flex-1">
                                {step > 1 && (
                                    <button
                                        onClick={prevStep}
                                        type="button"
                                        className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 px-4 md:px-6 py-3.5 rounded-xl transition-all active:scale-95 border border-white/10 shadow-lg"
                                    >
                                        <Icon name="ArrowLeftIcon" size={20} />
                                        <span className="hidden sm:inline">{t('wizard.back')}</span>
                                    </button>
                                )}
                            </div>

                            {/* 1. Selected Table Info (Step 2 Only) - In the Middle */}
                            {step === 2 && (
                                <div className="flex-1 flex justify-center">
                                    <div
                                        className={`
                      flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl transition-all duration-300 w-auto justify-center
                      ${formData.tableId
                                                ? 'bg-primary border border-primary/20 text-white shadow-lg'
                                                : 'bg-white/5 border border-white/10 text-gray-500'
                                            }
                    `}
                                    >
                                        {formData.tableId ? (
                                            <>
                                                <Icon name="CheckCircleIcon" size={16} className="text-white" />
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
