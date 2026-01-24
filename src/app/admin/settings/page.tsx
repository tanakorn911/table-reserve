'use client';

import React, { useState, useEffect } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { Table } from '@/types/tables';
import {
  ClockIcon,
  TableCellsIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface BusinessHours {
  [key: string]: { open: string; close: string };
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'staff';
  position?: string;
  staff_id?: string;
}

const DEFAULT_HOURS: BusinessHours = {
  '0': { open: '10:00', close: '21:00' },
  '1': { open: '11:00', close: '22:00' },
  '2': { open: '11:00', close: '22:00' },
  '3': { open: '11:00', close: '22:00' },
  '4': { open: '11:00', close: '23:00' },
  '5': { open: '11:00', close: '23:00' },
  '6': { open: '10:00', close: '23:00' },
};

const DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export default function AdminSettingsPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Business Hours State
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [hoursLoading, setHoursLoading] = useState(true);
  const [hoursSaving, setHoursSaving] = useState(false);

  // Tables State
  const [tables, setTables] = useState<Table[]>([]);

  // Staff Members State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);

  // Holidays State
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayEndDate, setHolidayEndDate] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');
  const [holidaysLoading, setHolidaysLoading] = useState(true);

  const supabase = createClientSupabaseClient();

  const fetchProfiles = async () => {
    setProfilesLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true });

      if (error) {
        console.error('Supabase Error:', error);
        alert('ไม่สามารถดึงข้อมูลพนักงานได้: ' + (error.message || JSON.stringify(error)));
        return;
      }
      setProfiles(data || []);
    } catch (error: any) {
      console.error('System Error:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (error.message || 'Unknown error'));
    } finally {
      setProfilesLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Tables
        const tablesRes = await fetch('/api/tables');
        const tablesJson = await tablesRes.json();
        if (tablesJson.data) setTables(tablesJson.data);

        // Fetch Settings
        const settingsRes = await fetch('/api/settings?key=business_hours');
        const settingsJson = await settingsRes.json();

        if (settingsJson.data && settingsJson.data.value) {
          setBusinessHours(settingsJson.data.value);
        }

        // Fetch Staff Profiles
        await fetchProfiles();

        // Fetch Holidays
        const holidaysRes = await supabase
          .from('holidays')
          .select('*')
          .order('holiday_date', { ascending: true });
        if (holidaysRes.data) setHolidays(holidaysRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setHoursLoading(false);
        setHolidaysLoading(false);
      }
    };
    fetchData();
  }, []);

  const syncProfiles = async () => {
    if (!confirm('ต้องการดึงรายชื่อพนักงานทั้งหมดจากระบบ Authentication มาลงตารางใหม่หรือไม่?'))
      return;

    setProfilesLoading(true);
    try {
      // ในทางปฏิบัติเราอาจจะเรียกผ่าน API Route เพื่อความปลอดภัย
      // แต่สำหรับการแก้ปัญหาเฉพาะหน้า เราจะใช้เครื่องมือ SQL ที่ให้ไปก่อนหน้า
      // หรือถ้ามีรายชื่อแล้วแต่สิทธิ์ไม่ขึ้น ให้ลอง Login ใหม่ครับ
      alert('ระบบจะทำการรีโหลดข้อมูลจาก Server อีกครั้ง...');
      await fetchProfiles();
    } finally {
      setProfilesLoading(false);
    }
  };

  const toggleRole = async (profileId: string, currentRole: 'admin' | 'staff') => {
    const newRole = currentRole === 'admin' ? 'staff' : 'admin';
    if (
      !confirm(
        `คุณแน่ใจหรือไม่ที่จะเปลี่ยนสิทธิ์เป็น ${newRole === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}?`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;

      // Refresh list
      await fetchProfiles();
      alert('อัปเดตสิทธิ์เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสิทธิ์');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ' });
      setPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (dayIndex: string, type: 'open' | 'close', value: string) => {
    setBusinessHours((prev) => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [type]: value,
      },
    }));
  };

  const handleSaveHours = async () => {
    setHoursSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'business_hours',
          value: businessHours,
          description: 'Opening and closing hours',
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      alert('บันทึกเวลาทำการเรียบร้อยแล้ว');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกเวลาทำการ');
      console.error(error);
    } finally {
      setHoursSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayDate) return;

    try {
      const datesToInsert = [];

      if (holidayEndDate && holidayEndDate > holidayDate) {
        // Range mode
        const start = new Date(holidayDate + 'T00:00:00');
        const end = new Date(holidayEndDate + 'T00:00:00');

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          datesToInsert.push({
            holiday_date: d.toISOString().split('T')[0],
            description: holidayDesc,
          });
        }
      } else {
        // Single day mode
        datesToInsert.push({ holiday_date: holidayDate, description: holidayDesc });
      }

      const { error } = await supabase.from('holidays').insert(datesToInsert);

      if (error) {
        if (error.code === '23505') alert('บางวันในกลุ่มนี้ถูกตั้งเป็นวันหยุดอยู่แล้ว');
        else alert('เกิดข้อผิดพลาด: ' + error.message);
        return;
      }

      alert('เพิ่มวันหยุดเรียบร้อย');
      setHolidayDate('');
      setHolidayEndDate('');
      setHolidayDesc('');
      // Refresh
      const { data } = await supabase
        .from('holidays')
        .select('*')
        .order('holiday_date', { ascending: true });
      if (data) setHolidays(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('ต้องการลบวันหยุดนี้ใช่หรือไม่?')) return;
    try {
      const { error } = await supabase.from('holidays').delete().eq('id', id);
      if (error) throw error;
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch (e) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  // 🆕 Staff Edit Modal State
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    full_name: '',
    position: '',
    staff_id: '',
  });

  const openEditStaffModal = (profile: any) => {
    setEditingStaff(profile);
    setStaffFormData({
      full_name: profile.full_name || '',
      position: profile.position || '',
      staff_id: profile.staff_id || '',
    });
    setIsStaffModalOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    setLoading(true);
    try {
      // Update auth metadata via API route (safer for admin operations on other users)
      // But since Supabase Client can't update other users easily, we'll try updating the 'profiles' table directly
      // However, our profiles table might not have these columns if they are only in auth metadata.
      // Assumption: We need to update user_metadata. This usually requires Service Role key on server side.

      // Let's use an API route for this to be secure and correct
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingStaff.id,
          data: staffFormData,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update');
      }

      alert('อัปเดตข้อมูลพนักงานเรียบร้อย');
      setIsStaffModalOpen(false);
      fetchProfiles(); // Refresh list
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ตั้งค่าระบบ</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Business Hours Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">เวลาทำการ</h2>
          </div>

          {hoursLoading ? (
            <div className="py-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : (
            <div className="space-y-4 flex-1">
              {DAYS.map((day, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                >
                  <span className="font-bold text-gray-700 w-24">{day}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={businessHours[String(index)]?.open || '00:00'}
                      onChange={(e) => handleHoursChange(String(index), 'open', e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded font-medium text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500">น.</span>
                  </div>
                  <span className="text-gray-400 font-medium">-</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={businessHours[String(index)]?.close || '00:00'}
                      onChange={(e) => handleHoursChange(String(index), 'close', e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded font-medium text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500">น.</span>
                  </div>
                </div>
              ))}

              <button
                onClick={handleSaveHours}
                disabled={hoursSaving}
                className="w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-70 flex justify-center items-center"
              >
                {hoursSaving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึกเวลาทำการ'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Staff Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">จัดการพนักงาน ({profiles.length})</h2>
            </div>
            <button
              onClick={fetchProfiles}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="รีเฟรชรายชื่อ"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
            </button>
          </div>

          <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 p-4 mb-6 overflow-y-auto max-h-[400px]">
            {profilesLoading ? (
              <div className="py-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
            ) : profiles.length === 0 ? (
              <div className="py-12 text-center">
                <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">ไม่พบรายชื่อพนักงาน</p>
                <p className="text-xs text-gray-400 mt-2">
                  กรุณารัน SQL เพื่อ Sync ข้อมูล หรือรีเฟรชหน้าจอ
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {profiles.map((p) => (
                  <li
                    key={p.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {p.full_name || 'ไม่ระบุชื่อ'}
                          </span>
                          {p.staff_id && (
                            <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                              {p.staff_id}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.email}</div>
                        <div className="text-xs font-medium text-indigo-600 mt-1">
                          {p.position || 'ยังไม่ระบุตำแหน่ง'}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          p.role === 'admin'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {p.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => openEditStaffModal(p)}
                        className="flex-1 py-1.5 px-3 rounded-md border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                        แก้ไขข้อมูล
                      </button>
                      <button
                        onClick={() => toggleRole(p.id, p.role)}
                        className={`flex-1 py-1.5 px-3 rounded-md border text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                          p.role === 'admin'
                            ? 'border-gray-300 text-gray-500 hover:bg-gray-50'
                            : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        {p.role === 'admin' ? 'ลดระดับ' : 'ตั้งเป็น Admin'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-gray-400 italic text-center">
            * ผู้ดูแลระบบสามารถแก้ไขรายละเอียดของพนักงานทุกคนได้จากตรงนี้
          </p>
        </div>

        {/* Table Management Link */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col h-full lg:col-span-2">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2 bg-green-50 rounded-lg">
              <TableCellsIcon className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">ข้อมูลโต๊ะ ({tables.length})</h2>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-6">
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tables.map((t) => (
                <li
                  key={t.id}
                  className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="overflow-hidden">
                    <span className="font-bold text-gray-900 block truncate">{t.name}</span>
                    <span className="text-xs text-gray-500 truncate block">
                      {t.description || '-'}
                    </span>
                  </div>
                  <span className="flex-shrink-0 ml-3 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                    {t.capacity} ที่นั่ง
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/admin/tables"
            className="w-full py-3 px-4 bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 font-bold rounded-lg transition-colors text-center"
          >
            ไปหน้าจัดการข้อมูลโต๊ะ
          </Link>
        </div>

        {/* 🆕 Holiday/Closing Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col h-full lg:col-span-2">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2 bg-red-50 rounded-lg">
              <CalendarDaysIcon className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">วันหยุดร้าน / วันปิดทำการพิเศษ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-6 bg-red-50 rounded-2xl border border-red-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-red-800 uppercase pl-1">
                เริ่มตั้งแต่วันที่
              </label>
              <input
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:ring-4 focus:ring-red-500/10 focus:border-red-500 font-bold text-gray-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-red-800 uppercase pl-1">
                ถึงวันที่ (ไม่บังคับ)
              </label>
              <input
                type="date"
                value={holidayEndDate}
                min={holidayDate}
                onChange={(e) => setHolidayEndDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:ring-4 focus:ring-red-500/10 focus:border-red-500 font-bold text-gray-900"
              />
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-bold text-red-800 uppercase pl-1">หมายเหตุ</label>
              <input
                type="text"
                value={holidayDesc}
                placeholder="เหตุผล"
                onChange={(e) => setHolidayDesc(e.target.value)}
                className="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:ring-4 focus:ring-red-500/10 focus:border-red-500 font-bold text-gray-900"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddHoliday}
                className="w-full h-[42px] bg-red-600 text-white font-black rounded-lg uppercase tracking-widest hover:bg-red-700 shadow-lg active:scale-95 transition-all"
              >
                เพิ่มวันหยุด
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 max-h-[300px] overflow-y-auto">
            {holidaysLoading ? (
              <p className="text-center py-4">กำลังโหลด...</p>
            ) : holidays.length === 0 ? (
              <p className="text-center py-8 text-gray-400 font-medium italic">
                ยังไม่มีวันหยุดพิเศษที่ตั้งไว้
              </p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                      วันที่
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                      เหตุผล
                    </th>
                    <th className="px-4 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {holidays.map((h) => (
                    <tr key={h.id}>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        {h.holiday_date}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {h.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Section (Collapsed/Secondary) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
          ความปลอดภัย
        </h2>
        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              เปลี่ยนรหัสผ่านผู้ดูแลระบบ
            </label>
            <div className="flex gap-4">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium placeholder-gray-400"
                placeholder="รหัสผ่านใหม่"
              />
              <button
                type="submit"
                disabled={loading || !password}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? '...' : 'เปลี่ยน'}
              </button>
            </div>
          </div>
          {message.text && (
            <div
              className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
            >
              {message.text}
            </div>
          )}
        </form>
      </div>
      {/* Modal for editing staff details */}
      <EditStaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSave={handleUpdateStaff}
        staffFormData={staffFormData}
        setStaffFormData={setStaffFormData}
      />
    </div>
  );
}

// 🆕 EditStaffModal Component (Moved outside to prevent re-renders)
const EditStaffModal = ({
  isOpen,
  onClose,
  onSave,
  staffFormData,
  setStaffFormData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  staffFormData: any;
  setStaffFormData: React.Dispatch<React.SetStateAction<any>>;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">แก้ไขข้อมูลพนักงาน</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อ-นามสกุล</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
              value={staffFormData.full_name}
              onChange={(e) =>
                setStaffFormData((prev: any) => ({ ...prev, full_name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ตำแหน่ง</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
              value={staffFormData.position}
              onChange={(e) =>
                setStaffFormData((prev: any) => ({ ...prev, position: e.target.value }))
              }
            >
              <option value="">-- เลือกตำแหน่ง --</option>
              <option value="ผู้จัดการร้าน (Manager)">ผู้จัดการร้าน (Manager)</option>
              <option value="พนักงานบริการ (Server)">พนักงานบริการ (Server)</option>
              <option value="พนักงานต้อนรับ (Host)">พนักงานต้อนรับ (Host)</option>
              <option value="แคชเชียร์ (Cashier)">แคชเชียร์ (Cashier)</option>
              <option value="พ่อครัว (Chef)">พ่อครัว (Chef)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">รหัสพนักงาน</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium font-mono"
                value={staffFormData.staff_id}
                onChange={(e) =>
                  setStaffFormData((prev: any) => ({ ...prev, staff_id: e.target.value }))
                }
                placeholder="เช่น ST-001"
              />
              <button
                type="button"
                onClick={() => {
                  const randomId = 'ST-' + Math.floor(1000 + Math.random() * 9000);
                  setStaffFormData((prev: any) => ({ ...prev, staff_id: randomId }));
                }}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-200"
                title="สุ่มรหัสพนักงาน"
              >
                🎲
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
          >
            ยกเลิก
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};
