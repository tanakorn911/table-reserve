'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/lib/i18n';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Feedback {
    id: string;
    rating: number;
    comment: string;
    customer_name: string;
    created_at: string;
}

interface TestimonialsProps {
    locale: 'th' | 'en';
}

const Testimonials: React.FC<TestimonialsProps> = ({ locale }) => {
    // ใช้งาน hook สำหรับแปลภาษาตาม locale ที่ส่งมา (th/en)
    const { t } = useTranslation(locale);
    // state สำหรับเก็บรายการ feedback จากลูกค้า
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    // state สำหรับสถานะการโหลดข้อมูลครั้งแรก
    const [isLoading, setIsLoading] = useState(true);
    // ref สำหรับอ้างอิง div ที่ใช้ในการเลื่อนการ์ด (carousel)
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    // state สำหรับจัดการการลากเมาส์เลื่อนการ์ด (mouse drag)
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // สร้าง Supabase Client สำหรับฝั่ง Client-side
    const supabase = useMemo(() => createClientSupabaseClient(), []);

    // ฟังก์ชันดึงข้อมูลรีวิวที่เป็นสาธารณะ ( rating >= 4 และตัดชื่อ)
    const fetchPublicFeedback = useCallback(async () => {
        try {
            // ดึงข้อมูลผ่าน API สาธารณะ จำกัดเพียง 10 รายการล่าสุด
            const res = await fetch(`/api/public/feedback?limit=10&t=${Date.now()}`);
            const result = await res.json();
            if (result.success) {
                setFeedbacks(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch testimonials:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // ครั้งแรกที่รันคอมโพเนนต์ให้ดึงข้อมูลก่อน
        fetchPublicFeedback();

        // ตั้งค่าช่องทาง (Channel) สำหรับ Realtime อัปเดตข้อมูลทันทีเมื่อ DB เปลี่ยนแปลง
        const channel = supabase
            .channel('public_feedback_updates')
            .on(
                'postgres_changes',
                {
                    event: '*', // ติดตามทุการเปลี่ยนแปลง (เพิ่ม, แก้ไข, ลบ)
                    schema: 'public',
                    table: 'feedback'
                },
                () => {
                    // เมื่อข้อมูลเปลี่ยน ให้ยิง API ดึงข้อมูลใหม่
                    fetchPublicFeedback();
                }
            )
            .subscribe();

        // เมื่อลบคอมโพเนนต์ให้ยกเลิกการติดตาม Realtime
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPublicFeedback, supabase]);


    // ฟังก์ชันเลื่อนการ์ดด้วยการกดปุ่ม (ถ้ามีปุ่มควบคุมในอนาคต)
    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    // เหตุการณ์เมื่อกดเมาส์ค้างเพื่อเริ่มการลาก (Drag Start)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };

    // เหตุการณ์เมื่อเมาส์ออกจากพื้นที่เลื่อน ให้หยุดการลาก
    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    // เหตุการณ์เมื่อปล่อยเมาส์ ให้หยุดการลาก
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // เหตุการณ์เมื่อเลื่อนเมาส์ (ขณะกดค้าง) ให้เลื่อน carousel ตามการขยับเมาส์
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2; // เพิ่มความเร็วในการเลื่อนเป็น 2 เท่า
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    // หากกำลังโหลดหรือไม่มีรีวิวเลย จะไม่แสดงผลคอมโพเนนต์นี้
    if (isLoading || feedbacks.length === 0) return null;

    return (
        <section className="py-12 bg-background overflow-hidden border-b border-border/10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ส่วนหัวข้อ: ชื่อหัวข้อ, คำอธิบาย, และปุ่มเขียนรีวิว */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 px-4 md:px-2 text-center md:text-left">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h2 className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1.5 flex items-center justify-center md:justify-start gap-2">
                            <span className="w-6 h-[1px] bg-accent/30"></span>
                            {t('testimonials.title')}
                        </h2>
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                            {t('testimonials.subtitle')}
                        </h3>
                    </div>

                    <div className="flex items-center justify-center md:justify-end gap-3">
                        {/* ปุ่ม "เขียนรีวิว" ที่พาไปยังหน้าเช็คสถานะเพื่อให้ยืนยันตัวตนก่อนรีวิว */}
                        <Link
                            href="/check-status"
                            className="inline-flex items-center gap-3 px-6 py-2.5 bg-accent hover:brightness-110 text-accent-foreground text-sm font-bold rounded-xl shadow-warm transition-all active:scale-95 group whitespace-nowrap"
                        >
                            <span>{t('testimonials.leaveReview')}</span>
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* พื้นที่ของ Carousel รีวิวที่สามารถเลื่อนได้ด้วยเมาส์ (Drag) */}
                <div
                    ref={scrollContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className={`flex overflow-x-auto gap-4 sm:gap-6 pt-4 pb-12 px-4 sm:px-6 snap-x snap-mandatory scrollbar-hide select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {feedbacks.map((item, index) => (
                        <div
                            key={item.id}
                            className="flex-none w-[75vw] sm:w-[280px] snap-center relative"
                        >
                            {/* ป้าย "Review/รีวิว" ขนาดเล็กทรงรี ดูพรีเมียม */}
                            <div className="absolute -top-3 -left-2 z-10 flex items-center justify-center bg-accent rounded-full shadow-warm-md border-2 border-background pointer-events-none px-2.5 h-6.5 min-w-[42px]">
                                <span className={`text-accent-foreground font-black uppercase tracking-tighter
                                    ${locale === 'th' ? 'text-[10px]' : 'text-[8.5px]'}
                                `}>
                                    {locale === 'th' ? 'รีวิว' : 'Review'}
                                </span>
                            </div>

                            {/* ตัวการ์ดรีวิว: แสดงชื่อ (เซนเซอร์), ดาว, และความคิดเห็น */}
                            <div className="bg-card p-3.5 pl-7 rounded-2xl shadow-warm border border-border/40 hover:border-accent/30 hover:-translate-y-1 transition-all duration-300 group">
                                <div className="min-w-0 space-y-0.5">
                                    <h4 className="font-black text-foreground text-[13px] leading-tight truncate">
                                        {item.customer_name || 'Guest'}
                                    </h4>

                                    {/* ส่วนแสดงคะแนนดาว */}
                                    <div className="flex text-accent">
                                        {[...Array(5)].map((_, i) => (
                                            <StarIcon key={i} className={`w-2.5 h-2.5 ${i < item.rating ? 'fill-current' : 'text-muted/20'}`} />
                                        ))}
                                    </div>

                                    {/* ข้อความรีวิวจากลูกค้า (ตัดบรรทัดถ้าข้อความยาวเกินไป) */}
                                    <p className="text-muted-foreground text-[11px] leading-snug italic line-clamp-2">
                                        "{item.comment || t('testimonials.defaultComment')}"
                                    </p>

                                    {/* วันที่รีวิว (แสดงผลตามภาษา th/en) */}
                                    <div className="text-[9px] font-medium text-muted-foreground pt-0.5 underline decoration-accent/10 underline-offset-2">
                                        {locale === 'th' ? 'รีวิวเมื่อ ' : 'Reviewed on '}
                                        {new Date(item.created_at).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

};

export default Testimonials;
