'use client'; // ทำงานฝั่ง Client Component

import React, { useState } from 'react';
import Image from 'next/image';

// อินเทอร์เฟซสำหรับ Props ของ AppImage
interface AppImageProps {
  src: string; // URL ของรูปภาพ
  alt: string; // คำอธิบายรูปภาพ (Accessibility)
  width?: number; // ความกว้าง
  height?: number; // ความสูง
  className?: string; // Class CSS
  priority?: boolean; // โหลดก่อนหรือไม่ (High Priority)
  quality?: number; // คุณภาพรูป (0-100)
  placeholder?: 'blur' | 'empty'; // การแสดงผลขณะโหลด
  blurDataURL?: string; // ข้อมูลภาพเบลอ (Base64)
  fill?: boolean; // ให้รูปเต็มพื้นที่ Parent
  sizes?: string; // ขนาด responsive
  onClick?: () => void; // ฟังก์ชันเมื่อคลิก
  fallbackSrc?: string; // รูปภาพสำรองกรณีโหลดไม่ผ่าน
  [key: string]: unknown; // Props อื่นๆ
}

/**
 * Component จัดการรูปภาพของแอปพลิเคชัน
 * - รองรับ Next.js Image Optimization
 * - รองรับ External URL (fallback เป็น img tag ธรรมดาถ้าจำเป็น)
 * - มี Fallback Image กรณีรูปล่ม (Error Handling)
 */
function AppImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  fill = false,
  sizes,
  onClick,
  fallbackSrc = '/assets/images/no_image.png', // รูป Default กรณี Error
  ...props
}: AppImageProps) {
  const [imageSrc, setImageSrc] = useState(src); // State เก็บ URL รูปภาพ
  const [isLoading, setIsLoading] = useState(true); // State สถานะกำลังโหลด
  const [hasError, setHasError] = useState(false); // State เกิดข้อผิดพลาด

  // ตรวจสอบว่าเป็น URL ภายนอกหรือไม่ (http/https)
  const isExternal = imageSrc.startsWith('http://') || imageSrc.startsWith('https://');
  // ตรวจสอบว่าเป็น URL ภายในหรือ Data URL
  const isLocal =
    imageSrc.startsWith('/') || imageSrc.startsWith('./') || imageSrc.startsWith('data:');

  // ฟังก์ชันจัดการเมื่อโหลดรูปภาพไม่สำเร็จ
  const handleError = () => {
    if (!hasError && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc); // เปลี่ยนไปใช้รูป Fallback
      setHasError(true);
    }
    setIsLoading(false); // หยุดสถานะโหลด
  };

  // ฟังก์ชันจัดการเมื่อโหลดรูปภาพเสร็จสิ้น
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Class พื้นฐาน: เพิ่มการแสดงผล loading และ effect เมื่อคลิกได้
  const commonClassName = `${className} ${isLoading ? 'bg-gray-200' : ''} ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`;

  // กรณีเป็น External URL ที่ไม่ได้อยู่ใน Whitelist ของ Next.js config (ป้องกัน Error)
  // หรือถ้าไม่มั่นใจ ให้ใช้ <img> ธรรมดาแทน
  if (isExternal && !isLocal) {
    const imgStyle: React.CSSProperties = {};

    if (width) imgStyle.width = width;
    if (height) imgStyle.height = height;

    // กรณีต้องการให้เต็มพื้นที่ (Fill)
    if (fill) {
      return (
        <div
          className={`relative ${className}`}
          style={{ width: width || '100%', height: height || '100%' }}
        >
          <img
            src={imageSrc}
            alt={alt}
            className={`${commonClassName} absolute inset-0 w-full h-full object-cover`}
            onError={handleError}
            onLoad={handleLoad}
            onClick={onClick}
            style={imgStyle}
            {...props}
          />
        </div>
      );
    }

    // กรณีปกติ (กำหนด Width/Height)
    return (
      <img
        src={imageSrc}
        alt={alt}
        className={commonClassName}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick}
        style={imgStyle}
        {...props}
      />
    );
  }

  // กรณีเป็นรูปภายใน (Local) หรือ Data URL ให้ใช้ Next.js Image เพื่อ Optimization
  const imageProps = {
    src: imageSrc,
    alt,
    className: commonClassName,
    priority,
    quality,
    placeholder,
    blurDataURL,
    unoptimized: true, // ปิด Optimization บางส่วนเพื่อแก้ปัญหาบางอย่าง
    onError: handleError,
    onLoad: handleLoad,
    onClick,
    ...props,
  };

  // กรณี Fill Container
  if (fill) {
    return (
      <div className={`relative ${className}`}>
        <Image
          {...imageProps}
          fill
          sizes={sizes || '100vw'}
          style={{ objectFit: 'cover' }}
          alt={alt}
        />
      </div>
    );
  }

  // กรณีปกติสำหรับ Next.js Image
  return <Image {...imageProps} width={width || 400} height={height || 300} alt={alt} />;
}

export default AppImage;
