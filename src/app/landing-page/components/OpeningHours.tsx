import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

interface DaySchedule {
  day: string;
  hours: string;
  isToday?: boolean;
}

interface OpeningHoursProps {
  schedule: DaySchedule[];
}

const OpeningHours: React.FC<OpeningHoursProps> = ({ schedule }) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
              <Icon name="ClockIcon" size={32} className="text-white" />
            </div>
            <h2 className="mb-4 text-4xl font-bold lg:text-5xl font-heading text-foreground">
              {t('hours.title')}
            </h2>
            <p className="text-lg text-muted-foreground">{t('hours.subtitle')}</p>
          </div>

          <div className="p-6 bg-background rounded-xl shadow-warm-md lg:p-8">
            <div className="space-y-4">
              {schedule.map((item, index) => (
                <div
                  key={index}
                  className={`
                    flex items-center justify-between py-4 px-6 rounded-lg
                    transition-smooth
                    ${
                      item.isToday
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-muted/50 hover:bg-muted'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {item.isToday && (
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                    <span
                      className={`
                        text-lg font-semibold
                        ${item.isToday ? 'text-gray-300' : 'text-foreground'}
                      `}
                    >
                      {item.day}
                    </span>
                  </div>
                  <span
                    className={`
                      text-lg font-medium
                      ${item.isToday ? 'text-gray-300' : 'text-muted-foreground'}
                    `}
                  >
                    {item.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OpeningHours;
