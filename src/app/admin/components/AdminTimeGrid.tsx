'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useTranslation } from '@/lib/i18n';
import { useAdminLocale } from './LanguageSwitcher';

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
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) return;
      setLoading(true);
      try {
        // Determine layout mode
        // Actually we just want the list of configured times from API
        // We can reuse the same API but ignore session/hold logic if possible,
        // BUT the API currently returns status based on bookings.
        // For Admin, seeing 'booked' slots is actually useful info, but we still want to be able to SELECT them to see *who* booked it.
        // Wait, if I select a 'booked' slot in Admin, I want to see the floor plan AT THAT TIME.
        // So I should disregard the 'booked' status for *disabling* the button. Admin can click anything.

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
          <div className="col-span-3 py-4 text-center text-xs text-gray-400">{t('common.loading')}</div>
        ) : (
          timeSlots.map((slot) => {
            const isSelected = value === slot.time;
            let activityClass =
              'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary';

            if (isSelected) {
              activityClass = 'bg-primary text-white border-primary shadow-lg shadow-primary/30';
            } else if (slot.status === 'booked') {
              // In Admin, we might render booked red-ish but still clickable
              activityClass = 'bg-red-50 border-red-100 text-red-400';
            } else if (slot.status === 'held') {
              activityClass = 'bg-yellow-50 border-yellow-100 text-yellow-600';
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
      <p className="text-[10px] text-slate-700 font-bold text-center bg-white/50 py-1 rounded">
        {t('admin.floorPlan.timeGridTips')}
      </p>
    </div>
  );
};

export default AdminTimeGrid;
