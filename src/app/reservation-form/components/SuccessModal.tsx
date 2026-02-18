'use client'; // ทำงานฝั่ง Client

import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';
import Confetti from '@/components/ui/Confetti';
import {
  createReservationEvent,
  generateGoogleCalendarUrl,
  downloadICSFile
} from '@/lib/calendarUtils';

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

interface SuccessModalProps {
  isOpen: boolean; // สถานะเปิด Modal
  onClose: () => void; // ฟังก์ชันปิด Modal
  reservation: ReservationDetails; // ข้อมูลการจองที่สำเร็จ
}

/**
 * SuccessModal Component
 * Modal แสดงผลเมื่อจองสำเร็จ
 * - แสดงรายละเอียดการจอง
 * - แสดง Confetti เฉลิมฉลอง
 * - ปุ่มเพิ่มลงปฏิทิน (Google Calendar, Apple Calendar)
 * - แนะนำให้แคปหน้าจอ
 */
const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, reservation }) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Effect: แสดง Confetti เมื่อเปิด Modal
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // หยุด Confetti หลังจาก 4 วินาที
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ฟังก์ชันเพิ่มลง Google Calendar
  const handleAddToGoogleCalendar = () => {
    const event = createReservationEvent(
      reservation.bookingCode || reservation.id.slice(0, 8),
      reservation.fullName,
      reservation.date,
      reservation.time,
      parseInt(reservation.guests),
      reservation.tableName,
      'Savory Bistro',
      '',
      locale as 'th' | 'en'
    );
    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank');
  };

  // ฟังก์ชันดาวน์โหลดไฟล์ .ics สำหรับ Apple Calendar / Outlook
  const handleAddToAppleCalendar = () => {
    const event = createReservationEvent(
      reservation.bookingCode || reservation.id.slice(0, 8),
      reservation.fullName,
      reservation.date,
      reservation.time,
      parseInt(reservation.guests),
      reservation.tableName,
      'Savory Bistro',
      '',
      locale as 'th' | 'en'
    );
    downloadICSFile(event, `reservation-${reservation.bookingCode || reservation.id.slice(0, 8)}.ics`);
  };

  if (!isOpen || !reservation) return null;
  const activeReservation = reservation;

  // ฟังก์ชันจัดรูปแบบวันที่ให้แสดงผลสวยงาม (รองรับภาษาไทย)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    // ปรับ Timezone เป็น UTC+7 สำหรับการแสดงผลที่ถูกต้อง
    const thailandOffset = 7 * 60;
    const localOffset = date.getTimezoneOffset();
    const thailandDate = new Date(date.getTime() + (thailandOffset + localOffset) * 60000);
    return thailandDate.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ฟังก์ชันจัดรูปแบบเวลา (รองรับ 12h/24h format)
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    if (locale === 'th') {
      return `${hour}:${minutes} น.`;
    }
    // ใช้ 12-hour format สำหรับภาษาอังกฤษ
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <>
      {/* Confetti Animation */}
      <Confetti trigger={showConfetti} duration={3000} />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-300 bg-foreground/60 backdrop-blur-sm transition-smooth"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-300 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="
            w-full max-w-md bg-card rounded-lg shadow-warm-xl
            animate-in zoom-in-95 duration-250
            max-h-[90vh] overflow-y-auto my-auto
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
        >
          {/* Header & Success Icon */}
          <div className="p-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <Icon name="CheckCircleIcon" size={40} className="text-success" variant="solid" />
            </div>
            <h2
              id="success-title"
              className="text-2xl font-heading font-bold text-foreground text-center"
            >
              {t('success.title')}
            </h2>
            <p className="text-base text-muted-foreground text-center">{t('success.subtitle')}</p>

            {/* Screenshot Reminder Alert */}
            <div className="bg-red-600 px-6 py-3 rounded-2xl animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.4)] mt-4">
              <p className="text-sm md:text-base font-black text-white text-center flex items-center gap-2 tracking-tight">
                <Icon name="CameraIcon" size={20} variant="solid" />
                {t('success.screenshot')}
              </p>
            </div>
          </div>

          {/* Reservation Details Card */}
          <div className="px-6 pb-6">
            <div className="bg-muted rounded-2xl p-6 space-y-4 border border-border">
              {/* Booking Code with Copy Feature */}
              <div className="flex items-start gap-4 group/copy">
                <Icon name="IdentificationIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('success.code')}</p>
                  <div className="relative inline-flex items-center">
                    <button
                      onClick={() => {
                        const code = activeReservation.bookingCode || activeReservation.id.slice(0, 8);
                        navigator.clipboard.writeText(code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="
                        text-xl font-black text-primary bg-primary/10 px-4 py-1.5 rounded-xl border border-primary/30 
                        flex items-center gap-3 transition-all hover:bg-primary/20 active:scale-95 
                        tracking-widest shadow-glow-sm hover:shadow-glow-md group
                      "
                      title={locale === 'th' ? 'คลิกเพื่อคัดลอก' : 'Click to copy'}
                    >
                      {activeReservation.bookingCode || activeReservation.id.slice(0, 8)}
                      {copiedCode ? (
                        <Icon name="CheckIcon" size={18} className="text-success animate-in zoom-in spin-in-90 duration-300" variant="solid" />
                      ) : (
                        <Icon name="DocumentDuplicateIcon" size={18} className="text-primary/50 group-hover:text-primary transition-colors" />
                      )}
                    </button>
                    {copiedCode && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-success text-success-foreground text-[10px] font-black px-2 py-1 rounded shadow-lg animate-in fade-in slide-in-from-bottom-2">
                        {locale === 'th' ? 'คัดลอกแล้ว!' : 'COPIED!'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="flex items-start gap-4">
                <Icon name="UserIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{t('form.name')}</p>
                  <p className="text-base font-bold text-foreground">
                    {activeReservation.fullName}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <Icon name="PhoneIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{t('form.phone')}</p>
                  <p className="text-base font-bold text-foreground">{activeReservation.phone}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-4">
                <Icon name="CalendarIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{t('form.date')}</p>
                  <p className="text-base font-bold text-foreground">
                    {formatDate(activeReservation.date)}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-4">
                <Icon name="ClockIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{t('form.time')}</p>
                  <p className="text-base font-bold text-foreground">
                    {formatTime(activeReservation.time)}
                  </p>
                </div>
              </div>

              {/* Guests */}
              <div className="flex items-start gap-4">
                <Icon name="UsersIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{t('form.guests')}</p>
                  <p className="text-base font-bold text-foreground">
                    {activeReservation.guests} {t('form.guests.label')}
                  </p>
                </div>
              </div>

              {/* Table Name (Optional) */}
              {activeReservation.tableName && (
                <div className="flex items-start gap-4">
                  <Icon name="MapIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{t('admin.floorPlan.editModal.name')}</p>
                    <p className="text-base font-bold text-foreground">
                      {activeReservation.tableName}
                    </p>
                  </div>
                </div>
              )}

              {/* Special Requests (Optional) */}
              {activeReservation.specialRequests && (
                <div className="flex items-start gap-4">
                  <Icon name="ChatBubbleLeftRightIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{t('form.requests')}</p>
                    <p className="text-base font-bold text-foreground">
                      {activeReservation.specialRequests}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 space-y-3">
            {/* Calendar Sync Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAddToGoogleCalendar}
                className="
                  flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                  text-sm font-medium bg-muted text-foreground border border-border
                  hover:bg-muted/80 transition-all active:scale-[0.97]
                "
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5zM8 7v10h2V7H8zm6 0v10h2V7h-2z" />
                </svg>
                <span>{t('calendar.google')}</span>
              </button>
              <button
                onClick={handleAddToAppleCalendar}
                className="
                  flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                  text-sm font-medium bg-muted text-foreground border border-border
                  hover:bg-muted/80 transition-all active:scale-[0.97]
                "
              >
                <Icon name="CalendarIcon" size={16} />
                <span>{t('calendar.apple')}</span>
              </button>
            </div>

            {/* Back Home Button */}
            <button
              onClick={onClose}
              className="
                w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md
                text-base font-medium bg-primary text-primary-foreground
                shadow-warm-sm transition-smooth hover:shadow-warm-md
                hover:-translate-y-0.5 active:scale-[0.97] min-h-[44px]
              "
            >
              <Icon name="HomeIcon" size={20} />
              <span>{t('success.backHome')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuccessModal;
