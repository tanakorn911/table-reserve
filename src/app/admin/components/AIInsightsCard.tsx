'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useTranslation } from '@/lib/i18n';

interface AIInsightsData {
    insight: string;
    stats: {
        today: {
            total: number;
            confirmed: number;
            pending: number;
            cancelled: number;
            totalGuests: number;
        };
        yesterday: {
            total: number;
            confirmed: number;
            totalGuests: number;
        };
    } | null;
    generatedAt: string;
}

interface AIInsightsCardProps {
    locale?: 'th' | 'en';
}

export default function AIInsightsCard({ locale = 'th' }: AIInsightsCardProps) {
    const { t } = useTranslation(locale);
    const [data, setData] = useState<AIInsightsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const { adminTheme } = useAdminTheme();

    const fetchInsights = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/ai/daily-insights?locale=${locale}`);
            const result = await response.json();

            if (result.success && result.data) {
                setData(result.data);
                // Start typing animation
                setIsTyping(true);
                setDisplayedText('');
            } else {
                setError(result.error || 'Failed to fetch insights');
            }
        } catch (err) {
            setError(locale === 'th' ? 'ไม่สามารถโหลดข้อมูลได้' : 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [locale]);

    // Fetch on mount
    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    // Typing animation
    useEffect(() => {
        if (isTyping && data?.insight) {
            const text = data.insight;
            let index = 0;

            const timer = setInterval(() => {
                if (index < text.length) {
                    setDisplayedText(text.slice(0, index + 1));
                    index++;
                } else {
                    setIsTyping(false);
                    clearInterval(timer);
                }
            }, 20); // 20ms per character

            return () => clearInterval(timer);
        }
    }, [isTyping, data?.insight]);

    const changePercent = data?.stats
        ? ((data.stats.today.total - data.stats.yesterday.total) / Math.max(data.stats.yesterday.total, 1) * 100).toFixed(0)
        : '0';

    const isPositive = parseInt(changePercent) >= 0;

    // Theme-aware colors
    const themeColors = adminTheme === 'dark' ? {
        container: 'bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-500/20 shadow-purple-500/5',
        iconBg: 'bg-purple-500/20',
        icon: 'text-purple-400',
        title: 'text-white',
        subtitle: 'text-purple-300/60',
        refreshBtn: 'bg-purple-500/10 hover:bg-purple-500/20',
        refreshIcon: 'text-purple-400',
        loadingDot: 'bg-purple-400',
        loadingText: 'text-purple-300/60',
        content: 'text-white/90',
        cursor: 'bg-purple-400',
        border: 'border-purple-500/20',
        statsLabel: 'text-white/40',
    } : {
        container: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-amber-500/5',
        iconBg: 'bg-amber-100',
        icon: 'text-amber-600',
        title: 'text-amber-900',
        subtitle: 'text-amber-600/60',
        refreshBtn: 'bg-amber-100 hover:bg-amber-200',
        refreshIcon: 'text-amber-600',
        loadingDot: 'bg-amber-500',
        loadingText: 'text-amber-600/60',
        content: 'text-amber-900',
        cursor: 'bg-amber-500',
        border: 'border-amber-200',
        statsLabel: 'text-amber-700/50',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 border shadow-lg ${themeColors.container}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${themeColors.iconBg}`}>
                        <Icon name="SparklesIcon" size={20} className={themeColors.icon} />
                    </div>
                    <div>
                        <h3 className={`font-bold ${themeColors.title}`}>{t('admin.ai.title')}</h3>
                        <p className={`text-xs ${themeColors.subtitle}`}>{t('admin.ai.subtitle')}</p>
                    </div>
                </div>
                <button
                    onClick={fetchInsights}
                    disabled={isLoading}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${themeColors.refreshBtn}`}
                    aria-label="Refresh insights"
                >
                    <Icon
                        name="ArrowPathIcon"
                        size={16}
                        className={`${themeColors.refreshIcon} ${isLoading ? 'animate-spin' : ''}`}
                    />
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[80px]">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3"
                        >
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${themeColors.loadingDot}`}
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.1,
                                        }}
                                    />
                                ))}
                            </div>
                            <span className={`text-sm ${themeColors.loadingText}`}>{t('admin.ai.analyzing')}</span>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-red-500 text-sm"
                        >
                            {error}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <p className={`text-sm leading-relaxed ${themeColors.content}`}>
                                {displayedText}
                                {isTyping && (
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        className={`ml-0.5 inline-block w-2 h-4 align-middle ${themeColors.cursor}`}
                                    />
                                )}
                            </p>

                            {/* Stats comparison */}
                            {data?.stats && (
                                <div className={`mt-4 flex items-center gap-4 pt-4 border-t ${themeColors.border}`}>
                                    <div className="flex items-center gap-2">
                                        <Icon
                                            name={isPositive ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'}
                                            size={16}
                                            className={isPositive ? 'text-green-500' : 'text-red-500'}
                                        />
                                        <span className={`text-sm font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                            {isPositive ? '+' : ''}{changePercent}%
                                        </span>
                                        <span className={`text-xs ${themeColors.statsLabel}`}>vs เมื่อวาน</span>
                                    </div>
                                    <div className={`text-xs ${themeColors.statsLabel}`}>
                                        อัพเดท {new Date(data.generatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
