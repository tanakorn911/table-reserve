'use client'; // ใช้ Client Component

import React, { useState, useEffect } from 'react';
import FloorPlan from '@/components/floor-plan/FloorPlan';
import { Table, TableShape } from '@/types/tables';
import Icon from '@/components/ui/AppIcon';
import { useTranslation } from '@/lib/i18n';
import { useAdminLocale, adminT } from '@/app/admin/components/LanguageSwitcher';
import AdminTimeGrid from '../components/AdminTimeGrid';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useDraggableScroll } from '@/hooks/useDraggableScroll';

// Props สำหรับ Modal แก้ไขโต๊ะ
interface EditModalProps {
  table: Table | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (table: Table) => void;
  onDelete: (id: number) => void;
  t: any;
}

/**
 * EditModal Component
 * 
 * หน้าต่าง Modal สำหรับแก้ไขข้อมูลโต๊ะ (ชื่อ, จำนวนคน, รูปทรง, โซน)
 */
const EditModal = ({ table, isOpen, onClose, onSave, onDelete, t }: EditModalProps) => {
  const [formData, setFormData] = useState<Partial<Table>>({});
  const { resolvedAdminTheme } = useAdminTheme();

  // อัพเดทข้อมูลในฟอร์มเมื่อมีการเลือกโต๊ะใหม่
  useEffect(() => {
    if (table) {
      setFormData({ ...table });
    }
  }, [table]);

  if (!isOpen || !table) return null;

  // จัดการการเปลี่ยนค่า input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value,
    }));
  };

  // บันทึกข้อมูล
  const handleSubmit = () => {
    if (formData && formData.name) {
      onSave(formData as Table);
      onClose();
    }
  };

  // Theme-aware colors definitions (กำหนดสีตาม Theme)
  const themeColors = resolvedAdminTheme === 'dark' ? {
    backdrop: 'bg-black/60',
    modal: 'bg-gray-800 border-gray-700',
    closeBtn: 'hover:bg-gray-700 text-gray-400 hover:text-white',
    iconBg: 'bg-gray-700 border-gray-600',
    iconText: 'text-white',
    title: 'text-white',
    subtitle: 'text-gray-400',
    label: 'text-gray-400',
    input: 'bg-gray-700 border-gray-600 focus:bg-gray-600 focus:border-yellow-500 text-white',
    shapeActive: 'border-yellow-500 bg-yellow-500 text-gray-900',
    shapeInactive: 'border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-500',
    shapeBorderActive: 'border-gray-900',
    shapeBorderInactive: 'border-gray-500',
    saveBtn: 'bg-[#4a6fa5] text-white shadow-[#4a6fa5]/20 hover:bg-[#3f5f8e]',
    deleteBtn: 'bg-red-900/30 text-red-400 hover:bg-red-900/50',
    focusRing: 'focus:ring-yellow-500/10',
  } : {
    backdrop: 'bg-black/20',
    modal: 'bg-white border-gray-200',
    closeBtn: 'hover:bg-gray-100 text-gray-400 hover:text-gray-900',
    iconBg: 'bg-gray-100 border-gray-200',
    iconText: 'text-gray-900',
    title: 'text-gray-900',
    subtitle: 'text-gray-500',
    label: 'text-gray-500',
    input: 'bg-white border-gray-200 focus:bg-white focus:border-accent text-gray-900',
    shapeActive: 'border-accent bg-accent text-accent-foreground',
    shapeInactive: 'border-gray-200 bg-white text-gray-500 hover:border-gray-400',
    shapeBorderActive: 'border-white',
    shapeBorderInactive: 'border-gray-400',
    saveBtn: 'bg-accent text-accent-foreground shadow-sm hover:bg-accent/90',
    deleteBtn: 'bg-red-50 text-red-600 hover:bg-red-100',
    focusRing: 'focus:ring-accent/20',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${themeColors.backdrop} backdrop-blur-sm transition-opacity`}
        onClick={onClose}
      />
      {/* Modal Content */}
      <div className={`${themeColors.modal} rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200 border`}>
        <button
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-full ${themeColors.closeBtn} transition-all`}
        >
          <Icon name="XMarkIcon" size={24} />
        </button>

        {/* Header: แสดงหมายเลขโต๊ะที่กำลังแก้ไข */}
        <div className="mb-8 text-center">
          <div className={`w-16 h-16 ${themeColors.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-inner`}>
            <span className={`text-2xl font-black ${themeColors.iconText}`}>
              {formData.name?.replace(/\D/g, '') || '#'}
            </span>
          </div>
          <h3 className={`text-2xl font-black ${themeColors.title} tracking-tight`}>
            {t('admin.floorPlan.editModal.title')}
          </h3>
          <p className={`text-sm ${themeColors.subtitle} font-medium`}>
            {t('admin.floorPlan.configureSettings')}
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* ชื่อโต๊ะ */}
          <div>
            <label className={`block text-xs font-bold ${themeColors.label} uppercase tracking-wider mb-2`}>
              {t('admin.floorPlan.editModal.name')}
            </label>
            <input
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className={`w-full px-5 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 ${themeColors.focusRing} font-bold transition-all ${themeColors.input}`}
              placeholder="e.g. T-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* ความจุ (Capacity) */}
            <div className="space-y-2">
              <label className={`block text-xs font-bold ${themeColors.label} uppercase tracking-wider`}>
                {t('admin.floorPlan.editModal.capacity')}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      capacity: Math.max(1, (prev.capacity || 0) - 1),
                    }))
                  }
                  className={`absolute left-1 top-1 w-8 h-full flex items-center justify-center rounded-lg transition-colors ${resolvedAdminTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-400 hover:text-black hover:bg-gray-200'}`}
                >
                  -
                </button>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity || 2}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      setFormData((prev) => ({ ...prev, capacity: Math.min(6, Math.max(1, val)) }));
                    } else {
                      setFormData((prev) => ({ ...prev, capacity: 1 }));
                    }
                  }}
                  min={1}
                  max={6}
                  className={`w-full px-10 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 ${themeColors.focusRing} font-bold text-center transition-all appearance-none ${themeColors.input}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, capacity: Math.min(6, (prev.capacity || 0) + 1) }))
                  }
                  className={`absolute right-1 top-1 w-8 h-full flex items-center justify-center rounded-lg transition-colors ${resolvedAdminTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-400 hover:text-black hover:bg-gray-200'}`}
                >
                  +
                </button>
              </div>
            </div>

            {/* โซน (Zone) */}
            <div className="space-y-2">
              <label className={`block text-xs font-bold ${themeColors.label} uppercase tracking-wider`}>
                {t('admin.floorPlan.editModal.zone')}
              </label>
              <select
                name="zone"
                value={formData.zone || 'Indoor'}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 ${themeColors.focusRing} font-bold transition-all appearance-none cursor-pointer ${themeColors.input}`}
              >
                <option value="Indoor">{t('admin.floorPlan.zone.indoor')}</option>
                <option value="Outdoor">{t('admin.floorPlan.zone.outdoor')}</option>
                <option value="VIP">{t('admin.floorPlan.zone.vip')}</option>
              </select>
            </div>
          </div>

          {/* รูปร่างโต๊ะ (Shape) */}
          <div>
            <label className={`block text-xs font-bold ${themeColors.label} uppercase tracking-wider mb-2`}>
              {t('admin.floorPlan.editModal.shape')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData((prev) => ({ ...prev, shape: 'rectangle' }))}
                className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 ${formData.shape === 'rectangle' ? themeColors.shapeActive : themeColors.shapeInactive}`}
              >
                <div
                  className={`w-4 h-3 border-2 rounded-sm ${formData.shape === 'rectangle' ? themeColors.shapeBorderActive : themeColors.shapeBorderInactive}`}
                />
                <span className="text-xs font-bold">{t('admin.floorPlan.shapes.rect')}</span>
              </button>
              <button
                onClick={() => setFormData((prev) => ({ ...prev, shape: 'circle' }))}
                className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 ${formData.shape === 'circle' ? themeColors.shapeActive : themeColors.shapeInactive}`}
              >
                <div
                  className={`w-4 h-4 border-2 rounded-full ${formData.shape === 'circle' ? themeColors.shapeBorderActive : themeColors.shapeBorderInactive}`}
                />
                <span className="text-xs font-bold">{t('admin.floorPlan.shapes.circle')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons: Delete & Update */}
        <div className="mt-10 flex gap-3">
          <button
            onClick={() => {
              if (confirm(t('admin.floorPlan.editModal.confirmDelete'))) {
                onDelete(table.id);
                onClose();
              }
            }}
            className={`flex-1 py-4 rounded-xl font-black transition-colors flex items-center justify-center gap-2 ${themeColors.deleteBtn}`}
          >
            <Icon name="TrashIcon" size={20} />
            {t('admin.floorPlan.editModal.delete')}
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 py-4 rounded-xl font-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${themeColors.saveBtn}`}
          >
            <Icon name="CheckIcon" size={20} />
            {t('admin.floorPlan.editModal.update')}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * FloorPlanAdminPage Component
 * 
 * หน้าจัดการผังร้านสำหรับ Admin
 * - แสดงผังโต๊ะ (Drag & Drop ได้)
 * - เพิ่ม/ลบ/แก้ไขโต๊ะ
 * - โหมด "Check Status" เพื่อดูว่าวัน/เวลาไหน โต๊ะไหนว่างบ้าง
 * - บันทึกตำแหน่งโต๊ะลงฐานข้อมูล
 */
