import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

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

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationDetails;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, reservation }) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

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
      <div
        className="fixed inset-0 z-300 bg-foreground/60 backdrop-blur-sm transition-smooth"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
        <div
          className="
            w-full max-w-md bg-card rounded-lg shadow-warm-xl
            animate-in zoom-in-95 duration-250
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
            <p className="text-base text-muted-foreground text-center font-semibold text-primary">
              {t('success.screenshot')}
            </p>
          </div>

          <div className="px-6 pb-6">
            <div className="bg-muted rounded-md p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Icon name="IdentificationIcon" size={20} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t('success.code')}</p>
                  <p className="text-xl font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border-2 border-blue-200 inline-block tracking-widest">
                    {activeReservation.bookingCode || activeReservation.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="UserIcon" size={20} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t('form.name')}</p>
                  <p className="text-base font-medium text-foreground">
                    {activeReservation.fullName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="PhoneIcon" size={20} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t('form.phone')}</p>
                  <p className="text-base font-medium text-foreground">{activeReservation.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="CalendarIcon" size={20} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t('form.date')}</p>
                  <p className="text-base font-medium text-foreground">
                    {formatDate(activeReservation.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="ClockIcon" size={20} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t('form.time')}</p>
                  <p className="text-base font-medium text-foreground">
                    {formatTime(activeReservation.time)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="UsersIcon" size={20} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t('form.guests')}</p>
                  <p className="text-base font-medium text-foreground">
                    {activeReservation.guests} {t('form.guests.label')}
                  </p>
                </div>
              </div>
              {activeReservation.specialRequests && (
                <div className="flex items-start gap-3">
                  <Icon name="ChatBubbleLeftRightIcon" size={20} className="text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t('form.requests')}</p>
                    <p className="text-base font-medium text-foreground">
                      {activeReservation.specialRequests}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              className="
                flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-md
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
