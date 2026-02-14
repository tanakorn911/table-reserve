'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

// โครงสร้างข้อมูลสำหรับการ์ดแต่ละใบ
interface InfoCard {
  icon: string; // ชื่อไอคอนที่จะใช้จาก AppIcon
  title: string; // หัวข้อจุดเด่น
  description: string; // คำอธิบายรายละเอียด
}

// Proptypes สำหรับ RestaurantInfo
interface RestaurantInfoProps {
  cards: InfoCard[]; // ข้อมูลการ์ดทั้งหมดที่จะแสดง (Array)
}

/**
 * RestaurantInfo Component
 * 
 * ส่วนแสดงข้อมูลจุดเด่นของร้าน (Why Choose Us / Features)
 * ทำหน้าที่บอกเล่าข้อดีหรือบริการที่น่าสนใจของร้าน
 * รูปแบบการแสดงผล:
 * - แสดงเป็น Grid ของ Card (1 คอลัมน์บนมือถือ, 3 คอลัมน์บน Desktop)
 * - แต่ละ Card ประกอบด้วย: ไอคอน, หัวข้อ, และคำอธิบาย
 */
const RestaurantInfo: React.FC<RestaurantInfoProps> = ({ cards }) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-6">

        {/* 1. Section Header: หัวข้อส่วนนี้ */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            {t('info.whyChooseUs')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('info.whyChooseUsDesc')}
          </p>
        </div>

        {/* 2. Info Cards Grid: แสดงการ์ดข้อมูล */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className="
                bg-card rounded-xl p-8 shadow-warm-md border border-border
                transition-smooth duration-300
                hover:shadow-warm-lg hover:-translate-y-1 hover:border-primary/20
              "
            >
              <div className="flex flex-col items-center text-center space-y-4">

                {/* ไอคอนในวงกลมสีจาง */}
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Icon name={card.icon} size={32} className="text-primary" />
                </div>

                {/* หัวข้อการ์ด */}
                <h3 className="text-2xl font-heading font-semibold text-foreground">
                  {card.title}
                </h3>

                {/* คำอธิบาย */}
                <p className="text-base text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RestaurantInfo;
