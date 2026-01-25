'use client';

import React, { useState, useEffect } from 'react';
import FloorPlan from '@/components/floor-plan/FloorPlan';
import { Table, TableShape } from '@/types/tables';
import Icon from '@/components/ui/AppIcon';
import { useTranslation } from '@/lib/i18n';
import { useAdminLocale } from '@/app/admin/components/LanguageSwitcher';
import AdminTimeGrid from '../components/AdminTimeGrid';

interface EditModalProps {
  table: Table | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (table: Table) => void;
  onDelete: (id: number) => void;
  t: any;
}

const EditModal = ({ table, isOpen, onClose, onSave, onDelete, t }: EditModalProps) => {
  const [formData, setFormData] = useState<Partial<Table>>({});

  useEffect(() => {
    if (table) {
      setFormData({ ...table });
    }
  }, [table]);

  if (!isOpen || !table) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = () => {
    if (formData) {
      onSave(formData as Table);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
        >
          <Icon name="XMarkIcon" size={24} />
        </button>

        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-inner">
            <span className="text-2xl font-black text-gray-900">
              {formData.name?.replace(/\D/g, '') || '#'}
            </span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">
            {t('admin.floorPlan.editModal.title')}
          </h3>
          <p className="text-sm text-gray-500 font-medium">
            {t('admin.floorPlan.configureSettings')}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {t('admin.floorPlan.editModal.name')}
            </label>
            <input
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="w-full px-5 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black font-bold text-gray-900 transition-all"
              placeholder="e.g. T-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
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
                  className="absolute left-1 top-1 w-8 h-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-200 rounded-lg transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity || 2}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-10 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black font-bold text-gray-900 text-center transition-all appearance-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, capacity: (prev.capacity || 0) + 1 }))
                  }
                  className="absolute right-1 top-1 w-8 h-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-200 rounded-lg transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                {t('admin.floorPlan.editModal.zone')}
              </label>
              <select
                name="zone"
                value={formData.zone || 'Indoor'}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black font-bold text-gray-900 transition-all appearance-none cursor-pointer"
              >
                <option value="Indoor">{t('admin.floorPlan.zone.indoor')}</option>
                <option value="Outdoor">{t('admin.floorPlan.zone.outdoor')}</option>
                <option value="VIP">{t('admin.floorPlan.zone.vip')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {t('admin.floorPlan.editModal.shape')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData((prev) => ({ ...prev, shape: 'rectangle' }))}
                className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 ${formData.shape === 'rectangle' ? 'border-black bg-black text-white' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <div
                  className={`w-4 h-3 border-2 rounded-sm ${formData.shape === 'rectangle' ? 'border-white' : 'border-gray-400'}`}
                />
                <span className="text-xs font-bold">{t('admin.floorPlan.shapes.rect')}</span>
              </button>
              <button
                onClick={() => setFormData((prev) => ({ ...prev, shape: 'circle' }))}
                className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 ${formData.shape === 'circle' ? 'border-black bg-black text-white' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <div
                  className={`w-4 h-4 border-2 rounded-full ${formData.shape === 'circle' ? 'border-white' : 'border-gray-400'}`}
                />
                <span className="text-xs font-bold">{t('admin.floorPlan.shapes.circle')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-3">
          <button
            onClick={() => {
              if (confirm(t('admin.floorPlan.editModal.confirmDelete'))) {
                onDelete(table.id);
                onClose();
              }
            }}
            className="flex-1 py-4 bg-red-50 text-red-600 rounded-xl font-black hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="TrashIcon" size={20} />
            {t('admin.floorPlan.editModal.delete')}
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-4 bg-[#3b5998] text-white rounded-xl font-black shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Icon name="CheckIcon" size={20} />
            {t('admin.floorPlan.editModal.update')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FloorPlanAdminPage() {
  const locale = useAdminLocale();
  const { t } = useTranslation(locale); // Dynamically use current locale
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'check'>('edit');
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkTime, setCheckTime] = useState('18:00'); // Default time
  const [bookedTables, setBookedTables] = useState<{ id: number; time: string }[]>([]);

  useEffect(() => {
    fetchTables();
  }, []);

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
          width: t.width || 60,
          height: t.height || 40,
          shape: t.shape || 'rectangle',
          zone: t.zone || 'Indoor',
        }));
        // Sort by ID to keep consistent
        setTables(tablesWithLayout.sort((a: Table, b: Table) => a.id - b.id));
      }
    } catch (error) {
      console.error('Failed to fetch tables', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookedTables = async () => {
    if (!checkDate) return;
    try {
      const response = await fetch(`/api/reservations?date=${checkDate}`);
      const result = await response.json();
      if (result.data) {
        const booked = result.data
          .filter((r: any) => {
            if (r.status !== 'confirmed' && r.status !== 'pending') return false;
            if (r.table_number === null) return false;

            if (checkTime) {
              const bookingTime = parseInt(r.reservation_time.substring(0, 2));
              const checkHour = parseInt(checkTime.substring(0, 2));
              const bookingEnd = bookingTime + 2;
              const checkEnd = checkHour + 2;
              return bookingEnd > checkHour && checkEnd > bookingTime;
            }
            return true;
          })
          .map((r: any) => ({
            id: Number(r.table_number),
            time: r.reservation_time.substring(0, 5),
            guestName: r.guest_name,
            guestPhone: r.guest_phone,
            partySize: r.party_size,
            status: r.status,
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

  useEffect(() => {
    if (viewMode === 'check') {
      fetchBookedTables();
    } else {
      setBookedTables([]);
    }
  }, [viewMode, checkDate, checkTime]);

  const handleTableUpdate = async (updatedTable: Table) => {
    setTables((prev) => prev.map((t) => (t.id === updatedTable.id ? updatedTable : t)));

    try {
      await fetch(`/api/tables/${updatedTable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedTable.name,
          capacity: updatedTable.capacity,
          shape: updatedTable.shape,
          zone: updatedTable.zone,
          x: updatedTable.x,
          y: updatedTable.y,
          width: updatedTable.width,
          height: updatedTable.height,
        }),
      });
    } catch (error) {
      console.error('Failed to save table update', error);
    }
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

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
            width: t.width,
            height: t.height,
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

  const addTable = async (shape: TableShape, zone: string = 'Indoor') => {
    const newTableCount = tables.length + 1;
    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `T-${newTableCount}`,
          capacity: 4,
          description: locale === 'th' ? 'โต๊ะใหม่' : 'New Table',
          x: 50,
          y: 50,
          width: shape === 'circle' ? 80 : 80,
          height: shape === 'circle' ? 80 : 60,
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

  const deleteTable = async (id: number) => {
    try {
      await fetch(`/api/tables/${id}`, { method: 'DELETE' });
      setTables((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full md:h-[calc(100vh-theme(spacing.20))] flex flex-col md:flex-row gap-6 p-4 md:p-6 max-w-[1600px] mx-auto overflow-y-auto md:overflow-hidden">
      {/* Main Canvas - Moved to TOP on mobile for better visibility */}
      <div className="flex-1 order-1 md:order-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative group min-h-[500px] md:min-h-0">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-black text-slate-700 shadow-lg flex items-center gap-2">
            <Icon name="Square2StackIcon" size={16} className="text-blue-500" />
            {t('admin.floorPlan.tableCount').replace('{count}', tables.length.toString())}
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50/50">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
                <span className="text-sm font-medium text-gray-400">
                  {t('admin.floorPlan.loading')}
                </span>
              </div>
            </div>
          ) : (
            <div className="min-w-[800px] h-full p-4 md:p-8 pb-32">
              <FloorPlan
                mode={viewMode === 'edit' ? 'edit' : 'view'}
                tables={tables}
                onTableUpdate={handleTableUpdate}
                height={850}
                onTableEdit={setEditingTable}
                bookedTables={bookedTables}
                locale={locale}
                onTableSelect={(id) => {
                  if (viewMode === 'check') {
                    const booking = bookedTables.find((b) => b.id === id);
                    if (booking) setSelectedBooking(booking);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sidebar / Toolbar - Moved to BOTTOM on mobile */}
      <div className="w-full md:w-80 flex flex-col gap-4 order-2 md:order-1">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {t('admin.floorPlan.title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{t('admin.floorPlan.subtitle')}</p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex-1 py-3 px-2 text-[13px] font-black rounded-xl transition-all flex items-center justify-center gap-2 ${viewMode === 'edit'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Icon name="PencilIcon" size={16} />
              {t('admin.floorPlan.mode.edit')}
            </button>
            <button
              onClick={() => setViewMode('check')}
              className={`flex-1 py-3 px-2 text-[13px] font-black rounded-xl transition-all flex items-center justify-center gap-2 ${viewMode === 'check'
                ? 'bg-white text-green-600 shadow-md'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Icon name="MagnifyingGlassIcon" size={16} />
              {t('admin.floorPlan.mode.check')}
            </button>
          </div>

          {/* Check Date Picker */}
          {viewMode === 'check' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {t('admin.floorPlan.selectDate')}
                </label>
                <input
                  type="date"
                  value={checkDate}
                  onChange={(e) => setCheckDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
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

          {viewMode === 'edit' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {t('admin.floorPlan.addTable')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => addTable('rectangle')}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-8 h-6 border-2 border-gray-400 rounded-sm mb-2 group-hover:border-primary transition-colors"></div>
                  <span className="text-xs font-bold text-gray-600 group-hover:text-primary">
                    {t('admin.floorPlan.shapes.rect')}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1">
                    ({t('admin.floorPlan.zone.indoor')})
                  </span>
                </button>
                <button
                  onClick={() => addTable('circle')}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-8 h-8 border-2 border-gray-400 rounded-full mb-2 group-hover:border-primary transition-colors"></div>
                  <span className="text-xs font-bold text-gray-600 group-hover:text-primary">
                    {t('admin.floorPlan.shapes.circle')}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1">
                    ({t('admin.floorPlan.zone.outdoor')})
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <div className="flex flex-col gap-2">
              <button
                id="save-btn"
                onClick={handleSaveLayout}
                disabled={saveStatus !== 'idle'}
                className={`w-full py-3 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${saveStatus === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30' : 'bg-primary hover:bg-primary/90 shadow-primary/30'}`}
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

        {/* Tip Card - Smaller or Hidden on Mobile if needed */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hidden md:block">
          <h3 className="font-black text-slate-900 text-base mb-3 flex items-center gap-2">
            <Icon name="InformationCircleIcon" size={20} className="text-blue-600" />
            {t('admin.floorPlan.tips')}
          </h3>
          <ul className="text-sm text-slate-700 space-y-3 list-disc list-inside font-bold leading-relaxed">
            <li>{t('admin.floorPlan.tip1')}</li>
            <li>{t('admin.floorPlan.tip2')}</li>
            <li>{t('admin.floorPlan.tip3')}</li>
          </ul>
        </div>
      </div>


      <EditModal
        table={editingTable}
        isOpen={!!editingTable}
        onClose={() => setEditingTable(null)}
        onSave={handleTableUpdate}
        onDelete={deleteTable}
        t={t}
      />

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
            >
              <Icon name="XMarkIcon" size={24} />
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                <Icon name="CalendarIcon" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t('admin.floorPlan.bookingDetails')}</h3>
              <p className="text-sm text-gray-500">{t('admin.reservations.table.table')} {selectedBooking.id}</p>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('form.time')}</span>
                  <span className="font-bold text-gray-900">{selectedBooking.time} {locale === 'th' ? 'น.' : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('admin.floorPlan.nextAvailable')}</span>
                  <span className="font-bold text-green-600">
                    {(() => {
                      const [h, m] = selectedBooking.time.split(':').map(Number);
                      const endH = h + 2;
                      return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}${locale === 'th' ? ' น.' : ''}`;
                    })()}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                  <span className="text-gray-500">{t('form.name')}</span>
                  <span className="font-bold text-gray-900">{selectedBooking.guestName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('form.phone')}</span>
                  <span className="font-bold text-gray-900">{selectedBooking.guestPhone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('form.guests')}</span>
                  <span className="font-bold text-gray-900">{selectedBooking.partySize} {t('admin.reservations.guests')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('admin.reservations.table.status')}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-xs ${selectedBooking.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                      }`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
