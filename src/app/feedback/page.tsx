'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { useTranslation } from '@/lib/i18n';
import { useNavigation } from '@/contexts/NavigationContext';
import {
    ArrowLeftIcon,
    BuildingStorefrontIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    StarIcon as StarOutline,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

// FeedbackContent: ส่วนเนื้อหาหลักของหน้า Feedback
// ปรับปรุงใหม่: ใช้ Design System มาตรฐานของแอป (bg-background, text-foreground, shadow-warm)
function FeedbackContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const { locale } = useNavigation();
    const { t } = useTranslation(locale);

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
                setError(t('feedback.error.code'));
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
                    setError(data.error || t('feedback.error.notFound'));
                }
            } catch (err) {
                setError(t('feedback.error.general'));
            } finally {
                setIsLoading(false);
            }
        };

        lookupReservation();
    }, [code, t]);

    // บันทึกความเห็น
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reservationId) {
            setError(t('feedback.error.notFound'));
            return;
        }

        if (rating === 0) {
            setError(t('feedback.error.rating'));
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
                setError(data.error || t('feedback.error.general'));
            }
        } catch (err) {
            setError(t('feedback.error.general'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const ratingLabels = [
        { emoji: '😞', text: t('feedback.rating.1') },
        { emoji: '😕', text: t('feedback.rating.2') },
        { emoji: '😐', text: t('feedback.rating.3') },
        { emoji: '😊', text: t('feedback.rating.4') },
        { emoji: '🤩', text: t('feedback.rating.5') },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary rounded-full border-t-transparent animate-spin mb-4"></div>
                <p className="text-foreground font-bold text-lg animate-pulse">{t('common.loading')}</p>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center bg-card rounded-[24px] p-8 shadow-warm-lg border border-border"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-24 h-24 mx-auto mb-6 relative"
                    >
                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <CheckCircleIcon className="w-20 h-20 text-green-500" />
                        </div>
                    </motion.div>

                    <h1 className="text-3xl font-extrabold text-foreground mb-3">
                        {t('feedback.success.title')}
                    </h1>

                    <p className="text-muted-foreground mb-8">
                        {t('feedback.success.desc')}
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-all hover:-translate-y-1"
                    >
                        <BuildingStorefrontIcon className="w-5 h-5" />
                        {t('nav.home')}
                    </Link>
                </motion.div>
            </div>
        );
    }

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
                                ให้คะแนน <span className="text-accent">ความพึงพอใจ</span>
                            </>
                        ) : (
                            t('feedback.title')
                        )}
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        {t('feedback.subtitle')}
                    </p>
                </div>

                <div className="bg-card rounded-[24px] shadow-warm-lg border border-border overflow-hidden">
                    {/* Reservation Info Header */}
                    {reservationInfo && (
                        <div className="bg-muted/50 p-6 border-b border-border">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 text-2xl">
                                    😊
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        {t('checkStatus.label.customer')}
                                    </p>
                                    <h3 className="font-bold text-lg text-foreground">
                                        {reservationInfo.guest_name || t('checkStatus.label.customer')}
                                    </h3>
                                    <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                                        <span>{reservationInfo.reservation_date}</span>
                                        <span>•</span>
                                        <span>{reservationInfo.reservation_time?.slice(0, 5)} น.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500 flex items-center gap-3 font-medium"
                                >
                                    <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Rating Stars */}
                        <div className="text-center">
                            <p className="text-foreground font-bold mb-6 text-lg">
                                {t('feedback.label.rating')}
                            </p>

                            <div className="flex justify-center gap-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <motion.button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="focus:outline-none transition-colors"
                                    >
                                        {star <= (hoverRating || rating) ? (
                                            <StarSolid className="w-12 h-12 text-yellow-500 drop-shadow-sm" />
                                        ) : (
                                            <StarOutline className="w-12 h-12 text-muted-foreground/30 hover:text-yellow-400" />
                                        )}
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
                                        <span className="text-2xl">{ratingLabels[(hoverRating || rating) - 1].emoji}</span>
                                        <span className="font-bold text-accent text-lg">
                                            {ratingLabels[(hoverRating || rating) - 1].text}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Comment */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-foreground font-bold">
                                {t('feedback.label.comment')}
                                <span className="text-muted-foreground font-normal text-sm">
                                    {t('feedback.placeholder.optional')}
                                </span>
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={t('feedback.comment.placeholder')}
                                rows={4}
                                className="w-full px-5 py-4 bg-muted border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none transition-all"
                            />
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 bg-accent text-accent-foreground rounded-xl font-bold text-lg shadow-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    {t('feedback.submitting')}
                                </>
                            ) : (
                                <>
                                    {t('feedback.submit')}
                                </>
                            )}
                        </motion.button>
                    </form>
                </div>

                {/* Footer Link */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        {t('feedback.thankyou')}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function FeedbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary rounded-full border-t-transparent animate-spin mb-4"></div>
                <p className="text-foreground font-bold text-lg animate-pulse">Loading...</p>
            </div>
        }>
            <FeedbackContent />
        </Suspense>
    );
}
