'use client';

import React, { useState, useEffect } from 'react';
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

// Map day index (0=Sun) to Thai Day Name
const DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

const LandingPageInteractive: React.FC = () => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await fetch('/api/settings?key=business_hours');
        const json = await res.json();
        let hoursData = DEFAULT_HOURS;

        if (json.data && json.data.value) {
          hoursData = json.data.value;
        }

        const getThailandDay = () => {
          const now = new Date();
          const thailandOffset = 7 * 60; // UTC+7 in minutes
          const localOffset = now.getTimezoneOffset();
          const thailandTime = new Date(now.getTime() + (thailandOffset + localOffset) * 60000);
          return thailandTime.getDay(); // 0 = Sunday
        };

        const currentDayIndex = getThailandDay();

        // Reorder to start from Monday (Index 1) to Sunday (Index 0) for display habit?
        // Or just standard Weekday order (Mon-Sun).
        // Let's stick to Mon-Sun display order as per previous data.
        // Mon=1 ... Sat=6, Sun=0.

        const displayOrder = [1, 2, 3, 4, 5, 6, 0];

        const newSchedule = displayOrder.map((dayIndex) => {
          const dayConfig = hoursData[String(dayIndex)];
          return {
            day: DAY_NAMES[dayIndex],
            hours: dayConfig ? `${dayConfig.open} - ${dayConfig.close} น.` : 'ปิดทำการ',
            isToday: dayIndex === currentDayIndex,
          };
        });

        setSchedule(newSchedule);
      } catch (error) {
        console.error('Failed to fetch hours', error);
        // Fallback static data
        const fallbackSchedule = [
          { day: 'จันทร์', hours: '11:00 - 22:00 น.', isToday: false },
          { day: 'อังคาร', hours: '11:00 - 22:00 น.', isToday: false },
          { day: 'พุธ', hours: '11:00 - 22:00 น.', isToday: false },
          { day: 'พฤหัสบดี', hours: '11:00 - 23:00 น.', isToday: false },
          { day: 'ศุกร์', hours: '11:00 - 23:00 น.', isToday: false },
          { day: 'เสาร์', hours: '10:00 - 23:00 น.', isToday: false },
          { day: 'อาทิตย์', hours: '10:00 - 21:00 น.', isToday: false },
        ];
        setSchedule(fallbackSchedule);
      }
    };

    fetchHours();

    const fetchHolidays = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('holidays')
        .select('*')
        .gte('holiday_date', today)
        .order('holiday_date', { ascending: true })
        .limit(3);
      if (data) setHolidays(data);
    };
    fetchHolidays();

    // Optional: Poll every 30s so if admin updates, it reflects
    const interval = setInterval(() => {
      fetchHours();
      fetchHolidays();
    }, 30000);
    return () => clearInterval(interval);
  }, [supabase]);

  const landingData: LandingPageData = {
    restaurantName: t('app.title'),
    tagline: t('app.tagline'),
    heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
    heroImageAlt: 'Restaurant atmosphere',
    schedule: schedule, // Use dynamic state
    infoCards: [
      {
        icon: 'SparklesIcon',
        title: 'บริการระดับพรีเมียม',
        description:
          'บริการจองโต๊ะออนไลน์ที่สะดวก รวดเร็ว และมีประสิทธิภาพสูงสุด รองรับทุกความต้องการของคุณ',
      },
      {
        icon: 'UserGroupIcon',
        title: 'ทีมงานมืออาชีพ',
        description:
          'ทีมงานผู้เชี่ยวชาญพร้อมให้บริการตลอด 24 ชั่วโมง แก้ไขปัญหาได้อย่างรวดเร็วและมีประสิทธิภาพ',
      },
      {
        icon: 'HomeModernIcon',
        title: 'ระบบที่ทันสมัย',
        description: 'เทคโนโลยีล่าสุดเพื่อประสบการณ์การจองที่ราบรื่น ปลอดภัย และใช้งานง่าย',
      },
    ],
    trustBadges: [
      {
        icon: 'ShieldCheckIcon',
        title: 'ปลอดภัย SSL',
        description: 'ข้อมูลของคุณได้รับการปกป้องด้วยการเข้ารหัสระดับสูง',
      },
      {
        icon: 'StarIcon',
        title: 'มาตรฐาน 5 ดาว',
        description: 'ได้รับการรับรองคุณภาพจากสมาคมร้านอาหาร',
      },
      {
        icon: 'CheckBadgeIcon',
        title: 'รับรองมาตรฐาน',
        description: 'ผ่านมาตรฐานความปลอดภัยและสุขอนามัย',
      },
    ],
    contact: {
      phone: '054-466-666',
      email: 'contact@up.ac.th',
      address: 'มหาวิทยาลัยพะเยา 19 หมู่ 2 ต.แม่กา อ.เมือง จ.พะเยา 56000',
      mapLat: 40.758,
      mapLng: -73.9855,
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
