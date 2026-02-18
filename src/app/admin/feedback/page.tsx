'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    ChatBubbleBottomCenterTextIcon,
    StarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    TrashIcon,
    UsersIcon,
    TrophyIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useAdminLocale, adminT } from '../components/LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useDraggableScroll } from '@/hooks/useDraggableScroll';
import { createClientSupabaseClient } from '@/lib/supabase/client';

// อินเทอร์เฟซสำหรับข้อมูล Feedback แต่ละรายการ
interface FeedbackItem {
    id: string;
    reservation_id: string;
    rating: number;
    comment: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    created_at: string;
    reservations: {
        guest_name: string;
        reservation_date: string;
    } | null;
}

// อินเทอร์เฟซสำหรับการแบ่งหน้า (Pagination)
interface Pagination {
    total: number;
    limit: number;
    offset: number;
}

// อินเทอร์เฟซสำหรับข้อมูลสถิติภาพรวม
interface Stats {
    averageRating: number;
    totalFeedback: number;
}

/**
 * FeedbackPage Component
 * 
 * หน้าสำหรับแอดมินเพื่อดูและบริหารจัดการความคิดเห็น/คำติชมจากลูกค้า
 * แสดงผลในรูปแบบตารางพร้อมข้อมูลสถิติภาพรวม
 */
