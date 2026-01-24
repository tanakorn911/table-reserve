'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface SocialLink {
  name: string;
  icon: string;
  url: string;
}

interface FooterProps {
  restaurantName: string;
  socialLinks: SocialLink[];
}

const Footer: React.FC<FooterProps> = ({ restaurantName, socialLinks }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    setCurrentYear(new Date().getFullYear());
  }, []);

  if (!isHydrated) {
    return (
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                <Icon name="BuildingStorefrontIcon" size={24} className="text-primary-foreground" />
              </div>
              <span className="text-xl font-heading font-bold text-foreground">
                {restaurantName}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {socialLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-muted"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © {restaurantName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex flex-col items-center space-y-6">
          <Link
            href="/landing-page"
            className="flex items-center gap-3 transition-smooth hover:opacity-80"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Icon name="BuildingStorefrontIcon" size={24} className="text-primary-foreground" />
            </div>
            <span className="text-xl font-heading font-bold text-foreground">{restaurantName}</span>
          </Link>

          <div className="flex items-center gap-4">
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center justify-center w-10 h-10 rounded-full
                  bg-muted text-foreground
                  transition-smooth hover:bg-primary hover:text-primary-foreground
                  active:scale-[0.95] min-w-[44px] min-h-[44px]
                "
                aria-label={link.name}
              >
                <Icon name={link.icon} size={20} />
              </a>
            ))}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © {currentYear} {restaurantName}. สงวนลิขสิทธิ์
            </p>
            <p className="text-xs text-muted-foreground">
              การจองออนไลน์ที่ปลอดภัยด้วยการเข้ารหัส SSL
            </p>
            <Link
              href="/admin/login"
              target="_blank"
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline decoration-dotted"
            >
              เข้าสู่ระบบผู้ดูแลระบบ (Admin)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
