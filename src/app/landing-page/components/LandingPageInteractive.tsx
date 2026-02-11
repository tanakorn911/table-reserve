'use client'; // ใช้ Client Component เพื่อให้สามารถใช้ Hooks (useState, useEffect) และ Interactive Features ได้

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

// ----------------------------------------------------------------------
// Interfaces (โครงสร้างข้อมูล)
// ----------------------------------------------------------------------

// โครงสร้างข้อมูลเวลาเปิด-ปิดสำหรับแต่ละวัน
interface DaySchedule {
  day: string;    // ชื่อวัน (เช่น อาทิตย์, จันทร์)
  hours: string;  // ช่วงเวลาเปิด-ปิด (เช่น "10:00 - 22:00 น.")
  isToday?: boolean; // ระบุว่าเป็นวันปัจจุบันหรือไม่ (เพื่อใช้ในการไฮไลท์)
}

// โครงสร้างข้อมูลสำหรับการ์ดแสดงจุดเด่นร้าน (Info Card)
interface InfoCard {
  icon: string;        // ชื่อไอคอน (IconName)
  title: string;       // หัวข้อ
  description: string; // คำอธิบายรายละเอียด
}

// โครงสร้างข้อมูลสำหรับ Badge ความน่าเชื่อถือ (Trust Badge)
interface TrustBadge {
  icon: string;        // ชื่อไอคอน
  title: string;       // หัวข้อ
  description: string; // คำอธิบาย
}

// โครงสร้างข้อมูลการติดต่อ (Contact Info)
interface ContactInfo {
  phone: string;       // เบอร์โทรศัพท์
  email: string;       // อีเมล
  address: string;     // ที่อยู่ร้าน
  mapLat: number;      // ละติจูดในแผนที่
  mapLng: number;      // ลองจิจูดในแผนที่
}

// โครงสร้างข้อมูลลิงก์ Social Media
interface SocialLink {
  name: string; // ชื่อ Social Media (เช่น Facebook, Instagram)
  icon: string; // ชื่อไอคอน
  url: string;  // URL ลิงก์ไปยังหน้า Social Media
}

// โครงสร้างข้อมูลรวมสำหรับหน้า Landing Page ทั้งหมด
interface LandingPageData {
  restaurantName: string;      // ชื่อร้าน
  tagline: string;             // สโลแกนร้าน
  heroImage: string;           // URL รูปภาพ Banner หลัก
  heroImageAlt: string;        // คำอธิบายรูปภาพ (Alt text)
  schedule: DaySchedule[];     // ตารางเวลาเปิด-ปิด
  infoCards: InfoCard[];       // รายการการ์ดจุดเด่น
  trustBadges: TrustBadge[];   // รายการ Badge ความน่าเชื่อถือ
  contact: ContactInfo;        // ข้อมูลการติดต่อ
  socialLinks: SocialLink[];   // รายการลิงก์ Social Media
}

// ----------------------------------------------------------------------
// Constants (ค่าคงที่)
// ----------------------------------------------------------------------

// ค่าเริ่มต้นเวลาเปิด-ปิด (Fallback กรณีเชื่อมต่อ API ไม่ได้)
// 0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์
const DEFAULT_HOURS: any = {
  '0': { open: '10:00', close: '21:00' }, // อาทิตย์
  '1': { open: '11:00', close: '22:00' }, // จันทร์
  '2': { open: '11:00', close: '22:00' }, // อังคาร
  '3': { open: '11:00', close: '22:00' }, // พุธ
  '4': { open: '11:00', close: '23:00' }, // พฤหัส
  // หมายเหตุ: วันศุกร์ (5) ถูกข้ามไปในโค้ดเดิม (อาจเป็นวันหยุดประจำ)
  '6': { open: '10:00', close: '23:00' }, // เสาร์
};

/**
 * LandingPageInteractive Component
 * 
 * หน้า Landing Page หลักของเว็บไซต์ (Interactive Version)
 * ทำหน้าที่รวบรวมและแสดงผลข้อมูลทุกส่วนของหน้าแรก ได้แก่:
 * 1. Hero Section (Banner และปุ่มจอง)
 * 2. Annoucements (ประกาศวันหยุด)
 * 3. Opening Hours (เวลาเปิด-ปิด แบบ Real-time)
 * 4. Restaurant Info (ข้อมูลจุดเด่นร้าน)
 * 5. Trust Signals (สัญลักษณ์ความน่าเชื่อถือ)
 * 6. Location & Contact (แผนที่และข้อมูลติดต่อ)
 * 7. Footer (ส่วนท้ายเว็บ)
 * 
 * คุณสมบัติ:
 * - ดึงข้อมูลเวลาจาก API และแสดงผลตาม Timezone ของไทย
 * - รองรับหลายภาษา (i18n)
 * - มีการจัดการ Loading State และ Error Handling เบื้องต้น
 * - แสดงผลแบบ Responsive
 */
