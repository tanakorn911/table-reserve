'use client'; // ใช้ Client Component

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
  HomeIcon,
} from '@heroicons/react/24/outline';
import { useAdminLocale } from '@/app/admin/components/LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useTranslation } from '@/lib/i18n';
import AIInsightsCard from '@/app/admin/components/AIInsightsCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// โครงสร้างข้อมูลการจอง
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

/**
 * DashboardPage Component
 * 
 * หน้าแดชบอร์ดหลักสำหรับ Admin
 * - แสดงภาพรวมสถิติการจองวันนี้ (มาแล้ว, รอยืนยัน, ยกเลิก)
 * - กราฟแท่งแสดงช่วงเวลาที่ลูกค้าหนาแน่น (Peak Occupancy)
 * - รายการจองล่าสุดที่กำลังจะมาถึง (Who's Next?)
 * - AI Insights วิเคราะห์ภาพรวมประจำวัน
 */
export default function DashboardPage() {
  const locale = useAdminLocale();
  const { resolvedAdminTheme } = useAdminTheme();
  const { t } = useTranslation(locale);

  // State เก็บสถิติต่างๆ
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayPending: 0,
    todayConfirmed: 0,
    todayPax: 0, // จำนวนลูกค้า (คน)
    bookedTables: 0,
    totalTables: 0,
  });
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]); // รายการจองที่จะมาถึงเร็วๆนี้
  const [allReservations, setAllReservations] = useState<Reservation[]>([]); // รายการจองทั้งหมดของวันนี้ (สำหรับ Export/Clear)
  const [hourlyPaxData, setHourlyPaxData] = useState<any[]>([]); // ข้อมูลกราฟ
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  // Effect: โหลดข้อมูลครั้งแรก และตั้งเวลา Auto-refresh ทุก 30 วินาที
  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ฟังก์ชันดึงข้อมูล Dashboard ทั้งหมด
  const fetchDashboardData = async () => {
    try {
      // คำนวณวันที่ปัจจุบัน (ตามเวลาไทย UTC+7)
      const now = new Date();
      const thailandTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const todayStr = thailandTime.toISOString().split('T')[0];

      // ดึงข้อมูลการจองทั้งหมด
      const allRes = await fetch('/api/reservations');
      const { data: allData } = await allRes.json();

      // กรองเฉพาะการจองของ "วันนี้" เพื่อมาแสดงสถิติ
      const todayData = (allData || []).filter((r: Reservation) =>
        r.reservation_date === todayStr
      );

      // กรองการจองที่ "ยังไม่ผ่านไป" (วันนี้และอนาคต) เพื่อแสดงรายการที่จะมาถึง
      const upcomingData = (allData || []).filter((r: Reservation) =>
        r.reservation_date >= todayStr
      );

      // ดึงข้อมูลโต๊ะทั้งหมดเพื่อนับจำนวนโต๊ะ
      const tablesRes = await fetch('/api/tables');
      const { data: tablesData } = await tablesRes.json();

      if (todayData) {
        // คำนวณตัวเลขสถิติวันนี้
        const total = todayData.length;
        const pending = todayData.filter((r: Reservation) => r.status === 'pending').length;
        const confirmed = todayData.filter((r: Reservation) => r.status === 'confirmed').length;
        const pax = todayData
          .filter((r: Reservation) => r.status === 'confirmed')
          .reduce((sum: number, r: Reservation) => sum + (r.party_size || 0), 0);

        // นับจำนวนโต๊ะที่ถูกจองวันนี้ (ไม่ซ้ำ)
        const bookedTables = new Set(
          todayData
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

        // เรียงลำดับการจองวันนี้ตามเวลา
        const sortedToday = [...todayData]
          .sort((a: Reservation, b: Reservation) =>
            new Date(a.reservation_date + 'T' + a.reservation_time).getTime() - new Date(b.reservation_date + 'T' + b.reservation_time).getTime()
          );

        setAllReservations(sortedToday);

        // เรียงลำดับรายการที่จะมาถึง (Upcoming)
        const sortedUpcoming = [...upcomingData]
          .sort((a: Reservation, b: Reservation) =>
            new Date(a.reservation_date + 'T' + a.reservation_time).getTime() - new Date(b.reservation_date + 'T' + b.reservation_time).getTime()
          );

        setRecentReservations(sortedUpcoming.slice(0, 5)); // เอาแค่ 5 รายการแรก

        // คำนวณข้อมูลกราฟความหนาแน่นรายชั่วโมง (เฉพาะวันนี้)
        const hoursMap = new Map<string, number>();
        todayData
          .filter((r: Reservation) => r.status !== 'cancelled')
          .forEach((r: Reservation) => {
            const hour = r.reservation_time.split(':')[0] + ':00';
            hoursMap.set(hour, (hoursMap.get(hour) || 0) + r.party_size);
          });

        const hourlyData = Array.from(hoursMap.entries())
          .map(([time, pax]) => ({ time, pax }))
          .sort((a, b) => a.time.localeCompare(b.time));

        setHourlyPaxData(hourlyData);
      } else {
        // กรณีไม่มีข้อมูล
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
        setHourlyPaxData([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชัน Export ข้อมูลเป็น CSV
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

  // ฟังก์ชันลบข้อมูลการจองทั้งหมดของวันนี้ (สำหรับทดสอบหรือเริ่มวันใหม่)
  const handleClearDay = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const confirmMsg = locale === 'th'
      ? `ยืนยันการเคลียร์รายการจองวันที่ ${todayStr}?\n\n⚠️ แนะนำให้ Export CSV ก่อนลบ!`
      : `Confirm clearing reservations for ${todayStr}?\n\n⚠️ Recommended to Export CSV first!`;

    if (!confirm(confirmMsg)) return;

    setClearing(true);
    try {
      // วนลบทีละรายการ (TODO: ควรทำ API สำหรับ Bulk Delete)
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ส่วนหัวแสดงวันที่และปุ่มจัดการ (Page Header) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl border transition-all duration-300 ${resolvedAdminTheme === 'dark' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-amber-100 border-amber-200'}`}>
            <HomeIcon className={`w-8 h-8 ${resolvedAdminTheme === 'dark' ? 'text-yellow-400' : 'text-amber-600'}`} />
          </div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${resolvedAdminTheme === 'dark' ? 'text-yellow-400' : 'text-amber-700'}`}>
              {t('admin.dashboard.title')}
            </h1>
            <p className={`text-sm mt-0.5 font-medium ${resolvedAdminTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date().toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Action Buttons: Export CSV & Clear Data */}
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

      {/* Cards แสดงสถิติรวม */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Bookings: ยอดจองรวม */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">{locale === 'th' ? 'การจองวันนี้' : 'Today\'s Bookings'}</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{stats.todayTotal}</p>
        </div>

        {/* Pending: รอยืนยัน */}
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

        {/* Expected Guests: จำนวนคน */}
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

        {/* Tables Booked: โต๊ะที่จอง */}
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

      {/* AI Insights Card: วิเคราะห์ข้อมูลด้วย AI */}
      <AIInsightsCard locale={locale} />

      {/* Operational Insights: กราฟและลำดับการจอง */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peak Occupancy Forecast: กราฟแท่งแสดงลูกค้าตามช่วงเวลา */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{locale === 'th' ? 'ความหนาแน่นรายชั่วโมง' : 'Peak Occupancy'}</h2>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">
                {locale === 'th' ? 'จำนวนลูกค้าคาดการณ์ในแต่ละช่วงเวลา' : 'Forecasted guests for today'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">{locale === 'th' ? 'จำนวนลูกค้า (Pax)' : 'Guests'}</span>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] -ml-5">
            {hourlyPaxData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                {locale === 'th' ? 'ไม่มีข้อมูลการจองในวันนี้' : 'No data for today'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyPaxData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f9f9f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  />
                  <Bar dataKey="pax" radius={[6, 6, 0, 0]} barSize={40}>
                    {hourlyPaxData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={'#d4af37'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* สรุปสถานะโต๊ะทั้งหมด */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h3 className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{locale === 'th' ? 'สถานะโต๊ะวันนี้' : 'Table Status'}</h3>
                <div className="space-y-1.5 text-center">
                  <div className="flex items-center justify-center gap-8">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">{locale === 'th' ? 'ว่าง' : 'Available'}</span>
                      <span className="text-lg font-black text-gray-900 ml-1">{stats.totalTables - stats.bookedTables}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">{locale === 'th' ? 'จองแล้ว' : 'Booked'}</span>
                      <span className="text-lg font-black text-gray-900 ml-1">{stats.bookedTables}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Who's Next?: รายการจองที่จะถึง */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{locale === 'th' ? 'ลำดับการจอง' : "Who's Next?"}</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-tighter font-bold">
                {locale === 'th' ? 'ใครจะมาถึงในลำดับถัดไป' : 'Arrival priority'}
              </p>
            </div>
            <Link href="/admin/reservations" className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowRightIcon className="w-4 h-4 text-gray-400" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[480px] -mx-1 px-1">
            {recentReservations.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-xs">{locale === 'th' ? 'ยังไม่มีการจองวันนี้' : 'No bookings'}</p>
              </div>
            ) : (
              <div className="relative border-l border-gray-100 ml-2 space-y-4 pb-2">
                {recentReservations.map((r) => {
                  const now = new Date();
                  const [h, m] = r.reservation_time.split(':').map(Number);
                  const resTime = new Date();
                  resTime.setHours(h, m, 0);
                  const isComingSoon = r.reservation_date === new Date().toISOString().split('T')[0] &&
                    resTime.getTime() > now.getTime() &&
                    (resTime.getTime() - now.getTime()) < 3600000; // น้อยกว่า 1 ชม.

                  return (
                    <div key={r.id} className="relative pl-5">
                      <div className={`absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full border border-white ${isComingSoon ? 'bg-blue-600' : 'bg-gray-300'
                        }`}></div>

                      <div className={`p-3 rounded-xl border transition-all ${isComingSoon ? 'bg-blue-50 border-blue-200' : 'bg-gray-50/50 border-gray-100'
                        }`}>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className={`text-xs font-black ${isComingSoon ? 'text-blue-700' : 'text-gray-900'}`}>{r.reservation_time.substring(0, 5)}</span>
                            <p className="font-bold text-[13px] text-gray-900 leading-tight mt-0.5">{r.guest_name}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 font-bold uppercase">
                              <span>{r.party_size} {locale === 'th' ? 'คน' : 'pax'}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>{r.table_name || '-'}</span>
                            </div>
                          </div>
                          <div className={`w-2 h-8 rounded-full ${r.status === 'confirmed' ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
