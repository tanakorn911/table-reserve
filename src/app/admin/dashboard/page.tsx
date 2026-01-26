'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  TableCellsIcon,
  ArrowRightIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useAdminLocale } from '@/app/admin/components/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';

interface Reservation {
  id: string;
  guest_name: string;
  guest_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  table_number?: number;
  table_name?: string;
  created_at: string;
}

export default function DashboardPage() {
  const locale = useAdminLocale();
  const { t } = useTranslation(locale);

  const [stats, setStats] = useState({
    todayTotal: 0,
    todayPending: 0,
    todayConfirmed: 0,
    todayPax: 0,
    bookedTables: 0,
    totalTables: 0,
  });
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Fetch ALL reservations (today and future)
      const allRes = await fetch('/api/reservations');
      const { data: allData } = await allRes.json();

      // Filter for today and future reservations
      const upcomingData = (allData || []).filter((r: Reservation) =>
        r.reservation_date >= todayStr
      );

      // Fetch tables count
      const tablesRes = await fetch('/api/tables');
      const { data: tablesData } = await tablesRes.json();

      if (upcomingData && upcomingData.length > 0) {
        const total = upcomingData.length;
        const pending = upcomingData.filter((r: Reservation) => r.status === 'pending').length;
        const confirmed = upcomingData.filter((r: Reservation) => r.status === 'confirmed').length;
        const pax = upcomingData
          .filter((r: Reservation) => r.status !== 'cancelled')
          .reduce((sum: number, r: Reservation) => sum + (r.party_size || 0), 0);
        const bookedTables = new Set(
          upcomingData
            .filter((r: Reservation) => r.status !== 'cancelled' && r.table_number)
            .map((r: Reservation) => r.table_number)
        ).size;

        setStats({
          todayTotal: total,
          todayPending: pending,
          todayConfirmed: confirmed,
          todayPax: pax,
          bookedTables: bookedTables,
          totalTables: tablesData?.length || 0,
        });

        // Get recent reservations (latest 5)
        const sorted = [...upcomingData]
          .sort((a: Reservation, b: Reservation) =>
            new Date(a.reservation_date + 'T' + a.reservation_time).getTime() - new Date(b.reservation_date + 'T' + b.reservation_time).getTime()
          );
        setAllReservations(sorted);
        setRecentReservations(sorted.slice(0, 5));
      } else {
        setStats({
          todayTotal: 0,
          todayPending: 0,
          todayConfirmed: 0,
          todayPax: 0,
          bookedTables: 0,
          totalTables: tablesData?.length || 0,
        });
        setAllReservations([]);
        setRecentReservations([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConfirm = async (id: string) => {
    setConfirming(id);
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error confirming:', error);
    } finally {
      setConfirming(null);
    }
  };

  const handleExportCSV = () => {
    if (allReservations.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const headers = ['ID', 'Guest Name', 'Phone', 'Party Size', 'Date', 'Time', 'Status', 'Table'];
    const rows = allReservations.map(r => [
      r.id,
      r.guest_name,
      r.guest_phone,
      r.party_size,
      r.reservation_date,
      r.reservation_time,
      r.status,
      r.table_name || '-'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reservations_${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearDay = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const confirmMsg = locale === 'th'
      ? `ยืนยันการเคลียร์รายการจองวันที่ ${todayStr}?\n\n⚠️ แนะนำให้ Export CSV ก่อนลบ!`
      : `Confirm clearing reservations for ${todayStr}?\n\n⚠️ Recommended to Export CSV first!`;

    if (!confirm(confirmMsg)) return;

    setClearing(true);
    try {
      // Delete all reservations for today
      for (const r of allReservations) {
        await fetch(`/api/reservations/${r.id}`, { method: 'DELETE' });
      }
      await fetchDashboardData();
    } catch (error) {
      console.error('Error clearing:', error);
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('admin.dashboard.title')}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date().toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={allReservations.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{locale === 'th' ? 'Export CSV' : 'Export CSV'}</span>
          </button>
          <button
            onClick={handleClearDay}
            disabled={clearing || allReservations.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrashIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{clearing ? '...' : (locale === 'th' ? 'เคลียร์วันนี้' : 'Clear Today')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Bookings */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">{locale === 'th' ? 'การจองวันนี้' : 'Today\'s Bookings'}</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{stats.todayTotal}</p>
        </div>

        {/* Pending */}
        <div className={`bg-white rounded-xl p-5 border ${stats.todayPending > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${stats.todayPending > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <ClockIcon className={`w-5 h-5 ${stats.todayPending > 0 ? 'text-yellow-600' : 'text-gray-500'}`} />
            </div>
            {stats.todayPending > 0 && (
              <span className="text-xs font-bold text-yellow-700 bg-yellow-200 px-2 py-0.5 rounded-full animate-pulse">
                {locale === 'th' ? 'ต้องดำเนินการ' : 'Action needed'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-medium">{locale === 'th' ? 'รอยืนยัน' : 'Pending'}</p>
          <p className={`text-3xl font-black mt-1 ${stats.todayPending > 0 ? 'text-yellow-700' : 'text-gray-900'}`}>{stats.todayPending}</p>
        </div>

        {/* Expected Guests */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <UsersIcon className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">{locale === 'th' ? 'ลูกค้าที่จะมา' : 'Expected Guests'}</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{stats.todayPax}</p>
          <p className="text-xs text-gray-400 mt-1">{locale === 'th' ? 'คน (ยืนยันแล้ว)' : 'guests (confirmed)'}</p>
        </div>

        {/* Tables Booked */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <TableCellsIcon className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">{locale === 'th' ? 'โต๊ะที่จองแล้ว' : 'Tables Booked'}</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{stats.bookedTables}</p>
          <p className="text-xs text-gray-400 mt-1">{locale === 'th' ? `จาก ${stats.totalTables} โต๊ะ` : `of ${stats.totalTables} tables`}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reservations */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">{locale === 'th' ? 'รายการจองล่าสุด' : 'Recent Bookings'}</h2>
            <Link href="/admin/reservations" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              {locale === 'th' ? 'ดูทั้งหมด' : 'View all'}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {recentReservations.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{locale === 'th' ? 'ยังไม่มีการจองวันนี้' : 'No bookings today'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full ${r.status === 'confirmed' ? 'bg-green-500' : r.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                    <div>
                      <p className="font-bold text-gray-900">{r.guest_name}</p>
                      <p className="text-sm text-gray-500">
                        {r.reservation_time.substring(0, 5)} • {r.party_size} {locale === 'th' ? 'คน' : 'guests'}
                        {r.table_name && ` • ${r.table_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === 'pending' ? (
                      <button
                        onClick={() => handleQuickConfirm(r.id)}
                        disabled={confirming === r.id}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {confirming === r.id ? '...' : (locale === 'th' ? 'ยืนยัน' : 'Confirm')}
                      </button>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        {locale === 'th' ? 'ยืนยันแล้ว' : 'Confirmed'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{locale === 'th' ? 'ทางลัด' : 'Quick Actions'}</h2>

          <div className="space-y-3">
            <Link
              href="/admin/reservations"
              className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">{locale === 'th' ? 'จัดการการจอง' : 'Manage Reservations'}</span>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin/floor-plan"
              className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <TableCellsIcon className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">{locale === 'th' ? 'ผังโต๊ะ' : 'Floor Plan'}</span>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">{locale === 'th' ? 'ตั้งค่าระบบ' : 'Settings'}</span>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Table Status Summary */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">{locale === 'th' ? 'สถานะโต๊ะวันนี้' : 'Table Status'}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{locale === 'th' ? 'ว่าง' : 'Available'}</span>
                </div>
                <span className="font-bold text-gray-900">{stats.totalTables - stats.bookedTables}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{locale === 'th' ? 'จองแล้ว' : 'Booked'}</span>
                </div>
                <span className="font-bold text-gray-900">{stats.bookedTables}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
