'use client'; // ทำงานฝั่ง Client Component

import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti'; // Library สำหรับสร้าง Effect กระดาษสี

interface ConfettiProps {
    trigger?: boolean; // ตัวกระตุ้นให้แสดง Confetti
    duration?: number; // ระยะเวลาในการแสดง (ms)
}

/**
 * Confetti Component - แสดง effect กระดาษโปรยเพื่อเฉลิมฉลอง
 * มักใช้เมื่อการจองสำเร็จ
 */
export default function Confetti({ trigger = true, duration = 3000 }: ConfettiProps) {
    // ฟังก์ชันเริ่มยิง Confetti (ใช้ useCallback เพื่อไม่ให้สร้างฟังก์ชันใหม่ทุก render)
    const fireConfetti = useCallback(() => {
        const end = Date.now() + duration; // คำนวณเวลาสิ้นสุด

        // สีธีมของร้าน (น้ำเงิน, ทอง, เขียว, ส้ม, แดง)
        const colors = ['#3b5998', '#d4af37', '#48bb78', '#ed8936', '#f56565'];

        // ฟังก์ชันสร้างเฟรม Animation
        const frame = () => {
            // ยิงจากด้านซ้าย
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.7 },
                colors: colors,
            });

            // ยิงจากด้านขวา
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.7 },
                colors: colors,
            });

            // ถ้ายังไม่หมดเวลา ให้เรียก frame ถัดไป
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        // ยิงชุดใหญ่ตอนเริ่มต้น (Initial burst)
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: colors,
        });

        // เริ่มวนลูปยิงต่อเนื่อง
        frame();
    }, [duration]);

    // Effect ทำงานเมื่อค่า trigger เปลี่ยนเป็น true
    useEffect(() => {
        if (trigger) {
            // หน่วงเวลาเล็กน้อยเพื่อความสมูท (UX)
            const timer = setTimeout(fireConfetti, 200);
            return () => clearTimeout(timer); // เคลียร์ timeout เมื่อ unmount
        }
    }, [trigger, fireConfetti]);

    return null; // Component นี้ไม่มี UI ที่แสดงผลเอง (ใช้ canvas ของ library)
}

/**
 * Hook สำหรับเรียกใช้ Confetti ผ่านโปรแกรม (ไม่ต้องวาง Component)
 */
export function useConfetti() {
    // ฟังก์ชันยิงแบบปรับแต่งได้
    const fire = useCallback((options?: confetti.Options) => {
        const defaults: confetti.Options = {
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b5998', '#d4af37', '#48bb78', '#ed8936', '#f56565'],
        };

        confetti({ ...defaults, ...options });
    }, []);

    // ฟังก์ชันยิงแบบพลุแตก (Burst) ตามจุดต่างๆ
    const fireBurst = useCallback(() => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            colors: ['#3b5998', '#d4af37', '#48bb78', '#ed8936', '#f56565'],
        };

        // ฟังก์ชันย่อยคำนวณจำนวน particle
        function fire(particleRatio: number, opts: confetti.Options) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            });
        }

        // ยิงหลายๆ รูปแบบพร้อมกัน
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }, []);

    return { fire, fireBurst };
}
