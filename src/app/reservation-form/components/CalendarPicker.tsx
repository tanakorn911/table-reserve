'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { createClientSupabaseClient } from '@/lib/supabase/client';

interface CalendarPickerProps {
    id: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    minDate?: string;
    error?: boolean;
    success?: boolean;
}

const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const CalendarPicker: React.FC<CalendarPickerProps> = ({
    id,
    name,
    value,
    onChange,
    onBlur,
    minDate,
    error = false,
    success = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [holidays, setHolidays] = useState<{ date: string, desc: string }[]>([]);
    const supabase = createClientSupabaseClient();

    useEffect(() => {
        const fetchHolidays = async () => {
            const { data } = await supabase.from('holidays').select('holiday_date, description');
            if (data) setHolidays(data.map(h => ({ date: h.holiday_date, desc: h.description })));
        };
        fetchHolidays();
    }, [supabase]);

    // Initialize to selected date's month or current month
    useEffect(() => {
        if (value) {
            setCurrentMonth(new Date(value + 'T00:00:00'));
        }
    }, []);

    const getMinDateObj = () => {
        if (!minDate) return null;
        return new Date(minDate + 'T00:00:00');
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days: (number | null)[] = [];

        // Add empty cells for days before the first day
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Add the days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const isDateDisabled = (day: number) => {
        const minDateObj = getMinDateObj();
        if (!minDateObj) return false;

        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(0, 0, 0, 0);

        // Max Date: 30 days from now
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        maxDate.setHours(0, 0, 0, 0);

        minDateObj.setHours(0, 0, 0, 0);

        // Check against minDate & maxDate
        if (date < minDateObj || date > maxDate) return true;

        // Check against holidays
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (holidays.some(h => h.date === dateStr)) return true;

        return false;
    };

    const getHoliday = (day: number) => {
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return holidays.find(h => h.date === dateStr);
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear()
        );
    };

    const isSelected = (day: number) => {
        if (!value) return false;
        const selectedDate = new Date(value + 'T00:00:00');
        return (
            day === selectedDate.getDate() &&
            currentMonth.getMonth() === selectedDate.getMonth() &&
            currentMonth.getFullYear() === selectedDate.getFullYear()
        );
    };


    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return 'เลือกวันที่';
        const date = new Date(dateStr + 'T00:00:00');
        const day = date.getDate();
        const month = THAI_MONTHS[date.getMonth()];
        const year = date.getFullYear() + 543; // Buddhist era
        return `${day} ${month} ${year}`;
    };

    const canGoPrevMonth = () => {
        const minDateObj = getMinDateObj();
        if (!minDateObj) return true;

        const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const minMonthStart = new Date(minDateObj.getFullYear(), minDateObj.getMonth(), 1);

        return prevMonthDate >= minMonthStart;
    };

    const getThailandDate = (offsetDays = 0) => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const thTime = new Date(utc + (7 * 3600000));
        if (offsetDays !== 0) {
            thTime.setDate(thTime.getDate() + offsetDays);
        }
        const year = thTime.getFullYear();
        const month = String(thTime.getMonth() + 1).padStart(2, '0');
        const day = String(thTime.getDate()).padStart(2, '0');
        return {
            dateStr: `${year}-${month}-${day}`,
            day: thTime.getDate(),
            month: thTime.getMonth(),
            year: thTime.getFullYear()
        };
    };

    const isDateValueDisabled = (dateValue: string) => {
        const [y, m, d] = dateValue.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        date.setHours(0, 0, 0, 0);

        const minDateObj = getMinDateObj();
        if (minDateObj) {
            minDateObj.setHours(0, 0, 0, 0);
            if (date < minDateObj) return true;
        }

        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        maxDate.setHours(0, 0, 0, 0);
        if (date > maxDate) return true;

        if (holidays.some(h => h.date === dateValue)) return true;

        return false;
    };

    const handleQuickSelect = (offset: number) => {
        console.log('[DEBUG] Quick Select triggered, offset:', offset);
        const { dateStr, month, year } = getThailandDate(offset);
        console.log('[DEBUG] Calculated date string:', dateStr);

        if (isDateValueDisabled(dateStr)) {
            console.log('[DEBUG] Date is disabled, skipping selection.');
            alert('ขออภัย วันที่เลือกไม่สามารถจองได้');
            return;
        }

        setCurrentMonth(new Date(year, month, 1));
        onChange(dateStr);
        setIsOpen(false);

        // Use setTimeout to ensure the form state has updated before triggering validation
        setTimeout(() => {
            console.log('[DEBUG] Triggering onBlur after quick select');
            onBlur?.();
        }, 100);
    };

    const handleSelect = (day: number) => {
        console.log('[DEBUG] Normal day selected:', day);
        if (isDateDisabled(day)) return;

        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateValue = `${year}-${month}-${dayStr}`;

        console.log('[DEBUG] Date value for select:', dateValue);
        onChange(dateValue);
        setIsOpen(false);
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <div className="relative">
            <input type="hidden" id={id} name={name} value={value} />
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
          w-full px-4 py-3.5 pr-12 rounded-lg text-base font-medium text-left
          bg-input border-2 transition-all duration-300
          focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary
          min-h-[52px] shadow-sm cursor-pointer
          ${error ? 'border-error' : success ? 'border-success' : 'border-border'}
          hover:border-primary/70 hover:shadow-md active:scale-[0.99]
        `}
            >
                <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
                    {formatDisplayDate(value)}
                </span>
            </button>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="p-1.5 rounded-md bg-primary/10">
                    <Icon name="CalendarIcon" size={20} className="text-primary" />
                </div>
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px] cursor-pointer"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-[110] top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-xl shadow-warm-lg p-4 pointer-events-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={prevMonth}
                                disabled={!canGoPrevMonth()}
                                className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Icon name="ChevronLeftIcon" size={20} className="text-foreground" />
                            </button>
                            <h3 className="text-lg font-semibold text-foreground">
                                {THAI_MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
                            </h3>
                            <button
                                type="button"
                                onClick={nextMonth}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                                <Icon name="ChevronRightIcon" size={20} className="text-foreground" />
                            </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {THAI_DAYS.map((day, i) => (
                                <div
                                    key={day}
                                    className={`text-center text-sm font-medium py-2 ${i === 0 ? 'text-error' : i === 6 ? 'text-primary' : 'text-muted-foreground'
                                        }`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day, index) => (
                                <div key={index} className="aspect-square">
                                    {day && (
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(day)}
                                            disabled={isDateDisabled(day)}
                                            title={getHoliday(day)?.desc || ''}
                                            className={`
                                                relative w-full h-full flex flex-col items-center justify-center rounded-lg text-sm font-medium
                                                transition-all duration-200
                                                ${isSelected(day)
                                                    ? 'bg-primary text-primary-foreground shadow-warm-sm'
                                                    : isToday(day)
                                                        ? 'bg-accent/20 text-accent border border-accent'
                                                        : getHoliday(day)
                                                            ? 'bg-red-50 text-red-500 border border-red-100 opacity-60'
                                                            : isDateDisabled(day)
                                                                ? 'text-muted-foreground/30 cursor-not-allowed grayscale'
                                                                : 'text-foreground hover:bg-muted'
                                                }
                                            `}
                                        >
                                            {day}
                                            {getHoliday(day) && (
                                                <span className="absolute bottom-0.5 w-1 h-1 bg-red-500 rounded-full" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Quick select */}
                        <div className="mt-4 pt-3 border-t border-border flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleQuickSelect(0)}
                                className="flex-1 py-2.5 px-3 rounded-lg text-sm font-bold bg-muted text-foreground hover:bg-primary/20 transition-all active:scale-95"
                            >
                                วันนี้
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickSelect(1)}
                                className="flex-1 py-2.5 px-3 rounded-lg text-sm font-bold bg-muted text-foreground hover:bg-primary/20 transition-all active:scale-95"
                            >
                                พรุ่งนี้
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CalendarPicker;
