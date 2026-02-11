import React, { useState } from 'react';
import { Table } from '@/types/tables';
import Icon from '@/components/ui/AppIcon';
import { useTranslation } from '@/lib/i18n';
import { useNavigation } from '@/contexts/NavigationContext';

interface TableListViewProps {
  tables: Table[]; // รายการโต๊ะทั้งหมด
  selectedTableId: number | undefined; // ID ของโต๊ะที่เลือก
  onSelect: (id: number) => void; // ฟังก์ชันเลือกโต๊ะ
  bookedTables: { id: number; time: string }[]; // รายการโต๊ะที่ถูกจองแล้ว
  partySize: number; // จำนวนแขก
}

/**
 * TableListView Component
 * แสดงรายการโต๊ะแบบ List (Grid) สำหรับหน้าจอง
 * - สามารถกรองตาม Zone ได้
 * - แสดงสถานะว่าง/ไม่ว่าง/ที่นั่งไม่พอ
 */
const TableListView: React.FC<TableListViewProps> = ({
  tables,
  selectedTableId,
  onSelect,
  bookedTables,
  partySize,
}) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);
  const [activeZone, setActiveZone] = useState('all'); // โซนที่เลือก (default: all)

  // ดึงรายชื่อ Zone ทั้งหมดที่มี
  const zones = Array.from(new Set(tables.map((t) => t.zone || 'Indoor'))).sort();

  // ฟังก์ชันแปลงชื่อ Zone เป็นภาษาท้องถิ่น
  const getZoneLabel = (zone: string) => {
    switch (zone.toLowerCase()) {
      case 'indoor':
        return t('admin.floorPlan.zone.indoor');
      case 'outdoor':
        return t('admin.floorPlan.zone.outdoor');
      case 'vip':
        return t('admin.floorPlan.zone.vip');
      default:
        return zone;
    }
  };

  // กรองโต๊ะตาม Zone ที่เลือก
  const filteredTables =
    activeZone === 'all' ? tables : tables.filter((t) => (t.zone || 'Indoor') === activeZone);

  return (
    <div className="w-full">
      {/* Zone Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-2">
        {/* ปุ่มเลือกทั้งหมด */}
        <button
          onClick={() => setActiveZone('all')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all
                        ${activeZone === 'all'
              ? 'bg-white text-primary shadow-lg'
              : 'bg-white/10 text-white hover:bg-white/20'
            }
                    `}
        >
          {t('admin.floorPlan.allZones')}
        </button>
        {/* ปุ่มเลือกตาม Zone */}
        {zones.map((zone) => (
          <button
            key={zone}
            onClick={() => setActiveZone(zone)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all
                            ${activeZone === zone
                ? 'bg-white text-primary shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20'
              }
                        `}
          >
            {getZoneLabel(zone)}
          </button>
        ))}
      </div>

      {/* Grid แสดงรายการโต๊ะ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredTables.map((table) => {
          // ตรวจสอบเงื่อนไขต่างๆ
          const isBooked = bookedTables.some((b) => b.id === table.id); // ถูกจองแล้ว?
          const isSelected = selectedTableId === table.id; // ถูกเลือกอยู่?
          const isCapacityLow = table.capacity < partySize; // ที่นั่งพอไหม?
          const isDisabled = isBooked || isCapacityLow; // ปิดการใช้งานปุ่ม?

          return (
            <button
              key={table.id}
              onClick={() => !isDisabled && onSelect(table.id)}
              disabled={isDisabled}
              className={`
                                relative p-4 rounded-2xl flex flex-col items-start gap-2 transition-all duration-300 border-2
                                ${isSelected
                  ? 'bg-primary border-primary shadow-xl shadow-primary/20 transform scale-[1.02]'
                  : isDisabled
                    ? 'bg-gray-800/50 border-gray-700/50 opacity-60 cursor-not-allowed grayscale'
                    : 'bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/10'
                }
                            `}
            >
              <div className="flex justify-between w-full">
                <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-white'}`}>
                  {table.name}
                </span>
                {isSelected && <Icon name="CheckCircleIcon" size={18} className="text-white" />}
              </div>

              {/* แสดงจำนวนที่นั่ง */}
              <div className="flex items-center gap-2 text-xs">
                <Icon
                  name="UserIcon"
                  size={14}
                  className={isSelected ? 'text-white/80' : 'text-gray-400'}
                />
                <span className={isSelected ? 'text-white/90' : 'text-gray-400'}>
                  {table.capacity} {t('form.guests.label')}
                </span>
              </div>

              {/* Badge สถานะ */}
              <div className="mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-black/20 text-white/70">
                {isBooked
                  ? t('table.status.booked')
                  : isCapacityLow
                    ? t('table.status.unavailable')
                    : t('table.status.available')}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TableListView;
