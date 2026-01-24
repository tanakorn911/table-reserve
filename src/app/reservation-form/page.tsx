import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import MobileMenu from '@/components/common/MobileMenu';

import ReservationWizard from './components/ReservationWizard';

export const metadata: Metadata = {
  title: 'แบบฟอร์มจองโต๊ะ',
  description: 'จองประสบการณ์การรับประทานอาหารของคุณกับเรา',
};

export default function ReservationFormPage() {
  return (
    <>
      <Header />
      <MobileMenu />
      <ReservationWizard />
    </>
  );
}
