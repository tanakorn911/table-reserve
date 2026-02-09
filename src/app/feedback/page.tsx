'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

function FeedbackContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');

    const [reservationId, setReservationId] = useState<string | null>(null);
    const [reservationInfo, setReservationInfo] = useState<any>(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Lookup reservation by booking code
    useEffect(() => {
        const lookupReservation = async () => {
            if (!code) {
                setError('กรุณาระบุรหัสการจอง');
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/feedback/lookup?code=${code}`);
                const data = await response.json();

                if (data.success && data.reservation) {
                    setReservationId(data.reservation.id);
                    setReservationInfo(data.reservation);
                } else {
                    setError(data.error || 'ไม่พบรหัสการจองนี้');
                }
            } catch (err) {
                setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
            } finally {
                setIsLoading(false);
            }
        };

        lookupReservation();
    }, [code]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reservationId) {
            setError('ไม่พบข้อมูลการจอง');
            return;
        }

        if (rating === 0) {
            setError('กรุณาให้คะแนน');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reservationId,
                    rating,
                    comment,
                    name: reservationInfo?.guest_name,
                    phone: reservationInfo?.guest_phone,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setIsSubmitted(true);
            } else {
                setError(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
        } finally {
            setIsSubmitting(false);
        }
    };

    const ratingLabels = [
        { emoji: '😞', text: 'ไม่พอใจมาก' },
        { emoji: '😕', text: 'ไม่ค่อยพอใจ' },
        { emoji: '😐', text: 'พอใช้ได้' },
        { emoji: '😊', text: 'พอใจ' },
        { emoji: '🤩', text: 'ยอดเยี่ยม!' },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-yellow-500"
                />
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="max-w-md w-full text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-32 h-32 mx-auto mb-8 relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full animate-pulse" />
                        <div className="absolute inset-2 bg-slate-800 rounded-full flex items-center justify-center">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}>
                                <Icon name="CheckIcon" size={64} className="text-yellow-500" />
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-3xl font-bold text-white mb-3"
                    >
                        ขอบคุณค่ะ/ครับ! 💖
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-slate-400 mb-8"
                    >
                        ความคิดเห็นของคุณมีค่ามากสำหรับเรา
                        <br />เราจะนำไปพัฒนาบริการให้ดียิ่งขึ้น
                    </motion.p>

                    <motion.a
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        href="/landing-page"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 rounded-xl font-bold shadow-lg shadow-yellow-500/20 hover:shadow-xl transition-all hover:-translate-y-1"
                    >
                        <Icon name="HomeIcon" size={20} />
                        กลับหน้าหลัก
                    </motion.a>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
            <div className="max-w-lg mx-auto">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                            <Icon name="BuildingStorefrontIcon" size={24} className="text-slate-900" />
                        </div>
                        <span className="text-xl font-bold text-white">Savory Bistro</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-800/80 backdrop-blur rounded-3xl border border-slate-700 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-yellow-500 via-yellow-500 to-yellow-600 p-8 text-center overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="relative z-10"
                        >
                            <div className="w-20 h-20 bg-slate-900/20 rounded-full mx-auto flex items-center justify-center mb-4 backdrop-blur-sm">
                                <span className="text-5xl">⭐</span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                ให้คะแนนประสบการณ์ของคุณ
                            </h1>
                            <p className="text-slate-800/80 text-sm">
                                ความคิดเห็นของคุณช่วยให้เราพัฒนาได้ดียิ่งขึ้น
                            </p>
                        </motion.div>
                    </div>

                    {/* Reservation Info */}
                    {reservationInfo && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mx-6 -mt-4 relative z-20"
                        >
                            <div className="bg-slate-900 rounded-2xl p-4 text-white border border-slate-700">
                                <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-700">
                                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Icon name="UserIcon" size={24} className="text-slate-900" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-500">ลูกค้า</p>
                                        <p className="font-bold text-lg">{reservationInfo.guest_name || 'ลูกค้า'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div>
                                        <p className="text-xs text-slate-500">รหัสจอง</p>
                                        <p className="font-bold text-yellow-500 text-sm">{code}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">วันที่</p>
                                        <p className="font-medium text-sm">{reservationInfo.reservation_date}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">เวลา</p>
                                        <p className="font-medium text-sm">{reservationInfo.reservation_time?.slice(0, 5) || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 pt-8 space-y-8">
                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 text-red-400 flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Icon name="ExclamationCircleIcon" size={24} />
                                    </div>
                                    <span className="font-medium">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Rating Stars */}
                        <div className="text-center">
                            <p className="text-slate-300 font-medium mb-6">
                                คุณพอใจกับบริการของเราแค่ไหน?
                            </p>

                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <motion.button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        whileHover={{ scale: 1.15, y: -4 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all ${star <= (hoverRating || rating)
                                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30'
                                            : 'bg-slate-700 hover:bg-slate-600'
                                            }`}
                                    >
                                        {star <= (hoverRating || rating) ? '⭐' : '☆'}
                                    </motion.button>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                {(hoverRating || rating) > 0 && (
                                    <motion.div
                                        key={hoverRating || rating}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mt-4 flex items-center justify-center gap-2"
                                    >
                                        <span className="text-3xl">{ratingLabels[(hoverRating || rating) - 1].emoji}</span>
                                        <span className="font-bold text-yellow-500 text-lg">
                                            {ratingLabels[(hoverRating || rating) - 1].text}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="flex items-center gap-2 text-slate-300 font-medium mb-3">
                                <Icon name="ChatBubbleBottomCenterTextIcon" size={20} className="text-yellow-500" />
                                ความคิดเห็นเพิ่มเติม
                                <span className="text-slate-500 font-normal text-sm">(ไม่บังคับ)</span>
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="เล่าให้เราฟังหน่อยว่าประสบการณ์ของคุณเป็นอย่างไร..."
                                rows={4}
                                className="w-full px-5 py-4 bg-slate-900/50 border-2 border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-500 resize-none transition-all"
                            />
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-yellow-500/20 hover:shadow-xl"
                        >
                            {isSubmitting ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <Icon name="ArrowPathIcon" size={24} />
                                    </motion.div>
                                    กำลังส่ง...
                                </>
                            ) : (
                                <>
                                    <Icon name="PaperAirplaneIcon" size={24} />
                                    ส่งความคิดเห็น
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-slate-500 text-sm mt-6"
                >
                    ขอบคุณที่ใช้บริการ Savory Bistro 🍽️
                </motion.p>
            </div>
        </div>
    );
}

export default function FeedbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-yellow-500 animate-spin" />
            </div>
        }>
            <FeedbackContent />
        </Suspense>
    );
}
