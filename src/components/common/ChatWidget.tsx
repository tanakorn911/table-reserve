'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

interface ChatWidgetProps {
    lineOAUrl?: string;
    tawkToId?: string;
}

/**
 * Live Chat Widget
 * Floating chat button that opens LINE OA or Tawk.to chat
 */
export default function ChatWidget({
    lineOAUrl = 'https://line.me/R/ti/p/@tablereserve',
    tawkToId
}: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Show tooltip after 3 seconds visit
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTooltip(true);
            // Hide tooltip after 5 seconds
            setTimeout(() => setShowTooltip(false), 5000);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    // Handle Tawk.to script if ID is provided
    useEffect(() => {
        if (tawkToId && typeof window !== 'undefined') {
            // Load Tawk.to script
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://embed.tawk.to/${tawkToId}/default`;
            script.charset = 'UTF-8';
            script.setAttribute('crossorigin', '*');
            document.body.appendChild(script);

            return () => {
                document.body.removeChild(script);
            };
        }
    }, [tawkToId]);

    // If Tawk.to is enabled, don't render custom widget
    if (tawkToId) {
        return null;
    }

    const handleChatClick = () => {
        if (isOpen) {
            setIsOpen(false);
        } else {
            // Open LINE OA in new tab
            window.open(lineOAUrl, '_blank');
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[400]">
            {/* Tooltip */}
            <AnimatePresence>
                {showTooltip && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full right-0 mb-3 whitespace-nowrap"
                    >
                        <div className="bg-white rounded-xl shadow-lg px-4 py-3 border border-gray-100">
                            <p className="text-sm font-bold text-gray-800">
                                💬 มีคำถาม? แชทกับเราได้เลย!
                            </p>
                            {/* Arrow */}
                            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-100 transform rotate-45" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Options Popup */}
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
                                <h3 className="text-white font-bold">สนทนากับเรา</h3>
                                <p className="text-white/80 text-xs">ตอบกลับภายใน 5 นาที</p>
                            </div>
                            <div className="p-3 space-y-2">
                                {/* LINE Option */}
                                <a
                                    href={lineOAUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-xl bg-[#00B900] hover:bg-[#00A000] text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                                    </svg>
                                    <span className="font-bold">LINE Official</span>
                                </a>

                                {/* Phone Option */}
                                <a
                                    href="tel:+6612345678"
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
                                >
                                    <Icon name="PhoneIcon" size={24} />
                                    <span className="font-bold">โทรหาเรา</span>
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          transition-all duration-300
          ${isOpen
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    }
        `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={showTooltip && !isOpen ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: showTooltip && !isOpen ? Infinity : 0 }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <Icon name="XMarkIcon" size={24} className="text-white" />
                        </motion.div>
                    ) : (
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

            {/* Pulse animation when closed */}
            {!isOpen && (
                <motion.div
                    className="absolute inset-0 rounded-full bg-green-500"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            )}
        </div>
    );
}
