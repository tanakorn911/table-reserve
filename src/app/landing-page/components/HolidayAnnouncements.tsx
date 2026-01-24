import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface Holiday {
    id: string;
    holiday_date: string;
    description: string;
}

interface HolidayAnnouncementsProps {
    holidays: Holiday[];
}

const HolidayAnnouncements: React.FC<HolidayAnnouncementsProps> = ({ holidays }) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('th-TH', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <section className="py-8 bg-red-50 border-y border-red-100">
            <div className="container mx-auto px-4 lg:px-6">
                <div className="flex flex-col md:flex-row items-center gap-6 max-w-4xl mx-auto">
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-200">
                        <Icon name="CalendarDaysIcon" size={32} className="text-white" />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-xl font-black text-red-900 uppercase tracking-wider mb-1">
                            ประกาศวันหยุดพิเศษ
                        </h2>
                        <p className="text-red-700 font-medium">
                            ทางร้านขออภัยในความไม่สะดวก เนื่องจากจะมีการปิดทำการในวันดังกล่าวดั้งนี้:
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-end gap-3 flex-1">
                        {holidays.map((holiday) => (
                            <div
                                key={holiday.id}
                                className="bg-white px-4 py-2 rounded-xl border border-red-200 shadow-sm flex flex-col items-center min-w-[140px]"
                            >
                                <span className="text-xs font-bold text-red-400 uppercase tracking-tighter">
                                    {formatDate(holiday.holiday_date).split('ที่')[0]}
                                </span>
                                <span className="text-sm font-black text-gray-900">
                                    {new Date(holiday.holiday_date + 'T00:00:00').getDate()} {new Date(holiday.holiday_date + 'T00:00:00').toLocaleDateString('th-TH', { month: 'short' })}
                                </span>
                                {holiday.description && (
                                    <span className="text-[10px] text-gray-500 font-medium mt-1">
                                        ({holiday.description})
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
