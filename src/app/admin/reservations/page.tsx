'use client';

import React, { useEffect, useState, useRef } from 'react';
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
} from '@heroicons/react/24/outline';
import ReservationModal from './components/ReservationModal';
import { BookingSlip } from './components/BookingSlip';
import { useAdminLocale } from '@/app/admin/components/LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useTranslation } from '@/lib/i18n';

export default function AdminReservationsPage() {
  const locale = useAdminLocale();
  const { adminTheme } = useAdminTheme();
  const { t } = useTranslation(locale);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingReservation, setEditingReservation] = useState<any>(null);

  // Print State
  const [printReservation, setPrintReservation] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef, // Use contentRef instead of content
  });

  // Trigger print when reservation is selected
  useEffect(() => {
    if (printReservation && printRef.current) {
      handlePrint();
      // Reset after print dialog opens (optional, but good for UX)
      // setTimeout(() => setPrintReservation(null), 1000);
    }
  }, [printReservation, handlePrint]);

  useEffect(() => {
    fetchReservations();

    // 🆕 Auto-update every 60 seconds
    const interval = setInterval(fetchReservations, 60000);
    return () => clearInterval(interval);
  }, [filterStatus, filterDate]);

  const fetchReservations = async () => {
    if (reservations.length === 0) setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterDate) params.append('date', filterDate);

      const response = await fetch(`/api/reservations?${params.toString()}`);
      const { data } = await response.json();

      if (data) {
        // 🆕 Custom Sorting:
        // 1. Cancelled goes to the bottom
        // 2. Others sorted by newest (created_at) first
        const sortedData = [...data].sort((a, b) => {
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
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const statusLabel =
      newStatus === 'confirmed' ? 'อนุมัติ' : newStatus === 'cancelled' ? 'ยกเลิก' : 'เสร็จสิ้น';
    if (!confirm(`ยืนยันการตั้งสถานะเป็น '${statusLabel}' ?`)) return;

    setUpdatingId(id);
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Use functional update to avoid stale state from polling
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

  const deleteReservation = async (id: string) => {
    if (!confirm(locale === 'th' ? 'ยืนยันการลบรายการจองนี้ถาวร? (ไม่สามารถกู้คืนได้)' : 'Confirm permanent deletion? (Cannot be undone)')) return;

    setUpdatingId(id);
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
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
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save');
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

  const openEditModal = (reservation: any) => {
    setEditingReservation(reservation);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingReservation(null);
    setIsModalOpen(true);
  };

  const filteredReservations = reservations.filter(
    (r) =>
      r.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.guest_phone.includes(searchTerm) ||
      (r.booking_code && r.booking_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.id.slice(0, 8).toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <h1 className={`text-2xl font-bold ${adminTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('admin.reservations.title')}</h1>

        {/* Action Bar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
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
          className="w-full md:w-auto px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke-width%3D%222%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22m19.5%208.25-7.5%207.5-7.5-7.5%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_0.75rem_center] bg-no-repeat"
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
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
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
                    <td className="px-3 py-4 max-w-[150px]">
                      <p
                        className="text-xs text-gray-500 italic truncate"
                        title={reservation.admin_notes || ''}
                      >
                        {reservation.admin_notes || '-'}
                      </p>
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
                          onClick={() => setPrintReservation(reservation)}
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

              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPrintReservation(reservation)}
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
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingReservation}
        isSubmitting={isSubmitting}
      />

      <div className="hidden">
        <BookingSlip ref={printRef} reservation={printReservation} />
      </div>
    </div>
  );
}
