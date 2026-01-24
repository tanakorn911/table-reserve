'use client';

import React, { useState, useEffect, useMemo } from 'react';
import HeroSection from './HeroSection';
import OpeningHours from './OpeningHours';
import RestaurantInfo from './RestaurantInfo';
import TrustSignals from './TrustSignals';
import LocationContact from './LocationContact';
import Footer from './Footer';
import StickyReserveButton from './StickyReserveButton';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';
import HolidayAnnouncements from './HolidayAnnouncements';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { Line } from 'recharts';

interface DaySchedule {
    day: string;
    hours: string;
    isToday?: boolean;
}

interface InfoCard {
    icon: string;
    title: string;
    description: string;
}

interface TrustBadge {
    icon: string;
    title: string;
    description: string;
}

interface ContactInfo {
    phone: string;
    email: string;
    address: string;
    mapLat: number;
    mapLng: number;
}

interface SocialLink {
    name: string;
    icon: string;
    url: string;
}

interface LandingPageData {
    restaurantName: string;
    tagline: string;
    heroImage: string;
    heroImageAlt: string;
    schedule: DaySchedule[];
    infoCards: InfoCard[];
    trustBadges: TrustBadge[];
    contact: ContactInfo;
    socialLinks: SocialLink[];
}

const DEFAULT_HOURS: any = {
    '0': { open: '10:00', close: '21:00' },
    '1': { open: '11:00', close: '22:00' },
    '2': { open: '11:00', close: '22:00' },
    '3': { open: '11:00', close: '22:00' },
    '4': { open: '11:00', close: '23:00' },
    '5': { open: '11:00', close: '23:00' },
    '6': { open: '10:00', close: '23:00' },
};