export default function FeedbackPage() {
    const locale = useAdminLocale(); // ดึงภาษาที่แอดมินเลือก
    const { resolvedAdminTheme } = useAdminTheme(); // ดึง Theme ปัจจุบัน (light/dark)
    const isDark = resolvedAdminTheme === 'dark';

    // State สำหรับจัดการข้อมูลในหน้าจอ
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, limit: 10, offset: 0 });
    const [stats, setStats] = useState<Stats>({ averageRating: 0, totalFeedback: 0 });

    // Ref เพื่อเช็คว่าโหลดครั้งแรกหรือยัง (ป้องกันการกระพริบเมื่อข้อมูลอัปเดต)
    const isInitialLoad = useRef(true);

    // ฟังก์ชันดึงข้อมูล Feedback จาก API
    const fetchFeedback = useCallback(async (currentOffset: number = 0) => {
        // แสดง loading spinner เฉพาะครั้งแรก
        if (isInitialLoad.current) setIsLoading(true);
        setError(null);
        try {
            // เรียกใช้ API feedback พร้อมส่ง parameter สำหรับแบ่งหน้า
            const response = await fetch(`/api/feedback?limit=10&offset=${currentOffset}`);
            const result = await response.json();

            if (result.success) {
                setFeedback(result.data);
                setPagination(result.pagination);
                setStats(result.stats || { averageRating: 0, totalFeedback: 0 });
            } else {
                setError(result.error || adminT('admin.feedback.list.error', locale));
            }
        } catch (err) {
            console.error('Fetch feedback error:', err);
            setError(adminT('admin.feedback.list.error', locale));
        } finally {
            if (isInitialLoad.current) {
                setIsLoading(false);
                isInitialLoad.current = false;
            }
        }
    }, [locale]);

    // โหลดข้อมูลครั้งแรกเมื่อ Component Mount และตั้งค่า Real-time
    useEffect(() => {
        isInitialLoad.current = true;
        fetchFeedback(pagination.offset);

        // เชื่อมต่อ Supabase Realtime เพื่ออัปเดตข้อมูลทันทีเมื่อ DB เปลี่ยนแปลง
        const supabase = createClientSupabaseClient();
        const channel = supabase
            .channel('admin_feedback_changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // ดักจับทุกเหตุการณ์ (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'feedback'
                },
                () => {
                    // เมื่อมีการเปลี่ยนแปลง ให้ดึงข้อมูลใหม่แบบ background (ไม่กระพริบ)
                    fetchFeedback(pagination.offset);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchFeedback, pagination.offset]);

    // ฟังก์ชันจัดการเมื่อผู้ใช้เปลี่ยนหน้า (Pagination)
    const handlePageChange = (newOffset: number) => {
        fetchFeedback(newOffset);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนกลับขึ้นด้านบนแบบนุ่มนวล
    };

    // ฟังก์ชันสำหรับลบ Feedback
    const handleDelete = async (id: string) => {
        // แสดงการยืนยันก่อนลบ
        const confirmed = window.confirm(adminT('admin.feedback.delete.confirm', locale));
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/feedback?id=${id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                // แจ้งลบสำเร็จ (ใช้ alert สำหรับความเรียบง่ายตามแผน)
                alert(adminT('admin.feedback.delete.success', locale));
                // ดึงข้อมูลใหม่เพื่อสะท้อนการเปลี่ยนแปลง
                fetchFeedback(pagination.offset);
            } else {
                alert(result.error || adminT('admin.feedback.delete.error', locale));
            }
        } catch (err) {
            console.error('Delete feedback error:', err);
            alert(adminT('admin.feedback.delete.error', locale));
        }
    };

    // ฟังก์ชันช่วยในการ Render ดาวตามคะแนน (Rating)
    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    star <= rating ? (
                        <StarIconSolid key={star} className="w-4 h-4 text-yellow-500" />
                    ) : (
                        <StarIcon key={star} className="w-4 h-4 text-gray-300" />
                    )
                ))}
            </div>
        );
    };

    // กำหนด Class CSS ตาม Theme (Light/Dark) เพื่อความพรีเมียม
    const themeClasses = isDark ? {
        card: 'bg-gray-800/50 border-yellow-500/10',
        title: 'text-yellow-400',
        subtitle: 'text-gray-400',
        tableHeader: 'bg-gray-700/50 text-gray-300 border-gray-700',
        tableRow: 'border-gray-700/50 hover:bg-white/5',
        textMain: 'text-gray-100',
        textMuted: 'text-gray-400',
        statCard: 'bg-gray-800/80 border-gray-700',
        paginationBtn: 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-30',
        iconBg: 'bg-yellow-500/10 border-yellow-500/20',
        iconColor: 'text-yellow-400',
    } : {
        card: 'bg-white border-amber-200 shadow-sm',
        title: 'text-amber-700',
        subtitle: 'text-gray-500',
        tableHeader: 'bg-amber-50 text-amber-800 border-amber-100',
        tableRow: 'border-gray-100 hover:bg-amber-50/30',
        textMain: 'text-gray-900',
        textMuted: 'text-gray-500',
        statCard: 'bg-white border-amber-100 shadow-sm',
        paginationBtn: 'bg-white border-amber-200 text-gray-700 hover:bg-amber-50 disabled:opacity-30',
        iconBg: 'bg-amber-100 border-amber-200',
        iconColor: 'text-amber-600',
    };

    // ใช้ Hook สำหรับ Scroll แบบ Drag
    const { ref: scrollRef, events: scrollEvents, isDragging } = useDraggableScroll();

    if (isLoading && isInitialLoad.current) {
        return (
            <div className="p-6 space-y-6">
                {/* Skeleton Header */}
                <div className="flex items-center gap-4 animate-pulse">
                    <div className="w-16 h-16 bg-gray-700/50 rounded-2xl"></div>
                    <div className="space-y-2">
                        <div className="w-48 h-8 bg-gray-700/50 rounded-lg"></div>
                        <div className="w-32 h-4 bg-gray-700/30 rounded-lg"></div>
                    </div>
                </div>
                {/* Skeleton Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    <div className="h-32 bg-gray-700/30 rounded-2xl"></div>
                    <div className="h-32 bg-gray-700/30 rounded-2xl"></div>
                </div>
                {/* Skeleton Table */}
                <div className="h-96 bg-gray-700/20 rounded-2xl animate-pulse"></div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl border transition-all duration-300 ${themeClasses.iconBg}`}>
                        <ChatBubbleBottomCenterTextIcon className={`w-8 h-8 ${themeClasses.iconColor}`} />
                    </div>
                    <div>
                        <h1 className={`text-2xl font-black tracking-tight ${themeClasses.title}`}>
                            {adminT('admin.feedback.title', locale)}
                        </h1>
                        <p className={`text-sm mt-0.5 font-medium ${themeClasses.subtitle}`}>
                            {adminT('admin.feedback.subtitle', locale) || 'Manage customer reviews and ratings'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-6 rounded-2xl border flex items-center gap-4 ${themeClasses.statCard}`}>
                    <div className={`p-3 rounded-full ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <UsersIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className={`text-sm font-medium ${themeClasses.textMuted}`}>
                            {adminT('admin.feedback.stats.total', locale) || 'Total Feedback'}
                        </p>
                        <p className={`text-2xl font-black ${themeClasses.textMain}`}>
                            {stats.totalFeedback}
                        </p>
                    </div>
                </div>
                <div className={`p-6 rounded-2xl border flex items-center gap-4 ${themeClasses.statCard}`}>
                    <div className={`p-3 rounded-full ${isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-amber-50 text-amber-600'}`}>
                        <TrophyIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className={`text-sm font-medium ${themeClasses.textMuted}`}>
                            {adminT('admin.feedback.stats.rating', locale) || 'Average Rating'}
                        </p>
                        <div className="flex items-center gap-2">
                            <p className={`text-2xl font-black ${themeClasses.textMain}`}>
                                {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                            </p>
                            <div className="flex">
                                <StarIconSolid className="w-5 h-5 text-yellow-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ตารางแสดงรายการ Feedback */}
            <div className={`rounded-2xl border overflow-hidden ${themeClasses.card}`}>
                {!isLoading && !error && feedback.length > 0 && (
                    <>
                        {/* Wrapper สำหรับ Table ที่รองรับ Drag Scroll */}
                        <div
                            ref={scrollRef}
                            {...scrollEvents}
                            className={`overflow-x-auto cursor-grab active:cursor-grabbing select-none ${isDragging ? 'cursor-grabbing' : ''}`}
                        >
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className={`border-b text-[11px] font-black uppercase tracking-wider ${themeClasses.tableHeader}`}>
                                        <th className="px-6 py-4">{adminT('admin.feedback.list.date', locale)}</th>
                                        <th className="px-6 py-4">{adminT('admin.feedback.list.name', locale)}</th>
                                        <th className="px-6 py-4">{adminT('admin.feedback.list.rating', locale)}</th>
                                        <th className="px-6 py-4">{adminT('admin.feedback.list.comment', locale)}</th>
                                        <th className="px-6 py-4 text-center">{adminT('reservations.table.actions', locale)}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-transparent">
                                    {feedback.map((item) => (
                                        <tr key={item.id} className={`transition-colors border-b ${themeClasses.tableRow}`}>
                                            {/* วันที่และเวลา */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className={`text-sm font-bold ${themeClasses.textMain}`}>
                                                    {new Date(item.created_at).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </div>
                                                <div className={`text-[10px] ${themeClasses.textMuted}`}>
                                                    {new Date(item.created_at).toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </td>
                                            {/* ข้อมูลลูกค้าและการอ้างอิงการจอง */}
                                            <td className="px-6 py-5">
                                                <div className={`text-sm font-bold ${themeClasses.textMain}`}>
                                                    {item.customer_name || item.reservations?.guest_name || 'Guest'}
                                                </div>
                                                {item.customer_phone && (
                                                    <div className={`text-xs ${themeClasses.textMuted}`}>{item.customer_phone}</div>
                                                )}
                                                {item.reservations?.reservation_date && (
                                                    <div className="mt-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500 inline-block font-mono">
                                                        Ref: {new Date(item.reservations.reservation_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            {/* คะแนนดาว */}
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1">
                                                    {renderStars(item.rating)}
                                                    <span className={`text-[10px] font-bold ${isDark ? 'text-yellow-400' : 'text-amber-600'}`}>
                                                        {item.rating}.0 / 5.0
                                                    </span>
                                                </div>
                                            </td>
                                            {/* ความคิดเห็น */}
                                            <td className="px-6 py-5 max-w-md">
                                                <p className={`text-sm italic leading-relaxed ${themeClasses.textMain}`}>
                                                    {item.comment ? `"${item.comment}"` : '-'}
                                                </p>
                                            </td>
                                            {/* ปุ่มจัดการ */}
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className={`p-2 rounded-xl border transition-all ${isDark
                                                            ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                                                            : 'border-red-100 text-red-500 hover:bg-red-50'
                                                            }`}
                                                        title={adminT('reservations.actions.delete', locale)}
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* การแบ่งหน้า (Pagination) */}
                        {pagination.total > pagination.limit && (
                            <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-amber-100'}`}>
                                <p className={`text-xs font-bold ${themeClasses.textMuted}`}>
                                    Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.offset - pagination.limit)}
                                        disabled={pagination.offset === 0}
                                        className={`p-2 rounded-lg border transition-all ${themeClasses.paginationBtn}`}
                                    >
                                        <ChevronLeftIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                                        disabled={pagination.offset + pagination.limit >= pagination.total}
                                        className={`p-2 rounded-lg border transition-all ${themeClasses.paginationBtn}`}
                                    >
                                        <ChevronRightIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
                {/* Empty State */}
                {!isLoading && !error && feedback.length === 0 && (
                    <div className="p-12 text-center">
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'}`}>
                            <ChatBubbleBottomCenterTextIcon className="w-8 h-8" />
                        </div>
                        <h3 className={`text-lg font-bold mb-1 ${themeClasses.title}`}>
                            {adminT('admin.feedback.empty.title', locale) || 'No feedback yet'}
                        </h3>
                        <p className={`text-sm ${themeClasses.subtitle}`}>
                            {adminT('admin.feedback.empty.desc', locale) || 'Customer reviews will appear here.'}
                        </p>
                    </div>
                )}
            </div>
        </div >
    );
}
