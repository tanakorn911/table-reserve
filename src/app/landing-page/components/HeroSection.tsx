import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

interface HeroSectionProps {
  restaurantName: React.ReactNode;
  tagline: string;
  heroImage: string;
  heroImageAlt: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  restaurantName,
  tagline,
  heroImage,
  heroImageAlt,
}) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  return (
    <section className="relative w-full h-[600px] lg:h-[700px] overflow-hidden">
      <div className="absolute inset-0">
        <AppImage
          src={heroImage}
          alt={heroImageAlt}
          fill
          className="object-cover"
          priority
        />
        {/* Theme-aware overlay: very light for light theme, dark for dark theme */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-800/20 via-amber-900/30 to-amber-950/40 dark:from-black/50 dark:via-black/60 dark:to-black/80" />
      </div>

      <div className="relative container mx-auto px-4 lg:px-6 h-full flex flex-col justify-center items-center text-center">
        <div className="max-w-4xl space-y-6">
          {/* Always white text on dark overlay for hero */}
          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white drop-shadow-lg leading-snug">
            {restaurantName}
          </h1>

          <p className="text-xl lg:text-2xl text-white/90 font-medium drop-shadow-md">{tagline}</p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/reservation-form"
              className="
                inline-flex items-center gap-3 px-10 py-5 rounded-lg text-lg font-bold
                bg-accent text-accent-foreground shadow-warm-lg
                transition-all hover:shadow-warm-xl hover:-translate-y-1
                active:scale-[0.97]
              "
            >
              <Icon name="CalendarIcon" size={24} />
              <span>{t('hero.cta')}</span>
            </Link>

            <Link
              href="/check-status"
              className="
                inline-flex items-center gap-3 px-10 py-5 rounded-lg text-lg font-bold
                bg-white/20 backdrop-blur-md text-white border border-white/30
                transition-all hover:bg-white/30 hover:-translate-y-1
                active:scale-[0.97]
              "
            >
              <Icon name="MagnifyingGlassIcon" size={24} />
              <span>{t('nav.checkStatus')}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
