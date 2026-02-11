'use client'; // ทำงานฝั่ง Client Component

import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { Table, TableShape } from '@/types/tables'; // Type ของโต๊ะ
import Icon from '@/components/ui/AppIcon'; // Components ไอคอน

import { useTranslation } from '@/lib/i18n'; // Hook แปลภาษา
import { useNavigation } from '@/contexts/NavigationContext'; // Context สำหรับ Navigation

// Props ของ FloorPlan Component
interface FloorPlanProps {
    tables: Table[]; // รายการโต๊ะทั้งหมด
    mode: 'view' | 'edit' | 'select'; // โหมดการทำงาน: ดูอย่างเดียว, แก้ไข, หรือเลือกจอง
    onTableUpdate?: (table: Table) => void; // Callback เมื่อมีการอัปเดตโต๊ะ (ย้ายตำแหน่ง)
    onTableSelect?: (tableId: number) => void; // Callback เมื่อเลือกโต๊ะ
    onTableEdit?: (table: Table) => void; // Callback เมื่อต้องการแก้ไขโต๊ะ (Double Click)
    selectedTableId?: number | null; // ID ของโต๊ะที่ถูกเลือกอยู่
    bookedTables?: { id: number; time: string }[]; // รายการโต๊ะที่ถูกจองแล้ว
    partySize?: number; // จำนวนลูกค้า (ใช้กรองโต๊ะที่นั่งไม่พอ)
    width?: number; // ความกว้างของแผนผัง
    height?: number; // ความสูงของแผนผัง
    locale?: string; // ภาษา (ถ้าต้องการ Force)
    theme?: 'light' | 'dark'; // ธีม (Light/Dark)
}

/**
 * FloorPlan Component - แผนผังร้าน
 * - แสดงแผนผังร้านแบบ Interactive
 * - รองรับ Drag & Drop จัดวางโต๊ะ (Edit Mode)
 * - รองรับการเลือกโต๊ะเพื่อจอง (Select Mode)
 * - แสดงสถานะโต๊ะ (ว่าง, จองแล้ว, เลือกอยู่)
 * - แสดงโซนต่างๆ (Indoor, Outdoor, VIP, etc.)
 */
