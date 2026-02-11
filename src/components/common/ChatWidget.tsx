'use client'; // ทำงานฝั่ง Client Component

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Library สำหรับ Animation
import Icon from '@/components/ui/AppIcon';
import { usePathname } from 'next/navigation'; // Hook สำหรับดึง URL ปัจจุบัน
import { useTranslation } from '@/lib/i18n';
import { useNavigation } from '@/contexts/NavigationContext';

interface ChatWidgetProps {
    lineOAUrl?: string; // URL ของ LINE Official Account
    tawkToId?: string; // ID ของ Tawk.to (ถ้ามี)
}

/**
 * Live Chat Widget
 * ปุ่มแชทลอย (Floating Button) ที่มุมขวาล่าง
 * - เปิดลิงก์ไปยัง LINE OA
 * - หรือโหลด Widget ของ Tawk.to
 * - สามารถลากย้ายตำแหน่งได้ (Draggable)
 */
export default function ChatWidget({
    lineOAUrl = 'https://line.me/R/ti/p/@tablereserve', // ค่า Default
    tawkToId
}: ChatWidgetProps) {
    const pathname = usePathname();
    const { locale } = useNavigation(); // ดึงภาษาปัจจุบันจาก Context
    const { t } = useTranslation(locale);

    const [isOpen, setIsOpen] = useState(false); // สถานะเปิด/ปิดเมนูแชท
    const [showTooltip, setShowTooltip] = useState(false); // สถานะแสดง Tooltip
    const [isDragging, setIsDragging] = useState(false); // สถานะกำลังลาก (ป้องกันการคลิกโดยไม่ตั้งใจ)
    const constraintsRef = useRef<HTMLDivElement>(null); // ขอบเขตการลาก

    // ซ่อน Widget ในหน้า Admin
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    // Effect: แสดง Tooltip หลังจากเข้าเว็บมา 3 วินาที และซ่อนอัตโนมัติ
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTooltip(true);
            // ซ่อน Tooltip หลังแสดง 5 วินาที
            setTimeout(() => setShowTooltip(false), 5000);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    // Effect: โหลด Tawk.to Script (ถ้ามี ID)
    useEffect(() => {
        if (tawkToId && typeof window !== 'undefined') {
            // สร้าง Script tag เพื่อโหลด Tawk.to
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://embed.tawk.to/${tawkToId}/default`;
            script.charset = 'UTF-8';
            script.setAttribute('crossorigin', '*');
            document.body.appendChild(script);

            return () => {
                document.body.removeChild(script); // ลบ Script เมื่อ unmount
            };
        }
    }, [tawkToId]);

    // ถ้าใช้ Tawk.to ให้ซ่อน Custom Widget นี้ (ใช้ UI ของ Tawk.to แทน)
    if (tawkToId) {
        return null;
    }

    // ฟังก์ชันเปิด/ปิดเมนูแชท
    const handleButtonClick = () => {
        // ถ้าเพิ่งลากเสร็จ (isDragging = true) ไม่ต้องเปิดเมนู
        if (isDragging) {
            return;
        }
        setIsOpen(!isOpen);
    };

    // ฟังก์ชันคลิกปุ่ม LINE
    const handleLineClick = () => {
        window.open(lineOAUrl, '_blank'); // เปิด Link ใน Tab ใหม่
        setIsOpen(false); // ปิดเมนู
    };

    return (
        <>
            {/* พื้นที่ขอบเขตการลาก (เต็มหน้าจอ) - ป้องกันการลากหลุดจอ */}
            <div
                ref={constraintsRef}
                className="fixed inset-0 pointer-events-none z-[399]"
            />

            {/* ตัว Widget หลัก */}
            <motion.div
                drag // เปิดใช้งานการลาก
                dragConstraints={constraintsRef} // จำกัดขอบเขต
                dragElastic={0.1} // ความยืดหยุ่นขอบ
                dragMomentum={false} // ไม่ให้ไถลต่อเมื่อปล่อย
                onDragStart={() => setIsDragging(true)} // เริ่มลาก
                onDragEnd={() => {
                    setTimeout(() => setIsDragging(false), 100); // หน่วงเวลาเล็กน้อยเพื่อให้แน่ใจว่าจบการลากจริง
                }}
                className="fixed bottom-6 right-6 z-[400] cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }} // ป้องกัน Browser action บนมือถือ
            >
                {/* Tooltip แนะนำให้แชท */}
                <AnimatePresence>
                    {showTooltip && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute bottom-full right-0 mb-3 whitespace-nowrap pointer-events-none"
                        >
                            <div className="bg-white rounded-xl shadow-lg px-4 py-3 border border-gray-100">
                                <p className="text-sm font-bold text-gray-800">
                                    💬 {t('ai.chat.tooltip')}
                                </p>
                                {/* ลูกศรชี้ลง */}
                                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-100 transform rotate-45" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* เมนูตัวเลือกการติดต่อ (Popup) */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            className="absolute bottom-full right-0 mb-4 w-64"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                                <div className="p-4 bg-gradient-to-r from-green-500 to-green-600">
                                    <h3 className="text-white font-bold">{t('ai.chat.title')}</h3>
                                    <p className="text-white/80 text-xs">{t('ai.chat.subtitle')}</p>
                                </div>
                                <div className="p-3 space-y-2">
                                    {/* ตัวเลือก: LINE */}
                                    <button
                                        onClick={handleLineClick}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#00B900] hover:bg-[#00A000] text-white transition-colors"
                                    >
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                                        </svg>
                                        <span className="font-bold">{t('ai.chat.line')}</span>
                                    </button>

                                    {/* ตัวเลือก: โทรศัพท์ */}
                                    <a
                                        href="tel:0801234567"
                                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
                                    >
                                        <Icon name="PhoneIcon" size={24} />
                                        <span className="font-bold">{t('ai.chat.phone')}</span>
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ปุ่มหลัก (ไอคอนแชท) */}
                <motion.button
                    onClick={handleButtonClick}
                    className={`
                        w-14 h-14 rounded-full shadow-lg flex items-center justify-center
                        transition-all duration-300 pointer-events-auto
                        ${isOpen
                            ? 'bg-gray-600 hover:bg-gray-700' // สีเมื่อเปิด (สีเทา)
                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' // สีปกติ (สีเขียว)
                        }
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={showTooltip && !isOpen ? { scale: [1, 1.1, 1] } : {}} // Animation เรียกร้องความสนใจ
                    transition={{ duration: 0.5, repeat: showTooltip && !isOpen ? Infinity : 0 }}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            // ไอคอนปิด (X)
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                            >
                                <Icon name="XMarkIcon" size={24} className="text-white" />
                            </motion.div>
                        ) : (
                            // ไอคอนแชท
                            <motion.div
                                key="chat"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                            >
                                <Icon name="ChatBubbleLeftRightIcon" size={24} className="text-white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>

                {/* วงแหวน Pulse Animation เมื่อยังไม่ได้เปิด */}
                {!isOpen && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-green-500 pointer-events-none"
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                )}
            </motion.div>
        </>
    );
}
