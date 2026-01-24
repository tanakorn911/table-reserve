'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  HashtagIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

export default function CheckStatusPage() {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);
  const [inputValue, setInputValue] = useState('');
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatTime = (time: string) => {
    const cleanTime = time.substring(0, 5);
    if (locale === 'th') return `${cleanTime} น.`;
    const [h, m] = cleanTime.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;

    setLoading(true);
    setError('');
    setReservation(null);

    try {
      // Precise search by code BX-XXXXXX
      const res = await fetch(`/api/public/check-booking?code=${inputValue.trim().toUpperCase()}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || t('checkStatus.error.notFound'));
      } else {
        setReservation(json.data);
      }
    } catch (err) {
      setError(t('checkStatus.error.connection'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          text: t('checkStatus.status.confirmed'),
          color: 'text-green-400',
          icon: CheckCircleIcon,
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
        };
      case 'pending':
        return {
          text: t('checkStatus.status.pending'),
          color: 'text-amber-400',
          icon: ClockIcon,
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
        };
      case 'cancelled':
        return {
          text: t('checkStatus.status.cancelled'),
          color: 'text-red-400',
          icon: ExclamationCircleIcon,
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
        };
      case 'completed':
        return {
          text: t('checkStatus.status.completed'),
          color: 'text-blue-400',
          icon: CheckCircleIcon,
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
        };
      default:
        return {
          text: status,
          color: 'text-gray-400',
          icon: ClockIcon,
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
        };
    }
  };

  const statusInfo = reservation ? getStatusDisplay(reservation.status) : null;

  return (
    <div className="min-h-screen bg-[#1a202c] text-white font-sans selection:bg-amber-500/30">
      {/* Header / Nav */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <BuildingStorefrontIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">{t('app.title')}</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-accent transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {t('success.backHome')}
        </Link>
      </div>

      <div className="max-w-xl mx-auto pt-16 pb-24 px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            {locale === 'th' ? (
              <>
                ตรวจสอบ <span className="text-accent">สถานะการจอง</span>
              </>
            ) : (
              t('checkStatus.title')
            )}
          </h1>
          <p className="text-gray-400 font-medium">{t('checkStatus.subtitle')}</p>
        </div>

        {/* Search Card */}
        <div className="bg-[#2d3748] rounded-[24px] p-8 shadow-2xl border border-white/5">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-3">
              <label
                htmlFor="bookingCode"
                className="block text-xs font-black uppercase tracking-[0.2em] text-gray-500 ml-1"
              >
                {t('checkStatus.label.code')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <HashtagIcon className="w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  id="bookingCode"
                  type="text"
                  placeholder={t('checkStatus.placeholder')}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                  className="w-full bg-[#1a202c] border-2 border-white/10 rounded-2xl py-4 pl-14 pr-6 text-2xl font-black text-white focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-gray-700 tracking-widest"
                />
              </div>
              <p className="text-[10px] text-muted-foreground ml-1">
                *{' '}
                {locale === 'th'
                  ? 'สามารถใช้รหัสจอง (BX-...) หรือ เบอร์โทรศัพท์ในการค้นหาได้'
                  : 'You can search by booking code (BX-...) or phone number'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || inputValue.length < 4}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black py-4 rounded-xl text-lg shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-30 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-[#1a202c]/30 border-t-[#1a202c] rounded-full animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="w-5 h-5" />
              )}
              {t('checkStatus.button')}
            </button>
          </form>

          {error && (
            <div className="mt-8 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold animate-in bounce-in duration-300">
              <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Result Section */}
        {reservation && statusInfo && (
          <div className="mt-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div
              className={`rounded-3xl border ${statusInfo.border} ${statusInfo.bg} p-8 flex flex-col items-center text-center shadow-lg`}
            >
              <div className={`p-4 rounded-2xl ${statusInfo.bg} mb-4`}>
                <statusInfo.icon className={`w-10 h-10 ${statusInfo.color}`} />
              </div>
              <h2 className={`text-3xl font-black ${statusInfo.color} mb-1`}>{statusInfo.text}</h2>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                Reservation Status
              </p>

              <div className="w-full h-px bg-white/10 my-8"></div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-4 text-left">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {t('checkStatus.label.customer')}
                  </p>
                  <p className="text-lg font-bold text-white">{reservation.guest_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {t('checkStatus.label.code')}
                  </p>
                  <p className="text-lg font-bold text-[#d4af37]">{reservation.short_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {t('checkStatus.label.date')}
                  </p>
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    {formatDate(reservation.reservation_date)}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {t('checkStatus.label.time')}
                  </p>
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    {formatTime(reservation.reservation_time)}
                  </div>
                </div>
              </div>

              {reservation.table_number && (
                <div className="w-full mt-10 p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <UserIcon className="w-6 h-6 text-[#d4af37]" />
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {t('checkStatus.label.table')}
                      </p>
                      <p className="text-xl font-black text-white">
                        {t('checkStatus.label.tableNum').replace('{num}', reservation.table_number)}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-[#d4af37]/10 rounded border border-[#d4af37]/20 text-[10px] font-black text-[#d4af37] uppercase tracking-wider">
                    Ready
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 font-medium">
            {t('checkStatus.help')} <span className="text-[#d4af37] font-bold">081-222-2222</span>
          </p>
        </div>
      </div>
    </div>
  );
}
