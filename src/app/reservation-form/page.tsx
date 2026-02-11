import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import MobileMenu from '@/components/common/MobileMenu';
import ReservationWizard from './components/ReservationWizard'; // Component หลักสำหรับขั้นตอนการจอง

// กำหนด Metadata ของหน้าจองโต๊ะ (SEO)
export const metadata: Metadata = {
  title: 'Savory Bistro - แบบฟอร์มจองโต๊ะ', // ชื่อ Tab
  description: 'จองประสบการณ์การรับประทานอาหารของคุณกับเรา', // คำอธิบาย SEO
};

/**
 * ReservationFormPage Component
 * หน้าหลักสำหรับการจองโต๊ะ
 * - แสดง Header และ Mobile Menu
 * - แสดง ReservationWizard เพื่อเริ่มขั้นตอนการจอง
 */
export default function ReservationFormPage() {
  return (
    <>
      <Header />
      <MobileMenu />
      {/* Wizard สำหรับจัดการขั้นตอนการจองทั้งหมด (เลือกวัน, เวลา, โต๊ะ, ข้อมูลติดต่อ) */}
      <ReservationWizard />
    </>
  );
}
