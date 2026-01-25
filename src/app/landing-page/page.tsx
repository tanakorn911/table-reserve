import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import MobileMenu from '@/components/common/MobileMenu';
import LandingPageInteractive from './components/LandingPageInteractive';

export const metadata: Metadata = {
  title: 'TableReserve',
  description:
    'จองโต๊ะที่ TableReserve และสัมผัสกับอาหารรสเลิศ บรรยากาศที่หรูหรา และการบริการที่ยอดเยี่ยม จองออนไลน์ได้ทันทีเพื่อประสบการณ์การรับประทานอาหารที่น่าจดจำ',
};

export default function LandingPage() {
  return (
    <>
      <Header />
      <MobileMenu />
      <main className="min-h-screen pt-20">
        <LandingPageInteractive />
      </main>
    </>
  );
}
