import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

// โครงสร้างข้อมูลวันหยุด
interface Holiday {
  id: string; // ID ของวันหยุด
  holiday_date: string; // วันที่ (YYYY-MM-DD)
  description: string; // รายละเอียดวันหยุด
}

// Proptypes
interface HolidayAnnouncementsProps {
  holidays: Holiday[]; // รายการวันหยุดทั้งหมดจาก Database
}

/**
 * HolidayAnnouncements Component
 * 
 * ส่วนแสดงประกาศวันหยุดร้าน (Banner Alert)
 * ใช้สำหรับแจ้งเตือนลูกค้าว่าร้านจะปิดทำการในวันไหนบ้าง
 * คุณสมบัติเด่น:
 * - Group Consecutive Dates: สามารถรวมวันหยุดที่ติดกันและมีรายละเอียดเหมือนกัน
 *   ให้แสดงเป็นช่วงเวลาเดียวได้ (เช่น 12-14 เม.ย. สงกรานต์) เพื่อลดความรกของหน้าจอ
 * - Responsive Grid: แสดงผลสวยงามทั้งมือถือและ Desktop
 */
const HolidayAnnouncements: React.FC<HolidayAnnouncementsProps> = ({ holidays }) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  // Memoized Calculation: จัดกลุ่มวันหยุดที่ติดกัน
  const groupedHolidays = React.useMemo(() => {
    if (holidays.length === 0) return [];

    // 1. เรียงลำดับวันหยุดตามวันที่
    const sorted = [...holidays].sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
    const groups: any[] = [];

    // 2. วนลูปเพื่อจัดกลุ่ม
    sorted.forEach((h) => {
      const prev = groups[groups.length - 1]; // กลุ่มล่าสุดที่สร้าง
      const currDate = new Date(h.holiday_date + 'T00:00:00');

      // เงื่อนไขการรวมกลุ่ม:
      // - ต้องมีกลุ่มก่อนหน้า
      // - รายละเอียด (Description) ต้องเหมือนกัน
      // - วันที่ต้องต่อเนื่องกัน (ต่างกัน 1 วัน)
      if (prev && prev.description === h.description) {
        const lastDate = new Date(prev.endDate + 'T00:00:00');
        const diffDays = (currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);

        if (diffDays === 1) {
          prev.endDate = h.holiday_date; // ขยายวันสิ้นสุดของกลุ่มเดิม
          return;
        }
      }

      // ถ้าไม่เข้าเงื่อนไข ให้สร้างกลุ่มใหม่
      groups.push({
        startDate: h.holiday_date,
        endDate: h.holiday_date,
        description: h.description
      });
    });

    return groups;
  }, [holidays]);

  // Helper Function: จัดรูปแบบการแสดงผลวันที่ (เช่น 12 ม.ค.)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00'); // เติมเวลาเพื่อป้องกัน Timezone shift
    return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Helper Function: หาชื่อวันย่อ (เช่น จ., อ. หรือ Mon, Tue)
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
      weekday: 'short',
    });
  };

  return (
    <section className="py-8 bg-red-50 border-y border-red-100 overflow-hidden relative">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-6 max-w-5xl mx-auto">

          {/* 1. Icon Section: ไอคอนปฏิทินสีแดง */}
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-200">
            <Icon name="CalendarDaysIcon" size={32} className="text-white" />
          </div>

          {/* 2. Text Content: หัวข้อและข้อความแจ้งเตือน */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-xl font-black text-red-900 uppercase tracking-wider mb-1">
              {t('holiday.title')}
            </h2>
            <p className="text-red-700 font-medium text-sm">{t('holiday.message')}</p>
          </div>

          {/* 3. Holiday Cards Section: รายการวันหยุด */}
          <div className="flex flex-wrap justify-center lg:justify-end gap-3 flex-[2]">
            {groupedHolidays.map((group, idx) => (
              <div
                key={idx}
                className="
                  bg-white px-5 py-3 rounded-2xl border border-red-200 shadow-sm
                  flex flex-col items-center justify-center min-w-[160px]
                  animate-in fade-in slide-in-from-right-2 duration-500
                  hover:scale-105 transition-transform
                "
              >
                {/* ชื่อวัน (Weekday) */}
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">
                  {group.startDate === group.endDate
                    ? getDayName(group.startDate)
                    : `${getDayName(group.startDate)} - ${getDayName(group.endDate)}`}
                </span>

                {/* วันที่ (Date Range) */}
                <span className="text-base font-black text-gray-900">
                  {group.startDate === group.endDate
                    ? formatDate(group.startDate)
                    : `${formatDate(group.startDate)} - ${formatDate(group.endDate)}`}
                </span>

                {/* รายละเอียดเพิ่มเติม (Description Badge) */}
                {group.description && (
                  <span className="text-[10px] text-red-500 font-bold mt-1 bg-red-50 px-2 py-0.5 rounded-full">
                    {group.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HolidayAnnouncements;