const LandingPageInteractive: React.FC = () => {
  // Hooks สำหรับ Navigation และการแปลภาษา
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  // State สำหรับเก็บข้อมูลตารางเวลาที่ประมวลผลแล้ว
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);

  // State สำหรับเก็บข้อมูลวันหยุด
  const [holidays, setHolidays] = useState<any[]>([]);

  // สร้าง Supabase Client (ใช้ memo เพื่อป้องกันการสร้างใหม่ทุก render)
  const supabase = useMemo(() => createClientSupabaseClient(), []);

  // ฟังก์ชันคำนวณวันและเวลาปัจจุบันในประเทศไทย (UTC+7)
  const getThailandTime = () => {
    const now = new Date();
    const thailandOffset = 7 * 60; // Offset ของไทยคือ +7 ชั่วโมง (หน่วยเป็นนาที)
    const localOffset = now.getTimezoneOffset(); // Offset ของเครื่อง Client
    // ปรับเวลาให้เป็นเวลาไทย
    return new Date(now.getTime() + (thailandOffset + localOffset) * 60000);
  };

  // Memoize ชื่อวันทั้ง 7 วันตามภาษาที่เลือก (เพื่อไม่ให้สร้าง array ใหม่ทุก render)
  const dayNames = useMemo(
    () => [
      t('day.sunday'),
      t('day.monday'),
      t('day.tuesday'),
      t('day.wednesday'),
      t('day.thursday'),
      t('day.friday'),
      t('day.saturday'),
    ],
    [t]
  );

  // Effect: โหลดข้อมูล (เวลาเปิด-ปิด และวันหยุด) และตั้งเวลาอัปเดตอัตโนมัติ
  useEffect(() => {
    let isMounted = true; // Flag เพื่อตรวจสอบว่า Component ยัง mount อยู่หรือไม่

    // ฟังก์ชันย่อยสำหรับดึงเวลาเปิด-ปิดจาก API
    const fetchHours = async () => {
      try {
        // เรียก API เพื่อดึงค่า business_hours
        const res = await fetch('/api/settings?key=business_hours', {
          cache: 'no-store', // ห้าม Cache เพื่อให้ได้ข้อมูลล่าสุดเสมอ
        });

        if (!res.ok) throw new Error('Network response was not ok');
        const json = await res.json();

        // ถ้า Component unmount ไปแล้ว ให้หยุดทำงาน
        if (!isMounted) return;

        let hoursData = DEFAULT_HOURS;
        // หากมีข้อมูลจาก API ให้ใช้ข้อมูลนั้น แทนค่า Default
        if (json.data && json.data.value) {
          hoursData = json.data.value;
        }

        const thailandTime = getThailandTime();
        const currentDayIndex = thailandTime.getDay(); // ดึง index ของวันปัจจุบัน (0 = อาทิตย์)

        const displayOrder = [0, 1, 2, 3, 4, 5, 6]; // ลำดับการแสดงผล (อาทิตย์ -> เสาร์)

        // แปลงข้อมูลดิบให้เป็น Array ของ DaySchedule
        const newSchedule = displayOrder.map((dayIndex) => {
          let timeRange = t('hours.closed'); // ค่าเริ่มต้นคือ "ปิด"

          // ตรวจสอบวันศุกร์ (5) หรือวันที่ไม่มีใน config
          // (หมายเหตุ: Logic นี้กำหนดว่าวันศุกร์ปิดเสมอ ตาม Code เดิม)
          if (dayIndex !== 5) {
            const dayConfig = hoursData[String(dayIndex)];
            if (dayConfig) {
              if (locale === 'th') {
                // รูปแบบภาษาไทย: 10:00 - 22:00 น.
                timeRange = `${dayConfig.open} - ${dayConfig.close} น.`;
              } else {
                // รูปแบบภาษาอังกฤษ: Convert เป็น AM/PM (เช่น 10:00 AM - 10:00 PM)
                const toAmPm = (timeStr: string) => {
                  try {
                    const [h, m] = timeStr.split(':');
                    let hour = parseInt(h, 10);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    hour = hour % 12 || 12; // แปลง 24h เป็น 12h (0 -> 12)
                    return `${hour}:${m} ${ampm}`;
                  } catch {
                    return timeStr; // ถ้าแปลงไม่ได้ ให้คืนค่าเดิม
                  }
                };
                timeRange = `${toAmPm(dayConfig.open)} - ${toAmPm(dayConfig.close)}`;
              }
            }
          }

          return {
            day: dayNames[dayIndex],       // ชื่อวัน
            hours: timeRange,              // เวลาเปิด-ปิด
            isToday: dayIndex === currentDayIndex, // เป็นวันปัจจุบันหรือไม่
          };
        });

        setSchedule(newSchedule); // อัปเดต State
      } catch (error) {
        console.error('Failed to fetch hours:', error);

        // กรณี Error ให้ใช้ Fallback Schedule
        if (isMounted) {
          const thailandTime = getThailandTime();
          const currentDayIndex = thailandTime.getDay();

          const fallbackSchedule = [
            { id: 0, open: '10:00', close: '21:00' },
            { id: 1, open: '11:00', close: '22:00' },
            { id: 2, open: '11:00', close: '22:00' },
            { id: 3, open: '11:00', close: '22:00' },
            { id: 4, open: '11:00', close: '23:00' },
            // ข้ามวันศุกร์ (id 5)
            { id: 6, open: '10:00', close: '23:00' },
          ].map((item) => {
            const hoursStr = `${item.open} - ${item.close}`;
            return {
              day: dayNames[item.id],
              hours: locale === 'th' ? `${hoursStr} น.` : hoursStr,
              isToday: item.id === currentDayIndex,
            };
          });
          setSchedule(fallbackSchedule);
        }
      }
    };

    // ฟังก์ชันดึงรายการวันหยุดจาก Supabase
    const fetchHolidays = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]; // วันที่ปัจจุบันรูปแบบ YYYY-MM-DD
        // Query วันหยุดที่มีวันที่ >= วันนี้ เรียงตามวันที่
        const { data } = await supabase
          .from('holidays')
          .select('*')
          .gte('holiday_date', today)
          .order('holiday_date', { ascending: true });

        if (isMounted && data) {
          setHolidays(data);
        }
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
      }
    };

    // เรียกฟังก์ชันครั้งแรกทันทีที่ mount
    fetchHours();
    fetchHolidays();

    // ตั้งเวลาให้เรียกซ้ำทุก 30 วินาที (Polling) เพื่ออัปเดตข้อมูลให้เป็น Real-time
    const interval = setInterval(() => {
      fetchHours();
      fetchHolidays();
    }, 30000);

    // Cleanup: ยกเลิก interval และ set flag เมื่อ unmount
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [supabase, locale, dayNames, t]);

  // เตรียมข้อมูล Static สำหรับส่วนต่างๆ ของหน้า
  const landingData: LandingPageData = {
    restaurantName: t('hero.title'),
    tagline: t('app.tagline'),
    heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
    heroImageAlt: t('hero.imageAlt'),
    schedule: schedule,

    // ข้อมูล Cards จุดเด่นของร้าน (3 รายการ)
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

    // ข้อมูล Badges ความน่าเชื่อถือ (3 รายการ)
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

    // ข้อมูลการติดต่อ
    contact: {
      phone: '054-466-666',
      email: 'contact@up.ac.th',
      address: t('contact.address.full'),
      mapLat: 40.7128, // พิกัดตัวอย่าง (New York) - ควรแก้เป็นพิกัดจริงของร้าน
      mapLng: -74.0060,
    },

    // ลิงก์ Social Media
    socialLinks: [
      { name: 'Facebook', icon: 'Facebook', url: 'https://facebook.com/chanasorn.phaochuad' },
      { name: 'Instagram', icon: 'Instagram', url: 'https://instagram.com/csphf' },
    ],
  };

  // สร้าง JSX สำหรับชื่อร้านใน Hero Section โดยเฉพาะ
  // (มีการใส่ <br> สำหรับภาษาไทยในหน้าจอมือถือ)
  const heroTitle = locale === 'th'
    ? (
      <>
        ยินดีต้อนรับสู่ <br className="md:hidden" />
        ซาโวรี่ บิสโทร
      </>
    )
    : t('hero.title');

  // Render Component หลัก
  return (
    <>
      {/* 1. Hero Section: ส่วนหัวพร้อมภาพพื้นหลัง */}
      <HeroSection
        restaurantName={heroTitle}
        tagline={landingData.tagline}
        heroImage={landingData.heroImage}
        heroImageAlt={landingData.heroImageAlt}
      />

      {/* 2. Holiday Announcements: ประกาศวันหยุด (แสดงเฉพาะเมื่อมีข้อมูล) */}
      {holidays.length > 0 && <HolidayAnnouncements holidays={holidays} />}

      {/* 3. Opening Hours: ตารางเวลาเปิด-ปิด */}
      <OpeningHours schedule={landingData.schedule} />

      {/* 4. Restaurant Info: ข้อมูลจุดเด่นร้าน */}
      <RestaurantInfo cards={landingData.infoCards} />

      {/* 5. Trust Signals: สัญลักษณ์ความน่าเชื่อถือ */}
      <TrustSignals badges={landingData.trustBadges} />

      {/* 6. Location & Contact: แผนที่และข้อมูลติดต่อ */}
      <LocationContact contact={landingData.contact} />

      {/* 7. Footer: ส่วนท้ายเว็บ */}
      <Footer restaurantName={landingData.restaurantName} socialLinks={landingData.socialLinks} />

      {/* 8. Sticky Reserve Button: ปุ่มจองลอยติดหน้าจอ (สำหรับมือถือ) */}
      <StickyReserveButton />
    </>
  );
};

export default LandingPageInteractive;
