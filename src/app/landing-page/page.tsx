import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import MobileMenu from '@/components/common/MobileMenu';
import LandingPageInteractive from './components/LandingPageInteractive';

export const metadata: Metadata = {
  title: 'TableReserve - Experience Fine Dining at Its Best',
  description:
    'Book your table at TableReserve and experience exceptional cuisine, elegant atmosphere, and outstanding service. Reserve online now for a memorable dining experience.',
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
