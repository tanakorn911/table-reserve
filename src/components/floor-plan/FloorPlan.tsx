'use client';

import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { Table, TableShape } from '@/types/tables';
import Icon from '@/components/ui/AppIcon';

import { useTranslation } from '@/lib/i18n';
import { useNavigation } from '@/contexts/NavigationContext';

interface FloorPlanProps {
    tables: Table[];
    mode: 'view' | 'edit' | 'select';
    onTableUpdate?: (table: Table) => void;
    onTableSelect?: (tableId: number) => void;
    onTableEdit?: (table: Table) => void;
    selectedTableId?: number | null;
    bookedTables?: { id: number; time: string }[];
    partySize?: number;
    width?: number;
    height?: number;
    locale?: string;
}

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
}) => {
    const { locale: contextLocale } = useNavigation();
    // Use prop locale if provided, otherwise context, otherwise default 'th'
    const targetLocale = (propLocale || contextLocale || 'th') as 'th' | 'en';
    const { t } = useTranslation(targetLocale);

    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingTableId, setDraggingTableId] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [activeZone, setActiveZone] = useState<string>('all');

    // Get unique zones
    let zones = Array.from(new Set(tables.map((t) => t.zone || 'Default'))).sort();

    // In edit mode, ensure standard zones are always available to allow adding tables to empty zones
    if (mode === 'edit') {
        const standardZones = ['Indoor', 'Outdoor', 'VIP'];
        zones = Array.from(new Set([...zones, ...standardZones])).sort();
    }

    const filteredTables =
        activeZone === 'all' ? tables : tables.filter((t) => (t.zone || 'Default') === activeZone);

    const dragStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleMouseDown = (e: MouseEvent, table: Table) => {
        if (mode !== 'edit' || !containerRef.current) return;

        // Don't prevent default immediately to allow click events to propagate properly for double-click
        // e.preventDefault();
        e.stopPropagation();

        const containerRect = containerRef.current.getBoundingClientRect();

        const tableLeftPx = (table.x / 100) * containerRect.width;
        const tableTopPx = (table.y / 100) * containerRect.height;

        const clickX = e.clientX - containerRect.left;
        const clickY = e.clientY - containerRect.top;

        setDragOffset({
            x: clickX - tableLeftPx,
            y: clickY - tableTopPx,
        });
        setDraggingTableId(table.id);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (draggingTableId === null || mode !== 'edit' || !containerRef.current || !onTableUpdate)
            return;

        // Prevent selection during drag
        e.preventDefault();

        const containerRect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        let newLeftPx = mouseX - dragOffset.x;
        let newTopPx = mouseY - dragOffset.y;

        newLeftPx = Math.max(0, Math.min(newLeftPx, containerRect.width - 50));
        newTopPx = Math.max(0, Math.min(newTopPx, containerRect.height - 50));

        const newX = (newLeftPx / containerRect.width) * 100;
        const newY = (newTopPx / containerRect.height) * 100;

        // Snap to grid (2.5% step)
        const snap = 2.5;
        const snappedX = Math.round(newX / snap) * snap;
        const snappedY = Math.round(newY / snap) * snap;

        const table = tables.find((t) => t.id === draggingTableId);
        if (table) {
            onTableUpdate({
                ...table,
                x: Number(snappedX.toFixed(2)),
                y: Number(snappedY.toFixed(2)),
            });
        }
    };

    const handleMouseUp = (e: MouseEvent, table?: Table) => {
        setDraggingTableId(null);
        dragStartRef.current = null;
    };

    const getMainClasses = (table: Table) => {
        const bookedInfo = bookedTables.find((t) => t.id === table.id);
        const isBooked = !!bookedInfo;
        const isSelected = selectedTableId === table.id;
        const isDragging = draggingTableId === table.id;
        const isCapacityLow = partySize && table.capacity < partySize;

        let base =
            'absolute flex flex-col items-center justify-center border transition-all duration-200 cursor-pointer select-none text-xs font-bold shadow-sm z-10 ';

        if (table.shape === 'circle') base += ' rounded-full aspect-square';
        else if (table.shape === 'round-rect') base += ' rounded-[1.5rem]';
        else base += ' rounded-lg';

        if (mode === 'edit') {
            base += ' cursor-move hover:border-primary border-dashed border-2';
            if (isDragging) base += ' border-primary bg-primary/10 z-50 shadow-xl scale-110';
            else base += ' border-gray-400 bg-white/80 hover:bg-white text-gray-600';
        } else {
            if (isBooked) {
                // Booked: Light Red background
                base += ' bg-red-100 border-red-300 text-red-700 cursor-not-allowed';
            } else if (isCapacityLow) {
                // Low Capacity: Transparent/Gray
                base += ' bg-gray-100/50 border-gray-200 text-gray-300 cursor-not-allowed';
            } else if (isSelected) {
                // Selected: Primary
                base +=
                    ' bg-primary border-primary text-white shadow-xl transform scale-110 z-20 ring-4 ring-white/50';
            } else {
                // Available: Silver/Metallic Look for Dark Theme
                base +=
                    ' bg-slate-200 border-slate-400 text-slate-900 shadow-lg hover:bg-white hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 ring-1 ring-black/10';
            }
        }

        return base;
    };

    const renderChairs = (table: Table) => {
        const chairs = [];
        const capacity = table.capacity;

        const isSelected = selectedTableId === table.id;
        // bookedInfo is computed each render in map, but here we need to find it again or pass it.
        // The renderChairs is called inside map, so it has access to table.
        // But `bookedTables` is prop.
        const isBooked = bookedTables.find((t) => t.id === table.id);

        const chairColorClass = isSelected
            ? 'bg-primary/20 border-primary/40'
            : isBooked
                ? 'bg-red-900/50 border-red-700/50'
                : 'bg-slate-400 border-slate-500'; // Darker silver chairs

        if (table.shape === 'circle') {
            for (let i = 0; i < capacity; i++) {
                const angle = (i * 360) / capacity;
                chairs.push(
                    <div
                        key={i}
                        className={`absolute w-3 h-3 rounded-full border shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${chairColorClass}`}
                        style={{
                            transform: `rotate(${angle}deg) translate(0, -140%)`,
                        }}
                    />
                );
            }
            return <div className="absolute inset-0 flex items-center justify-center">{chairs}</div>;
        }

        const sideCapacity = Math.ceil(capacity / 2);

        return (
            <>
                <div className="absolute -top-3 w-full flex justify-center gap-1">
                    {Array.from({ length: sideCapacity }).map((_, i) => (
                        <div
                            key={`t-${i}`}
                            className={`w-6 h-2 rounded-t-sm border-t border-x ${chairColorClass}`}
                        />
                    ))}
                </div>
                <div className="absolute -bottom-3 w-full flex justify-center gap-1">
                    {Array.from({ length: capacity - sideCapacity }).map((_, i) => (
                        <div
                            key={`b-${i}`}
                            className={`w-6 h-2 rounded-b-sm border-b border-x ${chairColorClass}`}
                        />
                    ))}
                </div>
            </>
        );
    };

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

    return (
        <div className="w-full flex flex-col">
            {/* Zone Tabs */}
            {zones.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 border-b border-gray-200 no-scrollbar">
                    <button
                        onClick={() => setActiveZone('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeZone === 'all'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {t('admin.floorPlan.allZones')}
                    </button>
                    {zones.map((zone) => (
                        <button
                            key={zone}
                            onClick={() => setActiveZone(zone)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeZone === zone
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {getZoneLabel(zone)}
                        </button>
                    ))}
                </div>
            )}

            {/* Map Container - Dark Theme */}
            <div
                ref={containerRef}
                className="relative bg-[#0F172A] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl cursor-default group"
                style={{ height: `${height}px`, width: '100%' }}
                onMouseMove={handleMouseMove}
                onMouseUp={() => handleMouseUp}
                onMouseLeave={() => setDraggingTableId(null)}
            >
                {/* Floor Background Layers */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Indoor Zone (Main Floor) - Dark Slate */}
                    <div className="absolute top-0 left-0 w-[70%] h-full bg-[#1E293B] border-r border-slate-700">
                        <div
                            className="absolute inset-0 opacity-[0.4]"
                            style={{
                                backgroundImage:
                                    'repeating-linear-gradient(45deg, transparent, transparent 10px, #334155 10px, #334155 11px)',
                                backgroundSize: '20px 20px',
                            }}
                        ></div>
                        <div className="absolute top-4 left-4 px-3 py-1 bg-slate-800/80 backdrop-blur rounded-lg border border-slate-600/30 text-xs font-bold text-slate-300 tracking-wider uppercase shadow-sm">
                            {t('admin.floorPlan.zone.indoor')}
                        </div>
                    </div>

                    {/* Outdoor Zone (Terrace) - Darker Slate */}
                    <div className="absolute top-0 right-0 w-[30%] h-full bg-[#0F172A]">
                        <div
                            className="absolute inset-0 opacity-[0.2]"
                            style={{
                                backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
                                backgroundSize: '16px 16px',
                            }}
                        ></div>
                        <div className="absolute top-4 right-4 px-3 py-1 bg-slate-800/80 backdrop-blur rounded-lg border border-slate-600/30 text-xs font-bold text-slate-300 tracking-wider uppercase shadow-sm">
                            {t('admin.floorPlan.zone.outdoor')}
                        </div>
                    </div>

                    {/* VIP Zone (Private Room) - Deep Gold/Bronze */}
                    <div className="absolute bottom-6 left-6 w-[20%] h-[35%] bg-[#3D342B] rounded-2xl border border-[#785C36] shadow-lg shadow-black/20">
                        <div
                            className="absolute inset-0 opacity-[0.1]"
                            style={{
                                backgroundImage: 'linear-gradient(45deg, #B48E43 1px, transparent 1px)',
                                backgroundSize: '12px 12px',
                            }}
                        ></div>
                        {/* VIP Door - Right Side Facing Center */}
                        <div className="absolute -right-px top-1/2 -translate-y-1/2 w-1.5 h-16 bg-[#B48E43] rounded-full shadow-[0_0_15px_rgba(180,142,67,0.6)] z-10">
                            {/* Door handle */}
                            <div className="absolute top-1/2 left-0.5 w-1.5 h-1.5 bg-white/80 rounded-full -translate-y-1/2 shadow-inner" />
                            {/* Swing Arc */}
                            <div className="absolute top-0 left-full w-16 h-16 border-t border-r border-[#B48E43]/30 rounded-tr-full pointer-events-none" />
                        </div>
                        <div className="absolute -top-3 left-4 px-3 py-1 bg-[#2C241B] backdrop-blur rounded-lg border border-[#B48E43] text-xs font-bold text-[#F0E6D2] tracking-wider uppercase shadow-md">
                            <Icon name="StarIcon" size={10} className="inline mr-1 text-[#B48E43]" />
                            {t('admin.floorPlan.zone.vip')}
                        </div>
                    </div>

                    {/* Main Entrance Door */}
                    <div className="absolute top-1/2 right-[30%] -translate-y-1/2 translate-x-1/2 z-0">
                        <div className="w-1.5 h-16 bg-[#334155] rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)] relative">
                            <div className="absolute top-2 -left-1 w-3.5 h-1 bg-[#475569] rounded-full transform -rotate-12" />
                            <div className="absolute bottom-2 -left-1 w-3.5 h-1 bg-[#475569] rounded-full transform rotate-12" />
                        </div>
                        <div className="absolute top-1/2 left-full ml-2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                            {t('admin.floorPlan.entrance') || 'Entrance'}
                        </div>
                    </div>
                </div>

                {filteredTables.map((table) => {
                    const bookedInfo = bookedTables.find((t) => t.id === table.id);
                    const isBooked = !!bookedInfo;
                    const isCapacityLow = partySize && table.capacity < partySize;

                    return (
                        <div
                            key={table.id}
                            className={getMainClasses(table)}
                            style={{
                                left: `${table.x}%`,
                                top: `${table.y}%`,
                                width: `${table.width || 60}px`,
                                height: `${table.height || 40}px`,
                            }}
                            onMouseDown={(e) => handleMouseDown(e, table)}
                            onMouseUp={(e) => handleMouseUp(e, table)}
                            onClick={() => {
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
                                if (mode === 'edit' && onTableEdit) onTableEdit(table);
                            }}
                        >
                            {renderChairs(table)}
                            <div
                                className={`px-3 py-1 rounded-full text-xs font-black z-10 pointer-events-none transition-all duration-300 shadow-sm backdrop-blur-md
                                    ${selectedTableId === table.id ? 'text-white' : 'text-slate-900 bg-white/90 border border-white/50'}
                                `}
                            >
                                {table.name}
                            </div>

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

                {mode === 'edit' && filteredTables.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                        <p>{t('admin.floorPlan.noTablesInZone')}</p>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-gray-500 justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border border-gray-300 rounded shadow-sm"></div>
                    <span>{t('admin.floorPlan.legend.available')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary border border-primary rounded shadow-lg shadow-primary/30"></div>
                    <span>{t('admin.floorPlan.legend.selected')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded"></div>
                    <span>{t('admin.floorPlan.legend.booked')}</span>
                </div>
            </div>
        </div>
    );
};

export default FloorPlan;
