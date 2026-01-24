'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Table } from '@/types/tables';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  isSubmitting: boolean;
}

export default function ReservationModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: ReservationModalProps) {
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    party_size: 2,
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '18:00',
    table_number: '',
    special_requests: '',
    admin_notes: '',
  });

  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch('/api/tables');
        const result = await response.json();
        if (result.data) {
          setTables(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch tables:', error);
      }
    };

    if (isOpen && tables.length === 0) {
      fetchTables();
    }
  }, [isOpen, tables.length]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        guest_name: initialData.guest_name,
        guest_phone: initialData.guest_phone,
        party_size: initialData.party_size,
        reservation_date: initialData.reservation_date,
        reservation_time: initialData.reservation_time,
        table_number: initialData.table_number || '',
        special_requests: initialData.special_requests || '',
        admin_notes: initialData.admin_notes || '',
      });
    } else {
      // Reset for create mode
      setFormData({
        guest_name: '',
        guest_phone: '',
        party_size: 2,
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '18:00',
        table_number: '',
        special_requests: '',
        admin_notes: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      table_number: formData.table_number ? Number(formData.table_number) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'แก้ไขข้อมูลการจอง' : 'สร้างรายการจองใหม่'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">ชื่อลูกค้า</label>
                <input
                  type="text"
                  required
                  className="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium placeholder-gray-400"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  required
                  className="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium placeholder-gray-400"
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">วันที่</label>
                <input
                  type="date"
                  required
                  className="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  value={formData.reservation_date}
                  onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">เวลา</label>
                <input
                  type="time"
                  required
                  className="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  value={formData.reservation_time}
                  onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">จำนวนคน</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    className="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                    value={formData.party_size}
                    onChange={(e) =>
                      setFormData({ ...formData, party_size: Number(e.target.value) })
                    }
                  />
                  <span className="absolute right-4 top-2.5 text-gray-500 text-sm font-medium pointer-events-none">
                    ท่าน
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  เลือกโต๊ะ (ไม่บังคับ)
                </label>
                <select
                  className="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium bg-white"
                  value={formData.table_number}
                  onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                >
                  <option value="">ไม่ระบุ / จัดหน้างาน</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      โต๊ะ {t.name} ({t.capacity} ที่นั่ง)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                คำขอพิเศษเพิ่มเติม (จากลูกค้า)
              </label>
              <textarea
                className="block w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium placeholder-gray-400 bg-gray-50"
                rows={2}
                value={formData.special_requests}
                readOnly={true}
                onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              />
            </div>

            {initialData?.payment_slip_url && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <label className="block text-sm font-black text-blue-800 uppercase tracking-widest mb-2">
                  หลักฐานการชำระเงิน (สลิป)
                </label>
                <div className="mt-2 text-center">
                  <a href={initialData.payment_slip_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={initialData.payment_slip_url}
                      alt="Payment Slip"
                      className="mx-auto max-h-[300px] rounded-lg shadow-sm border border-blue-200 hover:opacity-90 transition-opacity"
                    />
                  </a>
                  <p className="mt-2 text-xs text-blue-500 font-medium italic">
                    * คลิกที่รูปเพื่อดูขนาดใหญ่
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <label className="block text-sm font-black text-orange-800 uppercase tracking-widest mb-2">
                หมายเหตุพนักงาน (Staff Only)
              </label>
              <textarea
                className="block w-full px-4 py-2.5 text-gray-900 border-2 border-orange-200 rounded-lg focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold placeholder:text-orange-300/60"
                rows={3}
                placeholder="เช่น ลูกค้าเจ้าประจำ, แพ้อาหาร, หรือประวัติ No-show..."
                value={formData.admin_notes}
                onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? 'กำลังบันทึก...' : initialData ? 'บันทึกการแก้ไข' : 'ยืนยันการจอง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
