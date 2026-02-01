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
            <div className="bg-red-600 px-6 py-3 rounded-2xl animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.4)] mt-4">
              <p className="text-sm md:text-base font-black text-white text-center flex items-center gap-2 tracking-tight">
                <Icon name="CameraIcon" size={20} variant="solid" />
                {t('success.screenshot')}
              </p>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="bg-white/5 rounded-2xl p-6 space-y-4 border border-white/10">
              <div className="flex items-start gap-4">
                <Icon name="IdentificationIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">{t('success.code')}</p>
                  <p className="text-xl font-black text-blue-400 bg-blue-400/10 px-4 py-1.5 rounded-xl border border-blue-400/30 inline-block tracking-widest shadow-glow-sm">
                    {activeReservation.bookingCode || activeReservation.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon name="UserIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">{t('form.name')}</p>
                  <p className="text-base font-bold text-white">
                    {activeReservation.fullName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon name="PhoneIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">{t('form.phone')}</p>
                  <p className="text-base font-bold text-white">{activeReservation.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon name="CalendarIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">{t('form.date')}</p>
                  <p className="text-base font-bold text-white">
                    {formatDate(activeReservation.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon name="ClockIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">{t('form.time')}</p>
                  <p className="text-base font-bold text-white">
                    {formatTime(activeReservation.time)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Icon name="UsersIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">{t('form.guests')}</p>
                  <p className="text-base font-bold text-white">
                    {activeReservation.guests} {t('form.guests.label')}
                  </p>
                </div>
              </div>
              {activeReservation.tableName && (
                <div className="flex items-start gap-4">
                  <Icon name="MapIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">{t('admin.floorPlan.editModal.name')}</p>
                    <p className="text-base font-bold text-white">
                      {activeReservation.tableName}
                    </p>
                  </div>
                </div>
              )}
              {activeReservation.specialRequests && (
                <div className="flex items-start gap-4">
                  <Icon name="ChatBubbleLeftRightIcon" size={22} className="text-accent mt-0.5" variant="solid" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">{t('form.requests')}</p>
                    <p className="text-base font-bold text-white">
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
