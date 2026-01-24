import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import MobileMenu from '@/components/common/MobileMenu';
import { NavigationProvider } from '@/contexts/NavigationContext';
import ReservationFormInteractive from './components/ReservationFormInteractive';

export const metadata: Metadata = {
  title: 'แบบฟอร์มจองโต๊ะ',
  description: 'จองประสบการณ์การรับประทานอาหารของคุณกับเรา',
};

export default function ReservationFormPage() {
  return (
    <NavigationProvider>
      <Header />
      <MobileMenu />
      <ReservationFormInteractive />
    </NavigationProvider>
  );
}
