import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
// Note: TABLE_TYPES import removed as we now accept tables as props
import { Table } from '@/types/tables';

interface TableSelectionProps {
  tables: Table[]; // รายการโต๊ะทั้งหมด
  selectedTableId: number | undefined; // ID ของโต๊ะที่เลือก
  onSelect: (id: number) => void; // ฟังก์ชันเลือกโต๊ะ
  bookedTableIds: number[]; // ID ของโต๊ะที่ถูกจองแล้ว
  partySize: number; // จำนวนแขก
  error?: boolean; // สถานะ Error (กรณีไม่ได้เลือก)
}

// ฟังก์ชันแปลงข้อความเป็นภาษาท้องถิ่น (สำหรับชื่อโต๊ะและคำบรรยาย)
const getLocalizedText = (text: string, locale: 'th' | 'en') => {
  if (locale === 'th') return text;
  // Map คำแปลภาษาอังกฤษ
  const map: Record<string, string> = {
    โต๊ะริมหน้าต่าง: 'Window Table',
    โต๊ะโซฟา: 'Sofa Table',
    โต๊ะส่วนตัว: 'Private Table',
    'โต๊ะส่วนตัว (2 ที่นั่ง)': 'Private Table (2 seats)',
    โต๊ะกลางร้าน: 'Center Table',
    โต๊ะบาร์: 'Bar Table',
    'วิวสวย บรรยากาศดี (4 ที่นั่ง)': 'Nice view, good atmosphere (4 seats)',
    'นั่งสบาย เหมาะสำหรับครอบครัว (6 ที่นั่ง)': 'Comfortable, perfect for families (6 seats)',
    'มีความเป็นส่วนตัวสูง (2 ที่นั่ง)': 'High privacy (2 seats)',
    'บรรยากาศครึกครื้น (4 ที่นั่ง)': 'Lively atmosphere (4 seats)',
    'เหมาะสำหรับมาคนเดียวหรือคู่รัก (2 ที่นั่ง)': 'Good for solo or couples (2 seats)',
  };

  // ถ้ามีใน Map ให้ใช้เลย
  if (map[text]) return map[text];

  // กรณี Dynamic Strings (Heuristic ง่ายๆ)
  if (text.includes('ที่นั่ง'))
    return text.replace('ที่นั่ง', 'seats').replace('รองรับ', 'Supports');

  return text;
};

/**
 * TableSelection Component
 * แสดงรายการโต๊ะพร้อมรายละเอียด (แบบ Card List)
 * สำหรับ Desktop หรือมุมมองเพิ่มเติม
 */
const TableSelection: React.FC<TableSelectionProps> = ({
  tables,
  selectedTableId,
  onSelect,
  bookedTableIds = [],
  partySize,
  error = false,
}) => {
  const { locale } = useNavigation();

  return (
    <div className="space-y-3">
      {/* Grid แสดงรายการโต๊ะ (1 คอลัมน์บนมือถือ, 2 คอลัมน์บนจอใหญ่) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tables.map((table) => {
          const isBooked = bookedTableIds.includes(table.id); // สถานะถูกจอง
          const isCapacityLow = table.capacity < partySize; // ที่นั่งไม่พอ
          const isDisabled = isBooked || isCapacityLow; // ปิดการใช้งาน
          const isSelected = selectedTableId === table.id; // ถูกเลือก

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => !isDisabled && onSelect(table.id)}
              disabled={isDisabled}
              className={`
                relative flex items-start p-4 rounded-xl border-2 text-left transition-all duration-200
                ${isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : isBooked
                    ? 'border-red-200/50 bg-red-50/10 cursor-not-allowed pointer-events-none' // ถ้าจองแล้วใช้สีแดงอ่อน
                    : isDisabled
                      ? 'border-muted bg-gray-100/50 opacity-40 cursor-not-allowed grayscale pointer-events-none' // ถ้าที่นั่งไม่พอใช้สีเทา
                      : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                }
                ${error && !isSelected ? 'border-error/50' : ''}
              `}
            >
              {/* Icon ด้านซ้าย */}
              <div
                className={`
                p-2 rounded-lg mr-3 shrink-0
                ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}
              >
                <Icon name="QueueListIcon" size={24} />
              </div>

              <div className="flex-1 min-w-0">
                {/* Header: ชื่อโต๊ะ และ สถานะ */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-semibold ${isSelected ? 'text-primary' : isBooked ? 'text-red-500/90' : 'text-foreground'}`}
                  >
                    {getLocalizedText(table.name, locale)}
                  </span>
                  {/* Badge สถานะ */}
                  {isBooked ? (
                    <span className="text-xs font-medium text-red-600 px-2 py-0.5 rounded-full bg-red-100/80">
                      {locale === 'th' ? 'ไม่ว่าง' : 'Booked'}
                    </span>
                  ) : isCapacityLow ? (
                    <span className="text-xs font-medium text-warning px-2 py-0.5 rounded-full bg-warning/10">
                      {locale === 'th' ? 'ที่นั่งไม่พอ' : 'Capacity Low'}
                    </span>
                  ) : isSelected ? (
                    <span className="text-xs font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10">
                      {locale === 'th' ? 'เลือกแล้ว' : 'Selected'}
                    </span>
                  ) : null}
                </div>

                {/* คำอธิบายโต๊ะ */}
                <p
                  className={`text-sm line-clamp-2 ${isBooked ? 'text-red-400/80' : 'text-muted-foreground'}`}
                >
                  {getLocalizedText(table.description, locale)}
                </p>

                {/* จำนวนที่นั่ง */}
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="UsersIcon" size={14} />
                  <span>
                    {locale === 'th'
                      ? `รองรับ ${table.capacity} ท่าน`
                      : `Supports ${table.capacity} guests`}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TableSelection;
