'use client';

import React, { useEffect, useState } from 'react';
import {
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayPending: 0,
    todayConfirmed: 0,
    todayCancelled: 0,
    todayPax: 0, // Total people expected today
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]); // For Peak Hours
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch ALL reservations (or optimize API to support range, but GET /api/reservations supports date)
      // Ideally: fetch today separately from history.

      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Fetch Today's Data
      const todayRes = await fetch(`/api/reservations?date=${todayStr}`);
      const { data: todayData } = await todayRes.json();

      // 2. Fetch History (Last 7 days) if needed for 'week' tab
      // For now, let's just fetch everything for the week chart (simulated with existing API or fetch all)
      // If the dataset is huge, this is bad. But for now...
      const allRes = await fetch('/api/reservations'); // This takes status filter but defaults to all if auth
      const { data: allData } = await allRes.json();

      if (todayData) {
        const total = todayData.length;
        const pending = todayData.filter((r: any) => r.status === 'pending').length;
        const confirmed = todayData.filter((r: any) => r.status === 'confirmed').length;
        const cancelled = todayData.filter((r: any) => r.status === 'cancelled').length;
        const pax = todayData
          .filter((r: any) => r.status !== 'cancelled')
          .reduce((sum: number, r: any) => sum + (r.party_size || 0), 0);

        setStats({
          todayTotal: total,
          todayPending: pending,
          todayConfirmed: confirmed,
          todayCancelled: cancelled,
          todayPax: pax,
        });

        // Calculate Hourly Distribution (Peak Hours)
        const hoursMap = new Map<string, number>();
        todayData
          .filter((r: any) => r.status !== 'cancelled')
          .forEach((r: any) => {
            const hour = r.reservation_time.substring(0, 2); // "18"
            const key = `${hour}:00`;
            hoursMap.set(key, (hoursMap.get(key) || 0) + r.party_size);
          });

        // Sort keys by time
        const sortedHours = Array.from(hoursMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([time, pax]) => ({ time, pax }));

        setHourlyData(sortedHours);
      }

      if (allData) {
        // Prepare weekly chart
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const chart = last7Days.map((date) => {
          const dayReservations = allData.filter((r: any) => r.reservation_date === date);
          return {
            name: new Date(date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' }),
            bookings: dayReservations.length,
          };
        });

        setChartData(chart);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow group">
      <div>
        <p className="text-sm font-bold text-gray-400 mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-900">{value}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-1 font-bold">{subtitle}</p>}
      </div>
      <div
        className={`p-4 rounded-xl ${color} shadow-lg transition-transform group-hover:scale-110`}
      >
        <Icon className="w-8 h-8 text-white" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ภาพรวมประจำวัน</h1>
          <p className="text-sm text-gray-500 mt-1">
            ข้อมูลการจองสำหรับวันนี้:{' '}
            {new Date().toLocaleDateString('th-TH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'today'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            วันนี้
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'week'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            สัปดาห์นี้
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="จำนวนลูกค้า (Pax)"
          value={stats.todayPax}
          subtitle="คาดการณ์ลูกค้าวันนี้"
          icon={UserGroupIcon}
          color="bg-purple-600"
        />
        <StatCard
          title="จองวันนี้ทั้งหมด"
          value={stats.todayTotal}
          subtitle={`${stats.todayConfirmed} ยืนยัน / ${stats.todayPending} รอ`}
          icon={CalendarIcon}
          color="bg-blue-600"
        />
        <StatCard
          title="รอดำเนินการ"
          value={stats.todayPending}
          subtitle="ต้องกดอนุมัติ"
          icon={ClockIcon}
          color={stats.todayPending > 0 ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'}
        />
        <StatCard
          title="ยืนยันแล้ว"
          value={stats.todayConfirmed}
          subtitle="พร้อมให้บริการ"
          icon={CheckCircleIcon}
          color="bg-green-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <h2 className="mb-6 text-lg font-bold text-gray-900 flex items-center">
            {activeTab === 'today'
              ? 'ช่วงเวลาที่ลูกค้าแน่น (Peak Hours)'
              : 'แนวโน้มการจอง (7 วันย้อนหลัง)'}
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'today' ? (
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis allowDecimals={false} stroke="#9CA3AF" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="pax"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.2}
                    name="จำนวนลูกค้า"
                  />
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis allowDecimals={false} stroke="#9CA3AF" />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#3B82F6" radius={[4, 4, 0, 0]} name="จำนวนการจอง" />
                </BarChart>
              )}
            </ResponsiveContainer>
            {activeTab === 'today' && hourlyData.length === 0 && (
              <div className="flex h-full items-center justify-center text-gray-400 pb-20 -mt-80">
                ยังไม่มีข้อมูลการจองสำหรับวันนี้
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">สถานะโต๊ะวันนี้</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-gray-700 font-medium">ว่าง (Available)</span>
              </div>
              <span className="font-bold text-gray-900">-</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                <span className="text-gray-700 font-medium">จองแล้ว (Booked)</span>
              </div>
              <span className="font-bold text-gray-900">{stats.todayTotal}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3">คำแนะนำ</h3>
            <ul className="text-sm text-gray-500 space-y-2 list-disc pl-4">
              <li>
                ช่วงเวลา Peak วันนี้คือ{' '}
                <strong>
                  {hourlyData.length > 0
                    ? hourlyData.reduce((prev, current) =>
                        prev.pax > current.pax ? prev : current
                      ).time
                    : '-'}
                </strong>
              </li>
              <li>เตรียมพนักงานให้เพียงพอก่อนเวลา 17:00</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
