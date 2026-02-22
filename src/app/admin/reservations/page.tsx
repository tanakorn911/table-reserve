'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  PrinterIcon,
  PencilSquareIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import ReservationModal from './components/ReservationModal';
import { BookingSlip } from './components/BookingSlip';
import { useAdminLocale } from '@/app/admin/components/LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useTranslation } from '@/lib/i18n';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useDraggableScroll } from '@/hooks/useDraggableScroll';
import { XMarkIcon as XMarkIconSolid } from '@heroicons/react/24/solid';

export default function AdminReservationsPage() {
  const locale = useAdminLocale();
  const { resolvedAdminTheme } = useAdminTheme();
  const { t } = useTranslation(locale);
  // State สำหรับเก็บข้อมูลการจองทั้งหมดที่ดึงมาจาก API
  const [reservations, setReservations] = useState<any[]>([]);
  // State สำหรับสถานะการโหลดข้อมูล
  const [loading, setLoading] = useState(true);
  // State สำหรับตัวกรองสถานะ (all, pending, confirmed, cancelled, completed)
  const [filterStatus, setFilterStatus] = useState('all');
  // State สำหรับตัวกรองวันที่
  const [filterDate, setFilterDate] = useState('');
  // State สำหรับคำค้นหา (ชื่อ, เบอร์โทร, รหัสการจอง)
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  // State ควบคุมการแสดงผล Modal สำหรับสร้าง/แก้ไขการจอง
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingReservation, setEditingReservation] = useState<any>(null);

  // Print State
  // State สำหรับเก็บข้อมูลการจองที่ต้องการพิมพ์ใบจอง
  const [printReservation, setPrintReservation] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Staff ID Dialog State (สำหรับถามรหัสพนักงานก่อนปริ้น)
  const [showStaffIdDialog, setShowStaffIdDialog] = useState(false);
  const [staffIdInput, setStaffIdInput] = useState('');
  const [staffIdError, setStaffIdError] = useState('');
  const [staffIdLoading, setStaffIdLoading] = useState(false);
  const [pendingPrintReservation, setPendingPrintReservation] = useState<any>(null);
  const [printStaffInfo, setPrintStaffInfo] = useState<{ staff_id: string; full_name: string } | null>(null);

  // Draggable Scroll Hook
  const { ref: scrollRef, events } = useDraggableScroll();

  // Ref เพื่อเช็คว่าโหลดครั้งแรกหรือยัง (ป้องกันการกระพริบเมื่อข้อมูลอัปเดต)
  const isInitialLoad = useRef(true);

  // Hook สำหรับจัดการการพิมพ์
  const handlePrint = useReactToPrint({
    contentRef: printRef, // Use contentRef instead of content
  });

  // Trigger print when reservation is selected
  // สั่งพิมพ์เมื่อเลือกรายการจอง (printReservation มีค่า)
  useEffect(() => {
    if (printReservation && printRef.current) {
      handlePrint();
    }
  }, [printReservation, handlePrint]);

  // ฟังก์ชันเปิด dialog ถามรหัสพนักงานก่อนปริ้น
  const openPrintDialog = (reservation: any) => {
    setPendingPrintReservation(reservation);
    setStaffIdInput('');
    setStaffIdError('');
    setPrintStaffInfo(null);
    setShowStaffIdDialog(true);
  };

  // ฟังก์ชันยืนยันรหัสพนักงานและเริ่มปริ้น
  const confirmStaffAndPrint = async () => {
    if (!staffIdInput.trim()) {
      setStaffIdError(locale === 'th' ? 'กรุณากรอกรหัสพนักงาน' : 'Please enter staff ID');
      return;
    }

    setStaffIdLoading(true);
    setStaffIdError('');

    try {
      const supabase = createClientSupabaseClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('staff_id, full_name, role')
        .eq('staff_id', staffIdInput.trim())
        .single();

      if (error || !profile) {
        setStaffIdError(locale === 'th' ? 'ไม่พบรหัสพนักงานนี้ในระบบ' : 'Staff ID not found');
        setStaffIdLoading(false);
        return;
      }

      // ตั้งค่าข้อมูลพนักงานและเริ่มปริ้น
      const staffData = {
        staff_id: profile.staff_id || staffIdInput.trim(),
        full_name: profile.full_name || '-',
      };
      setPrintStaffInfo(staffData);
      setPrintReservation(pendingPrintReservation);
      setShowStaffIdDialog(false);
    } catch (err) {
      setStaffIdError(locale === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred');
    } finally {
      setStaffIdLoading(false);
    }
  };

  // ฟังก์ชันดึงข้อมูลการจองจาก API
  // แสดง loading เฉพาะครั้งแรก, ครั้งต่อไปจะ update แบบ background (ไม่กระพริบ)
  const fetchReservations = useCallback(async () => {
    // แสดง loading spinner เฉพาะครั้งแรก
    if (isInitialLoad.current) setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterDate) params.append('date', filterDate);

      const response = await fetch(`/api/reservations?${params.toString()}`);
      const { data } = await response.json();

      if (data) {
        // 🆕 Custom Sorting:
        // 1. Cancelled goes to the bottom (รายการที่ยกเลิกอยู่ล่างสุด)
        // 2. Others sorted by newest (created_at) first (รายการอื่นๆ เรียงตามเวลาที่สร้างล่าสุด)
        const sortedData = [...data].sort((a: any, b: any) => {
          // Priority 1: Status (Cancelled at the bottom)
          if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
          if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;

          // Priority 2: Creation Date (Newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setReservations(sortedData);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, [filterStatus, filterDate]);

  useEffect(() => {
    // รีเซ็ต initial load เมื่อเปลี่ยน filter
    isInitialLoad.current = true;
    fetchReservations();

    // 🆕 Real-time Update using Supabase
    // เชื่อมต่อ Supabase Realtime เพื่ออัปเดตข้อมูลทันทีเมื่อ DB เปลี่ยนแปลง
    const supabase = createClientSupabaseClient();
    const channel = supabase
      .channel('admin_reservations_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // ดักจับทุกเหตุการณ์ (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'reservations'
        },
        () => {
          // เมื่อมีการเปลี่ยนแปลง ให้ดึงข้อมูลใหม่แบบ background (ไม่กระพริบเพราะ fetchReservations จัดการไว้แล้ว)
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterStatus, filterDate, fetchReservations]); // เพิ่ม fetchReservations ใน deps เพราะใช้ useCallback แล้ว

  // ฟังก์ชันอัปเดตสถานะการจอง (Approve, Complete, Cancel)
  const updateStatus = async (id: string, newStatus: string) => {
    const statusLabel =
      newStatus === 'confirmed' ? 'อนุมัติ' : newStatus === 'cancelled' ? 'ยกเลิก' : 'เสร็จสิ้น';
    if (!confirm(`ยืนยันการตั้งสถานะเป็น '${statusLabel}' ?`)) return;

    setUpdatingId(id);
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Use functional update to avoid stale state from polling
        // อัปเดตข้อมูลใน Local State ทันทีเพื่อให้ UI ตอบสนองไว
        setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      } else {
        const errorData = await response.json();
        alert(`${t('common.error')}: ${errorData.error || (locale === 'th' ? 'ไม่สามารถอัปเดตสถานะได้' : 'Failed to update status')}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(locale === 'th' ? 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่' : 'Connection error. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ฟังก์ชันลบรายการจองถาวร
  const deleteReservation = async (id: string) => {
    if (!confirm(locale === 'th' ? 'ยืนยันการลบรายการจองนี้ถาวร? (ไม่สามารถกู้คืนได้)' : 'Confirm permanent deletion? (Cannot be undone)')) return;

    setUpdatingId(id);
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setReservations((prev) => prev.filter((r) => r.id !== id));
      } else {
        const errorData = await response.json();
        alert(`${t('common.error')}: ${errorData.error || (locale === 'th' ? 'ไม่สามารถลบรายการได้' : 'Failed to delete')}`);
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert(locale === 'th' ? 'เกิดข้อผิดพลาดในการเชื่อมต่อ' : 'Connection error');
    } finally {
      setUpdatingId(null);
    }
  };

  // ฟังก์ชันจัดการการสร้างหรือแก้ไขการจอง (Submit Form)
  const handleCreateOrUpdate = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const url = editingReservation
        ? `/api/reservations/${editingReservation.id}`
        : '/api/reservations';

      const method = editingReservation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || (locale === 'th' ? 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' : 'Failed to save'));
        return;
      }

      // Refresh list
      fetchReservations();
      setIsModalOpen(false);
      setEditingReservation(null);
      alert(editingReservation
        ? (locale === 'th' ? 'แก้ไขข้อมูลสำเร็จ' : 'Successfully updated')
        : (locale === 'th' ? 'สร้างการจองสำเร็จ' : 'Successfully created')
      );
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // เปิด Modal เพื่อแก้ไขการจอง
  const openEditModal = (reservation: any) => {
    setEditingReservation(reservation);
    setIsModalOpen(true);
  };

  // เปิด Modal เพื่อสร้างการจองใหม่
  const openCreateModal = () => {
    setEditingReservation(null);
    setIsModalOpen(true);
  };

  // กรองรายการจองตามคำค้นหา (Search Term)
  const filteredReservations = reservations.filter(
    (r) =>
      r.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.guest_phone.includes(searchTerm) ||
      (r.booking_code && r.booking_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.id.slice(0, 8).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ฟังก์ชันกำหนดสีของป้ายสถานะ (Badge Color)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* ส่วนหัวของหน้า (Page Header) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl border transition-all duration-300 ${resolvedAdminTheme === 'dark' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-amber-100 border-amber-200'}`}>
            <CalendarIcon className={`w-8 h-8 ${resolvedAdminTheme === 'dark' ? 'text-yellow-400' : 'text-amber-600'}`} />
          </div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${resolvedAdminTheme === 'dark' ? 'text-yellow-400' : 'text-amber-700'}`}>
              {t('admin.reservations.title')}
            </h1>
            <p className={`text-sm mt-0.5 font-medium ${resolvedAdminTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('admin.reservations.subtitle')}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        {/* ส่วนปุ่มดำเนินการ: Export CSV และ Create Reservation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // Export CSV Logic
              const headers = [
                'Booking Code',
                'Date',
                'Time',
                'Guest Name',
                'Phone',
                'Pax',
                'Table',
                'Status',
                'Notes',
              ];
              const rows = filteredReservations.map((r) => [
                r.booking_code || r.id.slice(0, 8),
                r.reservation_date,
                r.reservation_time,
                r.guest_name,
                r.guest_phone,
                r.party_size,
                r.table_name || r.table_number || '-',
                r.status,
                r.admin_notes || '',
              ]);
              const csvContent =
                'data:text/csv;charset=utf-8,' +
                headers.join(',') +
                '\n' +
                rows.map((e) => e.join(',')).join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute(
                'download',
                `reservations_${new Date().toISOString().split('T')[0]}.csv`
              );
              document.body.appendChild(link);
              link.click();
            }}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 shadow-sm text-sm font-medium transition-colors border border-gray-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            {t('admin.reservations.exportCSV')}
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm text-sm font-medium transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            {t('admin.reservations.create')}
          </button>
        </div>
      </div>

      {/* Filters */}
      {/* ส่วนตัวกรอง: ค้นหา, สถานะ, วันที่ */}
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-4 md:space-y-0 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder={t('admin.reservations.search')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="w-full md:w-auto px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke-width%3D%222%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22m19.5%208.25-7.5%207.5-7.5-7.5%22/%3E%3C/svg%3E')] bg-size-[20px_20px] bg-position-[right_0.75rem_center] bg-no-repeat"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">{t('admin.reservations.filter.all')}</option>
          <option value="pending">{t('admin.reservations.filter.pending')}</option>
          <option value="confirmed">{t('admin.reservations.filter.confirmed')}</option>
          <option value="cancelled">{t('admin.reservations.filter.cancelled')}</option>
          <option value="completed">{t('admin.reservations.filter.completed')}</option>
        </select>

        <input
          type="date"
          lang={locale}
          className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      {/* Desktop Table View */}
      {/* ตารางแสดงข้อมูลการจองสำหรับ Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div
          ref={scrollRef}
          {...events}
          className="overflow-x-auto cursor-grab active:cursor-grabbing"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
                >
                  {t('admin.reservations.table.datetime')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
                >
                  {t('admin.reservations.table.guest')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
                >
                  {t('admin.reservations.table.table')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
                >
                  {t('admin.reservations.table.notes')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
                >
                  {t('admin.reservations.table.slip')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
                >
                  {t('admin.reservations.table.status')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-right text-sm font-bold text-gray-700 uppercase tracking-wider"
                >
                  {t('admin.reservations.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center flex-col items-center">
                      <div className="w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin mb-2"></div>
                      {t('admin.reservations.loading')}
                    </div>
                  </td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {t('admin.reservations.noData')}
                  </td>
                </tr>
              ) : (
                filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">
                            {reservation.booking_code || `#${reservation.id.slice(0, 8)}`}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {reservation.reservation_date}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 flex items-center mt-0.5">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {reservation.reservation_time}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {reservation.guest_name}
                      </div>
                      <div className="text-xs text-gray-600">{reservation.guest_phone}</div>
                      <div className="text-xs font-medium text-gray-500 mt-0.5">
                        {locale === 'th' ? 'จำนวน' : 'Guests:'} {reservation.party_size} {t('admin.reservations.guests')}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                        {reservation.table_name || reservation.table_number || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-4 max-w-[200px]">
                      <div className="flex flex-col gap-1 max-w-[180px]">
                        {reservation.special_requests && (
                          <div className="text-xs text-gray-700 bg-amber-50 px-2 py-1 rounded border border-amber-100 truncate" title={reservation.special_requests}>
                            <span className="font-bold text-amber-700 mr-1">{locale === 'th' ? 'ลูกค้า:' : 'Guest:'}</span>
                            <span className="truncate">{reservation.special_requests}</span>
                          </div>
                        )}
                        {reservation.admin_notes && (
                          <div className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 italic truncate" title={reservation.admin_notes}>
                            <span className="font-bold mr-1">Admin:</span>
                            <span className="truncate">{reservation.admin_notes}</span>
                          </div>
                        )}
                        {!reservation.special_requests && !reservation.admin_notes && (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {reservation.payment_slip_url ? (
                        <a
                          href={reservation.payment_slip_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            ></path>
                          </svg>
                          <span className="text-[10px] font-bold">{t('admin.reservations.viewSlip')}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">{t('admin.reservations.noSlip')}</span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-bold rounded-full border ${getStatusColor(reservation.status)}`}
                      >
                        {reservation.status === 'pending'
                          ? t('admin.reservations.filter.pending')
                          : reservation.status === 'confirmed'
                            ? t('admin.reservations.filter.confirmed')
                            : reservation.status === 'cancelled'
                              ? t('admin.reservations.filter.cancelled')
                              : reservation.status === 'completed'
                                ? t('admin.reservations.filter.completed')
                                : reservation.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => openPrintDialog(reservation)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                          title={t('admin.reservations.actions.print')}
                        >
                          <PrinterIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(reservation)}
                          className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-100 rounded-md transition-colors"
                          title={t('admin.reservations.actions.edit')}
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>

                        {/* Status Actions */}
                        {/* ปุ่มเปลี่ยนสถานะต่างๆ */}
                        {reservation.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(reservation.id, 'confirmed')}
                            disabled={!!updatingId}
                            className={`px-3 py-1 text-xs font-bold text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition-colors ${updatingId === reservation.id ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            {updatingId === reservation.id ? '...' : t('admin.reservations.actions.approve')}
                          </button>
                        )}
                        {reservation.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus(reservation.id, 'completed')}
                            disabled={!!updatingId}
                            className={`px-3 py-1 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 transition-colors ${updatingId === reservation.id ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            {updatingId === reservation.id ? '...' : t('admin.reservations.actions.complete')}
                          </button>
                        )}
                        {(reservation.status === 'pending' ||
                          reservation.status === 'confirmed') && (
                            <button
                              onClick={() => updateStatus(reservation.id, 'cancelled')}
                              disabled={!!updatingId}
                              className={`px-3 py-1 text-xs font-bold text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 transition-colors ${updatingId === reservation.id ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              {updatingId === reservation.id ? '...' : t('admin.reservations.actions.cancel')}
                            </button>
                          )}
                        {reservation.status === 'cancelled' && (
                          <button
                            onClick={() => deleteReservation(reservation.id)}
                            disabled={!!updatingId}
                            className={`px-3 py-1 text-xs font-bold text-white bg-red-600 border border-red-700 rounded-md hover:bg-red-700 transition-colors ${updatingId === reservation.id ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            {updatingId === reservation.id ? '...' : t('admin.reservations.actions.delete')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      {/* การ์ดแสดงผลสำหรับ Mobile */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-lg shadow-sm text-center text-gray-500">
            <div className="flex justify-center flex-col items-center">
              <div className="w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin mb-2"></div>
              {t('admin.reservations.loading')}
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm text-center text-gray-500 italic">
            {t('admin.reservations.noData')}
          </div>
        ) : (
          filteredReservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 uppercase tracking-tighter">
                      {reservation.booking_code || `#${reservation.id.slice(0, 8)}`}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{reservation.guest_name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">📞 {reservation.guest_phone}</p>
                </div>
                <span
                  className={`px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-widest ${getStatusColor(reservation.status)}`}
                >
                  {reservation.status === 'pending'
                    ? t('admin.reservations.filter.pending')
                    : reservation.status === 'confirmed'
                      ? t('admin.reservations.filter.confirmed')
                      : reservation.status === 'cancelled'
                        ? t('admin.reservations.filter.cancelled')
                        : reservation.status === 'completed'
                          ? t('admin.reservations.filter.completed')
                          : reservation.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {locale === 'th' ? 'นัดหมาย' : 'Schedule'}
                  </p>
                  <p className="text-sm font-bold text-gray-800">{reservation.reservation_date}</p>
                  <p className="text-xs text-gray-600">
                    {locale === 'th' ? 'เวลา' : 'Time:'} {reservation.reservation_time.substring(0, 5)} {locale === 'th' ? 'น.' : ''}
                  </p>
                </div>
                <div className="space-y-0.5 border-l border-gray-200 pl-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {locale === 'th' ? 'โต๊ะ & จำนวน' : 'Table & Pax'}
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {reservation.table_name || reservation.table_number || 'ยังไม่ระบุ'}
                  </p>
                  <p className="text-xs text-gray-600">{reservation.party_size} {t('admin.reservations.guests')}</p>
                </div>
              </div>

              {/* Special Requests & Admin Notes in Mobile View */}
              {(reservation.special_requests || reservation.admin_notes) && (
                <div className="grid grid-cols-1 gap-2 p-3 bg-white rounded-lg border border-gray-100 shadow-sm text-xs mt-1">
                  {reservation.special_requests && (
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded self-start">{locale === 'th' ? 'คำขอพิเศษจากลูกค้า' : 'Special Request'}</span>
                      <p className="text-gray-700">{reservation.special_requests}</p>
                    </div>
                  )}
                  {reservation.admin_notes && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded self-start">Admin Note</span>
                      <p className="text-gray-500 italic">{reservation.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-2">
                  <button
                    onClick={() => openPrintDialog(reservation)}
                    className="p-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-200 transition-colors"
                  >
                    <PrinterIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(reservation)}
                    className="p-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-200 transition-colors"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  {reservation.payment_slip_url && (
                    <a
                      href={reservation.payment_slip_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-gray-100 text-blue-600 rounded-lg hover:bg-blue-100 border border-gray-200 transition-colors flex items-center"
                      title={t('admin.reservations.viewSlip')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  {reservation.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(reservation.id, 'confirmed')}
                      disabled={!!updatingId}
                      className="px-4 py-2.5 bg-green-600 text-white text-xs font-black rounded-lg shadow-sm hover:bg-green-700 uppercase tracking-widest transition-all active:scale-95"
                    >
                      {updatingId === reservation.id ? '...' : t('admin.reservations.actions.approve')}
                    </button>
                  )}
                  {reservation.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(reservation.id, 'completed')}
                      disabled={!!updatingId}
                      className="px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-lg shadow-sm hover:bg-blue-700 uppercase tracking-widest transition-all active:scale-95"
                    >
                      {updatingId === reservation.id ? '...' : t('admin.reservations.actions.complete')}
                    </button>
                  )}
                  {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                    <button
                      onClick={() => updateStatus(reservation.id, 'cancelled')}
                      disabled={!!updatingId}
                      className="px-4 py-2.5 bg-red-50 text-red-600 text-xs font-black rounded-lg border border-red-100 hover:bg-red-100 uppercase tracking-widest transition-all active:scale-95"
                    >
                      {updatingId === reservation.id ? '...' : t('admin.reservations.actions.cancel')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals & Hidden Print Area */}
      {/* Modal และโซนสำหรับพิมพ์ (ซ่อนอยู่) */}
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingReservation}
        isSubmitting={isSubmitting}
      />

      <div className="hidden">
        <BookingSlip ref={printRef} reservation={printReservation} staffInfo={printStaffInfo} />
      </div>

      {/* Staff ID Dialog - ถามรหัสพนักงานก่อนปริ้น */}
      {showStaffIdDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {locale === 'th' ? '🖨️ ยืนยันก่อนพิมพ์' : '🖨️ Confirm before print'}
              </h3>
              <button
                onClick={() => setShowStaffIdDialog(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <XMarkIconSolid className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              {locale === 'th'
                ? 'กรุณากรอกรหัสพนักงานเพื่อบันทึกผู้ออกใบจอง'
                : 'Please enter your staff ID to record who issued this slip'}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {locale === 'th' ? 'รหัสพนักงาน' : 'Staff ID'}
              </label>
              <input
                type="text"
                value={staffIdInput}
                onChange={(e) => { setStaffIdInput(e.target.value); setStaffIdError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && confirmStaffAndPrint()}
                placeholder={locale === 'th' ? 'เช่น ST-0001' : 'e.g. ST-0001'}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-gray-900 font-bold text-center text-lg tracking-wider placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
              />
              {staffIdError && (
                <p className="text-xs text-red-500 font-bold mt-1.5">⚠️ {staffIdError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStaffIdDialog(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 border border-gray-200 transition-colors"
              >
                {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                onClick={confirmStaffAndPrint}
                disabled={staffIdLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {staffIdLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>{locale === 'th' ? 'ตรวจสอบ...' : 'Checking...'}</span>
                  </>
                ) : (
                  <>
                    <PrinterIcon className="w-4 h-4" />
                    <span>{locale === 'th' ? 'พิมพ์ใบจอง' : 'Print Slip'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
