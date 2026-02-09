'use client';

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
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationDetails;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, reservation }) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Stop confetti after 4 seconds
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Calendar event handlers - now with locale support
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    // Add Thailand timezone offset (UTC+7)
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

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    if (locale === 'th') {
      return `${hour}:${minutes} น.`;
    }
    // Convert to 12-hour format for EN
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <>
      {/* Confetti Animation */}
      <Confetti trigger={showConfetti} duration={3000} />

      <div
        className="fixed inset-0 z-300 bg-foreground/60 backdrop-blur-sm transition-smooth"
        onClick={onClose}
        aria-hidden="true"
      />
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
            <div className="bg-red-600 px-6 py-3 rounded-2xl animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.4)] mt-4">
              <p className="text-sm md:text-base font-black text-white text-center flex items-center gap-2 tracking-tight">
                <Icon name="CameraIcon" size={20} variant="solid" />
                {t('success.screenshot')}
              </p>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="bg-muted rounded-2xl p-6 space-y-4 border border-border">
              <div className="flex items-start gap-4">
                <Icon name="IdentificationIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('success.code')}</p>
                  <p className="text-xl font-black text-primary bg-primary/10 px-4 py-1.5 rounded-xl border border-primary/30 inline-block tracking-widest shadow-glow-sm">
                    {activeReservation.bookingCode || activeReservation.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon name="UserIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{t('form.name')}</p>
                  <p className="text-base font-bold text-foreground">
                    {activeReservation.fullName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon name="PhoneIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{t('form.phone')}</p>
                  <p className="text-base font-bold text-foreground">{activeReservation.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon name="CalendarIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{t('form.date')}</p>
                  <p className="text-base font-bold text-foreground">
                    {formatDate(activeReservation.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon name="ClockIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{t('form.time')}</p>
                  <p className="text-base font-bold text-foreground">
                    {formatTime(activeReservation.time)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon name="UsersIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{t('form.guests')}</p>
                  <p className="text-base font-bold text-foreground">
                    {activeReservation.guests} {t('form.guests.label')}
                  </p>
                </div>
              </div>
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
