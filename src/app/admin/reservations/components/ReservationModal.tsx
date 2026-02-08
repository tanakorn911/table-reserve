'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Table } from '@/types/tables';
import { useTranslation } from '@/lib/i18n';
import { useAdminLocale } from '@/app/admin/components/LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

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
  const { adminTheme } = useAdminTheme();
  const locale = useAdminLocale();
  const { t } = useTranslation(locale);
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

  const themeClasses = adminTheme === 'dark' ? {
    modal: 'bg-gray-800 border-gray-700',
    text: 'text-white',
    input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500',
    label: 'text-gray-300',
    closeBtn: 'text-gray-400 hover:text-white hover:bg-gray-700',
    cancelBtn: 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600',
    sectionBg: 'bg-gray-900/50 border-gray-700',
    sectionText: 'text-gray-400',
  } : {
    modal: 'bg-white border-gray-100',
    text: 'text-gray-900',
    input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500',
    label: 'text-gray-700',
    closeBtn: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
    cancelBtn: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    sectionBg: 'bg-blue-50 border-blue-100',
    sectionText: 'text-blue-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`${themeClasses.modal} rounded-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto shadow-2xl border`}>
        <div className={`flex justify-between items-center mb-6 pb-4 border-b ${adminTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
            {initialData ? (locale === 'th' ? 'แก้ไขข้อมูลการจอง' : 'Edit Reservation') : (locale === 'th' ? 'สร้างรายการจองใหม่' : 'New Reservation')}
          </h2>
          <button
            onClick={onClose}
            className={`${themeClasses.closeBtn} transition-colors p-1 rounded-full`}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>{t('form.name')}</label>
                <input
                  type="text"
                  required
                  className={`block w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:border-transparent font-medium border ${themeClasses.input}`}
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  required
                  className={`block w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:border-transparent font-medium border ${themeClasses.input}`}
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>{t('form.date')}</label>
                <input
                  type="date"
                  required
                  className={`block w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:border-transparent font-medium border ${themeClasses.input}`}
                  value={formData.reservation_date}
                  onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>{t('form.time')}</label>
                <input
                  type="time"
                  required
                  className={`block w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:border-transparent font-medium border ${themeClasses.input}`}
                  value={formData.reservation_time}
                  onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>{t('form.guests')}</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    className={`block w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:border-transparent font-medium border ${themeClasses.input}`}
                    value={formData.party_size}
                    onChange={(e) =>
                      setFormData({ ...formData, party_size: Number(e.target.value) })
                    }
                  />
                  <span className={`absolute right-4 top-2.5 text-sm font-medium pointer-events-none ${adminTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('form.guests.label')}
                  </span>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>
                  {t('form.table')} ({locale === 'th' ? 'ไม่บังคับ' : 'Optional'})
                </label>
                <select
                  className={`block w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:border-transparent font-medium border ${themeClasses.input}`}
                  value={formData.table_number}
                  onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                >
                  <option value="">{locale === 'th' ? 'ไม่ระบุ / จัดหน้างาน' : 'Walk-in / Assign Later'}</option>
                  {tables.map((tableItem) => (
                    <option key={tableItem.id} value={tableItem.id}>
                      {locale === 'th' ? 'โต๊ะ' : 'Table'} {tableItem.name} ({tableItem.capacity} {t('form.guests.label')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-bold mb-1.5 ${themeClasses.label}`}>
                {t('form.requests')} ({locale === 'th' ? 'จากลูกค้า' : 'from customer'})
              </label>
              <textarea
                className={`block w-full px-4 py-2 rounded-lg focus:ring-2 focus:border-transparent font-medium border ${themeClasses.input} opacity-80`}
                rows={2}
                value={formData.special_requests}
                readOnly={true}
                onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              />
            </div>

            {initialData?.payment_slip_url && (
              <div className={`p-4 rounded-xl border ${themeClasses.sectionBg}`}>
                <label className={`block text-sm font-black uppercase tracking-widest mb-2 ${themeClasses.sectionText}`}>
                  {t('admin.reservations.table.slip')}
                </label>
                <div className="mt-2 text-center">
                  <a href={initialData.payment_slip_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={initialData.payment_slip_url}
                      alt="Payment Slip"
                      className={`mx-auto max-h-[300px] rounded-lg shadow-sm border hover:opacity-90 transition-opacity ${adminTheme === 'dark' ? 'border-gray-600' : 'border-blue-200'}`}
                    />
                  </a>
                  <p className={`mt-2 text-xs font-medium italic ${adminTheme === 'dark' ? 'text-gray-400' : 'text-blue-500'}`}>
                    {locale === 'th' ? '* คลิกที่รูปเพื่อดูขนาดใหญ่' : '* Click to view full image'}
                  </p>
                </div>
              </div>
            )}

            <div className={`p-4 rounded-xl border ${adminTheme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-slate-50 border-slate-200'}`}>
              <label className={`block text-sm font-black uppercase tracking-widest mb-2 ${adminTheme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>
                {t('admin.reservations.table.notes')}
              </label>
              <textarea
                className={`block w-full px-4 py-2.5 border-2 rounded-lg focus:ring-4 font-bold ${adminTheme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-900/50' : 'bg-white border-slate-200 text-gray-900 placeholder:text-slate-400 focus:ring-primary/10 focus:border-primary'}`}
                rows={3}
                placeholder={locale === 'th' ? "เช่น ลูกค้าเจ้าประจำ, แพ้อาหาร, หรือประวัติ No-show..." : "e.g., VIP, Food allergies, or No-show history..."}
                value={formData.admin_notes}
                onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
              />
            </div>
          </div>

          <div className={`flex justify-end gap-3 pt-6 border-t ${adminTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 text-sm font-bold border rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 ${themeClasses.cancelBtn}`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? t('common.loading') : initialData ? t('common.save') : t('form.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