const FloorPlan: React.FC<FloorPlanProps> = ({
    tables,
    mode,
    onTableUpdate,
    onTableSelect,
    onTableEdit,
    selectedTableId,
    bookedTables = [],
    partySize,
    width = 800,
    height = 600,
    locale: propLocale,
    theme = 'dark',
}) => {
    // จัดการภาษา
    const { locale: contextLocale } = useNavigation();
    // ใช้ prop locale ถ้ามี, ถ้าไม่มีใช้จาก context, ถ้าไม่มีใช้ 'th' เป็นค่าเริ่มต้น
    const targetLocale = (propLocale || contextLocale || 'th') as 'th' | 'en';
    const { t } = useTranslation(targetLocale);

    const containerRef = useRef<HTMLDivElement>(null); // Ref สำหรับ Container หลัก
    const [draggingTableId, setDraggingTableId] = useState<number | null>(null); // ID โต๊ะที่กำลังลาก
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // ระยะห่างจุดคลิกกับมุมโต๊ะ
    const [activeZone, setActiveZone] = useState<string>('all'); // โซนที่กำลังแสดงผล (Filter)

    // ดึงรายการโซนทั้งหมดที่มีอยู่ (Unique Values) และเรียงลำดับ
    let zones = Array.from(new Set(tables.map((t) => t.zone || 'Default'))).sort();

    // ในโหมดแก้ไข (Edit Mode) ให้แสดงโซนมาตรฐานเสมอ เพื่อให้สามารถเพิ่มโต๊ะลงในโซนว่างได้
    if (mode === 'edit') {
        const standardZones = ['Indoor', 'Outdoor', 'VIP'];
        zones = Array.from(new Set([...zones, ...standardZones])).sort();
    }

    // กรองโต๊ะตามโซนที่เลือก
    const filteredTables =
        activeZone === 'all' ? tables : tables.filter((t) => (t.zone || 'Default') === activeZone);

    const dragStartRef = useRef<{ x: number; y: number } | null>(null); // จุดเริ่มต้นการลาก

    // ฟังก์ชันเริ่มลากโต๊ะ (Mouse Down)
    const handleMouseDown = (e: MouseEvent, table: Table) => {
        if (mode !== 'edit' || !containerRef.current) return; // ทำงานเฉพาะ Edit Mode

        // อย่าเพิ่ง preventDefault ทันที เพื่อให้ event click ทำงานได้ (เช่น double-click)
        // e.preventDefault();
        e.stopPropagation(); // หยุดการ Bubbling

        const containerRect = containerRef.current.getBoundingClientRect();

        // คำนวณตำแหน่งโต๊ะปัจจุบันเป็น Pixel
        const tableLeftPx = (table.x / 100) * containerRect.width;
        const tableTopPx = (table.y / 100) * containerRect.height;

        const clickX = e.clientX - containerRect.left;
        const clickY = e.clientY - containerRect.top;

        // บันทึกระยะห่างจุดคลิก เพื่อให้การลากสมูท (ไม่กระโดดไปที่เมาส์)
        setDragOffset({
            x: clickX - tableLeftPx,
            y: clickY - tableTopPx,
        });
        setDraggingTableId(table.id);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    // ฟังก์ชันขณะลากโต๊ะ (Mouse Move)
    const handleMouseMove = (e: MouseEvent) => {
        if (draggingTableId === null || mode !== 'edit' || !containerRef.current || !onTableUpdate)
            return;

        // ป้องกันการเลือกข้อความขณะลาก
        e.preventDefault();

        const containerRect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        // คำนวณตำแหน่งใหม่
        let newLeftPx = mouseX - dragOffset.x;
        let newTopPx = mouseY - dragOffset.y;

        // จำกัดขอบเขตไม่ให้ลากตกขอบ (Boundary Constraints)
        newLeftPx = Math.max(0, Math.min(newLeftPx, containerRect.width - 50));
        newTopPx = Math.max(0, Math.min(newTopPx, containerRect.height - 50));

        // แปลงกลับเป็นค่าเปอร์เซ็นต์ (%)
        const newX = (newLeftPx / containerRect.width) * 100;
        const newY = (newTopPx / containerRect.height) * 100;

        // Snap to grid (จัดให้ตรงแนวทีละ 2.5%)
        const snap = 2.5;
        const snappedX = Math.round(newX / snap) * snap;
        const snappedY = Math.round(newY / snap) * snap;

        const table = tables.find((t) => t.id === draggingTableId);
        if (table) {
            // 🛡️ Logic ตรวจจับโซนอัตโนมัติ (Auto-Zone Detection)
            let detectedZone = 'Indoor';
            if (snappedX > 70) {
                detectedZone = 'Outdoor'; // ด้านขวาเป็น Outdoor
            } else if (snappedX >= 6 && snappedX <= 44 && snappedY >= 46 && snappedY <= 94) {
                detectedZone = 'VIP'; // พื้นที่มุมซ้ายล่างเป็น VIP
            }

            // ส่งค่า Update กลับไปที่ Parent Component
            onTableUpdate({
                ...table,
                x: Number(snappedX.toFixed(2)),
                y: Number(snappedY.toFixed(2)),
                zone: detectedZone, // อัปเดตโซนอัตโนมัติ
            });
        }
    };

    // ฟังก์ชันจบการลาก (Mouse Up)
    const handleMouseUp = (e: MouseEvent, table?: Table) => {
        setDraggingTableId(null);
        dragStartRef.current = null;
    };

    // ฟังก์ชันคำนวณ Class CSS หลักของโต๊ะตามสถานะต่างๆ
    const getMainClasses = (table: Table) => {
        const bookedInfo = bookedTables.find((t) => t.id === table.id);
        const isBooked = !!bookedInfo; // ถูกจองแล้ว
        const isSelected = selectedTableId === table.id; // ถูกเลือก
        const isDragging = draggingTableId === table.id; // กำลังถูกลาก
        const isCapacityLow = partySize && table.capacity < partySize; // ที่นั่งไม่พอ

        let base =
            'absolute flex flex-col items-center justify-center border transition-all duration-200 cursor-pointer select-none text-xs font-bold shadow-sm z-10 ';

        // รูปร่างของโต๊ะ
        if (table.shape === 'circle') base += ' rounded-full aspect-square';
        else if (table.shape === 'round-rect') base += ' rounded-[1.5rem]';
        else base += ' rounded-lg';

        if (mode === 'edit') {
            // โหมดแก้ไข: แสดงขอบประ, เลื่อนได้
            base += ' cursor-move hover:border-primary border-dashed border-2';
            if (isDragging) base += ' border-primary bg-primary/10 z-50 shadow-xl scale-110';
            else base += ' border-gray-400 bg-white/80 hover:bg-white text-gray-600';
        } else {
            // โหมดใช้งานจริง
            if (isBooked) {
                // ถูกจอง: สีแดงอ่อน, กดไม่ได้
                base += ' bg-red-100 border-red-300 text-red-700 cursor-not-allowed';
            } else if (isCapacityLow) {
                // ที่นั่งไม่พอ: สีจางลง
                base += ' bg-gray-100/50 border-gray-200 text-gray-300 cursor-not-allowed';
            } else if (isSelected) {
                // ถูกเลือก: สีหลัก (Primary), ขยายใหญ่ขึ้น
                base +=
                    ' bg-primary border-primary text-white shadow-xl transform scale-110 z-20 ring-4 ring-white/50';
            } else {
                // ว่าง: สีเทา/เงิน (Metallic Look) สำหรับ Dark Theme
                base +=
                    ' bg-slate-200 border-slate-400 text-slate-900 shadow-lg hover:bg-white hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 ring-1 ring-black/10';
            }
        }

        return base;
    };

    // ฟังก์ชันแสดงเก้าอี้รอบโต๊ะ
    const renderChairs = (table: Table) => {
        const chairs = [];
        const capacity = table.capacity;

        const isSelected = selectedTableId === table.id;
        const isBooked = bookedTables.find((t) => t.id === table.id);

        // สีของเก้าอี้ตามสถานะ
        const chairColorClass = isSelected
            ? 'bg-primary border-primary/40' // สีสว่างเมื่อเลือก
            : isBooked
                ? 'bg-red-500/50 border-red-700/50'
                : 'bg-slate-400 border-slate-500';

        // กรณีโต๊ะกลม: วางเก้าอี้เป็นวงกลม
        if (table.shape === 'circle') {
            for (let i = 0; i < capacity; i++) {
                const angle = (i * 360) / capacity;
                chairs.push(
                    <div
                        key={i}
                        className={`absolute w-3.5 h-3.5 rounded-full border shadow-sm ${chairColorClass}`}
                        style={{
                            transform: `rotate(${angle}deg) translate(0, -145%)`, // หมุนและดันออกไปรอบๆ
                        }}
                    />
                );
            }
            return <div className="absolute inset-0 flex items-center justify-center">{chairs}</div>;
        }

        // กรณีโต๊ะเหลี่ยม: กระจายเก้าอี้ 4 ด้าน
        const chairsPerSide = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        };

        // Algorithm กระจายเก้าอี้
        for (let i = 0; i < capacity; i++) {
            if (i % 4 === 0) chairsPerSide.top++;
            else if (i % 4 === 1) chairsPerSide.bottom++;
            else if (i % 4 === 2) chairsPerSide.left++;
            else chairsPerSide.right++;
        }

        return (
            <>
                {/* เก้าอี้ด้านบน */}
                <div className="absolute -top-3.5 left-0 w-full flex justify-center gap-1 px-2">
                    {Array.from({ length: chairsPerSide.top }).map((_, i) => (
                        <div key={`t-${i}`} className={`w-6 h-3 rounded-t-lg border-t border-x ${chairColorClass} shadow-sm`} />
                    ))}
                </div>
                {/* เก้าอี้ด้านล่าง */}
                <div className="absolute -bottom-3.5 left-0 w-full flex justify-center gap-1 px-2">
                    {Array.from({ length: chairsPerSide.bottom }).map((_, i) => (
                        <div key={`b-${i}`} className={`w-6 h-3 rounded-b-lg border-b border-x ${chairColorClass} shadow-sm`} />
                    ))}
                </div>
                {/* เก้าอี้ด้านซ้าย */}
                <div className="absolute -left-3.5 top-0 h-full flex flex-col justify-center gap-1 py-2">
                    {Array.from({ length: chairsPerSide.left }).map((_, i) => (
                        <div key={`l-${i}`} className={`w-3 h-6 rounded-l-lg border-l border-y ${chairColorClass} shadow-sm`} />
                    ))}
                </div>
                {/* เก้าอี้ด้านขวา */}
                <div className="absolute -right-3.5 top-0 h-full flex flex-col justify-center gap-1 py-2">
                    {Array.from({ length: chairsPerSide.right }).map((_, i) => (
                        <div key={`r-${i}`} className={`w-3 h-6 rounded-r-lg border-r border-y ${chairColorClass} shadow-sm`} />
                    ))}
                </div>
            </>
        );
    };

    // ฟังก์ชันแปลชื่อโซน
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

    // กำหนดสีตาม Theme (Theme-aware colors)
    const themeColors = theme === 'dark' ? {
        zoneTabs: 'border-gray-700',
        zoneActive: 'bg-primary text-white shadow-lg shadow-primary/20',
        zoneInactive: 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-600',
        legend: 'bg-slate-800 border-slate-600 text-slate-200',
        legendAvailable: 'bg-slate-600 border-slate-400',
        container: 'bg-[#0F172A] border-slate-700',
        indoor: 'bg-[#1E293B] border-slate-700',
        indoorPattern: '#334155',
        indoorLabel: 'bg-slate-800/80 border-slate-600/30 text-slate-300',
        outdoor: 'bg-[#0F172A]',
        outdoorPattern: '#475569',
        outdoorLabel: 'bg-slate-800/80 border-slate-600/30 text-slate-300',
        vip: 'bg-[#3D342B] border-[#B48E43]',
        vipLabel: 'bg-[#2C241B] border-[#B48E43] text-[#F0E6D2]',
        vipDoor: 'bg-[#B48E43]',
        entrance: 'bg-[#334155] border-slate-600',
        entranceText: 'text-slate-500',
        cashier: 'bg-slate-800 border-slate-600 text-slate-300',
    } : {
        zoneTabs: 'border-gray-200',
        zoneActive: 'bg-amber-600 text-white shadow-lg shadow-amber-600/20',
        zoneInactive: 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200',
        legend: 'bg-amber-50 border-amber-200 text-amber-900',
        legendAvailable: 'bg-amber-100 border-amber-300',
        container: 'bg-amber-50 border-amber-300',
        indoor: 'bg-white border-amber-200',
        indoorPattern: '#FDE68A',
        indoorLabel: 'bg-amber-100/80 border-amber-300/50 text-amber-800',
        outdoor: 'bg-green-50',
        outdoorPattern: '#86EFAC',
        outdoorLabel: 'bg-green-100/80 border-green-300/50 text-green-800',
        vip: 'bg-amber-100 border-amber-500',
        vipLabel: 'bg-amber-200 border-amber-500 text-amber-900',
        vipDoor: 'bg-amber-500',
        entrance: 'bg-gray-300 border-gray-400',
        entranceText: 'text-gray-600',
        cashier: 'bg-blue-100 border-blue-300 text-blue-800',
    };

    return (
        <div className="w-full flex flex-col">
            {/* แท็บเลือกโซน (แสดงด้านบน) */}
            {zones.length > 0 && (
                <div className={`flex gap-2 mb-4 overflow-x-auto pb-2 border-b ${themeColors.zoneTabs} no-scrollbar`}>
                    <button
                        onClick={() => setActiveZone('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeZone === 'all'
                            ? themeColors.zoneActive
                            : themeColors.zoneInactive
                            }`}
                    >
                        {t('admin.floorPlan.allZones')}
                    </button>
                    {zones.map((zone) => (
                        <button
                            key={zone}
                            onClick={() => setActiveZone(zone)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeZone === zone
                                ? themeColors.zoneActive
                                : themeColors.zoneInactive
                                }`}
                        >
                            {/* แสดงชื่อโซนภาษาไทย */}
                            {getZoneLabel(zone)}
                        </button>
                    ))}
                </div>
            )}

            {/* คำอธิบายสัญลักษณ์ (Legend) */}
            <div className={`flex flex-wrap gap-6 text-[11px] font-black justify-center mb-6 p-3 rounded-2xl border shadow-md ${themeColors.legend}`}>
                <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded shadow-sm ${themeColors.legendAvailable}`}></div>
                    <span>{t('admin.floorPlan.legend.available')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary border border-primary rounded shadow-lg shadow-primary/20"></div>
                    <span>{t('admin.floorPlan.legend.selected')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded"></div>
                    <span>{t('admin.floorPlan.legend.booked')}</span>
                </div>
            </div>

            {/* Container แผนผังหลัก (พื้นที่วางโต๊ะ) */}
            <div
                ref={containerRef}
                className={`relative border-4 rounded-3xl overflow-hidden shadow-2xl cursor-default group ${themeColors.container}`}
                style={{ height: `${height}px`, width: '100%', minWidth: '800px' }}
                onMouseMove={handleMouseMove}
                onMouseUp={() => handleMouseUp}
                onMouseLeave={() => setDraggingTableId(null)}
            >
                {/* ภาพพื้นหลังแผนผัง (Floor Background Layers) */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* เขต Indoor (Main Floor) */}
                    <div className={`absolute top-0 left-0 w-[70%] h-full border-r ${themeColors.indoor}`}>
                        {/* ลวดลายพื้น */}
                        <div
                            className="absolute inset-0 opacity-[0.4]"
                            style={{
                                backgroundImage:
                                    `repeating-linear-gradient(45deg, transparent, transparent 10px, ${themeColors.indoorPattern} 10px, ${themeColors.indoorPattern} 11px)`,
                                backgroundSize: '20px 20px',
                            }}
                        ></div>
                        <div className={`absolute top-4 left-4 px-3 py-1 backdrop-blur rounded-lg border text-xs font-bold tracking-wider uppercase shadow-sm ${themeColors.indoorLabel}`}>
                            {t('admin.floorPlan.zone.indoor')}
                        </div>
                    </div>

                    {/* เขต Outdoor (ระเบียง) */}
                    <div className={`absolute top-0 right-0 w-[30%] h-full ${themeColors.outdoor}`}>
                        <div
                            className="absolute inset-0 opacity-[0.2]"
                            style={{
                                backgroundImage: `radial-gradient(${themeColors.outdoorPattern} 1px, transparent 1px)`,
                                backgroundSize: '16px 16px',
                            }}
                        ></div>
                        <div className={`absolute top-4 right-4 px-3 py-1 backdrop-blur rounded-lg border text-xs font-bold tracking-wider uppercase shadow-sm ${themeColors.outdoorLabel}`}>
                            {t('admin.floorPlan.zone.outdoor')}
                        </div>
                    </div>

                    {/* เขต VIP (ห้องส่วนตัว) */}
                    <div className={`absolute bottom-6 left-6 w-[38%] h-[48%] rounded-2xl border-4 shadow-2xl ${themeColors.vip}`}>
                        <div
                            className="absolute inset-0 opacity-[0.1]"
                            style={{
                                backgroundImage: `linear-gradient(45deg, ${theme === 'dark' ? '#B48E43' : '#D97706'} 1px, transparent 1px)`,
                                backgroundSize: '12px 12px',
                            }}
                        ></div>
                        {/* ประตู VIP */}
                        <div className={`absolute -right-px top-1/2 -translate-y-1/2 w-1.5 h-16 rounded-full shadow-lg z-10 ${themeColors.vipDoor}`}>
                            {/* มือจับประตู */}
                            <div className="absolute top-1/2 left-0.5 w-1.5 h-1.5 bg-white/80 rounded-full -translate-y-1/2 shadow-inner" />
                            {/* รอยสวิงประตู */}
                            <div className={`absolute top-0 left-full w-16 h-16 border-t border-r rounded-tr-full pointer-events-none ${theme === 'dark' ? 'border-[#B48E43]/30' : 'border-amber-500/30'}`} />
                        </div>
                        <div className={`absolute -top-3 left-4 px-3 py-1 backdrop-blur rounded-lg border text-xs font-bold tracking-wider uppercase shadow-md ${themeColors.vipLabel}`}>
                            <Icon name="StarIcon" size={10} className={`inline mr-1 ${theme === 'dark' ? 'text-[#B48E43]' : 'text-amber-600'}`} />
                            {t('admin.floorPlan.zone.vip')}
                        </div>
                    </div>

                    {/* ประตูทางเข้าหลัก */}
                    <div className="absolute top-1/2 right-[30%] -translate-y-1/2 translate-x-1/2 z-0">
                        <div className={`w-2.5 h-20 rounded-full shadow-lg relative border-x ${themeColors.entrance}`}>
                            <div className={`absolute top-2 -left-1 w-3.5 h-1 rounded-full transform -rotate-12 ${theme === 'dark' ? 'bg-[#475569]' : 'bg-gray-400'}`} />
                            <div className={`absolute bottom-2 -left-1 w-3.5 h-1 rounded-full transform rotate-12 ${theme === 'dark' ? 'bg-[#475569]' : 'bg-gray-400'}`} />
                        </div>
                        <div className={`absolute top-1/2 left-full ml-2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${themeColors.entranceText}`}>
                            {t('admin.floorPlan.entrance') || 'Entrance'}
                        </div>
                    </div>

                    {/* จุดชำระเงิน (Cashier) */}
                    <div className={`absolute bottom-6 left-[46%] w-32 h-20 rounded-[1rem] border-2 shadow-2xl flex items-center justify-center overflow-hidden ${themeColors.cashier}`}>
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        <div className="flex flex-col items-center">
                            <Icon name="CreditCardIcon" size={20} className="text-blue-500 mb-1" />
                            <span className="text-[12px] font-black uppercase tracking-tight text-center px-2">
                                {t('admin.floorPlan.cashier')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* แสดงผลรายการโต๊ะทั้งหมด */}
                {filteredTables.map((table) => {
                    const bookedInfo = bookedTables.find((t) => t.id === table.id);
                    const isBooked = !!bookedInfo;
                    const isCapacityLow = partySize && table.capacity < partySize;

                    return (
                        <div
                            key={table.id}
                            className={getMainClasses(table)} // Class ตามสถานะ
                            style={{
                                left: `${table.x}%`, // ตำแหน่ง X (%)
                                top: `${table.y}%`, // ตำแหน่ง Y (%)
                                width: `${table.width || 60}px`,
                                height: `${table.height || 40}px`,
                            }}
                            onMouseDown={(e) => handleMouseDown(e, table)}
                            onMouseUp={(e) => handleMouseUp(e, table)}
                            onClick={() => {
                                // Logic การเลือกโต๊ะ
                                if (mode === 'select') {
                                    if (onTableSelect && !isBooked && !isCapacityLow) {
                                        onTableSelect(table.id);
                                    }
                                } else if (onTableSelect) {
                                    onTableSelect(table.id);
                                }
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                if (mode === 'edit' && onTableEdit) onTableEdit(table); // แก้ไขโต๊ะเมื่อ Double Click
                            }}
                        >
                            {/* แสดงเก้าอี้ */}
                            {renderChairs(table)}

                            {/* ป้ายแสดงจำนวนที่นั่ง (Capacity Badge) */}
                            <div className={`absolute -top-2 -left-2 z-20 px-1.5 py-0.5 rounded-md text-[10px] font-black shadow-sm border
                                ${selectedTableId === table.id
                                    ? 'bg-white text-primary border-primary'
                                    : 'bg-slate-800 text-white border-slate-600'}
                            `}>
                                {table.capacity}
                            </div>

                            {/* ชื่อโต๊ะ */}
                            <div
                                className={`px-4 py-2 rounded-full text-[14px] font-black z-10 pointer-events-none transition-all duration-300 shadow-md backdrop-blur-md
                                    ${selectedTableId === table.id ? 'text-white' : 'text-slate-900 bg-white border-2 border-slate-300'}
                                `}
                            >
                                {table.name}
                            </div>

                            {/* ไอคอนเครื่องหมายถูกเมื่อเลือก */}
                            {selectedTableId === table.id && (
                                <Icon
                                    name="CheckCircleIcon"
                                    size={24}
                                    className="text-white drop-shadow-md animate-in zoom-in duration-300 absolute -top-2 -right-2 bg-primary rounded-full"
                                />
                            )}
                        </div>
                    );
                })}

                {/* แสดงข้อความเมื่อไม่มีโต๊ะในโซนที่เลือก */}
                {mode === 'edit' && filteredTables.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                        <p>{t('admin.floorPlan.noTablesInZone')}</p>
                    </div>
                )}
            </div>


        </div>
    );
};

export default FloorPlan;
