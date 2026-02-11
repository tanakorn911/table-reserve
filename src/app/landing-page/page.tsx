import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import MobileMenu from '@/components/common/MobileMenu'; // เมนูสำหรับมือถือ
import LandingPageInteractive from './components/LandingPageInteractive'; // Component หลักของหน้า Landing Page

// กำหนด Metadata ของหน้า (SEO)
export const metadata: Metadata = {
  title: 'Savory Bistro', // ชื่อเว็บไซต์ที่แสดงบน Tab
  description:
    'จองโต๊ะที่ Savory Bistro และสัมผัสกับอาหารรสเลิศ บรรยากาศที่หรูหรา และการบริการที่ยอดเยี่ยม จองออนไลน์ได้ทันทีเพื่อประสบการณ์การรับประทานอาหารที่น่าจดจำ', // คำอธิบายสำหรับ SEO
};

export default function LandingPage() {
  return (
    <>
      {/* Header ส่วนบนสุดของหน้า (Logo, เมนูนำทาง) */}
      <Header />

      {/* Mobile Menu (แสดงเมื่อเปิดในมือถือ) */}
      <MobileMenu />

      {/* เนื้อหาหลักของหน้า */}
      <main className="min-h-screen pt-20"> {/* pt-20 เว้นระยะด้านบนให้พ้น Header */}
        <LandingPageInteractive />
      </main>
    </>
  );
}
