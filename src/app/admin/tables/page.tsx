'use client';

import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  ClockIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import TableModal from './components/TableModal';

export default function AdminTablesPage() {
  // Helper to get next 15 min slot
  const getNextTimeSlot = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const remainder = 15 - (minutes % 15);
    now.setMinutes(minutes + remainder);

    // Pad with leading zeros
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(getNextTimeSlot());

  // Separate selected state for query to prevent refetch on every keystroke
  const [query, setQuery] = useState({
    date: new Date().toISOString().split('T')[0],
    time: getNextTimeSlot(),
  });

  const [reservations, setReservations] = useState<any[]>([]);

  // Table State (Loaded from DB)
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 15 seconds to prevent flashing (5s was too fast)
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [query]); // Only re-fetch when user explicitly hits 'Check' (updates query)

  const handleCheck = () => {
    setQuery({ date, time });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Tables
      // ... (keep existing fetch Tables logic)
      let tablesData = [];
      try {
        const tablesRes = await fetch('/api/tables');
        const tablesJson = await tablesRes.json();
        if (tablesJson.data) {
          tablesData = tablesJson.data;
        }
      } catch (e) {
        console.warn('Failed to fetch tables', e);
      }
      setTables(tablesData);

      // 2. Fetch Reservations
      const response = await fetch(`/api/reservations?date=${query.date}&status=confirmed`);
      const responsePending = await fetch(`/api/reservations?date=${query.date}&status=pending`);

      const { data: confirmed } = await response.json();
      const { data: pending } = await responsePending.json();

      setReservations([...(confirmed || []), ...(pending || [])]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = (tableId: number) => {
    const totalDuration = 90 + 15; // 105 mins
    const [reqHour, reqMinute] = query.time.split(':').map(Number);
    const reqMinutes = reqHour * 60 + reqMinute;

    const booking = reservations.find((r) => {
      if (r.table_number !== tableId) return false;
      const [dbHour, dbMinute] = r.reservation_time.substring(0, 5).split(':').map(Number);
      const dbMinutes = dbHour * 60 + dbMinute;
      return Math.abs(dbMinutes - reqMinutes) < totalDuration;
    });

    return booking;
  };

  // ... (keep CRUD Operations)
  const handleCreateOrUpdate = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const url = editingTable ? `/api/tables/${editingTable.id}` : '/api/tables';

      const method = editingTable ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save table');
      }

      alert(editingTable ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มโต๊ะสำเร็จ');
      setIsModalOpen(false);
      setEditingTable(null);
      fetchData();
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        'ยืนยันการลบโต๊ะนี้? (การลบจะไม่ส่งผลต่อประวัติการจองเก่า แต่จะเลือกไม่ได้ในการจองใหม่)'
      )
    )
      return;

    try {
      const response = await fetch(`/api/tables/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      alert('ลบโต๊ะสำเร็จ');
      fetchData();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบโต๊ะ');
    }
  };

  const openCreateModal = () => {
    setEditingTable(null);
    setIsModalOpen(true);
  };

  const openEditModal = (table: any) => {
    setEditingTable(table);
    setIsModalOpen(true);
  };

  const isDirty = date !== query.date || time !== query.time;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">จัดการข้อมูลโต๊ะ</h1>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm text-sm font-medium transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            เพิ่มโต๊ะ
          </button>

          <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm font-bold text-gray-700 pl-2">วันที่:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-gray-300 rounded-md text-sm focus:ring-blue-600 focus:border-blue-600 text-gray-900"
            />
          </div>
          <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm font-bold text-gray-700 pl-2">เวลา:</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border-gray-300 rounded-md text-sm focus:ring-blue-600 focus:border-blue-600 text-gray-900"
            />
          </div>
          <button
            onClick={handleCheck}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-bold transition-all ${
              isDirty
                ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-300 ring-offset-1 animate-pulse'
                : 'bg-gray-800 text-white hover:bg-gray-900'
            }`}
          >
            {isDirty ? 'กดเพื่ออัปเดต' : 'ตรวจสอบ'}
          </button>
          {/* Display current checked time context */}
          <span className="text-xs text-gray-500 ml-1 whitespace-nowrap">
            (แสดงผล: {query.time} น.)
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => {
            const booking = checkAvailability(table.id);
            const isOccupied = !!booking;

            return (
              <div
                key={table.id}
                className={`relative group flex flex-col p-6 rounded-xl border-2 transition-all shadow-sm ${
                  isOccupied ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
                }`}
              >
                {/* Edit/Delete Actions (Visible on Hover) */}
                <div className="absolute top-2 right-2 flex space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(table)}
                    className="p-1.5 bg-white text-gray-600 rounded-full shadow hover:text-blue-600"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(table.id)}
                    className="p-1.5 bg-white text-gray-600 rounded-full shadow hover:text-red-600"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-lg ${
                      isOccupied ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                    }`}
                  >
                    <span className="text-xl font-bold">{table.id}</span>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded-full border ${
                      isOccupied
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-green-100 text-green-700 border-green-200'
                    }`}
                  >
                    {isOccupied ? 'ไม่ว่าง' : 'ว่าง'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{table.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{table.description}</p>

                <div className="flex items-center text-sm text-gray-700 mb-4">
                  <UsersIcon className="w-4 h-4 mr-2" />
                  ความจุ: {table.capacity} ท่าน
                </div>

                {isOccupied && (
                  <div className="mt-auto pt-4 border-t border-red-200">
                    <p className="text-xs font-bold text-red-700 uppercase mb-2">
                      ไม่ว่างจนถึง{' '}
                      {(() => {
                        const [h, m] = booking.reservation_time.split(':').map(Number);
                        const endDate = new Date();
                        endDate.setHours(h, m + 90 + 15); // +105 mins
                        return endDate.toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        });
                      })()}{' '}
                      น.
                    </p>
                    <div className="bg-white bg-opacity-60 p-3 rounded-md border border-red-100">
                      <p className="font-bold text-gray-900 line-clamp-1">{booking.guest_name}</p>
                      <div className="flex items-center text-xs text-gray-600 mt-1">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        เริ่ม: {booking.reservation_time.substring(0, 5)} น. ({booking.party_size}{' '}
                        ท่าน)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingTable}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
