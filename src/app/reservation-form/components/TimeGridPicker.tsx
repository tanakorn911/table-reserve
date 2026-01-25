'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

interface TimeSlot {
  time: string;
  label: string;
  status: 'available' | 'booked' | 'held';
}

interface TimeGridPickerProps {
  id: string;
  name: string;
  value: string;
  selectedDate: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  success?: boolean;
}



const TimeGridPicker: React.FC<TimeGridPickerProps> = ({
  id,
  name,
  value,
  selectedDate,
  onChange,
  onBlur,
  error = false,
  success = false,
}) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);
  const [isOpen, setIsOpen] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch time slots from API
  const fetchTimeSlots = useCallback(async (isInitialLoad = false) => {
    if (!selectedDate) return;

    // Only show loading spinner on initial load, not background refreshes
    if (isInitialLoad) {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `/api/timeslots?date=${selectedDate}`
      );
      const data = await response.json();

      if (data.slots) {
        // Smart comparison: detect status changes (e.g., available → held)
        setTimeSlots(prev => {
          // Check if lengths differ
          if (prev.length !== data.slots.length) {
            return data.slots;
          }

          // Check if any slot status changed
          const hasStatusChange = prev.some((prevSlot, idx) => {
            const newSlot = data.slots[idx];
            return newSlot && (prevSlot.status !== newSlot.status || prevSlot.time !== newSlot.time);
          });

          // Only update if something actually changed
          return hasStatusChange ? data.slots : prev;
        });
      }
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [selectedDate]);

  // Fetch on mount and when date changes
  useEffect(() => {
    fetchTimeSlots(true); // Initial load with loading spinner
  }, [fetchTimeSlots]);

  // Refresh slots periodically when picker is open (background updates without loading spinner)
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => fetchTimeSlots(false), 3000);
    return () => clearInterval(interval);
  }, [isOpen, fetchTimeSlots]);



  // Handle time selection
  const handleSelect = (e: React.MouseEvent, time: string) => {
    e.preventDefault();
    onChange(time);
    setIsOpen(false);
  };

  // ... (keep effect)

  const formatDisplayTime = (time: string) => {
    if (!time) return locale === 'th' ? 'เลือกเวลา' : 'Select Time';

    if (locale === 'th') {
      return `${time} น.`;
    }

    // AM/PM Format
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return time;
    }
  };

  const getStatusColor = (status: string, isSelected: boolean) => {
    if (isSelected) return 'bg-primary text-primary-foreground shadow-warm-sm';
    switch (status) {
      case 'booked':
        return 'bg-error/20 text-error cursor-not-allowed line-through';
      default:
        return 'bg-muted/50 text-foreground hover:bg-primary/20 hover:text-primary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'booked':
        return locale === 'th' ? ' (จองแล้ว)' : ' (Booked)';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      <input type="hidden" id={id} name={name} value={value} />
      <button
        type="button"
        onClick={() => {
          if (selectedDate) {
            setIsOpen(!isOpen);
            if (!isOpen) fetchTimeSlots(true); // Show spinner when manually opening
          }
        }}
        disabled={!selectedDate}
        className={`
          w-full px-4 pl-12 py-4 rounded-2xl text-base font-bold text-left
          bg-white/5 border border-white/10 transition-all duration-300
          focus:outline-none focus:bg-white/10 focus:border-primary/50 focus:shadow-[0_0_20px_rgba(var(--primary),0.2)]
          min-h-[56px] shadow-lg shadow-black/5 relative overflow-hidden group
          ${error ? 'border-error/50 bg-error/5' : success ? 'border-success/50 bg-success/5' : ''}
          ${selectedDate ? 'hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-pointer active:scale-[0.99]' : 'opacity-40 cursor-not-allowed grayscale'}
        `}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110">
          <Icon name="ClockIcon" size={20} className="text-white/70 group-hover:text-white" />
        </div>

        <span
          className={`block transition-colors duration-300 ${value ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}
        >
          {!selectedDate
            ? locale === 'th'
              ? 'กรุณาเลือกวันที่ก่อน'
              : 'Please select a date first'
            : formatDisplayTime(value)}
        </span>
      </button>

      {isOpen && selectedDate && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px] cursor-pointer"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-[110] top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-xl shadow-warm-lg p-4 max-h-[350px] overflow-y-auto pointer-events-auto">
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-card/90 backdrop-blur-sm pb-2 z-10">
              <h4 className="text-sm font-semibold text-foreground">
                {locale === 'th' ? 'เลือกเวลา' : 'Select Time'}
              </h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                <p className="text-xs text-muted-foreground animate-pulse">
                  {locale === 'th' ? 'กำลังโหลดเวลาที่ว่าง...' : 'Loading available slots...'}
                </p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-2">
                <div className="p-3 bg-muted rounded-full text-muted-foreground">
                  <Icon name="CalendarIcon" size={24} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {locale === 'th' ? 'ไม่มีช่วงเวลาว่างในวันนี้' : 'No available slots today'}
                </p>
                <button
                  type="button"
                  onClick={() => fetchTimeSlots(true)}
                  className="text-xs text-primary font-bold uppercase mt-2 hover:underline"
                >
                  {locale === 'th' ? 'ลองใหม่อีกครั้ง' : 'Try Again'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 gap-3">
                {timeSlots.map(({ time, label, status }) => {
                  const isSelected = value === time;
                  const isDisabled = status !== 'available' && !isSelected;

                  // Format label for display
                  let displayLabel = label;
                  if (locale !== 'th' && time) {
                    try {
                      const [hours, minutes] = time.split(':');
                      const hour = parseInt(hours, 10);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const hour12 = hour % 12 || 12;
                      displayLabel = `${hour12}:${minutes} ${ampm}`;
                    } catch (e) {
                      /* ignore */
                    }
                  }

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isDisabled}
                      onClick={(e) => !isDisabled && handleSelect(e, time)}
                      title={`${displayLabel}`}
                      className={`
                        flex items-center justify-center py-3.5 px-2 rounded-xl text-sm font-bold transition-all duration-200
                        ${getStatusColor(status, isSelected)}
                        ${isDisabled ? '' : 'active:scale-90 cursor-pointer shadow-sm hover:shadow-md'}
                      `}
                    >
                      {displayLabel}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TimeGridPicker;
