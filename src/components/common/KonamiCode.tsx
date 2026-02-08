'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { useConfetti } from '@/components/ui/Confetti';

// Konami Code sequence: ↑ ↑ ↓ ↓ ← → ← → B A
const KONAMI_CODE = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

const STORAGE_KEY = 'tablereserve_secret_discount';

interface KonamiCodeProps {
    discountAmount?: number;
    onUnlock?: (discountCode: string) => void;
}

/**
 * Konami Code Easter Egg Component
 * Type ↑↑↓↓←→←→BA to unlock a secret discount!
 */
export default function KonamiCode({
    discountAmount = 50,
    onUnlock
}: KonamiCodeProps) {
    const [inputSequence, setInputSequence] = useState<string[]>([]);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [discountCode, setDiscountCode] = useState<string>('');
    const { fireBurst } = useConfetti();

    // Check if already unlocked
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setDiscountCode(saved);
            setIsUnlocked(true);
        }
    }, []);

    // Generate discount code
    const generateCode = useCallback(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'SECRET-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }, []);

    // Handle key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const newSequence = [...inputSequence, e.code].slice(-KONAMI_CODE.length);
            setInputSequence(newSequence);

            // Check if sequence matches
            if (newSequence.length === KONAMI_CODE.length) {
                const isMatch = newSequence.every((key, i) => key === KONAMI_CODE[i]);
                if (isMatch && !isUnlocked) {
                    // Success!
                    const code = generateCode();
                    setDiscountCode(code);
                    setIsUnlocked(true);
                    setShowModal(true);
                    localStorage.setItem(STORAGE_KEY, code);

                    // Fire confetti!
                    fireBurst();

                    // Call callback
                    onUnlock?.(code);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [inputSequence, isUnlocked, generateCode, fireBurst, onUnlock]);

    // Show progress hint (optional visual feedback)
    const progress = inputSequence.length / KONAMI_CODE.length;

    return (
        <>
            {/* Secret progress indicator (very subtle) */}
            {progress > 0 && progress < 1 && (
                <div
                    className="fixed bottom-4 left-4 z-50 opacity-20 pointer-events-none"
                    style={{
                        width: `${progress * 50}px`,
                        height: '4px',
                        background: 'linear-gradient(90deg, #d4af37, #f59e0b)',
                        borderRadius: '2px',
                        transition: 'width 0.2s ease'
                    }}
                />
            )}

            {/* Secret Discount Modal */}
            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md"
                            onClick={() => setShowModal(false)}
                        />
                        <div className="fixed inset-0 z-[501] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                className="w-full max-w-sm bg-gradient-to-br from-yellow-900/90 to-amber-900/90 rounded-2xl shadow-2xl border border-yellow-500/30 overflow-hidden"
                            >
                                {/* Sparkle animation background */}
                                <div className="absolute inset-0 overflow-hidden">
                                    {[...Array(20)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                top: `${Math.random() * 100}%`,
                                            }}
                                            animate={{
                                                opacity: [0, 1, 0],
                                                scale: [0, 1.5, 0],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                delay: Math.random() * 2,
                                            }}
                                        />
                                    ))}
                                </div>

                                <div className="relative p-8 text-center">
                                    {/* Trophy Icon */}
                                    <motion.div
                                        initial={{ rotate: -10 }}
                                        animate={{ rotate: [0, -5, 5, 0] }}
                                        transition={{ duration: 0.5, repeat: 3 }}
                                        className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30"
                                    >
                                        <Icon name="GiftIcon" size={40} className="text-yellow-900" variant="solid" />
                                    </motion.div>

                                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-2">
                                        🎉 SECRET UNLOCKED!
                                    </h2>
                                    <p className="text-yellow-100/80 mb-6">
                                        คุณพบ Easter Egg ลับ! รับส่วนลดพิเศษ ฿{discountAmount}
                                    </p>

                                    {/* Discount Code */}
                                    <div className="bg-black/40 rounded-xl p-4 mb-6 border border-yellow-500/30">
                                        <p className="text-xs text-yellow-300/60 uppercase tracking-widest mb-2">
                                            รหัสส่วนลด
                                        </p>
                                        <p className="text-2xl font-mono font-black text-yellow-300 tracking-wider">
                                            {discountCode}
                                        </p>
                                    </div>

                                    <p className="text-xs text-yellow-100/50 mb-6">
                                        แสดงรหัสนี้เมื่อมาถึงร้านเพื่อรับส่วนลด
                                    </p>

                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-full py-3 px-6 bg-gradient-to-r from-yellow-500 to-amber-600 text-yellow-900 font-bold rounded-xl shadow-lg hover:shadow-yellow-500/30 transition-all active:scale-95"
                                    >
                                        เข้าใจแล้ว! 🎊
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

/**
 * Hook to check if user has unlocked the secret discount
 */
export function useSecretDiscount() {
    const [discountCode, setDiscountCode] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setDiscountCode(saved);
        }
    }, []);

    return {
        isUnlocked: !!discountCode,
        discountCode,
        discountAmount: 50,
    };
}
