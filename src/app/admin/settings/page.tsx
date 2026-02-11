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
import { useTranslation } from '@/lib/i18n';
import { useAdminLocale } from '@/app/admin/components/LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import PasswordChangeModal from './PasswordChangeModal';


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

const DAYS_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// AdminSettingsPage: หน้าตั้งค่าระบบ (จัดการเวลาทำการ, พนักงาน, วันหยุด)
export default function AdminSettingsPage() {
  const locale = useAdminLocale();
  const { adminTheme } = useAdminTheme();
  const { t } = useTranslation(locale);
  const DAYS = locale === 'th' ? DAYS_TH : DAYS_EN;
  const [loading, setLoading] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(true);

  // Business Hours State
  // สถานะเวลาทำการ
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [hoursLoading, setHoursLoading] = useState(true);
  const [hoursSaving, setHoursSaving] = useState(false);

  // Tables State
  // สถานะข้อมูลโต๊ะ
  const [tables, setTables] = useState<Table[]>([]);

  // Staff Members State
  // สถานะข้อมูลพนักงาน
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [staffSearch, setStaffSearch] = useState('');

  // Holidays State
  // สถานะวันหยุด
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayEndDate, setHolidayEndDate] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');
  const [holidaysLoading, setHolidaysLoading] = useState(true);

  const supabase = createClientSupabaseClient();

  // 🔐 Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);



  // Function to fetch staff profiles
  // ฟังก์ชันดึงข้อมูลพนักงานจาก Supabase
  const fetchProfiles = async () => {
    setProfilesLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true });

      if (error) {
        console.error('Supabase Error:', error);
        alert((locale === 'th' ? 'ไม่สามารถดึงข้อมูลพนักงานได้: ' : 'Failed to fetch staff: ') + (error.message || JSON.stringify(error)));
        return;
      }
      setProfiles(data || []);
    } catch (error: any) {
      console.error('System Error:', error);
      alert((locale === 'th' ? 'เกิดข้อผิดพลาดในการโหลดข้อมูล: ' : 'Error loading data: ') + (error.message || 'Unknown error'));
    } finally {
      setProfilesLoading(false);
    }
  };

  // Initial data loading
  // โหลดข้อมูลเริ่มต้นเมื่อเปิดหน้าเว็บ
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
          setBusinessHours({ ...DEFAULT_HOURS, ...settingsJson.data.value });
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

  // Sync profiles from Auth to DB
  // ซิงค์ข้อมูลพนักงานจากระบบ Auth ลง DB
  const syncProfiles = async () => {
    if (!confirm(locale === 'th' ? 'ต้องการดึงรายชื่อพนักงานทั้งหมดจากระบบ Authentication มาลงตารางใหม่หรือไม่?' : 'Do you want to sync all staff from Authentication system?'))
      return;

    setProfilesLoading(true);
    try {
      // ในทางปฏิบัติเราอาจจะเรียกผ่าน API Route เพื่อความปลอดภัย
      // แต่สำหรับการแก้ปัญหาเฉพาะหน้า เราจะใช้เครื่องมือ SQL ที่ให้ไปก่อนหน้า
      // หรือถ้ามีรายชื่อแล้วแต่สิทธิ์ไม่ขึ้น ให้ลอง Login ใหม่ครับ
      alert(locale === 'th' ? 'ระบบจะทำการรีโหลดข้อมูลจาก Server อีกครั้ง...' : 'Reloading data from server...');
      await fetchProfiles();
    } finally {
      setProfilesLoading(false);
    }
  };

  // Toggle staff role (Admin <-> Staff)
  // เปลี่ยนสิทธิ์พนักงาน (Admin <-> Staff)
  const toggleRole = async (profileId: string, currentRole: 'admin' | 'staff') => {
    const newRole = currentRole === 'admin' ? 'staff' : 'admin';
    const roleLabel = newRole === 'admin' ? (locale === 'th' ? 'ผู้ดูแลระบบ' : 'Administrator') : (locale === 'th' ? 'พนักงาน' : 'Staff');
    if (
      !confirm(
        locale === 'th' ? `คุณแน่ใจหรือไม่ที่จะเปลี่ยนสิทธิ์เป็น ${roleLabel}?` : `Are you sure you want to change role to ${roleLabel}?`
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
      alert(locale === 'th' ? 'อัปเดตสิทธิ์เรียบร้อยแล้ว' : 'Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      alert(locale === 'th' ? 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์' : 'Error updating role');
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

  // Save business hours settings
  // บันทึกการตั้งค่าเวลาทำการ
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

      alert(locale === 'th' ? 'บันทึกเวลาทำการเรียบร้อยแล้ว' : 'Business hours saved successfully');
    } catch (error) {
      alert(locale === 'th' ? 'เกิดข้อผิดพลาดในการบันทึกเวลาทำการ' : 'Error saving business hours');
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
        if (error.code === '23505') alert(locale === 'th' ? 'บางวันในกลุ่มนี้ถูกตั้งเป็นวันหยุดอยู่แล้ว' : 'Some dates in this range are already holidays');
        else alert((locale === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + error.message);
        return;
      }

      alert(locale === 'th' ? 'เพิ่มวันหยุดเรียบร้อย' : 'Holiday added successfully');
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

  const handleDeleteHoliday = async (id: string, groupKey?: string) => {
    const isAll = id === 'all';
    const confirmMsg = isAll
      ? (locale === 'th' ? 'ต้องการล้างข้อมูลวันหยุดทั้งหมดใช่หรือไม่?' : 'Are you sure you want to clear all holidays?')
      : (locale === 'th' ? 'ต้องการลบกลุ่มวันหยุดนี้ใช่หรือไม่?' : 'Are you sure you want to delete this holiday group?');

    if (!confirm(confirmMsg)) return;

    try {
      let query = supabase.from('holidays').delete();

      if (isAll) {
        // Delete everything
        const { error } = await query.neq('id', '00000000-0000-0000-0000-000000000000'); // Fake condition to delete all
        if (error) throw error;
        setHolidays([]);
      } else if (groupKey) {
        // Delete by description (our group key)
        const { error } = await query.eq('description', groupKey);
        if (error) throw error;
        setHolidays((prev) => prev.filter((h) => h.description !== groupKey));
      } else {
        // Standard delete by ID
        const { error } = await query.eq('id', id);
        if (error) throw error;
        setHolidays((prev) => prev.filter((h) => h.id !== id));
      }

      // Refresh to be sure
      const { data } = await supabase.from('holidays').select('*').order('holiday_date', { ascending: true });
      if (data) setHolidays(data);
    } catch (e) {
      alert(locale === 'th' ? 'เกิดข้อผิดพลาดในการลบ' : 'An error occurred during deletion');
    }
  };

  // Helper function to group consecutive holiday dates
  const getGroupedHolidays = () => {
    if (holidays.length === 0) return [];

    const sorted = [...holidays].sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
    const groups: any[] = [];

    sorted.forEach((h, i) => {
      const prev = groups[groups.length - 1];
      const currDate = new Date(h.holiday_date);

      if (prev && prev.description === h.description) {
        const lastDate = new Date(prev.endDate);
        const diffDays = (currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);

        if (diffDays === 1) {
          prev.endDate = h.holiday_date;
          prev.count += 1;
          prev.ids.push(h.id);
          return;
        }
      }

      groups.push({
        startDate: h.holiday_date,
        endDate: h.holiday_date,
        description: h.description,
        count: 1,
        ids: [h.id]
      });
    });

    return groups;
  };

  // Helper to group tables by capacity
  const groupedTables = tables.reduce((acc: any, table) => {
    const cap = table.capacity;
    if (!acc[cap]) acc[cap] = [];
    acc[cap].push(table);
    return acc;
  }, {});

  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);

  // 🆕 Staff Edit Modal State
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    id: '',
    email: '',
    password: '',
    full_name: '',
    position: '',
    staff_id: '',
    role: 'staff' as 'admin' | 'staff',
  });

  // 🆕 Add Staff Modal State
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffFormData, setNewStaffFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    position: '',
    staff_id: '',
    role: 'staff' as 'admin' | 'staff',
  });

  const openEditStaffModal = (profile: any) => {
    setEditingStaff(profile);
    setStaffFormData({
      id: profile.id,
      email: profile.email || '',
      password: '', // Password is not sent from server
      full_name: profile.full_name || '',
      position: profile.position || '',
      staff_id: profile.staff_id || '',
      role: profile.role || 'staff',
    });
    setIsStaffModalOpen(true);
  };

  const openAddStaffModal = () => {
    setNewStaffFormData({
      email: '',
      password: '',
      full_name: '',
      position: '',
      staff_id: '',
      role: 'staff',
    });
    setIsAddStaffModalOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    setLoading(true);
    try {
      const response = await fetch('/api/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffFormData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update');
      }

      alert(locale === 'th' ? 'อัปเดตข้อมูลพนักงานเรียบร้อย' : 'Staff information updated successfully');
      setIsStaffModalOpen(false);

      // 🔄 Refresh session if password was changed (prevents logout)
      if (staffFormData.password) {
        try {
          await supabase.auth.refreshSession();
        } catch (refreshError) {
          console.warn('Session refresh failed:', refreshError);
        }
      }

      fetchProfiles(); // Refresh list
    } catch (error: any) {
      alert((locale === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm(locale === 'th' ? 'คุณแน่ใจหรือไม่ที่จะลบพนักงานคนนี้? การกระทำนี้ไม่สามารถย้อนกลับได้' : 'Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/staff?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete');
      }

      alert(locale === 'th' ? 'ลบพนักงานเรียบร้อยแล้ว' : 'Staff member deleted successfully');
      setIsStaffModalOpen(false);
      fetchProfiles(); // Refresh list
    } catch (error: any) {
      alert((locale === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffFormData.email || !newStaffFormData.password) {
      alert(locale === 'th' ? 'กรุณากรอกอีเมลและรหัสผ่าน' : 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaffFormData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create staff');
      }

      alert(locale === 'th' ? 'เพิ่มพนักงานเรียบร้อยแล้ว' : 'Staff member added successfully');
      setIsAddStaffModalOpen(false);
      fetchProfiles(); // Refresh list
    } catch (error: any) {
      alert((locale === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <h1 className={`text-3xl font-extrabold tracking-tight ${adminTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('admin.settings.title')}</h1>

      {/* 🔐 Password Change Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {locale === 'th' ? 'เปลี่ยนรหัสผ่านของคุณเพื่อความปลอดภัย' : 'Change your password for security'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
            {locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* 🔐 Password Change Modal Component */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        locale={locale}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Business Hours Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[700px] flex flex-col">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{t('admin.settings.hours.title')}</h2>
          </div>

          {hoursLoading ? (
            <div className="py-10 text-center text-gray-500 font-bold">{t('common.loading')}</div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {DAYS.map((day, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${index === 5 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}
                >
                  <span className={`text-sm font-bold min-w-[80px] ${index === 5 ? 'text-red-700' : 'text-gray-900'}`}>
                    {day}
                  </span>

                  {index === 5 ? (
                    <span className="text-xs font-bold text-red-500 uppercase">
                      {locale === 'th' ? 'หยุดประจำสัปดาห์' : 'Weekly Holiday'}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={businessHours[String(index)]?.open || '00:00'}
                        onChange={(e) => handleHoursChange(String(index), 'open', e.target.value)}
                        className="px-2 py-1.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <span className="text-gray-400 text-xs font-bold">-</span>
                      <input
                        type="time"
                        value={businessHours[String(index)]?.close || '00:00'}
                        onChange={(e) => handleHoursChange(String(index), 'close', e.target.value)}
                        className="px-2 py-1.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={handleSaveHours}
                disabled={hoursSaving}
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {hoursSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  t('admin.settings.hours.save')
                )}
              </button>
            </div>
          )}
        </div>

        {/* Staff Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[700px] flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <UserGroupIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{t('admin.settings.staff.title').replace('(2)', '').trim()} ({profiles.length})</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={openAddStaffModal}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm"
                title={locale === 'th' ? 'เพิ่มพนักงานใหม่' : 'Add new staff'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
              </button>
              <button
                onClick={fetchProfiles}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title={locale === 'th' ? 'รีเฟรชรายชื่อ' : 'Refresh list'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="mb-3">
            <input
              type="text"
              placeholder={locale === 'th' ? '🔍 ค้นหาพนักงาน...' : '🔍 Search staff...'}
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-100 p-3 flex-1 overflow-y-auto">
            {profilesLoading ? (
              <div className="py-6 text-center text-gray-500">{t('common.loading')}</div>
            ) : profiles.length === 0 ? (
              <div className="py-8 text-center">
                <UserGroupIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">{locale === 'th' ? 'ไม่พบพนักงาน' : 'No staff found'}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {profiles
                  .filter((p) => {
                    if (!staffSearch) return true;
                    const search = staffSearch.toLowerCase();
                    return (
                      (p.full_name?.toLowerCase() || '').includes(search) ||
                      (p.email?.toLowerCase() || '').includes(search) ||
                      (p.position?.toLowerCase() || '').includes(search) ||
                      (p.staff_id?.toLowerCase() || '').includes(search)
                    );
                  })
                  .map((p) => (
                    <li
                      key={p.id}
                      className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              {p.full_name || (locale === 'th' ? 'ไม่ระบุชื่อ' : 'N/A')}
                            </span>
                            {p.staff_id && (
                              <span className="text-[10px] font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                {p.staff_id}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{p.email}</div>
                          <div className="text-xs font-medium text-indigo-600 mt-0.5">
                            {p.position || (locale === 'th' ? 'ยังไม่ระบุตำแหน่ง' : 'Position not set')}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${p.role === 'admin'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                          {p.role === 'admin' ? t('admin.login.role.admin') : t('admin.login.role.staff')}
                        </span>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => openEditStaffModal(p)}
                          className="flex-1 py-1.5 px-2 rounded border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                        >
                          <PencilIcon className="w-3 h-3" />
                          {t('admin.settings.staff.edit')}
                        </button>
                        <button
                          onClick={() => toggleRole(p.id, p.role)}
                          className={`flex-1 py-1.5 px-2 rounded border text-xs font-bold transition-colors flex items-center justify-center gap-1 ${p.role === 'admin'
                            ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                            }`}
                        >
                          <ShieldCheckIcon className="w-3 h-3" />
                          {p.role === 'admin' ? (locale === 'th' ? 'ลดระดับ' : 'Demote') : t('admin.settings.staff.promote')}
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        {/* Table Management Section - Compact Version */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full lg:col-span-1">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-lg">
                <TableCellsIcon className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{locale === 'th' ? 'ข้อมูลโต๊ะ' : 'Tables'}</h2>
            </div>
            <Link
              href="/admin/floor-plan"
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title={locale === 'th' ? 'ไปหน้าผังร้าน' : 'Go to Floor Plan'}
            >
              <PencilIcon className="w-5 h-5" />
            </Link>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {Object.keys(groupedTables).sort((a, b) => Number(a) - Number(b)).map((capacity) => (
              <div key={capacity} className="bg-gray-50/50 rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-gray-400">
                    {locale === 'th' ? `${capacity} ที่นั่ง` : `${capacity} Seats`}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100">{groupedTables[capacity].length}</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-2">
                  {groupedTables[capacity].map((tableItem: any) => (
                    <div
                      key={tableItem.id}
                      className="bg-white px-1 py-2 rounded-lg border border-gray-200 shadow-sm text-center"
                    >
                      <span className="font-extrabold text-gray-900 text-xs block truncate">{tableItem.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-2">
              <p className="text-[10px] text-gray-400 text-center font-medium italic">
                {locale === 'th' ? `* รวมทั้งหมด ${tables.length} โต๊ะ (${totalSeats} ที่นั่ง)` : `* Total ${tables.length} tables (${totalSeats} seats)`}
              </p>
            </div>
          </div>
        </div>

        {/* Holiday/Closing Section - Compact Version */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full lg:col-span-1">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-50 rounded-lg">
                <CalendarDaysIcon className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{locale === 'th' ? 'วันหยุด' : 'Holidays'}</h2>
            </div>
            {holidays.length > 0 && (
              <button
                onClick={() => handleDeleteHoliday('all')}
                className="text-[10px] font-black text-red-600 uppercase hover:underline"
              >
                {locale === 'th' ? 'ล้างทั้งหมด' : 'Clear All'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-100 text-gray-700 shadow-inner">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-red-400 ml-1">
                  {locale === 'th' ? 'วันที่เริ่ม' : 'Start Date'}
                </label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => {
                    setHolidayDate(e.target.value);
                    if (!holidayEndDate || holidayEndDate < e.target.value) setHolidayEndDate(e.target.value);
                  }}
                  className="px-4 py-3 bg-white border border-red-100 rounded-xl text-base font-bold w-full focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-red-400 ml-1">
                  {locale === 'th' ? 'วันที่สิ้นสุด' : 'End Date'}
                </label>
                <input
                  type="date"
                  value={holidayEndDate}
                  min={holidayDate}
                  onChange={(e) => setHolidayEndDate(e.target.value)}
                  className="px-4 py-3 bg-white border border-red-100 rounded-xl text-base font-bold w-full focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-red-400 ml-1">
                  {locale === 'th' ? 'สาเหตุวันหยุด' : 'Holiday Reason'}
                </label>
                <input
                  type="text"
                  value={holidayDesc}
                  placeholder={locale === 'th' ? "เช่น วันหยุดสงกรานต์, วันหยุดเทศกาล..." : "e.g. Songkran Festival..."}
                  onChange={(e) => setHolidayDesc(e.target.value)}
                  className="px-4 py-3 bg-white border border-red-100 rounded-xl text-base font-medium w-full focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-sm"
                />
              </div>
              <button
                onClick={handleAddHoliday}
                className="col-span-2 mt-2 py-4 bg-red-600 text-white font-black rounded-xl text-sm uppercase tracking-[0.2em] hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                <CalendarDaysIcon className="w-5 h-5" />
                {locale === 'th' ? 'ยืนยันเพิ่มวันหยุด' : 'Confirm Add Holiday'}
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {getGroupedHolidays().map((group, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between hover:border-red-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 text-red-700 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black">{group.count}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {group.startDate === group.endDate
                          ? group.startDate
                          : `${group.startDate} ถึง ${group.endDate}`}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">{group.description || (locale === 'th' ? 'ไม่ระบุสาเหตุ' : 'No reason')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(group.ids[0], group.description)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title={locale === 'th' ? 'ลบวันหยุดนี้' : 'Delete this holiday'}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {getGroupedHolidays().length === 0 && (
                <p className="text-center py-6 text-gray-400 text-sm">
                  {locale === 'th' ? 'ยังไม่มีวันหยุดที่ตั้งไว้' : 'No holidays set'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Modal for editing staff details */}
      <EditStaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSave={handleUpdateStaff}
        onDelete={handleDeleteStaff}
        staffFormData={staffFormData}
        setStaffFormData={setStaffFormData}
        isLoading={loading}
      />
      {/* Modal for adding new staff */}
      <AddStaffModal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
        onSave={handleAddStaff}
        formData={newStaffFormData}
        setFormData={setNewStaffFormData}
        isLoading={loading}
      />
    </div >
  );
}

// 🆕 EditStaffModal Component (Moved outside to prevent re-renders)
const EditStaffModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  staffFormData,
  setStaffFormData,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  staffFormData: any;
  setStaffFormData: React.Dispatch<React.SetStateAction<any>>;
  isLoading: boolean;
}) => {
  const locale = useAdminLocale();
  const { t } = useTranslation(locale);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto transition-all ${isLoading ? 'opacity-75 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t('admin.settings.staff.edit')}</h3>
          {isLoading && (
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {locale === 'th' ? 'กำลังอัปเดต...' : 'Updating...'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{locale === 'th' ? 'ข้อมูลส่วนตัว' : 'Personal Info'}</h4>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('form.name')}</label>
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
              <label className="block text-sm font-bold text-gray-700 mb-1">{locale === 'th' ? 'อีเมล' : 'Email'}</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
                value={staffFormData.email}
                onChange={(e) =>
                  setStaffFormData((prev: any) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {locale === 'th' ? 'รหัสผ่านใหม่ (ปล่อยว่างถ้าไม่ต้องการเปลี่ยน)' : 'New Password (Leave blank to keep current)'}
              </label>
              <input
                type="password"
                placeholder="******"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
                value={staffFormData.password}
                onChange={(e) =>
                  setStaffFormData((prev: any) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{locale === 'th' ? 'ข้อมูลพนักงาน' : 'Employment Info'}</h4>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{locale === 'th' ? 'ตำแหน่ง' : 'Position'}</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
                value={staffFormData.position}
                onChange={(e) =>
                  setStaffFormData((prev: any) => ({ ...prev, position: e.target.value }))
                }
              >
                <option value="">-- {locale === 'th' ? 'เลือกตำแหน่ง' : 'Select Position'} --</option>
                <option value="ผู้จัดการร้าน (Manager)">ผู้จัดการร้าน (Manager)</option>
                <option value="พนักงานบริการ (Server)">พนักงานบริการ (Server)</option>
                <option value="พนักงานต้อนรับ (Host)">พนักงานต้อนรับ (Host)</option>
                <option value="แคชเชียร์ (Cashier)">แคชเชียร์ (Cashier)</option>
                <option value="พ่อครัว (Chef)">พ่อครัว (Chef)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{locale === 'th' ? 'รหัสพนักงาน' : 'Staff ID'}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium font-mono"
                  value={staffFormData.staff_id}
                  onChange={(e) =>
                    setStaffFormData((prev: any) => ({ ...prev, staff_id: e.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={() => {
                    const randomId = 'ST-' + Math.floor(1000 + Math.random() * 9000);
                    setStaffFormData((prev: any) => ({ ...prev, staff_id: randomId }));
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-200"
                >
                  🎲
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{locale === 'th' ? 'สิทธิ์การใช้งาน' : 'Role'}</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
                value={staffFormData.role}
                onChange={(e) =>
                  setStaffFormData((prev: any) => ({ ...prev, role: e.target.value }))
                }
              >
                <option value="staff">{t('admin.login.role.staff')}</option>
                <option value="admin">{t('admin.login.role.admin')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
          <button
            onClick={() => onDelete(staffFormData.id)}
            disabled={isLoading}
            className="px-6 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <TrashIcon className="w-5 h-5" />
            {locale === 'th' ? 'ลบพนักงาน' : 'Delete Staff'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onSave}
              disabled={isLoading}
              className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:bg-indigo-400 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {locale === 'th' ? 'กำลังบันทึก' : 'Saving...'}
                </>
              ) : (
                t('common.save')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🆕 AddStaffModal Component for creating new staff
const AddStaffModal = ({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isLoading: boolean;
}) => {
  const locale = useAdminLocale();
  const { t } = useTranslation(locale);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto transition-all ${isLoading ? 'opacity-75 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">
            {locale === 'th' ? 'เพิ่มพนักงานใหม่' : 'Add New Staff Member'}
          </h3>
          {isLoading && (
            <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {locale === 'th' ? 'กำลังบันทึก...' : 'Saving...'}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {locale === 'th' ? 'อีเมล' : 'Email'} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 font-medium"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, email: e.target.value }))
              }
              placeholder={locale === 'th' ? 'staff@example.com' : 'staff@example.com'}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {locale === 'th' ? 'รหัสผ่าน' : 'Password'} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 font-medium"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, password: e.target.value }))
              }
              placeholder={locale === 'th' ? 'อย่างน้อย 6 ตัวอักษร' : 'At least 6 characters'}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('form.name')}</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 font-medium"
              value={formData.full_name}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, full_name: e.target.value }))
              }
              placeholder={locale === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {locale === 'th' ? 'ตำแหน่ง' : 'Position'}
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 font-medium"
              value={formData.position}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, position: e.target.value }))
              }
            >
              <option value="">-- {locale === 'th' ? 'เลือกตำแหน่ง' : 'Select Position'} --</option>
              <option value="ผู้จัดการร้าน (Manager)">ผู้จัดการร้าน (Manager)</option>
              <option value="พนักงานบริการ (Server)">พนักงานบริการ (Server)</option>
              <option value="พนักงานต้อนรับ (Host)">พนักงานต้อนรับ (Host)</option>
              <option value="แคชเชียร์ (Cashier)">แคชเชียร์ (Cashier)</option>
              <option value="พ่อครัว (Chef)">พ่อครัว (Chef)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {locale === 'th' ? 'รหัสพนักงาน' : 'Staff ID'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 font-medium font-mono"
                value={formData.staff_id}
                onChange={(e) =>
                  setFormData((prev: any) => ({ ...prev, staff_id: e.target.value }))
                }
                placeholder={locale === 'th' ? 'เช่น ST-001' : 'e.g., ST-001'}
              />
              <button
                type="button"
                onClick={() => {
                  const randomId = 'ST-' + Math.floor(1000 + Math.random() * 9000);
                  setFormData((prev: any) => ({ ...prev, staff_id: randomId }));
                }}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-200"
                title={locale === 'th' ? 'สุ่มรหัสพนักงาน' : 'Generate Staff ID'}
              >
                🎲
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {locale === 'th' ? 'สิทธิ์การใช้งาน' : 'Role'}
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 font-medium"
              value={formData.role}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, role: e.target.value }))
              }
            >
              <option value="staff">{t('admin.login.role.staff')}</option>
              <option value="admin">{t('admin.login.role.admin')}</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-10">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onSave}
            disabled={isLoading}
            className="px-8 py-3 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 active:scale-95 transition-all disabled:bg-purple-400 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {locale === 'th' ? 'กำลังบันทึก' : 'Saving...'}
              </>
            ) : (
              locale === 'th' ? 'เพิ่มพนักงาน' : 'Add Staff'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