export default function FloorPlanAdminPage() {
  const locale = useAdminLocale();
  const { adminTheme, resolvedAdminTheme } = useAdminTheme();
  const { t } = useTranslation(locale);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'check'>('edit'); // โหมด: แก้ไข หรือ ตรวจสอบ
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkTime, setCheckTime] = useState('18:00');
  const [bookedTables, setBookedTables] = useState<any[]>([]);
  const [displayMode, setDisplayMode] = useState<'map' | 'list'>('map');

  // Helper functions for translation
  const getLocalizedZone = (zone: string) => {
    switch (zone?.toLowerCase()) {
      case 'indoor': return t('admin.floorPlan.zone.indoor');
      case 'outdoor': return t('admin.floorPlan.zone.outdoor');
      case 'vip': return t('admin.floorPlan.zone.vip');
      default: return zone;
    }
  };

  const getLocalizedShape = (shape: string) => {
    switch (shape?.toLowerCase()) {
      case 'rectangle': return t('admin.floorPlan.shapes.rect');
      case 'circle': return t('admin.floorPlan.shapes.circle');
      case 'round-rect': return t('admin.floorPlan.shapes.roundRect');
      default: return shape;
    }
  };

  // Draggable Scroll Hook
  const { ref: scrollRef, events } = useDraggableScroll();

  // โหลดข้อมูลโต๊ะเมื่อเข้าหน้านี้
  useEffect(() => {
    fetchTables();
  }, []);

  // ฟังก์ชันดึงข้อมูลโต๊ะจาก API
  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tables');
      if (response.ok) {
        const result = await response.json();
        const data = result.data || [];
        const tablesWithLayout = data.map((t: any) => ({
          ...t,
          x: t.x ?? 0,
          y: t.y ?? 0,
          width: 80, // กำหนดขนาดมาตรฐาน
          height: 80,
          shape: t.shape || 'rectangle',
          zone: t.zone || 'Indoor',
        }));
        // เรียงตาม ID
        setTables(tablesWithLayout.sort((a: Table, b: Table) => a.id - b.id));
      }
    } catch (error) {
      console.error('Failed to fetch tables', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันดึงข้อมูลการจองเพื่อแสดงสถานะโต๊ะ (ในโหมด Check)
  const fetchBookedTables = async () => {
    if (!checkDate) return;
    try {
      const response = await fetch(`/api/reservations?date=${checkDate}`);
      const result = await response.json();
      if (result.data) {
        const booked = result.data
          .filter((r: any) => {
            // เอาเฉพาะที่ยังไม่ยกเลิก
            if (r.status !== 'confirmed' && r.status !== 'pending') return false;
            if (r.table_number === null) return false;

            // กรองตามเวลาถ้ามีการระบุ
            if (checkTime) {
              const bookingTime = parseInt(r.reservation_time.substring(0, 2));
              const checkHour = parseInt(checkTime.substring(0, 2));
              const bookingEnd = bookingTime + 2; // สมมติว่ากิน 2 ชม.
              const checkEnd = checkHour + 2;
              // เช็คช่วงเวลาทับซ้อน (Overlap)
              return bookingEnd > checkHour && checkEnd > bookingTime;
            }
            return true;
          })
          .map((r: any) => ({
            id: Number(r.table_number),
            reservationId: r.id, // Keep the real UUID for updates
            time: r.reservation_time.substring(0, 5),
            guestName: r.guest_name,
            guestPhone: r.guest_phone,
            partySize: r.party_size,
            status: r.status,
            bookingCode: r.booking_code,
          }));
        setBookedTables(booked);
      } else {
        setBookedTables([]);
      }
    } catch (error) {
      console.error('Failed to fetch bookings', error);
      setBookedTables([]);
    }
  };

  // อัพเดทข้อมูลการจองเมื่อเปลี่ยนโหมด, วันที่ หรือ เวลา
  useEffect(() => {
    if (viewMode === 'check') {
      fetchBookedTables();
    } else {
      setBookedTables([]);
    }
  }, [viewMode, checkDate, checkTime]);

  // ฟังก์ชันอัพเดทข้อมูลโต๊ะ (แก้ไขชื่อ, ขนาด etc.)
  const handleTableUpdate = (updatedTable: Table) => {
    // เช็คชื่อซ้ำ (เฉพาะกรณีเปลี่ยนชื่อจริงๆ)
    const isDuplicate = tables.some(t => t.name.toLowerCase() === updatedTable.name.toLowerCase() && t.id !== updatedTable.id);
    if (isDuplicate) {
      // ไม่ Alert ถี่เกินไปตอนลาก แต่กันไว้ใน state
      return;
    }

    setTables((prev) => prev.map((t) => (t.id === updatedTable.id ? updatedTable : t)));
    // 💡 ลบ API call ออกจากตรงนี้ เพื่อไม่ให้ยิงรัวๆ ตอนลากโต๊ะ (ย้ายไปรวมที่ปุ่มบันทึกทีเดียว)
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Function to update booking status (from Floor Plan)
  const handleUpdateStatus = async (reservationId: string, newStatus: string) => {
    setUpdatingBookingId(reservationId);
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state for bookedTables
        setBookedTables((prev) =>
          prev.map((b) => (b.reservationId === reservationId ? { ...b, status: newStatus } : b))
        );
        // Also update selectedBooking for the modal UI
        if (selectedBooking && selectedBooking.reservationId === reservationId) {
          setSelectedBooking({ ...selectedBooking, status: newStatus });
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to update status'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Connection error. Please try again.');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // ฟังก์ชันบันทึกตำแหน่งโต๊ะทั้งหมด (Save Layout)
  const handleSaveLayout = async () => {
    setSaveStatus('saving');
    try {
      const updates = tables.map((t) =>
        fetch(`/api/tables/${t.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            x: t.x,
            y: t.y,
            width: 80,
            height: 80,
          }),
        })
      );

      await Promise.all(updates);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save layout', error);
      alert('Failed to save layout');
      setSaveStatus('idle');
    }
  };

  // ฟังก์ชันเพิ่มโต๊ะใหม่
  const addTable = async (shape: TableShape, zone: string = 'Indoor') => {
    const newTableCount = tables.length + 1;
    let newName = `T-${newTableCount}`;

    // หาชื่อที่ไม่ซ้ำ
    let counter = 1;
    while (tables.some(t => t.name === newName)) {
      newName = `T-${newTableCount + counter}`;
      counter++;
    }

    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          capacity: 4,
          description: locale === 'th' ? 'โต๊ะใหม่' : 'New Table',
          x: 50,
          y: 50,
          width: 80,
          height: 80,
          shape: shape,
          zone: zone,
          locale: locale,
        }),
      });

      if (response.ok) {
        fetchTables();
      }
    } catch (error) {
      console.error('Error creating table', error);
    }
  };

  // ฟังก์ชันลบโต๊ะ
  const deleteTable = async (id: number) => {
    try {
      await fetch(`/api/tables/${id}`, { method: 'DELETE' });
      setTables((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Theme-aware colors for the main page layout
  const pageTheme = resolvedAdminTheme === 'dark' ? {
    bg: 'bg-gray-900',
    card: 'bg-gray-800 border-gray-700',
    cardBg: 'bg-gray-900/50',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    border: 'border-gray-700',
    modeSwitch: 'bg-gray-700',
    modeActive: 'bg-gray-600 text-yellow-400 shadow-md',
    modeInactive: 'text-gray-400 hover:text-gray-200',
    input: 'bg-gray-700 border-gray-600 text-white focus:border-yellow-500',
    tip: 'bg-blue-900/20 border-blue-900/40 text-blue-200',
    counter: 'bg-gray-800/90 border-gray-700 text-gray-200',
    dashedBorder: 'border-gray-600 hover:border-yellow-500 hover:bg-yellow-500/10',
    dashedText: 'text-gray-400 group-hover:text-yellow-500',
    dashedIcon: 'border-gray-500 group-hover:border-yellow-500',
    primaryBtn: 'bg-[#4a6fa5] hover:bg-[#3f5f8e] text-white shadow-sm',
  } : {
    bg: 'bg-gray-50',
    card: 'bg-white border-gray-200',
    cardBg: 'bg-gray-100/50',
    text: 'text-gray-900',
    textSecondary: 'text-gray-500',
    border: 'border-gray-200',
    modeSwitch: 'bg-gray-100',
    modeActive: 'bg-accent/10 text-accent shadow-sm border-accent/20',
    modeActiveCheck: 'bg-success/10 text-success shadow-sm border-success/20',
    modeInactive: 'text-muted-foreground hover:text-foreground',
    input: 'bg-card border-border text-foreground focus:border-accent focus:ring-accent/20',
    tip: 'bg-blue-50 border-blue-100 text-blue-800',
    counter: 'bg-card/90 border-border text-foreground shadow-sm',
    dashedBorder: 'border-stone-300 hover:border-accent hover:bg-accent/5',
    dashedText: 'text-muted-foreground group-hover:text-accent',
    dashedIcon: 'border-stone-300 group-hover:border-accent',
    primaryBtn: 'bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm',
  };

  // Theme-aware colors for Booking Detail Modal
  const modalTheme = resolvedAdminTheme === 'dark' ? {
    backdrop: 'bg-black/60',
    modal: 'bg-gray-800 border-gray-700',
    closeBtn: 'hover:bg-gray-700 text-gray-400 hover:text-white',
  } : {
    backdrop: 'bg-black/20',
    modal: 'bg-white border-gray-200',
    closeBtn: 'hover:bg-gray-100 text-gray-400 hover:text-gray-900',
  };

  return (
    <div className={`min-h-screen md:h-[calc(100vh-theme(spacing.20))] flex flex-col md:flex-row gap-6 p-4 md:p-6 max-w-[1600px] mx-auto overflow-y-auto md:overflow-hidden ${pageTheme.bg}`}>
      {/* 
        Main Canvas (พื้นที่แสดงผังร้าน)
        บนมือถือจะอยู่ด้านบน (order-1)
      */}
      <div className={`flex-1 order-2 ${pageTheme.card} rounded-2xl shadow-sm border overflow-hidden flex flex-col relative group min-h-[500px] md:min-h-0`}>
        {/* ตัวนับจำนวนโต๊ะ */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <div className={`${pageTheme.counter} backdrop-blur px-4 py-2 rounded-xl border text-[13px] font-black shadow-lg flex items-center gap-2`}>
            <Icon name="Square2StackIcon" size={16} className={resolvedAdminTheme === 'dark' ? 'text-blue-400' : 'text-blue-500'} />
            {t('admin.floorPlan.tableCount').replace('{count}', tables.length.toString())}
          </div>
        </div>

        <div
          ref={scrollRef}
          {...events}
          className={`flex-1 overflow-auto cursor-grab active:cursor-grabbing ${pageTheme.cardBg} select-none no-scrollbar`}
          style={{ touchAction: 'pan-y' }}
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className={`w-10 h-10 border-4 border-gray-200 ${resolvedAdminTheme === 'dark' ? 'border-t-yellow-500' : 'border-t-amber-500'} rounded-full animate-spin`} />
                <span className={`text-sm font-medium ${pageTheme.textSecondary}`}>
                  {t('admin.floorPlan.loading')}
                </span>
              </div>
            </div>
          ) : displayMode === 'map' ? (
            <div className="p-2 md:p-4 min-w-[1200px] md:min-w-0 md:w-full md:h-full flex flex-col">
              <FloorPlan
                mode={viewMode === 'edit' ? 'edit' : 'view'}
                tables={tables}
                onTableUpdate={handleTableUpdate}
                width={typeof window !== 'undefined' && window.innerWidth >= 768 ? '100%' : 1200}
                height={typeof window !== 'undefined' && window.innerWidth >= 768 ? '100%' : 950}
                onTableEdit={setEditingTable}
                bookedTables={bookedTables}
                locale={locale}
                theme={resolvedAdminTheme}
                onTableSelect={(id) => {
                  if (viewMode === 'check') {
                    const booking = bookedTables.find((b) => b.id === id);
                    if (booking) setSelectedBooking(booking);
                  }
                }}
              />
            </div>
          ) : (
            /* Table List View for Admin */
            <div className="p-6 overflow-y-auto h-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-32">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={`${resolvedAdminTheme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'} rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md group`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 ${resolvedAdminTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'} rounded-xl flex items-center justify-center border font-black text-lg ${pageTheme.text}`}>
                        {table.name.replace(/\D/g, '') || table.name}
                      </div>
                    </div>

                    <h4 className={`font-bold ${pageTheme.text} mb-1`}>{table.name}</h4>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                        <Icon name="UserIcon" size={14} />
                        <span>{table.capacity} {t('common.people')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                        <Icon name="MapPinIcon" size={14} />
                        <span>{getLocalizedZone(table.zone)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                        <Icon name="Square2StackIcon" size={14} />
                        <span>{getLocalizedShape(table.shape)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingTable(table)}
                      className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold border transition-all ${resolvedAdminTheme === 'dark'
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                        }`}
                    >
                      {t('common.edit')}
                    </button>
                  </div>
                ))}

                {/* Add Table Button in List */}
                {viewMode === 'edit' && (
                  <button
                    onClick={() => addTable('rectangle')}
                    className={`min-h-[200px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${pageTheme.dashedBorder}`}
                  >
                    <div className={`p-3 rounded-full border-2 ${pageTheme.dashedIcon}`}>
                      <Icon name="PlusIcon" size={24} className={pageTheme.textSecondary} />
                    </div>
                    <span className={`font-bold ${pageTheme.dashedText}`}>{t('admin.floorPlan.addTable')}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar / Toolbar ด้านซ้าย (หรือล่างในมือถือ) */}
      <div className="w-full md:w-[400px] flex flex-col gap-4 order-1 md:overflow-y-auto md:pr-2">
        <div className={`${pageTheme.card} rounded-2xl shadow-sm border p-6 flex flex-col gap-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-2xl border transition-all duration-300 ${resolvedAdminTheme === 'dark' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-amber-100 border-amber-200'}`}>
              <Icon name="MapIcon" size={32} className={resolvedAdminTheme === 'dark' ? 'text-yellow-400' : 'text-amber-600'} />
            </div>
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${resolvedAdminTheme === 'dark' ? 'text-yellow-400' : 'text-amber-700'}`}>
                {adminT('admin.floorPlan.title', locale)}
              </h1>
              <p className={`text-sm mt-0.5 font-medium ${resolvedAdminTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {adminT('admin.floorPlan.subtitle', locale)}
              </p>
            </div>
          </div>

          {/* Display View Switcher: สลับระหว่างมุมมองแผนผังกับมุมมองรายการ */}
          <div className="space-y-3">
            <div className={`text-xs font-bold ${pageTheme.textSecondary} uppercase tracking-widest`}>
              {t('admin.floorPlan.displayView')}
            </div>
            <div className={`flex ${pageTheme.modeSwitch} p-1.5 rounded-2xl shadow-inner`}>
              <button
                onClick={() => setDisplayMode('map')}
                className={`flex-1 min-w-max py-2.5 px-4 text-[13px] font-black rounded-xl transition-all flex items-center justify-center gap-2 ${displayMode === 'map'
                  ? pageTheme.modeActive
                  : pageTheme.modeInactive
                  }`}
              >
                <Icon name="MapIcon" size={16} />
                {t('admin.floorPlan.view.map')}
              </button>
              <button
                onClick={() => setDisplayMode('list')}
                className={`flex-1 min-w-max py-2.5 px-4 text-[13px] font-black rounded-xl transition-all flex items-center justify-center gap-2 ${displayMode === 'list'
                  ? pageTheme.modeActive
                  : pageTheme.modeInactive
                  }`}
              >
                <Icon name="ListBulletIcon" size={16} />
                {t('admin.floorPlan.view.list')}
              </button>
            </div>
          </div>

          {/* Mode Switcher: ปุ่มสลับระหว่างโหมดแก้ไขกับโหมดตรวจสอบ */}
          <div className={`flex ${pageTheme.modeSwitch} p-1.5 rounded-2xl shadow-inner`}>
            <button
              onClick={() => setViewMode('edit')}
              className={`flex-1 min-w-max py-3 px-4 text-[13px] font-black rounded-xl transition-all flex items-center justify-center gap-2 ${viewMode === 'edit'
                ? pageTheme.modeActive
                : pageTheme.modeInactive
                }`}
            >
              <Icon name="PencilIcon" size={16} />
              {t('admin.floorPlan.mode.edit')}
            </button>
            <button
              onClick={setViewMode.bind(null, 'check')}
              className={`flex-1 min-w-max py-3 px-4 text-[13px] font-black rounded-xl transition-all flex items-center justify-center gap-2 ${viewMode === 'check'
                ? resolvedAdminTheme === 'dark' ? 'bg-gray-600 text-green-400 shadow-md' : 'bg-white text-green-600 shadow-md'
                : pageTheme.modeInactive
                }`}
            >
              <Icon name="MagnifyingGlassIcon" size={16} />
              {t('admin.floorPlan.mode.check')}
            </button>
          </div>

          {/* Controls สำหรับ Mode Check */}
          {viewMode === 'check' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
              <div>
                <label className={`block text-xs font-bold ${pageTheme.textSecondary} uppercase tracking-widest mb-2`}>
                  {t('admin.floorPlan.selectDate')}
                </label>
                <input
                  type="date"
                  value={checkDate}
                  onChange={(e) => setCheckDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 font-bold focus:outline-none focus:ring-4 transition-all ${pageTheme.input} ${resolvedAdminTheme === 'dark' ? 'focus:ring-yellow-500/10' : 'focus:ring-amber-500/10'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold ${pageTheme.textSecondary} uppercase tracking-widest mb-2`}>
                  {t('checkStatus.label.time')}
                </label>
                <AdminTimeGrid
                  selectedDate={checkDate}
                  value={checkTime}
                  onChange={(t) => setCheckTime(t)}
                />
              </div>
            </div>
          )}

          {/* Controls สำหรับ Mode Edit: ปุ่มเพิ่มโต๊ะ */}
          {viewMode === 'edit' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className={`text-xs font-bold ${pageTheme.textSecondary} uppercase tracking-widest`}>
                {t('admin.floorPlan.addTable')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => addTable('rectangle')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all group ${pageTheme.dashedBorder}`}
                >
                  <div className={`w-8 h-6 border-2 rounded-sm mb-2 transition-colors ${pageTheme.dashedIcon}`}></div>
                  <span className={`text-xs font-bold ${pageTheme.dashedText}`}>
                    {t('admin.floorPlan.shapes.rect')}
                  </span>
                  <span className={`text-[10px] ${pageTheme.textSecondary} mt-1`}>
                    ({t('admin.floorPlan.zone.indoor')})
                  </span>
                </button>
                <button
                  onClick={() => addTable('circle')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all group ${pageTheme.dashedBorder}`}
                >
                  <div className={`w-8 h-8 border-2 rounded-full mb-2 transition-colors ${pageTheme.dashedIcon}`}></div>
                  <span className={`text-xs font-bold ${pageTheme.dashedText}`}>
                    {t('admin.floorPlan.shapes.circle')}
                  </span>
                  <span className={`text-[10px] ${pageTheme.textSecondary} mt-1`}>
                    ({t('admin.floorPlan.zone.outdoor')})
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ปุ่มบันทึก (Save) */}
          <div className={`pt-4 border-t ${pageTheme.border}`}>
            <div className="flex flex-col gap-2">
              <button
                id="save-btn"
                onClick={handleSaveLayout}
                disabled={saveStatus !== 'idle'}
                className={`w-full py-3 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${saveStatus === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30' : pageTheme.primaryBtn}`}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('admin.floorPlan.save')}...</span>
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <Icon name="CheckIcon" size={20} />
                    <span>{t('admin.floorPlan.saved')}</span>
                  </>
                ) : (
                  <>
                    <Icon name="CheckIcon" size={20} />
                    <span>{t('admin.floorPlan.save')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tip Card: คำแนะนำการใช้งาน */}
        <div className={`${pageTheme.card} rounded-2xl p-6 shadow-sm border hidden md:block overflow-hidden`}>
          <h3 className={`font-black ${pageTheme.text} text-base mb-3 flex items-center gap-2 whitespace-nowrap`}>
            <Icon name="InformationCircleIcon" size={20} className={resolvedAdminTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
            {t('admin.floorPlan.tips')}
          </h3>
          <ul className={`text-sm ${pageTheme.textSecondary} space-y-3 list-disc list-outside pl-5 font-bold leading-relaxed`}>
            <li>{t('admin.floorPlan.tip1')}</li>
            <li>{t('admin.floorPlan.tip2')}</li>
            <li>{t('admin.floorPlan.tip3')}</li>
          </ul>
        </div>
      </div>

      {/* Render Modals */}
      <EditModal
        table={editingTable}
        isOpen={!!editingTable}
        onClose={() => setEditingTable(null)}
        onSave={handleTableUpdate}
        onDelete={deleteTable}
        t={t}
      />

      {/* Booking Detail Modal: แสดงรายละเอียดจองเมื่อคลิกที่โต๊ะ (Mode Check) */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 ${modalTheme.backdrop} backdrop-blur-sm transition-opacity`}
            onClick={() => setSelectedBooking(null)}
          />
          <div className={`${modalTheme.modal} rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10 animate-in fade-in zoom-in-95 duration-200 border`}>
            <button
              onClick={() => setSelectedBooking(null)}
              className={`absolute top-4 right-4 ${modalTheme.closeBtn}`}
            >
              <Icon name="XMarkIcon" size={24} />
            </button>
            <div className="text-center mb-6">
              <div className={`w-12 h-12 ${resolvedAdminTheme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <Icon name="CalendarIcon" size={24} />
              </div>
              <h3 className={`text-xl font-bold ${pageTheme.text}`}>{t('admin.floorPlan.bookingDetails')}</h3>
              <p className={`text-sm ${pageTheme.textSecondary}`}>{t('admin.reservations.table.table')} {selectedBooking.id}</p>
            </div>
            <div className="space-y-4">
              <div className={`${pageTheme.cardBg} p-4 rounded-xl space-y-3 border ${pageTheme.border}`}>
                <div className="flex justify-between text-sm">
                  <span className={pageTheme.textSecondary}>{t('form.name')}</span>
                  <span className={`font-bold ${pageTheme.text}`}>{selectedBooking.guestName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={pageTheme.textSecondary}>{t('form.phone')}</span>
                  <span className={`font-bold ${pageTheme.text}`}>{selectedBooking.guestPhone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={pageTheme.textSecondary}>{t('form.guests')}</span>
                  <span className={`font-bold ${pageTheme.text}`}>{selectedBooking.partySize} {t('common.people')}</span>
                </div>
                <div className={`pt-2 border-t ${resolvedAdminTheme === 'dark' ? 'border-gray-700' : 'border-gray-200/50'}`}></div>
                <div className="flex justify-between text-sm">
                  <span className={pageTheme.textSecondary}>{t('form.time')}</span>
                  <span className={`font-bold ${pageTheme.text}`}>{selectedBooking.time} {locale === 'th' ? 'น.' : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={pageTheme.textSecondary}>{t('admin.floorPlan.nextAvailable')}</span>
                  <span className={`font-bold ${resolvedAdminTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    {(() => {
                      const [h, m] = selectedBooking.time.split(':').map(Number);
                      const endH = h + 2;
                      return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}${locale === 'th' ? ' น.' : ''}`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={pageTheme.textSecondary}>{t('admin.reservations.table.status')}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-xs ${selectedBooking.status === 'confirmed'
                      ? 'bg-green-100/10 text-green-500 border border-green-500/20'
                      : selectedBooking.status === 'completed'
                        ? 'bg-gray-100/10 text-gray-500 border border-gray-500/20'
                        : 'bg-yellow-100/10 text-yellow-500 border border-yellow-500/20'
                      }`}
                  >
                    {selectedBooking.status === 'pending'
                      ? t('admin.reservations.filter.pending')
                      : selectedBooking.status === 'confirmed'
                        ? t('admin.reservations.filter.confirmed')
                        : selectedBooking.status === 'cancelled'
                          ? t('admin.reservations.filter.cancelled')
                          : selectedBooking.status === 'completed'
                            ? t('admin.reservations.filter.completed')
                            : selectedBooking.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Booking */}
              <div className="flex flex-col gap-2 pt-2">
                {selectedBooking.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedBooking.reservationId, 'confirmed')}
                    disabled={!!updatingBookingId}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20"
                  >
                    {updatingBookingId === selectedBooking.reservationId ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Icon name="CheckCircleIcon" size={20} />
                        <span>{t('admin.reservations.actions.approve')}</span>
                      </>
                    )}
                  </button>
                )}

                {selectedBooking.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedBooking.reservationId, 'completed')}
                    disabled={!!updatingBookingId}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                  >
                    {updatingBookingId === selectedBooking.reservationId ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Icon name="CheckCircleIcon" size={20} />
                        <span>{t('admin.reservations.actions.complete')}</span>
                      </>
                    )}
                  </button>
                )}

                {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                  <button
                    onClick={() => {
                      if (confirm(t('admin.reservations.actions.cancel') + '?')) {
                        handleUpdateStatus(selectedBooking.reservationId, 'cancelled');
                      }
                    }}
                    disabled={!!updatingBookingId}
                    className={`w-full py-3 rounded-xl font-bold border transition-all ${resolvedAdminTheme === 'dark'
                      ? 'border-red-900/50 text-red-400 hover:bg-red-900/20'
                      : 'border-red-100 text-red-600 hover:bg-red-50'
                      }`}
                  >
                    {t('admin.reservations.actions.cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
