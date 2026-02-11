import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

// โครงสร้างข้อมูลตารางเวลาแต่ละวัน
interface DaySchedule {
  day: string; // ชื่อวัน (เช่น จันทร์, อังคาร)
  hours: string; // ช่วงเวลา (เช่น 10:00 - 22:00 น.)
  isToday?: boolean; // เป็นวันปัจจุบันหรือไม่ (ใช้สำหรับไฮไลท์)
}

// Proptypes
interface OpeningHoursProps {
  schedule: DaySchedule[]; // ข้อมูลตารางเวลาทั้งหมดที่ประมวลผลแล้ว
}

/**
 * OpeningHours Component
 * 
 * ส่วนแสดงตารางเวลาเปิด-ปิดร้าน (Business Hours)
 * คุณสมบัติ:
 * - แสดงรายการเวลาเปิด-ปิดครบทั้ง 7 วัน
 * - Highlight วันปัจจุบันให้เด่นชัด เพื่อให้ลูกค้าดูง่ายที่สุด
 * - รองรับการแสดงผลภาษาไทย/อังกฤษ (จัดการมาจาก Parent Component)
 */
const OpeningHours: React.FC<OpeningHoursProps> = ({ schedule }) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="max-w-4xl mx-auto">

          {/* 1. Header: หัวข้อและไอคอนนาฬิกา */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
              <Icon name="ClockIcon" size={32} className="text-primary" />
            </div>
            <h2 className="mb-4 text-4xl font-bold lg:text-5xl font-heading text-foreground">
              {t('hours.title')}
            </h2>
            <p className="text-lg text-muted-foreground">{t('hours.subtitle')}</p>
          </div>

          {/* 2. Schedule List: ตารางเวลา */}
          <div className="p-6 bg-background rounded-xl shadow-warm-md lg:p-8 border border-border">
            <div className="space-y-4">
              {schedule.map((item, index) => (
                <div
                  key={index}
                  className={`
                    flex items-center justify-between py-4 px-6 rounded-lg
                    transition-smooth
                    ${item.isToday
                      ? 'bg-primary/10 border-2 border-primary shadow-sm transform scale-[1.02]' // ไฮไลท์วันปัจจุบัน (เด่นพิเศษ)
                      : 'bg-muted/30 hover:bg-muted/60 border border-transparent' // วันอื่น ๆ (ปกติ)
                    }
                  `}
                >
                  {/* ส่วนชื่อวัน */}
                  <div className="flex items-center gap-3">
                    {/* จุดสีเขียว (Pulse Animation) แสดงว่าคือ "วันนี้" */}
                    {item.isToday && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                    )}
                    <span
                      className={`
                        text-lg font-semibold
                        ${item.isToday ? 'text-primary' : 'text-foreground'}
                      `}
                    >
                      {item.day}
                    </span>
                  </div>

                  {/* ส่วนเวลาเปิด-ปิด */}
                  <span
                    className={`
                      text-lg font-medium tracking-wide
                      ${item.isToday ? 'text-primary font-bold' : 'text-muted-foreground'}
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
