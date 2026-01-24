'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';

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

// Generate a session ID for this browser session
const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  try {
    let sessionId = sessionStorage.getItem('bookingSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('bookingSessionId', sessionId);
    }
    return sessionId;
  } catch (e) {
    // Fallback for private browsing where sessionStorage might be blocked
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
};

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
  const [isOpen, setIsOpen] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [holdingTime, setHoldingTime] = useState<string | null>(null);
  const [currentHold, setCurrentHold] = useState<string | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionId = useRef(getSessionId());

  // Fetch time slots from API
  const fetchTimeSlots = useCallback(async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/timeslots?date=${selectedDate}&sessionId=${sessionId.current}`
      );
      const data = await response.json();
      if (data.slots) {
        setTimeSlots(data.slots);
      }
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch on mount and when date changes
  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  // Refresh slots periodically when picker is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(fetchTimeSlots, 3000);
    return () => clearInterval(interval);
  }, [isOpen, fetchTimeSlots]);

  // Hold a time slot
  const holdTimeSlot = async (time: string) => {
    if (!selectedDate) return false;

    try {
      const response = await fetch('/api/timeslots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          time,
          action: 'hold',
          sessionId: sessionId.current,
        }),
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to hold time slot:', error);
      return false;
    }
  };

  // Release a time slot
  const releaseTimeSlot = async (time: string) => {
    if (!selectedDate) return;

    try {
      await fetch('/api/timeslots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          time,
          action: 'release',
          sessionId: sessionId.current,
        }),
      });
    } catch (error) {
      console.error('Failed to release time slot:', error);
    }
  };

  // Handle time selection with hold
  const handleSelect = async (e: React.MouseEvent, time: string) => {
    e.preventDefault();
    if (holdingTime) return;

    setHoldingTime(time);
    try {
      // Release previous hold if any
      if (currentHold && currentHold !== time) {
        await releaseTimeSlot(currentHold);
      }

      // Try to hold the new slot
      const response = await fetch('/api/timeslots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          time,
          action: 'hold',
          sessionId: sessionId.current,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setCurrentHold(time);
        onChange(time);
        setIsOpen(false);
      } else {
        // Refresh slots immediately to show accurate state
        const fetchPromise = fetchTimeSlots();
        setHoldingTime(null); // Clear loading state before alert
        alert(data.error || 'ขออภัย ช่วงเวลานี้ไม่ว่างแล้ว กรุณาเลือกเวลาอื่น');
        await fetchPromise;
      }
    } catch (error) {
      console.error('Failed to hold time slot:', error);
      setHoldingTime(null);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setHoldingTime(null);
    }
  };

  // Refresh hold every 20 seconds to keep it active while user fills the form
  // (since hold expires after 30 seconds)
  useEffect(() => {
    if (value && currentHold === value && selectedDate) {
      const interval = setInterval(async () => {
        await holdTimeSlot(value);
      }, 20000); // Refresh every 20 seconds

      return () => clearInterval(interval);
    }
  }, [value, currentHold, selectedDate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      if (currentHold) {
        releaseTimeSlot(currentHold);
      }
    };
  }, []);

  const formatDisplayTime = (time: string) => {
    if (!time) return 'เลือกเวลา';
    return `${time} น.`;
  };

  const getStatusColor = (status: string, isSelected: boolean, isHolding: boolean) => {
    if (isHolding) return 'bg-primary/40 text-primary-foreground animate-pulse';
    if (isSelected) return 'bg-primary text-primary-foreground shadow-warm-sm';
    switch (status) {
      case 'booked':
        return 'bg-error/20 text-error cursor-not-allowed line-through';
      case 'held':
        return 'bg-warning/20 text-warning cursor-not-allowed';
      default:
        return 'bg-muted/50 text-foreground hover:bg-primary/20 hover:text-primary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'booked':
        return ' (จองแล้ว)';
      case 'held':
        return ' (กำลังจอง)';
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
            if (!isOpen) fetchTimeSlots();
          }
        }}
        disabled={!selectedDate}
        className={`
          w-full px-4 py-3.5 pr-12 rounded-lg text-base font-medium text-left
          bg-input border-2 transition-all duration-300
          focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary
          min-h-[52px] shadow-sm
          ${error ? 'border-error' : success ? 'border-success' : 'border-border'}
          ${selectedDate ? 'hover:border-primary/70 hover:shadow-md cursor-pointer active:scale-[0.99]' : 'opacity-50 cursor-not-allowed'}
        `}
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {!selectedDate ? 'กรุณาเลือกวันที่ก่อน' : formatDisplayTime(value)}
        </span>
      </button>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Icon name="ClockIcon" size={20} className="text-primary" />
        </div>
      </div>

      {isOpen && selectedDate && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px] cursor-pointer"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-[110] top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-xl shadow-warm-lg p-4 max-h-[350px] overflow-y-auto pointer-events-auto">
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-card/90 backdrop-blur-sm pb-2 z-10">
              <h4 className="text-sm font-semibold text-foreground">เลือกเวลา</h4>
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
                  กำลังโหลดเวลาที่ว่าง...
                </p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-2">
                <div className="p-3 bg-muted rounded-full text-muted-foreground">
                  <Icon name="CalendarIcon" size={24} />
                </div>
                <p className="text-sm text-muted-foreground">ไม่มีช่วงเวลาว่างในวันนี้</p>
                <button
                  type="button"
                  onClick={() => fetchTimeSlots()}
                  className="text-xs text-primary font-bold uppercase mt-2 hover:underline"
                >
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 gap-3">
                {timeSlots.map(({ time, label, status }) => {
                  const isSelected = value === time;
                  const isHolding = holdingTime === time;
                  const isDisabled = (status !== 'available' && !isSelected) || isHolding;
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isDisabled}
                      onClick={(e) => !isDisabled && handleSelect(e, time)}
                      title={`${label}`}
                      className={`
                        flex items-center justify-center py-3.5 px-2 rounded-xl text-sm font-bold transition-all duration-200
                        ${getStatusColor(status, isSelected, isHolding)}
                        ${isDisabled ? '' : 'active:scale-90 cursor-pointer shadow-sm hover:shadow-md'}
                      `}
                    >
                      {isHolding ? (
                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        label
                      )}
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
