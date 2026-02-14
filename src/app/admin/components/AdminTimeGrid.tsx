'use client'; // ใช้ Client Component

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useTranslation } from '@/lib/i18n';
import { useAdminLocale } from './LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

// โครงสร้างข้อมูล Time Slot
interface TimeSlot {
  time: string; // เวลา (เช่น 10:00)
  label: string;
  status: 'available' | 'booked' | 'held'; // สถานะ: ว่าง, จองแล้ว, ติดจองชั่วคราว
}

// Proptypes
interface AdminTimeGridProps {
  selectedDate: string; // วันที่ที่เลือก
  value: string; // ค่าเวลาที่เลือกปัจจุบัน
  onChange: (time: string) => void; // ฟังก์ชัน callback เมื่อเลือกเวลา
}

/**
 * AdminTimeGrid Component
 * 
 * ตารางเลือกเวลาจองสำหรับหน้า Admin (เช่น ตอนสร้าง Booking ใหม่)
 * - แสดงรายการเวลาที่มีทั้งหมดในวันนั้น
 * - แสดงสถานะของแต่ละ Slot (ว่าง/เต็ม)
 * - รองรับ Theme (Light/Dark)
 */
const AdminTimeGrid: React.FC<AdminTimeGridProps> = ({ selectedDate, value, onChange }) => {
  const locale = useAdminLocale();
  const { t } = useTranslation(locale);
  const { resolvedAdminTheme } = useAdminTheme();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Theme configuration for colors
  const themeColors = resolvedAdminTheme === 'dark' ? {
    loading: 'text-gray-400',
    tips: 'text-gray-400 bg-gray-800/50',
    slot: {
      default: 'bg-gray-800 border-gray-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-400',
      selected: 'bg-yellow-500 text-gray-900 border-yellow-500 shadow-lg shadow-yellow-500/20',
      booked: 'bg-red-900/20 border-red-900/30 text-red-400',
      held: 'bg-yellow-900/20 border-yellow-900/30 text-yellow-500',
    }
  } : {
    loading: 'text-gray-400',
    tips: 'text-slate-700 bg-white/50',
    slot: {
      default: 'bg-white border-gray-200 text-gray-600 hover:border-amber-500 hover:text-amber-600',
      selected: 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/30',
      booked: 'bg-red-50 border-red-100 text-red-500',
      held: 'bg-yellow-50 border-yellow-100 text-yellow-600',
    }
  };

  // ดึงข้อมูล TimeSlots เมื่อวันที่เปลี่ยน
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/timeslots?date=${selectedDate}`);
        const data = await response.json();
        if (data.slots) {
          setTimeSlots(data.slots);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate]);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
        <div className="grid grid-cols-3 gap-2 min-w-max">
          {loading ? (
            <div className={`col-span-3 py-4 text-center text-xs ${themeColors.loading}`}>{t('common.loading')}</div>
          ) : (
          timeSlots.map((slot) => {
            const isSelected = value === slot.time;
            let activityClass = themeColors.slot.default;

            // กำหนดสีปุ่มตามสถานะ
            if (isSelected) {
              activityClass = themeColors.slot.selected;
            } else if (slot.status === 'booked') {
              activityClass = themeColors.slot.booked;
            } else if (slot.status === 'held') {
              activityClass = themeColors.slot.held;
            }

            return (
              <button
                key={slot.time}
                onClick={() => onChange(slot.time)}
                className={`
                  py-2 px-1 rounded-lg text-xs font-bold border transition-all
                  ${activityClass}
                `}
              // TODO: อาจจะ disable ปุ่มถ้าเต็ม แต่ใน Admin อาจจะยอมให้ overbook ได้? 
              // ปัจจุบันยอมให้กดได้หมดเพื่อให้ Admin จัดการได้เต็มที่
              >
                {slot.time}
              </button>
            );
          })
        )}
        </div>
      </div>
      <p className={`text-[10px] font-bold text-center py-1 rounded ${themeColors.tips}`}>
        {t('admin.floorPlan.timeGridTips')}
      </p>
    </div>
  );
};

export default AdminTimeGrid;
