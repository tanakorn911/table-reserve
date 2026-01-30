'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { useTranslation, Locale } from '@/lib/i18n';

interface AIRecommendationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTable: (tableId: number) => void;
    date: string;
    time: string;
    guests: number;
    locale: Locale;
}

const AIRecommendationModal: React.FC<AIRecommendationModalProps> = ({
    isOpen,
    onClose,
    onSelectTable,
    date,
    time,
    guests,
    locale,
}) => {
    const { t } = useTranslation(locale);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ recommendedTableId: number; reasoning: string } | null>(
        null
    );
    const [error, setError] = useState('');

    const handleAskAI = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await fetch('/api/ai/recommend-table', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: query,
                    date,
                    time,
                    guests,
                    locale,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('common.error'));
            }

            setResult(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = () => {
        if (result) {
            onSelectTable(result.recommendedTableId);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1E1E2E] border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center relative overflow-hidden">
                                <div className="relative z-10 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20">
                                        <Icon name="SparklesIcon" size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white tracking-tight">{t('ai.title')}</h3>
                                        <p className="text-xs text-gray-400">{t('ai.poweredBy')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="relative z-10 text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"
                                >
                                    <Icon name="XMarkIcon" size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6">
                                {!result ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300 ml-1">
                                                {t('ai.instruction')}
                                            </label>
                                            <div className="relative">
                                                <textarea
                                                    value={query}
                                                    onChange={(e) => setQuery(e.target.value)}
                                                    placeholder={t('ai.placeholder')}
                                                    className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-32 text-sm leading-relaxed"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleAskAI}
                                            disabled={isLoading || !query.trim()}
                                            className={`
                        w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative overflow-hidden group
                        ${isLoading || !query.trim()
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    : 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95'
                                                }
                      `}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Icon name="SparklesIcon" size={18} className="animate-spin" />
                                                    <span>{t('ai.thinking')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Icon name="SparklesIcon" size={18} className="group-hover:scale-110 transition-transform" />
                                                    <span>{t('ai.ask')}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                                <Icon name="ChatBubbleBottomCenterTextIcon" size={64} />
                                            </div>

                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-primary font-bold text-xs uppercase tracking-wider bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                                                        {t('ai.suggested')}
                                                    </span>
                                                </div>
                                                <h4 className="text-3xl font-black text-white mb-2">
                                                    {t('checkStatus.label.tableNum', { num: result.recommendedTableId })}
                                                </h4>
                                                <p className="text-white/80 text-sm leading-relaxed font-medium">
                                                    "{result.reasoning}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setResult(null)}
                                                className="flex-1 py-3.5 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors"
                                            >
                                                {t('ai.retry')}
                                            </button>
                                            <button
                                                onClick={handleSelect}
                                                className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Icon name="CheckIcon" size={18} />
                                                {t('ai.select')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3 rounded-xl flex items-center gap-2">
                                        <Icon name="ExclamationTriangleIcon" size={16} />
                                        {error}
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AIRecommendationModal;
