'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

// โครงสร้างข้อมูลการติดต่อ
interface ContactInfo {
  phone: string;  // เบอร์โทรศัพท์
  email: string;  // อีเมล
  address: string; // ที่อยู่
  mapLat: number; // ละติจูด
  mapLng: number; // ลองจิจูด
}

// Proptypes
interface LocationContactProps {
  contact: ContactInfo; // ข้อมูลการติดต่อที่ส่งเข้ามา
}

/**
 * LocationContact Component
 * 
 * ส่วนแสดงข้อมูลการติดต่อและแผนที่ (Contact Us & Location)
 * ช่วยให้ลูกค้าสามารถติดต่อร้านหรือเดินทางมายังร้านได้ถูก
 * ประกอบด้วย:
 * 1. ข้อมูลการติดต่อ: เบอร์โทร, อีเมล, ที่อยู่ (แสดงพร้อมไอคอน)
 * 2. แผนที่ Google Maps: ฝังแผนที่แบบ Interactive
 */
const LocationContact: React.FC<LocationContactProps> = ({ contact }) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="container mx-auto px-4 lg:px-6">

        {/* 1. Header: หัวข้อ Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            {t('contact.visitUs')}
          </h2>
          <p className="text-lg text-muted-foreground">{t('contact.subtitle')}</p>
        </div>

        {/* 2. Content Grid: แบ่งครึ่งหน้าจอ (ซ้าย: ข้อมูล, ขวา: แผนที่) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">

          {/* ส่วนซ้าย: รายละเอียดข้อมูลการติดต่อ */}
          <div className="space-y-6">

            {/* กล่องเบอร์โทรศัพท์ */}
            <div className="bg-background rounded-xl p-6 shadow-warm-sm border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
                  <Icon name="PhoneIcon" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {t('contact.phone')}
                  </h3>
                  <a
                    href={`tel:${contact.phone}`} // ทำให้คลิกโทรออกได้
                    className="text-lg text-muted-foreground hover:text-primary transition-smooth"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* กล่องอีเมล */}
            <div className="bg-background rounded-xl p-6 shadow-warm-sm border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
                  <Icon name="EnvelopeIcon" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {t('contact.email')}
                  </h3>
                  <a
                    href={`mailto:${contact.email}`} // ทำให้คลิกส่งเมลได้
                    className="text-lg text-muted-foreground hover:text-primary transition-smooth break-all"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            </div>

            {/* กล่องที่อยู่ */}
            <div className="bg-background rounded-xl p-6 shadow-warm-sm border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 flex-shrink-0">
                  <Icon name="MapPinIcon" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {t('contact.address')}
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{contact.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนขวา: Google Maps Embed */}
          <div className="w-full h-[400px] lg:h-full rounded-xl overflow-hidden shadow-warm-md border border-border">
            <iframe
              width="100%"
              height="100%"
              loading="lazy" // Lazy load แผนที่เพื่อ Performance
              title="Savory Bistro Restaurant Location"
              referrerPolicy="no-referrer-when-downgrade"
              // สร้าง URL Google Maps Embed จากพิกัดที่ได้รับ
              src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d700!2d${contact.mapLng}!3d${contact.mapLat}!2m3!1f0!2f45!3f0!3m2!1i1024!2i768!4f35!3m3!1m2!1s0x311878b9c6a9c8c7%3A0x7c8e03bf86ca13c0!2z4Lih4Lir4Liy4Lin4Li04LiX4Lii4Liy4Lil4Lix4Lii4Lie4Liw4LmA4Lii4Liy!5e1!3m2!1sth!2sth!4v1`}
                  className="border-0 grayscale-20 hover:grayscale-0 transition-all duration-500" // ปรับ map ให้สีจางลงนิดหน่อยเพื่อความสวยงาม
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationContact;
