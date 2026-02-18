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
  XMarkIcon,
  DocumentDuplicateIcon,
  StarIcon as StarOutline,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

// CheckStatusPage: หน้าตรวจสอบสถานะการจองด้วยรหัส Booking Code (BX-XXXXXX)
// และยังรองรับการเขียนรีวิว (Feedback) หลังจากค้นพบข้อมูลการจองแล้ว
export default function CheckStatusPage() {
  const { locale } = useNavigation(); // ดึง locale ปัจจุบันจาก Context
  const { t } = useTranslation(locale); // ใช้งานฟังก์ชันแปลภาษา

  // States สำหรับการค้นหาข้อมูล
  const [inputValue, setInputValue] = useState(''); // เก็บค่าที่พิมพ์ในช่องค้นหา
  const [reservation, setReservation] = useState<any>(null); // เก็บข้อมูลการจองที่ค้นพบ
  const [loading, setLoading] = useState(false); // สถานะการโหลดขณะเรียก API
  const [error, setError] = useState(''); // เก็บข้อความ Error กรณีค้นหาไม่พบ
  const [isModalOpen, setIsModalOpen] = useState(false); // สถานะการเปิด/ปิด Modal แสดงผล

  // Feedback State: จัดการข้อมูลการให้คะแนนและการรีวิว
  const [rating, setRating] = useState(0); // คะแนนดาว (1-5)
  const [comment, setComment] = useState(''); // ข้อความความคิดเห็น
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false); // สถานะกำลังส่งรีวิว
  const [feedbackSuccess, setFeedbackSuccess] = useState(false); // สถานะส่งรีวิวสำเร็จ
  const [feedbackError, setFeedbackError] = useState(''); // เก็บข้อความ Error ของรีวิว
  const [copiedCode, setCopiedCode] = useState(false); // สถานะการคัดลอกรหัสจอง

  // ฟังก์ชันแปลงเวลารูปแบบ HH:mm เป็นรูปแบบที่แสดงผลสวยงาม (เช่น 18:30 น. หรือ 6:30 PM)
  const formatTime = (time: string) => {
    const cleanTime = time.substring(0, 5);
    if (locale === 'th') return `${cleanTime} น.`;
    const [h, m] = cleanTime.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  // ฟังก์ชันแปลงวันที่ (ISO String) เป็นรูปแบบที่อ่านง่ายตามภาษา (เช่น 18 กุมภาพันธ์ 2026)
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

  // ฟังก์ชันหลักสำหรับค้นหาการจองผ่าน API
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;

    setLoading(true);
    setError('');
    setReservation(null);
    setIsModalOpen(false);

    // รีเซ็ตสถานะรีวิวทุกครั้งที่เริ่มการค้นหาใหม่
    setRating(0);
    setComment('');
    setFeedbackSuccess(false);
    setFeedbackError('');

    try {
      // เรียก API ค้นหาการจองด้วยรหัส Booking Code แบบตรงตัว
      // ระบบจะส่งรหัสเป็นตัวพิมพ์ใหญ่ทั้งหมด (BX-...)
      const res = await fetch(`/api/public/check-booking?code=${inputValue.trim().toUpperCase()}`);
      const json = await res.json();

      if (!res.ok) {
        // หากไม่พบข้อมูล แสดงข้อความแจ้งเตือน
        setError(json.error || t('checkStatus.error.notFound'));
      } else {
        // หากพบข้อมูล บันทึกลง state และเปิด Modal แสดงผลทันที
        setReservation(json.data);
        setIsModalOpen(true);
      }
    } catch (err) {
      setError(t('checkStatus.error.connection'));
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับส่งรีวิว (Feedback)
  const handleSubmitFeedback = async () => {
    // ตรวจสอบว่าต้องเลือกดาวอย่างน้อย 1 ดวง
    if (rating === 0) {
      setFeedbackError(t('feedback.error.rating'));
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackError('');

    try {
      // ส่งข้อมูลไปยัง API Feedback
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: reservation.id, // ผูกกับ ID ของการจอง
          rating,
          comment: comment.trim(),
          // ใช้ชื่อต้นฉบับจากการจองเพื่อความถูกต้อง
          customer_name: reservation.guest_name_original || reservation.guest_name,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setFeedbackError(json.error || t('feedback.error.general'));
      } else {
        // เมื่อส่งสำเร็จ แสดงผลสถานะ Success และซ่อนฟอร์มในฝั่ง UI
        setFeedbackSuccess(true);
        // ทำเครื่องหมายว่าการจองนี้มีรีวิวแล้ว เพื่อไม่ให้แสดงฟอร์มซ้ำ
        setReservation({ ...reservation, has_feedback: true });
      }
    } catch (err) {
      setFeedbackError(t('feedback.error.general'));
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // ฟังก์ชันแสดงสถานะ (สี, ไอคอน, ข้อความ) ตาม Status Code
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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Header / Nav */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between border-b border-border">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <BuildingStorefrontIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">{t('app.title')}</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {t('success.backHome')}
        </Link>
      </div>

      <div className="max-w-xl mx-auto pt-16 pb-24 px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-foreground mb-4 tracking-tight">
            {locale === 'th' ? (
              <>
                ตรวจสอบ <span className="text-accent">สถานะการจอง</span>
              </>
            ) : (
              t('checkStatus.title')
            )}
          </h1>
          <p className="text-muted-foreground font-medium">{t('checkStatus.subtitle')}</p>
        </div>

        {/* Search Card */}
        <div className="bg-card rounded-[24px] p-8 shadow-warm-lg border border-border">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label
                  htmlFor="bookingCode"
                  className="block text-sm font-black uppercase tracking-wider text-foreground"
                >
                  {t('checkStatus.label.code')}
                </label>
                <span className="text-xs text-muted-foreground font-medium">
                  {locale === 'th'
                    ? '* ใช้รหัสจอง (BX-...) ค้นหา'
                    : '* Use booking code (BX-...)'}
                </span>
              </div>
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
                  className="w-full bg-muted border-2 border-border rounded-2xl py-4 pl-14 pr-6 text-2xl font-black text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/50 tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || inputValue.length < 4}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black py-4 rounded-xl text-lg shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-30 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="w-5 h-5" />
              )}
              {t('checkStatus.button')}
            </button>

            {/* Premium Review Hint */}
            <div className="mt-6 flex items-center gap-3.5 p-4 rounded-2xl bg-accent/[0.03] border border-accent/10 transition-all hover:bg-accent/[0.06] group/hint border-dashed pointer-events-none">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 transition-all group-hover/hint:scale-110 shadow-sm">
                <StarSolid className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                  <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] leading-none">
                    {locale === 'th' ? 'เกร็ดน่ารู้' : 'Dining Insight'}
                  </p>
                </div>
                <p className="text-[12px] font-bold text-foreground/80 leading-snug">
                  {locale === 'th'
                    ? 'คุณสามารถแบ่งปันความประทับใจได้ทันทีหลังจากค้นหาการจอง'
                    : 'Share your dining experience immediately after finding your booking.'}
                </p>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-8 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold animate-in bounce-in duration-300">
              <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Result Section */}
        {/* Result Modal Popup */}
        {
          isModalOpen && reservation && statusInfo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              ></div>

              <div className={`relative bg-card border ${statusInfo.border} rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200`}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors z-10"
                  type="button"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                <div className={`p-8 flex flex-col items-center text-center ${statusInfo.bg}`}>
                  <div className={`p-4 rounded-2xl bg-white/5 mb-4`}>
                    <statusInfo.icon className={`w-10 h-10 ${statusInfo.color}`} />
                  </div>
                  <h2 className={`text-3xl font-black ${statusInfo.color} mb-1`}>{statusInfo.text}</h2>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                    {locale === 'th' ? 'สถานะการจอง' : 'RESERVATION STATUS'}
                  </p>

                  <div className="w-full h-px bg-border my-8"></div>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-4 text-left">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {t('checkStatus.label.customer')}
                      </p>
                      <p className="text-lg font-bold text-foreground line-clamp-1">{reservation.guest_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {t('checkStatus.label.code')}
                      </p>
                      <div className="relative group">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(reservation.short_id);
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          }}
                          className="flex items-center gap-2 text-lg font-bold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 transition-all active:scale-95 group/btn"
                        >
                          {reservation.short_id}
                          {copiedCode ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500 animate-in zoom-in spin-in-90" />
                          ) : (
                            <DocumentDuplicateIcon className="w-4 h-4 text-primary/40 group-hover/btn:text-primary transition-colors" />
                          )}
                        </button>
                        {copiedCode && (
                          <span className="absolute -top-8 left-0 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg animate-in fade-in slide-in-from-bottom-2">
                            {locale === 'th' ? 'คัดลอกแล้ว!' : 'COPIED!'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {t('checkStatus.label.date')}
                      </p>
                      <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        {formatDate(reservation.reservation_date)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {t('checkStatus.label.time')}
                      </p>
                      <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                        <ClockIcon className="w-4 h-4 text-muted-foreground" />
                        {formatTime(reservation.reservation_time)}
                      </div>
                    </div>
                  </div>

                  {reservation.table_number && (
                    <div className="w-full mt-10 p-5 rounded-2xl bg-muted border border-border flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <UserIcon className="w-6 h-6 text-primary" />
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {t('checkStatus.label.table')}
                          </p>
                          <p className="text-xl font-black text-foreground">
                            {reservation.table_name || reservation.table_number}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-primary/10 rounded border border-primary/20 text-[10px] font-black text-primary uppercase tracking-wider">
                        Ready
                      </div>
                    </div>
                  )}

                  {/* Feedback Section (How was your experience?) */}
                  {!reservation.has_feedback && (reservation.status === 'confirmed' || reservation.status === 'completed') && (
                    <div className="w-full mt-10 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 text-left animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-500 rounded-xl">
                          <StarSolid className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-black text-foreground">{t('feedback.title')}</h4>
                      </div>

                      {feedbackSuccess ? (
                        <div className="py-4 text-center animate-in zoom-in-95 duration-300">
                          <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                          <p className="font-bold text-green-600">{t('feedback.success.title')}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t('feedback.success.desc')}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Rating Stars */}
                          <div className="flex justify-center gap-2 py-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="transition-transform active:scale-90 hover:scale-110"
                                type="button"
                              >
                                {star <= rating ? (
                                  <StarSolid className="w-10 h-10 text-yellow-400 drop-shadow-sm" />
                                ) : (
                                  <StarOutline className="w-10 h-10 text-gray-300" />
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Comment box */}
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t('feedback.comment.placeholder')}
                            className="w-full bg-white dark:bg-gray-900 border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none min-h-[80px] resize-none transition-all placeholder:text-muted-foreground/50"
                          />

                          {feedbackError && (
                            <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                              <ExclamationCircleIcon className="w-3 h-3" />
                              {feedbackError}
                            </p>
                          )}

                          <button
                            onClick={handleSubmitFeedback}
                            disabled={feedbackSubmitting || rating === 0}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-black py-3 rounded-xl shadow-lg shadow-amber-500/10 transition-all active:scale-95 disabled:opacity-30 disabled:hover:translate-y-0"
                          >
                            {feedbackSubmitting ? t('feedback.submitting') : t('feedback.submit')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-muted border-t border-border">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-3 bg-background border border-border text-foreground font-bold rounded-xl shadow-sm hover:bg-muted transition-colors text-sm"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            {t('checkStatus.help')} <span className="text-primary font-bold">081-222-2222</span>
          </p>
        </div>
      </div >

      {/* Loading Overlay */}
      {
        loading && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-primary rounded-full border-t-transparent animate-spin mb-4"></div>
            <p className="text-foreground font-bold text-lg animate-pulse">{t('common.loading')}</p>
          </div>
        )
      }
    </div >
  );
}
