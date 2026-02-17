'use client';

import React, { useState, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { Table } from '@/types/tables';
import FloorPlan from '@/components/floor-plan/FloorPlan';
import { useDraggableScroll } from '@/hooks/useDraggableScroll';
import { useTranslation } from '@/lib/i18n';

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
 * แสดงรายการโต๊ะพร้อมรายละเอียด (แบบ Card List) หรือ แผนผังร้าน (Floor Plan)
 * รองรับการ Toggle ระหว่าง List/Map และ Drag-to-Scroll สำหรับ Map
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
  const { t } = useTranslation(locale);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map'); // Default เป็น Map ตามความต้องการลูกค้า

  // Setup Draggable Scroll สำหรับ Floor Plan Container
  // useDraggableScroll returns the ref to attach and the events to spread
  const { ref: scrollRef, events } = useDraggableScroll();

  // แปลง bookedTableIds (number[]) เป็น format ที่ FloorPlan ต้องการ ({ id, time }[])
  const bookedTablesData = bookedTableIds.map(id => ({ id, time: '' }));

  return (
    <div className="space-y-4">
      {/* View Toggle (List vs Map) */}
      <div className="flex justify-end">
        <div className="bg-muted/50 p-1 rounded-lg flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
              ${viewMode === 'map' ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:bg-white/50'}
            `}
          >
            <Icon name="MapIcon" size={16} />
            {locale === 'th' ? 'ผังร้าน' : 'Floor Plan'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
              ${viewMode === 'list' ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:bg-white/50'}
            `}
          >
            <Icon name="QueueListIcon" size={16} />
            {locale === 'th' ? 'รายการ' : 'List'}
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        // --- Map View (Floor Plan) ---
        <div className="relative border rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/50">
          <div
            ref={scrollRef}
            {...events} // Spread mouse events for drag scrolling
            className="overflow-x-auto cursor-grab active:cursor-grabbing no-scrollbar select-none"
            style={{ maxHeight: '600px', touchAction: 'none' }} // จำกัดความสูง
          >
            <div className="p-4 min-w-[1200px]"> {/* บังคับความกว้างเพื่อให้เมาส์ลากได้ (Drag-to-Scroll) */}
              <FloorPlan
                tables={tables}
                mode="select"
                selectedTableId={selectedTableId}
                onTableSelect={onSelect}
                bookedTables={bookedTablesData}
                partySize={partySize}
                width={1200}
                height={500}
                locale={locale}
                theme="light" // ปรับให้เข้ากับหน้าจองที่เป็น Light theme ส่วนใหญ่
              />
            </div>
          </div>
          {/* Hint Overlay for Mobile */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none bg-black/50 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm md:hidden">
            {locale === 'th' ? 'เลื่อนเพื่อดูผังร้าน' : 'Drag to explore'}
          </div>
        </div>
      ) : (
        // --- List View ---
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
      )}
    </div>
  );
};

export default TableSelection;