const LandingPageInteractive: React.FC = () => {
    const { locale } = useNavigation();
    const { t } = useTranslation(locale);
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const supabase = React.useMemo(() => createClientSupabaseClient(), []);

    // Memoize day names to avoid recreation
    const dayNames = React.useMemo(() => [
        t('day.sunday'),
        t('day.monday'),
        t('day.tuesday'),
        t('day.wednesday'),
        t('day.thursday'),
        t('day.friday'),
        t('day.saturday')
    ], [t]);

    useEffect(() => {
        let isMounted = true;

        const fetchHours = async () => {
            try {
                const res = await fetch('/api/settings?key=business_hours', {
                    cache: 'no-store'
                });
                if (!res.ok) throw new Error('Network response was not ok');
                const json = await res.json();

                if (!isMounted) return;

                let hoursData = DEFAULT_HOURS;
                if (json.data && json.data.value) {
                    hoursData = json.data.value;
                }

                const getThailandDay = () => {
                    const now = new Date();
                    const thailandOffset = 7 * 60;
                    const localOffset = now.getTimezoneOffset();
                    const thailandTime = new Date(now.getTime() + (thailandOffset + localOffset) * 60000);
                    return thailandTime.getDay();
                };

                const currentDayIndex = getThailandDay();
                const displayOrder = [1, 2, 3, 4, 5, 6, 0];

                const newSchedule = displayOrder.map((dayIndex) => {
                    const dayConfig = hoursData[String(dayIndex)];
                    let timeRange = t('hours.closed');

                    if (dayConfig) {
                        if (locale === 'th') {
                            timeRange = `${dayConfig.open} - ${dayConfig.close} น.`;
                        } else {
                            const toAmPm = (timeStr: string) => {
                                try {
                                    const [h, m] = timeStr.split(':');
                                    let hour = parseInt(h, 10);
                                    const ampm = hour >= 12 ? 'PM' : 'AM';
                                    hour = hour % 12 || 12;
                                    return `${hour}:${m} ${ampm}`;
                                } catch (e) {
                                    return timeStr;
                                }
                            };
                            timeRange = `${toAmPm(dayConfig.open)} - ${toAmPm(dayConfig.close)}`;
                        }
                    }

                    return {
                        day: dayNames[dayIndex],
                        hours: timeRange,
                        isToday: dayIndex === currentDayIndex,
                    };
                });

                setSchedule(newSchedule);
            } catch (error) {
                console.error('Failed to fetch hours:', error);
                if (isMounted) {
                    const fallbackSchedule = [
                        { day: dayNames[1], hours: '11:00 - 22:00', isToday: false },
                        { day: dayNames[2], hours: '11:00 - 22:00', isToday: false },
                        { day: dayNames[3], hours: '11:00 - 22:00', isToday: false },
                        { day: dayNames[4], hours: '11:00 - 23:00', isToday: false },
                        { day: dayNames[5], hours: '11:00 - 23:00', isToday: false },
                        { day: dayNames[6], hours: '10:00 - 23:00', isToday: false },
                        { day: dayNames[0], hours: '10:00 - 21:00', isToday: false },
                    ].map(item => ({
                        ...item,
                        hours: locale === 'th' ? `${item.hours} น.` : item.hours
                    }));
                    setSchedule(fallbackSchedule);
                }
            }
        };

        const fetchHolidays = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const { data } = await supabase
                    .from('holidays')
                    .select('*')
                    .gte('holiday_date', today)
                    .order('holiday_date', { ascending: true })
                    .limit(3);
                if (isMounted && data) {
                    setHolidays(data);
                }
            } catch (error) {
                console.error('Failed to fetch holidays:', error);
            }
        };

        fetchHours();
        fetchHolidays();

        const interval = setInterval(() => {
            fetchHours();
            fetchHolidays();
        }, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [supabase, locale, dayNames, t]);

    const landingData: LandingPageData = {
        restaurantName: t('app.title'),
        tagline: t('app.tagline'),
        heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
        heroImageAlt: t('hero.imageAlt'),
        schedule: schedule,
        infoCards: [
            {
                icon: 'SparklesIcon',
                title: t('info.premium.title'),
                description: t('info.premium.desc'),
            },
            {
                icon: 'UserGroupIcon',
                title: t('info.service.title'),
                description: t('info.service.desc'),
            },
            {
                icon: 'HomeModernIcon',
                title: t('info.modern.title'),
                description: t('info.modern.desc'),
            },
        ],
        trustBadges: [
            {
                icon: 'ShieldCheckIcon',
                title: t('trust.ssl.title'),
                description: t('trust.ssl.desc'),
            },
            {
                icon: 'StarIcon',
                title: t('trust.star.title'),
                description: t('trust.star.desc'),
            },
            {
                icon: 'CheckBadgeIcon',
                title: t('trust.health.title'),
                description: t('trust.health.desc'),
            },
        ],
        contact: {
            phone: '054-466-666',
            email: 'contact@up.ac.th',
            address: t('contact.address.full'),
            mapLat: 40.7580,
            mapLng: -73.9855
        },
        socialLinks: [
            { name: 'Facebook', icon: 'GlobeAltIcon', url: 'https://facebook.com' },
            { name: 'Instagram', icon: 'CameraIcon', url: 'https://instagram.com' },
            { name: 'Line', icon: 'ChatBubbleLeftIcon', url: 'https://line.me' },
        ],
    };

    return (
        <>
            <HeroSection
                restaurantName={landingData.restaurantName}
                tagline={landingData.tagline}
                heroImage={landingData.heroImage}
                heroImageAlt={landingData.heroImageAlt}
            />

            {holidays.length > 0 && <HolidayAnnouncements holidays={holidays} />}

            <OpeningHours schedule={landingData.schedule} />

            <RestaurantInfo cards={landingData.infoCards} />

            <TrustSignals badges={landingData.trustBadges} />

            <LocationContact contact={landingData.contact} />

            <Footer restaurantName={landingData.restaurantName} socialLinks={landingData.socialLinks} />

            <StickyReserveButton />
        </>
    );
};

export default LandingPageInteractive;
