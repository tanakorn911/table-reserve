'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Table } from '@/types/tables';
import { useTranslation } from '@/lib/i18n';
import { useAdminLocale } from '@/app/admin/components/LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { createClientSupabaseClient } from '@/lib/supabase/client';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  isSubmitting: boolean;
}

export default function ReservationModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: ReservationModalProps) {
  const { resolvedAdminTheme } = useAdminTheme();
  const locale = useAdminLocale();
  const { t } = useTranslation(locale);
  // State สำหรับเก็บข้อมูลในฟอร์ม
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    party_size: 2,
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '18:00',
    table_number: '',
    special_requests: '',
    admin_notes: '',
  });

  // State สำหรับ calendar dropdown
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // State สำหรับเก็บข้อมูลโต๊ะทั้งหมด
  const [tables, setTables] = useState<Table[]>([]);

  // State สำหรับ timeslots ที่ดึงจาก API (เหมือนหน้าบ้าน)
  const [timeSlots, setTimeSlots] = useState<{ time: string; label: string; status: string }[]>([]);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);

  // State สำหรับวันหยุด
  const [holidays, setHolidays] = useState<{ date: string; desc: string }[]>([]);

  // State สำหรับข้อมูลพนักงานปัจจุบัน (ใช้ต่อท้ายหมายเหตุ)
  const [currentStaff, setCurrentStaff] = useState<{ full_name: string; staff_id: string } | null>(null);

  // ดึงข้อมูลโต๊ะจาก API เมื่อเปิด Modal
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

    if (isOpen) {
      if (tables.length === 0) fetchTables();
    }
  }, [isOpen]);

  // ดึงวันหยุดจาก Supabase
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const supabase = createClientSupabaseClient();
        const { data } = await supabase.from('holidays').select('holiday_date, description');
        if (data) setHolidays(data.map((h: any) => ({ date: h.holiday_date, desc: h.description })));
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
      }
    };
    if (isOpen && holidays.length === 0) {
      fetchHolidays();
    }
  }, [isOpen]);

  // ดึงข้อมูลพนักงานปัจจุบันเมื่อเปิด Modal (ใช้ต่อท้ายหมายเหตุ)
  useEffect(() => {
    const fetchCurrentStaff = async () => {
      try {
        const supabase = createClientSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, staff_id')
            .eq('id', user.id)
            .single();
          if (profile) {
            setCurrentStaff({
              full_name: profile.full_name || user.email || '-',
              staff_id: profile.staff_id || '-',
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch current staff:', error);
      }
    };

    if (isOpen) {
      fetchCurrentStaff();
    }
  }, [isOpen]);

  // ดึง timeslots จาก API เมื่อวันที่เปลี่ยน (เหมือนหน้าบ้าน)
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!formData.reservation_date) return;
      setTimeSlotsLoading(true);
      try {
        const response = await fetch(`/api/timeslots?date=${formData.reservation_date}`);
        const result = await response.json();
        if (result.slots) {
          setTimeSlots(result.slots);
          // ถ้าเวลาปัจจุบันไม่อยู่ใน slots ให้เลือกช่องแรกที่ว่าง
          const currentTimeAvailable = result.slots.find(
            (s: any) => s.time === formData.reservation_time && s.status === 'available'
          );
          if (!currentTimeAvailable && result.slots.length > 0) {
            const firstAvailable = result.slots.find((s: any) => s.status === 'available');
            if (firstAvailable) {
              setFormData(prev => ({ ...prev, reservation_time: firstAvailable.time }));
            }
          }
        } else {
          setTimeSlots([]);
        }
      } catch (error) {
        console.error('Failed to fetch timeslots:', error);
      } finally {
        setTimeSlotsLoading(false);
      }
    };

    if (isOpen) {
      fetchTimeSlots();
    }
  }, [isOpen, formData.reservation_date]);

  // ตั้งค่าเริ่มต้นของฟอร์ม (กรณีแก้ไข -> ใช้ initialData, กรณีสร้างใหม่ -> Reset)
  useEffect(() => {
    if (initialData) {
      setFormData({
        guest_name: initialData.guest_name,
        guest_phone: initialData.guest_phone,
        party_size: initialData.party_size,
        reservation_date: initialData.reservation_date,
        reservation_time: initialData.reservation_time,
        table_number: initialData.table_number || '',
        special_requests: initialData.special_requests || '',
        admin_notes: initialData.admin_notes || '',
      });
    } else {
      // Reset for create mode
      setFormData({
        guest_name: '',
        guest_phone: '',
        party_size: 2,
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '18:00',
        table_number: '',
        special_requests: '',
        admin_notes: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // ฟังก์ชันจัดการการกดปุ่มบันทึก
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ต่อท้ายชื่อพนักงานในหมายเหตุ (ถ้ามีการเปลี่ยนแปลง)
    let finalNotes = formData.admin_notes;
    const originalNotes = initialData?.admin_notes || '';

    // เช็คว่าหมายเหตุมีการเปลี่ยนแปลง และมีข้อมูลพนักงาน
    if (finalNotes && finalNotes !== originalNotes && currentStaff) {
      const staffLabel = `[โดย: ${currentStaff.full_name}${currentStaff.staff_id !== '-' ? ` (${currentStaff.staff_id})` : ''}]`;
      // ถ้าหมายเหตุยังไม่มี label ชื่อพนักงานอยู่ ให้เพิ่มต่อท้าย
      if (!finalNotes.includes(staffLabel)) {
        finalNotes = `${finalNotes} ${staffLabel}`;
      }
    }

    onSubmit({
      ...formData,
      admin_notes: finalNotes,
      table_number: formData.table_number ? Number(formData.table_number) : null,
    });
  };

  // กำหนด Classname ตาม Theme (Light/Dark)
  const themeClasses = resolvedAdminTheme === 'dark' ? {
    modal: 'bg-gray-800 border-gray-700',
    text: 'text-white',
    input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500',
    label: 'text-gray-300',
    closeBtn: 'text-gray-400 hover:text-white hover:bg-gray-700',
    cancelBtn: 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600',
    sectionBg: 'bg-gray-900/50 border-gray-700',
    sectionText: 'text-gray-400',
  } : {
    modal: 'bg-white border-gray-100',
    text: 'text-gray-900',
    input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500',
    label: 'text-gray-700',
    closeBtn: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
    cancelBtn: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    sectionBg: 'bg-blue-50 border-blue-100',
    sectionText: 'text-blue-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`${themeClasses.modal} rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl border`}>
        {/* Header - ส่วนหัว (ไม่เลื่อน) */}
        <div className={`flex justify-between items-center p-6 pb-4 border-b shrink-0 ${resolvedAdminTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
            {initialData ? t('admin.reservations.modal.edit') : t('admin.reservations.modal.new')}
          </h2>
          <button
            onClick={onClose}
            className={`${themeClasses.closeBtn} transition-colors p-1 rounded-full`}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body - ส่วนฟอร์มที่เลื่อนได้ */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto px-6 pt-4 pb-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>{t('form.name')}</label>
                <input
                  type="text"
                  required
                  className={`block w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:border-transparent font-medium border ${themeClasses.input}`}
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>
                  {t('form.phone')}
                </label>
                <input
                  type="tel"
                  required
                  className={`block w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:border-transparent font-medium border ${themeClasses.input}`}
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                />
              </div>
            </div>

            {/* วันที่จอง - dropdown ปฏิทิน */}
            <div className="relative">
              <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>{t('form.date')}</label>
              {/* ปุ่มเลือกวันที่ */}
              <button
                type="button"
                onClick={() => {
                  setCalendarOpen(!calendarOpen);
                  if (!calendarOpen && formData.reservation_date) {
                    setCalendarMonth(new Date(formData.reservation_date + 'T00:00:00'));
                  }
                }}
                className={`block w-full px-4 py-2.5 rounded-lg font-medium border text-left flex items-center gap-2 ${themeClasses.input}`}
              >
                <CalendarDaysIcon className="w-5 h-5 shrink-0 opacity-60" />
                <span>{(() => {
                  if (!formData.reservation_date) return locale === 'th' ? 'เลือกวันที่' : 'Select Date';
                  const d = new Date(formData.reservation_date + 'T00:00:00');
                  const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
                  const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
                  const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  if (locale === 'th') {
                    return `${THAI_DAYS[d.getDay()]}ที่ ${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
                  } else {
                    return `${EN_DAYS[d.getDay()]}, ${d.getDate()} ${d.toLocaleString('en', { month: 'long' })} ${d.getFullYear()}`;
                  }
                })()}</span>
              </button>

              {/* Calendar Popup */}
              {calendarOpen && (
                <div className={`absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border shadow-xl p-3 ${resolvedAdminTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  {(() => {
                    const THAI_DAYS_S = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
                    const EN_DAYS_S = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
                    const THAI_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
                    const EN_MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

                    // วันนี้ (เวลาไทย)
                    const nowU = new Date();
                    const utcMs = nowU.getTime() + nowU.getTimezoneOffset() * 60000;
                    const todayTH = new Date(utcMs + 7 * 3600000);
                    const todayStr = `${todayTH.getFullYear()}-${String(todayTH.getMonth() + 1).padStart(2, '0')}-${String(todayTH.getDate()).padStart(2, '0')}`;

                    // วันสูงสุด (30 วันข้างหน้า)
                    const maxDate = new Date(todayTH);
                    maxDate.setDate(todayTH.getDate() + 30);

                    // คำนวณวันในเดือน
                    const year = calendarMonth.getFullYear();
                    const month = calendarMonth.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const lastDay = new Date(year, month + 1, 0);
                    const startDow = firstDay.getDay();
                    const daysInMonth = lastDay.getDate();

                    // ตรวจสอบการเลื่อนเดือนก่อนหน้า
                    const canPrev = new Date(year, month - 1, 1) >= new Date(todayTH.getFullYear(), todayTH.getMonth(), 1);

                    const dayHeaders = locale === 'th' ? THAI_DAYS_S : EN_DAYS_S;
                    const monthLabel = locale === 'th'
                      ? `${THAI_MONTHS_FULL[month]} ${year + 543}`
                      : `${EN_MONTHS_FULL[month]} ${year}`;

                    return (
                      <>
                        {/* Header: เดือน + ปุ่มเลื่อน */}
                        <div className="flex items-center justify-between mb-2">
                          <button
                            type="button"
                            disabled={!canPrev}
                            onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                            className={`p-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${resolvedAdminTheme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                          >
                            <ChevronLeftIcon className="w-4 h-4" />
                          </button>
                          <span className={`text-sm font-bold ${themeClasses.text}`}>{monthLabel}</span>
                          <button
                            type="button"
                            onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                            className={`p-1 rounded transition-colors ${resolvedAdminTheme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                          >
                            <ChevronRightIcon className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-1">
                          {dayHeaders.map((dh, i) => (
                            <div key={dh} className={`text-center text-[10px] font-bold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : resolvedAdminTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              {dh}
                            </div>
                          ))}
                        </div>
                        {/* Day grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: startDow }, (_, i) => <div key={`empty-${i}`} />)}
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const dateObj = new Date(year, month, day);
                            dateObj.setHours(0, 0, 0, 0);
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dow = dateObj.getDay();

                            // ตรวจสอบว่า disabled
                            const isPast = dateObj < new Date(todayTH.getFullYear(), todayTH.getMonth(), todayTH.getDate());
                            const isFuture = dateObj > maxDate;
                            const isFriday = dow === 5;
                            const holiday = holidays.find(h => h.date === dateStr);
                            const isDisabled = isPast || isFuture || isFriday || !!holiday;
                            const isSelected = formData.reservation_date === dateStr;
                            const isTodayDate = dateStr === todayStr;

                            let cls = '';
                            if (isSelected) {
                              cls = 'bg-blue-600 text-white font-bold';
                            } else if (isDisabled) {
                              cls = resolvedAdminTheme === 'dark'
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-300 cursor-not-allowed';
                              if (isFriday || holiday) cls += resolvedAdminTheme === 'dark' ? ' bg-red-900/20' : ' bg-red-50';
                            } else if (isTodayDate) {
                              cls = resolvedAdminTheme === 'dark'
                                ? 'bg-green-900/40 text-green-300 font-bold ring-1 ring-green-500/50 hover:bg-blue-600 hover:text-white'
                                : 'bg-green-100 text-green-700 font-bold ring-1 ring-green-400 hover:bg-blue-600 hover:text-white';
                            } else {
                              cls = resolvedAdminTheme === 'dark'
                                ? 'text-white hover:bg-blue-600 hover:text-white'
                                : 'text-gray-800 hover:bg-blue-600 hover:text-white';
                            }

                            return (
                              <button
                                key={dateStr}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => {
                                  setFormData({ ...formData, reservation_date: dateStr });
                                  setCalendarOpen(false);
                                }}
                                title={holiday?.desc || (isFriday ? (locale === 'th' ? 'วันหยุดประจำ' : 'Closed') : '')}
                                className={`relative w-full aspect-square flex items-center justify-center rounded text-xs transition-all ${cls}`}
                              >
                                {day}
                                {holiday && <span className="absolute bottom-0 w-1 h-1 rounded-full bg-red-500" />}
                              </button>
                            );
                          })}
                        </div>
                        {/* ปุ่ม "วันนี้" */}
                        <div className="mt-2 pt-2 border-t flex gap-2" style={{ borderColor: resolvedAdminTheme === 'dark' ? '#374151' : '#e5e7eb' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, reservation_date: todayStr });
                              setCalendarMonth(todayTH);
                              setCalendarOpen(false);
                            }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${resolvedAdminTheme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            {locale === 'th' ? 'วันนี้' : 'Today'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const tmr = new Date(todayTH);
                              tmr.setDate(todayTH.getDate() + 1);
                              const tmrStr = `${tmr.getFullYear()}-${String(tmr.getMonth() + 1).padStart(2, '0')}-${String(tmr.getDate()).padStart(2, '0')}`;
                              setFormData({ ...formData, reservation_date: tmrStr });
                              setCalendarMonth(tmr);
                              setCalendarOpen(false);
                            }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${resolvedAdminTheme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            {locale === 'th' ? 'พรุ่งนี้' : 'Tomorrow'}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* เวลาจอง - แสดงเป็นปุ่มกดแทน dropdown */}
            <div>
              <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>{t('form.time')}</label>
              {timeSlotsLoading ? (
                <p className={`text-sm ${themeClasses.label}`}>{locale === 'th' ? 'กำลังโหลดเวลา...' : 'Loading times...'}</p>
              ) : timeSlots.length === 0 ? (
                <p className={`text-sm text-red-400`}>{locale === 'th' ? 'ไม่มีเวลาว่าง (วันหยุด)' : 'No slots available (Holiday)'}</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    const isSelected = formData.reservation_time === slot.time;
                    const isBooked = slot.status === 'booked';
                    const isHeld = slot.status === 'held';

                    let btnClass = '';
                    if (isSelected) {
                      btnClass = 'bg-blue-600 text-white ring-2 ring-blue-400';
                    } else if (isBooked) {
                      btnClass = resolvedAdminTheme === 'dark'
                        ? 'bg-red-900/40 text-red-400 cursor-not-allowed opacity-60'
                        : 'bg-red-100 text-red-400 cursor-not-allowed opacity-60';
                    } else if (isHeld) {
                      btnClass = resolvedAdminTheme === 'dark'
                        ? 'bg-yellow-900/40 text-yellow-400'
                        : 'bg-yellow-100 text-yellow-600';
                    } else {
                      btnClass = resolvedAdminTheme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-blue-600 hover:text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-blue-600 hover:text-white';
                    }

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={isBooked}
                        onClick={() => !isBooked && setFormData({ ...formData, reservation_time: slot.time })}
                        className={`px-2 py-2 text-sm font-semibold rounded-lg transition-all ${btnClass}`}
                      >
                        {slot.time} {locale === 'th' ? 'น.' : ''}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* จำนวนแขก */}
            <div>
              <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>{t('form.guests')}</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  className={`block w-full px-4 pr-16 py-2.5 rounded-lg focus:ring-2 focus:border-transparent font-medium border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${themeClasses.input}`}
                  value={formData.party_size}
                  onChange={(e) =>
                    setFormData({ ...formData, party_size: Number(e.target.value) })
                  }
                />
                <span className={`absolute right-4 top-2.5 text-sm font-medium pointer-events-none ${resolvedAdminTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('form.guests.label')}
                </span>
              </div>
            </div>

            {/* เลือกโต๊ะ - แสดงเป็นปุ่มกด */}
            <div>
              <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>
                {t('form.table')} ({t('admin.reservations.table.optional')})
              </label>
              <div className="grid grid-cols-4 gap-2">
                {/* ปุ่ม "ไม่ระบุ" */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, table_number: '' })}
                  className={`px-2 py-2 text-sm font-semibold rounded-lg transition-all ${formData.table_number === ''
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : resolvedAdminTheme === 'dark'
                      ? 'bg-gray-700 text-white hover:bg-blue-600 hover:text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-blue-600 hover:text-white'
                    }`}
                >
                  {locale === 'th' ? 'ไม่ระบุ' : 'None'}
                </button>
                {tables.map((tableItem) => {
                  const isSelected = String(formData.table_number) === String(tableItem.id);
                  return (
                    <button
                      key={tableItem.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, table_number: String(tableItem.id) })}
                      className={`px-2 py-2 text-sm font-semibold rounded-lg transition-all ${isSelected
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : resolvedAdminTheme === 'dark'
                          ? 'bg-gray-700 text-white hover:bg-blue-600 hover:text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-blue-600 hover:text-white'
                        }`}
                    >
                      {tableItem.name} <span className="text-xs opacity-70">({tableItem.capacity})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>
                {t('form.requests')} ({t('admin.reservations.table.fromCustomer')})
              </label>
              <textarea
                className={`block w-full px-4 py-2 rounded-lg focus:ring-2 focus:border-transparent font-medium border ${themeClasses.input} opacity-80`}
                rows={2}
                value={formData.special_requests}
                readOnly={!!initialData}
                onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              />
            </div>

            {initialData?.payment_slip_url && (
              <div className={`p-4 rounded-xl border ${themeClasses.sectionBg}`}>
                <label className={`block text-sm font-black uppercase tracking-widest mb-2 ${themeClasses.sectionText}`}>
                  {t('admin.reservations.table.slip')}
                </label>
                <div className="mt-2 text-center">
                  <a href={initialData.payment_slip_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={initialData.payment_slip_url}
                      alt="Payment Slip"
                      className={`mx-auto max-h-[300px] rounded-lg shadow-sm border hover:opacity-90 transition-opacity ${resolvedAdminTheme === 'dark' ? 'border-gray-600' : 'border-blue-200'}`}
                    />
                  </a>
                  <p className={`mt-2 text-xs font-medium italic ${resolvedAdminTheme === 'dark' ? 'text-gray-400' : 'text-blue-500'}`}>
                    {t('admin.reservations.table.clickFull')}
                  </p>
                </div>
              </div>
            )}

            <div className={`p-4 rounded-xl border ${resolvedAdminTheme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-slate-50 border-slate-200'}`}>
              <label className={`block text-sm font-black uppercase tracking-widest mb-2 ${resolvedAdminTheme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>
                {t('admin.reservations.table.notes')}
              </label>
              <textarea
                className={`block w-full px-4 py-2.5 border-2 rounded-lg focus:ring-4 font-bold ${resolvedAdminTheme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-900/50' : 'bg-white border-slate-200 text-gray-900 placeholder:text-slate-400 focus:ring-primary/10 focus:border-primary'}`}
                rows={3}
                placeholder={t('admin.reservations.notes.placeholder')}
                value={formData.admin_notes}
                onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
              />
            </div>
          </div>

          {/* Footer Buttons - ปุ่มกด (ไม่เลื่อน) */}
          <div className={`flex justify-end gap-3 px-6 py-4 border-t shrink-0 ${resolvedAdminTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 text-sm font-bold border rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 ${themeClasses.cancelBtn}`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? t('common.loading') : initialData ? t('common.save') : t('form.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
