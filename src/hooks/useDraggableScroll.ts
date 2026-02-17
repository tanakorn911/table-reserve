import { useState, useRef, MouseEvent, useCallback } from 'react';

/**
 * useDraggableScroll Hook
 * 
 * Hook สำหรับทำให้ Container สามารถ Scroll ได้ด้วยการคลิกแล้วลาก (Drag to Scroll)
 * เหมาะสำหรับตารางหรือรายการที่ยาวเกินหน้าจอ
 */
export function useDraggableScroll() {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Use refs for values that change rapidly to avoid re-renders during drag
    const startX = useRef(0);
    const startScrollLeft = useRef(0);
    const isDown = useRef(false);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (!ref.current) return;
        isDown.current = true;
        setIsDragging(true);
        startX.current = e.pageX - ref.current.offsetLeft;
        startScrollLeft.current = ref.current.scrollLeft;
    }, []);

    const onMouseLeave = useCallback(() => {
        isDown.current = false;
        setIsDragging(false);
    }, []);

    const onMouseUp = useCallback(() => {
        isDown.current = false;
        setIsDragging(false);
    }, []);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDown.current || !ref.current) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX.current) * 2; // Scroll speed multiplier
        ref.current.scrollLeft = startScrollLeft.current - walk;
    }, []);

    return {
        ref,
        events: {
            onMouseDown,
            onMouseLeave,
            onMouseUp,
            onMouseMove,
        },
        isDragging,
    };
}
