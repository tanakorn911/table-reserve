'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useTranslation } from '@/lib/i18n';
import { useAdminLocale } from './LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

interface TimeSlot {
  time: string;
  label: string;
  status: 'available' | 'booked' | 'held';
}

interface AdminTimeGridProps {
  selectedDate: string;
  value: string;
  onChange: (time: string) => void;
}

const AdminTimeGrid: React.FC<AdminTimeGridProps> = ({ selectedDate, value, onChange }) => {
  const locale = useAdminLocale();
  const { t } = useTranslation(locale);
  const { adminTheme } = useAdminTheme();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Theme configuration
  const themeColors = adminTheme === 'dark' ? {
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
      <div className="grid grid-cols-3 gap-2">
        {loading ? (
          <div className={`col-span-3 py-4 text-center text-xs ${themeColors.loading}`}>{t('common.loading')}</div>
        ) : (
          timeSlots.map((slot) => {
            const isSelected = value === slot.time;
            let activityClass = themeColors.slot.default;

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
              >
                {slot.time}
              </button>
            );
          })
        )}
      </div>
      <p className={`text-[10px] font-bold text-center py-1 rounded ${themeColors.tips}`}>
        {t('admin.floorPlan.timeGridTips')}
      </p>
    </div>
  );
};

export default AdminTimeGrid;
