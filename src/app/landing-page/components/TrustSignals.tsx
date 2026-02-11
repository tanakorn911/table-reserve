import React from 'react';
import Icon from '@/components/ui/AppIcon';

// โครงสร้างข้อมูล Badge
interface TrustBadge {
  icon: string;        // ชื่อไอคอน
  title: string;       // หัวข้อ (เช่น "Safe & Clean")
  description: string; // คำอธิบายสั้นๆ
}

// Proptypes
interface TrustSignalsProps {
  badges: TrustBadge[]; // รายการ Badge ความน่าเชื่อถือ
}

/**
 * TrustSignals Component
 * 
 * ส่วนแสดงสัญลักษณ์ความน่าเชื่อถือ (Trust Factors)
 * สร้างความมั่นใจให้กับลูกค้า เช่น มาตรฐานความสะอาด, การชำระเงินที่ปลอดภัย
 * รูปแบบ: แถบสีพื้นหลังจางๆ พร้อมไอคอนและข้อความอธิบาย
 */
const TrustSignals: React.FC<TrustSignalsProps> = ({ badges }) => {
  return (
    <section className="py-12 lg:py-16 bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Grid แสดง Badge 3 คอลัมน์ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 divide-y md:divide-y-0 md:divide-x divide-border/50">
            {badges.map((badge, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-3 pt-6 md:pt-0 px-4 first:pt-0"
              >
                {/* ไอคอนวงกลมสีเขียว (สื่อถึงความปลอดภัย/ผ่านเกณฑ์) */}
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-success/10 mb-2 transition-transform hover:scale-110 duration-300">
                  <Icon name={badge.icon} size={28} className="text-success" />
                </div>

                {/* หัวข้อ */}
                <h4 className="text-lg font-bold text-foreground tracking-tight">
                  {badge.title}
                </h4>

                {/* คำอธิบาย */}
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSignals;
